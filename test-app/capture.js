const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // 모바일 규격 뷰포트 설정
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  
  const scratchDir = 'C:\\Users\\WISH\\.gemini\\antigravity\\brain\\0f115f8d-ebee-45ea-a01e-1651f80756a1\\scratch';
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  console.log('1. 로컬 개발 서버 접속 중...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  
  // 스플래시 로딩 확인
  await page.screenshot({ path: path.join(scratchDir, '1_splash.png') });
  console.log('스플래시 화면 캡처 완료');
  
  // 스플래시 스크린이 제거될 때까지 3.5초 대기
  console.log('스플래시 제거 대기 중 (3.5초)...');
  await new Promise(r => setTimeout(r, 3500));
  
  // 오늘 묵상 탭 확인
  await page.screenshot({ path: path.join(scratchDir, '2_today_tab.png') });
  console.log('오늘 묵상 탭 캡처 완료');

  // 말씀 카드 만들기 버튼 클릭 테스트
  console.log('말씀 카드 모달 띄우기 시도...');
  
  // sba-action-link 클래스를 가진 모든 버튼 조회
  const buttons = await page.$$('button');
  let cardBtn = null;
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('말씀 카드 만들기')) {
      cardBtn = btn;
      break;
    }
  }

  if (cardBtn) {
    await cardBtn.click();
    await new Promise(r => setTimeout(r, 1000)); // 모달 팝업 대기
    await page.screenshot({ path: path.join(scratchDir, '3_image_card_modal.png') });
    console.log('말씀 카드 모달 캡처 완료');
    
    // 모달 닫기
    const closeBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('닫기'));
    });
    if (closeBtn && closeBtn.asElement()) {
      await closeBtn.asElement().click();
      await new Promise(r => setTimeout(r, 500));
    }
  } else {
    console.log('말씀 카드 만들기 버튼을 찾을 수 없습니다.');
  }
  
  // 나눔 탭 클릭 테스트
  console.log('나눔 탭으로 전환 중...');
  const navItems = await page.$$('.sba-nav-item');
  if (navItems.length >= 5) {
    await navItems[4].click(); // 다섯 번째 탭인 '나눔' 클릭
    await new Promise(r => setTimeout(r, 1500)); // 나눔 피드 로딩 대기
    await page.screenshot({ path: path.join(scratchDir, '4_sharing_tab_locked.png') });
    console.log('나눔 탭 (비로그인 락) 캡처 완료');
  } else {
    console.log('네비게이션 아이템 개수가 부족합니다.');
  }

  await browser.close();
  console.log('모든 검수 캡처 완료!');
})().catch(err => {
  console.error('에러 발생:', err);
  process.exit(1);
});
