import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import webpush from "npm:web-push@3.6.7";

// CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// HTML 이스케이프 유틸리티 (텔레그램 HTML 파싱 대응)
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// 큐티 말씀 API fetch 로직 (Render 슬립 대응 재시도 탑재)
async function fetchTodayQt(backendUrl: string): Promise<any> {
  const url = `${backendUrl}/api/today-qt`;
  const maxRetries = 8;
  const retryIntervalMs = 5000; // 5초 대기

  for (let i = 1; i <= maxRetries; i++) {
    try {
      console.log(`[Fetch] 오늘의 말씀 가져오는 중 (시도 ${i}/${maxRetries}): ${url}`);
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.qt) {
          return data;
        }
      }
      throw new Error(`HTTP status ${res.status}`);
    } catch (err: any) {
      console.warn(`[Fetch] 시도 ${i} 실패: ${err.message}`);
      if (i === maxRetries) {
        throw new Error(`오늘의 말씀 로드 최종 실패 (최대 재시도 초과)`);
      }
      await new Promise(r => setTimeout(r, retryIntervalMs));
    }
  }
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

serve(async (req) => {
  // CORS 프리플라이트 대응
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // VAPID 설정 (신규 VAPID 키 세트 동기화)
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || 'BNPrlOSFSpYZ3wvt0EDSHT0MZJ9oXK79UUcUXfHuqFQVWZsGrGkm3IofICklW1fIWJtsrnURJxa6QxMCW3BPln4';
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || 'FYiGUuocgz_CAwnGsffClyJR1xbqExWB4n3d9NVEYEk';
    
    webpush.setVapidDetails(
      'mailto:lekas1217@gmail.com',
      vapidPublicKey,
      vapidPrivateKey
    );

    // 텔레그램 봇 토큰
    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || '7439054366:AAHeP_jC3g3VqjL2aP4_w07N4oN6K8z52e8';

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

    // 보안 인증 검증
    if (isTest) {
      // 특정 기기(endpoint)를 지정하여 테스트 알림을 보내는 경우에는 토큰 검증 생략 가능
      if (!targetEndpoint) {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
          return new Response(JSON.stringify({ error: "Missing Authorization header for test mode without endpoint." }), {
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
      }
    } else {
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
    
    const nowKst = new Date();
    const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      hour12: false
    });
    
    let hourStr = "08"; // 기본값
    try {
      const formattedHour = timeFormatter.format(nowKst);
      const match = formattedHour.match(/(\d{2})/);
      if (match) {
        hourStr = match[1];
      }
    } catch (e) {
      console.warn("KST 시간 파싱 오류:", e);
    }

    console.log(`[*] 작업 시작 - 현재 KST 날짜: ${targetDate.toLocaleDateString('ko-KR')}, 대상 시간대: ${hourStr}시, 테스트모드: ${isTest}`);

    // 1. 말씀 스케줄 API fetch (Render 깨어남 대응)
    const backendUrl = Deno.env.get('BACKEND_URL') || 'https://sba-qt.onrender.com';
    let todayData: any = null;
    try {
      todayData = await fetchTodayQt(backendUrl);
    } catch (err: any) {
      console.error(err.message);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const oldPlan = todayData.qt; // 오늘의 말씀 QT 계획 정보 { chapter, verse, title }
    
    // 말씀이 없는 날(주일)이거나 가져오지 못했다면 처리 중단
    if (!oldPlan) {
      console.log("[*] 오늘은 주일이거나 묵상 일정이 없습니다. 알림을 발송하지 않습니다.");
      return new Response(JSON.stringify({ message: "오늘은 묵상 일정이 없습니다." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. 성경 텍스트 데이터 로딩
    let bibleText = "";
    let bibleVerses: Record<string, string> = {};
    
    try {
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
        "창세기": "창", "출애굽기": "출", "레위기": "레", "민수기": "민", "신명기": "신", "여호수아": "수", "사사기": "삿", "룻기": "룻", "사무엘상": "삼상", "사무엘하": "삼하", "열왕기상": "왕상", "열왕기하": "왕하", "역대상": "대상", "역대하": "대하", "에스라": "스", "느헤미야": "느", "에스더": "에", "욥기": "욥", "시편": "시", "잠언": "잠", "전도서": "전", "아가": "아", "이사야": "사", "예레미야": "렘", "예레미야 애가": "애", "에스겔": "겔", "다니엘": "단", "호세아": "호", "요엘": "욜", "아모스": "암", "오바댜": "옵", "요나": "욘", "미가": "미", "나훔": "나", "하박국": "합", "스바냐": "습", "학개": "학", "스가랴": "슥", "말라기": "말", "마태복음": "마", "마가복음": "막", "누가복음": "눅", "요한복음": "요", "사도행전": "행", "로마서": "롬", "고린도전서": "고전", "고린도후서": "고후", "갈라디아서": "갈", "에베소서": "엡", "빌립보서": "빌", "골로새서": "골", "데살로니가전서": "살전", "데살로니가후서": "살후", "디모데전서": "딤전", "디모데후서": "딤후", "디도서": "딛", "빌레몬서": "몬", "히브리서": "히", "야고보서": "약", "베드로전서": "벧전", "베드로후서": "벧후", "요한일서": "요일", "요한이서": "요이", "요한삼서": "요삼", "유다서": "유", "요한계시록": "계"
      };

      const abbrev = KOR_TO_ENG[oldPlan.chapter] || KOR_TO_ENG[SHORT_TO_FULL[oldPlan.chapter]] || oldPlan.chapter;
      const bibleRes = await fetch(`${backendUrl}/bible/${abbrev}.json`);
      if (bibleRes.ok) {
        const bookData = await bibleRes.json();
        if (bookData && bookData[oldPlan.verse]) {
          bibleVerses = bookData[oldPlan.verse];
          const verseKeys = Object.keys(bibleVerses).map(Number).sort((a, b) => a - b);
          const previewVerses = verseKeys.slice(0, 5);
          bibleText = previewVerses.map(k => `${k}절: ${bibleVerses[k]}`).join("\n");
          if (verseKeys.length > 5) {
            bibleText += "\n... (이하 생략)";
          }
        }
      }
    } catch (e: any) {
      console.warn("성경 본문 텍스트 로딩 실패 (알림은 전송함):", e.message);
    }

    const title = "[SBA QT] 오늘의 말씀";
    const bodyText = `오늘의 말씀: ${oldPlan.title}`;

    console.log(`[*] 발송할 메세지: ${bodyText}`);

    // 3. 수신 대상 필터링 & 발송
    let pushSubscriptions: any[] = [];
    let telegramChats: any[] = [];

    if (isTest) {
      console.log("[*] 테스트 모드로 발송 대상을 식별합니다.");
      
      if (targetEndpoint) {
        const { data } = await supabase.from('qt_push_subscriptions').select('*').eq('endpoint', targetEndpoint);
        if (data && data.length > 0) {
          pushSubscriptions = data;
        }
      } else if (targetUserId) {
        const { data } = await supabase.from('qt_push_subscriptions').select('*').eq('user_id', targetUserId);
        if (data) pushSubscriptions = data;
      }

      if (targetTelegramChatId) {
        telegramChats = [{ telegram_chat_id: targetTelegramChatId }];
      } else if (targetUserId) {
        const { data } = await supabase.from('qt_telegram_chats').select('*').eq('user_id', targetUserId);
        if (data) telegramChats = data;
      }
    } else {
      // 시간(Hour) 단위 매칭으로 조회하여 누락 방지 (예: alarm_time이 '08:'로 시작하는 모든 사용자 조회)
      console.log(`[*] 정시 배치 모드 작동: ${hourStr}시 시간대에 해당하는 구독 정보를 조회합니다.`);
      
      const [pushRes, telegramRes] = await Promise.all([
        supabase.from('qt_push_subscriptions').select('*').like('alarm_time', `${hourStr}:%`),
        supabase.from('qt_telegram_chats').select('*').like('alarm_time', `${hourStr}:%`)
      ]);

      if (pushRes.data) pushSubscriptions = pushRes.data;
      if (telegramRes.data) telegramChats = telegramRes.data;
    }

    console.log(`[*] 조회 완료 - Web Push 대상: ${pushSubscriptions.length}건, Telegram 대상: ${telegramChats.length}건`);

    // 4. 발송 작업 수행 (비동기 병렬 처리)
    let pushSuccessCount = 0;
    let pushFailCount = 0;
    let pushCleanupCount = 0;
    let telegramSuccessCount = 0;
    let telegramFailCount = 0;

    // Web Push 발송
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
        if (error.statusCode === 404 || error.statusCode === 410) {
          pushCleanupCount++;
          console.log(`[Cleaner] 만료된 푸시 토큰 감지 (${error.statusCode}). DB 삭제 처리: ${sub.endpoint}`);
          await supabase.from('qt_push_subscriptions').delete().eq('endpoint', sub.endpoint);
        } else {
          console.error(`Web Push 발송 에러 (endpoint: ${sub.endpoint}):`, error.message);
        }
      }
    });

    // 텔레그램 발송
    const telegramPromises = telegramChats.map(async (chat) => {
      const chatId = chat.telegram_chat_id;
      const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
      const htmlText = `<b>${escapeHtml(title)}</b>\n\n📖 <b>${escapeHtml(oldPlan.title)}</b>\n\n${escapeHtml(bibleText || '본문은 아래 링크를 통해 앱에서 읽으실 수 있습니다.')}\n\n👉 <a href="https://sba-qt.onrender.com">묵상 앱 바로가기</a>`;

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
