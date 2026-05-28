import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // VAPID 키 세팅
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || 'BBRULQ6u9snBnV2LAfyu410fLl9Hhcc9VyE70wkgeEdeYjYCewDSPJ_t19oK_AzVtLDVBUYNc8YjuVb-B5sx8TQ';
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || 'Kaa2Bi6wQeDqBFLRj3mpRymJSojLYp7VCkjAIY8CFO4';
    webpush.setVapidDetails('mailto:lekas1217@gmail.com', vapidPublicKey, vapidPrivateKey);

    // 요청 페이로드 분석
    let reqData: any = {};
    if (req.method === 'POST') {
      try { reqData = await req.json(); } catch (_) {}
    }

    const isTest = reqData.test === true;
    const targetUserId = reqData.user_id;
    const targetEndpoint = reqData.endpoint;

    // KST 기준 현재 날짜와 시각 구하기
    const targetDate = getEffectiveDate();
    const todayStr = targetDate.toISOString().split('T')[0]; // "YYYY-MM-DD"
    
    // 1. 크론 시각 추출
    const now = new Date();
    const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false
    });
    const timeParts = timeFormatter.formatToParts(now);
    let hour = "08", minute = "00";
    for (const p of timeParts) {
      if (p.type === 'hour') hour = p.value.padStart(2, '0');
      if (p.type === 'minute') minute = p.value.padStart(2, '0');
    }
    const timeStr = `${hour}:${minute}`;

    console.log(`[*] 작업 시작 - KST 날짜: ${todayStr}, 시각: ${timeStr}, 테스트모드: ${isTest}`);

    // 2. 발송 대상 추출 (Web Push만 쿼리)
    let query = supabase.from('qt_push_subscriptions').select('*');
    if (isTest) {
      if (targetEndpoint) query = query.eq('endpoint', targetEndpoint);
      else if (targetUserId) query = query.eq('user_id', targetUserId);
    } else {
      query = query.eq('alarm_time', timeStr);
    }
    
    const { data: subscriptions, error: subError } = await query;
    if (subError || !subscriptions) throw new Error("구독자 정보 로드 실패");

    // 3. Web Push 순회 발송
    let successCount = 0;
    let failCount = 0;
    let cleanupCount = 0;

    const pushPromises = subscriptions.map(async (sub) => {
      // 해당 유저가 소속된 교회의 오늘 말씀을 가져옴
      const { data: schedule } = await supabase
        .from('qt_schedules')
        .select('*')
        .eq('church_id', sub.church_id)
        .eq('date', todayStr)
        .maybeSingle();

      if (!schedule) {
        console.log(`[-] 오늘 날짜(${todayStr}) 일정이 없습니다. 교회 ID: ${sub.church_id}`);
        return;
      }

      const payload = JSON.stringify({
        title: "[SBA QT] 오늘의 말씀",
        body: `오늘의 말씀: ${schedule.qt_book} ${schedule.qt_start_chap}장 (제목: ${schedule.qt_title || '본문'})`,
        url: "https://sba-qt.onrender.com"
      });

      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { auth: sub.auth, p256dh: sub.p256dh }
        }, payload);
        successCount++;
      } catch (error: any) {
        failCount++;
        if (error.statusCode === 404 || error.statusCode === 410) {
          cleanupCount++;
          console.log(`[Cleaner] 만료된 푸시 토큰 삭제: ${sub.endpoint}`);
          await supabase.from('qt_push_subscriptions').delete().eq('endpoint', sub.endpoint);
        } else {
          console.error(`푸시 발송 실패:`, error.message);
        }
      }
    });

    await Promise.all(pushPromises);

    console.log(`[+] 작업 완료 - 성공: ${successCount}, 실패: ${failCount}, 정리: ${cleanupCount}`);

    return new Response(JSON.stringify({
      success: true,
      stats: { success: successCount, fail: failCount, cleaned: cleanupCount }
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    console.error("전체 프로세스 처리 실패:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
