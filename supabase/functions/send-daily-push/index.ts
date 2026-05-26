import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import webpush from "npm:web-push@3.6.7";

// CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// 한글 성경 약어 -> 영어 3글자 코드 매핑
const KOR_TO_ENG: Record<string, string> = {
  "창": "GEN", "출": "EXO", "레": "LEV", "민": "NUM", "신": "DEU",
  "수": "JOS", "삿": "JDG", "룻": "RUT", "삼상": "1SA", "삼하": "2SA",
  "왕상": "1KI", "왕하": "2KI", "대상": "1CH", "대하": "2CH", "스": "EZR",
  "느": "NEH", "에": "EST", "욥": "JOB", "시": "PSA", "잠": "PRO",
  "전": "ECC", "아": "SNG", "사": "ISA", "렘": "JER", "애": "LAM",
  "겔": "EZK", "단": "DAN", "호": "HOS", "욜": "JOL", "암": "AMO",
  "옵": "OBA", "욘": "JON", "미": "MIC", "나": "NAM", "합": "HAB",
  "습": "ZEP", "학": "HAG", "슥": "ZEC", "말": "MAL", "마": "MAT",
  "막": "MRK", "눅": "LUK", "요": "JHN", "행": "ACT", "롬": "ROM",
  "고전": "1CO", "고후": "2CO", "갈": "GAL", "엡": "EPH", "빌": "PHP",
  "골": "COL", "살전": "1TH", "살후": "2TH", "딤전": "1TI", "딤후": "2TI",
  "딛": "TIT", "몬": "PHM", "히": "HEB", "약": "JAS", "벧전": "1PE",
  "벧후": "2PE", "요일": "1JN", "요이": "2JN", "요삼": "3JN", "유": "JUD",
  "계": "REV"
};

const SHORT_TO_FULL: Record<string, string> = {
  "창": "창세기", "출": "출애굽기", "레": "레위기", "민": "민수기", "신": "신명기", "수": "여호수아", "삿": "사사기", "룻": "룻기", "삼상": "사무엘상", "삼하": "사무엘하", "왕상": "열왕기상", "왕하": "열왕기하", "대상": "역대상", "대하": "역대하", "스": "에스라", "느": "느헤미야", "에": "에스더", "욥": "욥기", "시": "시편", "잠": "잠언", "전": "전도서", "아": "아가", "사": "이사야", "렘": "예레미야", "애": "예레미야 애가", "겔": "에스겔", "단": "다니엘", "호": "호세아", "욜": "요엘", "암": "아모스", "옵": "오바댜", "욘": "요나", "미": "미가", "나": "나훔", "합": "하박국", "습": "스바냐", "학": "학개", "슥": "스가랴", "말": "말라기", "마": "마태복음", "막": "마가복음", "눅": "누가복음", "요": "요한복음", "행": "사도행전", "롬": "로마서", "고전": "고린도전서", "고후": "고린도후서", "갈": "갈라디아서", "엡": "에베소서", "빌": "빌립보서", "골": "골로새서", "살전": "데살로니가전서", "살후": "데살로니가후서", "딤전": "디모데전서", "딤후": "디모데후서", "딛": "디도서", "몬": "빌레몬서", "히": "히브리서", "약": "야고보서", "벧전": "베드로전서", "벧후": "베드로후서", "요일": "요한일서", "요이": "요한이서", "요삼": "요한삼서", "유": "유다서", "계": "요한계시록"
};

// 큐티 일요일 제외 경과일수 계산 함수
function calcQtDays(startKST: Date, targetKST: Date): number {
  if (targetKST < startKST) return 0;
  let days = 0;
  const current = new Date(startKST.getTime());
  while (current <= targetKST) {
    if (current.getUTCDay() !== 0) days++; // 일요일 제외
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return days;
}

// KST 날짜 획득 기준 (새벽 5시 이전이면 어제 날짜로 처리)
function getEffectiveDate(): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hour12: false
  });
  
  const parts = formatter.formatToParts(now);
  let y = 0, m = 0, d = 0, h = 0;
  for (const p of parts) {
    if (p.type === 'year') y = parseInt(p.value, 10);
    if (p.type === 'month') m = parseInt(p.value, 10);
    if (p.type === 'day') d = parseInt(p.value, 10);
    if (p.type === 'hour') h = parseInt(p.value, 10);
  }
  
  const kstDate = new Date(y, m - 1, d);
  if (h < 5) {
    kstDate.setDate(kstDate.getDate() - 1);
  }
  return kstDate;
}

// HTML 이스케이프 유틸리티 (텔레그램 HTML 파싱 대응)
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

serve(async (req) => {
  // CORS 프리플라이트 대응
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // VAPID 설정
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || 'BBRULQ6u9snBnV2LAfyu410fLl9Hhcc9VyE70wkgeEdeYjYCewDSPJ_t19oK_AzVtLDVBUYNc8YjuVb-B5sx8TQ';
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || 'Kaa2Bi6wQeDqBFLRj3mpRymJSojLYp7VCkjAIY8CFO4';
    
    webpush.setVapidDetails(
      'mailto:lekas1217@gmail.com',
      vapidPublicKey,
      vapidPrivateKey
    );

    // 텔레그램 봇 토큰
    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || '7439054366:AAHeP_jC3g3VqjL2aP4_w07N4oN6K8z52e8'; // Fallback token

    // 요청 페이로드 분석
    let reqData: any = {};
    if (req.method === 'POST') {
      try {
        reqData = await req.json();
      } catch (_) {
        // empty body
      }
    }

    const isTest = reqData.test === true;
    const targetUserId = reqData.user_id;
    const targetEndpoint = reqData.endpoint;
    const targetTelegramChatId = reqData.telegram_chat_id;

    // custom 보안 인증 검증
    if (isTest) {
      // 프론트엔드 테스트 요청: Authorization 헤더에 실린 JWT 유효성 검증
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Missing Authorization header for test mode." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return new Response(JSON.stringify({ error: "Invalid credentials for test mode." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    } else {
      // 정시 크론 요청: x-cron-secret 토큰 검증
      const cronSecret = req.headers.get("x-cron-secret");
      const expectedSecret = Deno.env.get("CRON_SECRET") || "sba_qt_cron_secret_token_2026";
      if (cronSecret !== expectedSecret) {
        return new Response(JSON.stringify({ error: "Forbidden: Invalid cron secret." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // KST 기준 현재 날짜와 시각 구하기
    const targetDate = getEffectiveDate();
    const dayName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"][targetDate.getDay()];
    
    // 현재 KST 시각 문자열 (HH:MM 포맷) 구하기
    const nowKst = new Date();
    const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    let timeStr = "08:00"; // 기본값
    try {
      const formattedTime = timeFormatter.format(nowKst); // 예: "오전 08:30" 또는 "08:30"
      const match = formattedTime.match(/(\d{2}):(\d{2})/);
      if (match) {
        timeStr = `${match[1]}:${match[2]}`;
      } else {
        // 일부 윈도우/데노 환경 로케일 대응 포맷팅 파싱
        const parts = timeFormatter.formatToParts(nowKst);
        let hour = "08", minute = "00";
        for (const p of parts) {
          if (p.type === 'hour') hour = p.value.padStart(2, '0');
          if (p.type === 'minute') minute = p.value.padStart(2, '0');
        }
        timeStr = `${hour}:${minute}`;
      }
    } catch (e) {
      console.warn("KST 시각 파싱 오류:", e);
    }

    console.log(`[*] 작업 시작 - 현재 KST 날짜: ${targetDate.toLocaleDateString('ko-KR')}, 시각: ${timeStr}, 테스트모드: ${isTest}`);

    // 1. 말씀 스케줄 API fetch 및 파싱
    let scheduleData: any = null;
    try {
      const res = await fetch("https://sba-qt.onrender.com/api/sba-qt");
      if (!res.ok) throw new Error(`HTTP status ${res.status}`);
      scheduleData = await res.json();
    } catch (err) {
      console.warn("Live API fetch 실패, 로컬 캐시 폴백 시도:", err.message);
      // 혹시 Render 서버가 슬립 상태일 경우에 대비해 1회 추가 대기 후 재시도
      await new Promise(r => setTimeout(r, 2000));
      try {
        const res = await fetch("https://sba-qt.onrender.com/api/sba-qt");
        if (res.ok) scheduleData = await res.json();
      } catch (err2) {
        console.error("스케줄 데이터 로딩 최종 실패:", err2);
      }
    }

    if (!scheduleData || !scheduleData.qt_plan) {
      return new Response(JSON.stringify({ error: "스케줄 정보를 불러오지 못했습니다." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. 오늘의 말씀 계산
    let oldPlan: any = null;
    if (dayName !== "일요일") {
      const parsedStartDate = new Date("2024-12-17");
      const startKST = new Date(Date.UTC(parsedStartDate.getFullYear(), parsedStartDate.getMonth(), parsedStartDate.getDate()));
      const targetKST = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()));
      
      const daysElapsed = calcQtDays(startKST, targetKST);
      if (daysElapsed > 0) {
        let count = 0;
        for (const row of scheduleData.qt_plan) {
          const sp = parseInt(row.start_paragraph, 10);
          const ep = parseInt(row.end_paragraph, 10);
          const paras = ep - sp + 1;
          if (count + paras >= daysElapsed) {
            const verse = sp + (daysElapsed - count - 1);
            oldPlan = {
              chapter: row.chapter, // 예: 마태복음
              abbrev: KOR_TO_ENG[row.chapter] || KOR_TO_ENG[SHORT_TO_FULL[row.chapter]] || row.chapter,
              verse: verse.toString() // 장 번호
            };
            break;
          }
          count += paras;
        }
      }
    }

    // 일요일이거나 스케줄을 찾지 못했다면 빈 말씀 알림 또는 처리 중단
    if (!oldPlan) {
      console.log("[*] 오늘은 주일이거나 묵상 일정이 없습니다. 푸시를 발송하지 않습니다.");
      return new Response(JSON.stringify({ message: "오늘은 묵상 일정이 없습니다." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3. 성경 텍스트 데이터 로딩
    let bibleText = "";
    let bibleVerses: Record<string, string> = {};
    const bookAbbrev = KOR_TO_ENG[oldPlan.chapter] || KOR_TO_ENG[SHORT_TO_FULL[oldPlan.chapter]] || oldPlan.abbrev;
    
    try {
      const bibleRes = await fetch(`https://sba-qt.onrender.com/bible/${bookAbbrev}.json`);
      if (bibleRes.ok) {
        const bookData = await bibleRes.json();
        if (bookData && bookData[oldPlan.verse]) {
          bibleVerses = bookData[oldPlan.verse];
          // 앞쪽 5절 정도만 텍스트 구성하여 미리보기 제공
          const verseKeys = Object.keys(bibleVerses).map(Number).sort((a, b) => a - b);
          const previewVerses = verseKeys.slice(0, 5);
          bibleText = previewVerses.map(k => `${k}절: ${bibleVerses[k]}`).join("\n");
          if (verseKeys.length > 5) {
            bibleText += "\n... (이하 생략)";
          }
        }
      }
    } catch (e) {
      console.warn("성경 본문 텍스트 로딩 실패 (알림은 전송함):", e);
    }

    const title = "[SBA QT] 오늘의 말씀";
    const bodyText = `오늘의 말씀: ${oldPlan.chapter} ${oldPlan.verse}장`;

    console.log(`[*] 발송할 메세지: ${bodyText}`);

    // 4. 수신 대상 필터링 & 발송
    let pushSubscriptions: any[] = [];
    let telegramChats: any[] = [];

    if (isTest) {
      // 테스트 전송 모드
      console.log("[*] 테스트 모드로 발송 대상을 식별합니다.");
      
      // Web Push 구독 조회
      if (targetEndpoint) {
        const { data } = await supabase.from('qt_push_subscriptions').select('*').eq('endpoint', targetEndpoint);
        if (data && data.length > 0) {
          pushSubscriptions = data;
        }
      } else if (targetUserId) {
        const { data } = await supabase.from('qt_push_subscriptions').select('*').eq('user_id', targetUserId);
        if (data) pushSubscriptions = data;
      }

      // Telegram 구독 조회
      if (targetTelegramChatId) {
        telegramChats = [{ telegram_chat_id: targetTelegramChatId }];
      } else if (targetUserId) {
        const { data } = await supabase.from('qt_telegram_chats').select('*').eq('user_id', targetUserId);
        if (data) telegramChats = data;
      }
    } else {
      // 정시 배치 전송 모드
      console.log(`[*] 정시 배치 모드 작동: ${timeStr}에 해당하는 구독 정보를 조회합니다.`);
      
      const [pushRes, telegramRes] = await Promise.all([
        supabase.from('qt_push_subscriptions').select('*').eq('alarm_time', timeStr),
        supabase.from('qt_telegram_chats').select('*').eq('alarm_time', timeStr)
      ]);

      if (pushRes.data) pushSubscriptions = pushRes.data;
      if (telegramRes.data) telegramChats = telegramRes.data;
    }

    console.log(`[*] 조회 완료 - Web Push 대상: ${pushSubscriptions.length}건, Telegram 대상: ${telegramChats.length}건`);

    // 5. 발송 작업 수행 (비동기 병렬 처리)
    let pushSuccessCount = 0;
    let pushFailCount = 0;
    let pushCleanupCount = 0;
    let telegramSuccessCount = 0;
    let telegramFailCount = 0;

    // Web Push 병렬 발송
    const pushPromises = pushSubscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth,
          p256dh: sub.p256dh
        }
      };

      const payload = JSON.stringify({
        title: title,
        body: `${bodyText}\n터치하여 묵상을 시작해 보세요.`,
        url: "https://sba-qt.onrender.com"
      });

      try {
        await webpush.sendNotification(pushSubscription, payload);
        pushSuccessCount++;
      } catch (error: any) {
        pushFailCount++;
        // 404 Not Found 또는 410 Gone 이면 영구 만료된 토큰이므로 DB에서 정리
        if (error.statusCode === 404 || error.statusCode === 410) {
          pushCleanupCount++;
          console.log(`[Cleaner] 만료된 푸시 토큰 감지 (${error.statusCode}). DB 삭제 처리: ${sub.endpoint}`);
          await supabase.from('qt_push_subscriptions').delete().eq('endpoint', sub.endpoint);
        } else {
          console.error(`Web Push 발송 에러 (endpoint: ${sub.endpoint}):`, error.message);
        }
      }
    });

    // 텔레그램 병렬 발송
    const telegramPromises = telegramChats.map(async (chat) => {
      const chatId = chat.telegram_chat_id;
      const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
      const htmlText = `<b>${escapeHtml(title)}</b>\n\n📖 <b>${escapeHtml(oldPlan.chapter)} ${oldPlan.verse}장</b>\n\n${escapeHtml(bibleText || '본문은 아래 링크를 통해 앱에서 읽으실 수 있습니다.')}\n\n👉 <a href="https://sba-qt.onrender.com">묵상 앱 바로가기</a>`;

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: htmlText,
            parse_mode: "HTML",
            disable_web_page_preview: true
          })
        });

        if (response.ok) {
          telegramSuccessCount++;
        } else {
          telegramFailCount++;
          const errBody = await response.text();
          console.error(`텔레그램 메시지 발송 실패 (ChatID: ${chatId}):`, errBody);
          if (response.status === 403) {
            console.log(`[Cleaner] 사용자가 텔레그램 봇을 차단했습니다. DB 삭제 처리: ${chatId}`);
            await supabase.from('qt_telegram_chats').delete().eq('telegram_chat_id', chatId);
          }
        }
      } catch (error: any) {
        telegramFailCount++;
        console.error(`텔레그램 HTTP 에러 (ChatID: ${chatId}):`, error.message);
      }
    });

    // 모든 발송 완료 대기
    await Promise.all([...pushPromises, ...telegramPromises]);

    console.log(`[+] 작업 완료 - Web Push (성공: ${pushSuccessCount}, 실패: ${pushFailCount}, 정리: ${pushCleanupCount}) | Telegram (성공: ${telegramSuccessCount}, 실패: ${telegramFailCount})`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "알림 발송 작업이 완료되었습니다.",
        stats: {
          web_push: { success: pushSuccessCount, fail: pushFailCount, cleaned: pushCleanupCount },
          telegram: { success: telegramSuccessCount, fail: telegramFailCount }
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (err: any) {
    console.error("전체 프로세스 처리 실패:", err);
    return new Response(JSON.stringify({ error: err.message || "서버 내부 오류가 발생했습니다." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
