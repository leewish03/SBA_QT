const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // 브라우저 내부 에러 출력 리스너 추가
  page.on('console', msg => {
    const text = msg.text();
    // 중복되거나 시끄러운 로그 방지
    if (!text.includes('[vite]') && !text.includes('HMR')) {
      console.log('PAGE LOG:', text);
    }
  });
  page.on('pageerror', err => console.error('PAGE ERROR:', err.toString()));
  
  // 모바일 규격 뷰포트 설정
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  
  const scratchDir = 'C:\\Users\\WISH\\.gemini\\antigravity\\brain\\0f115f8d-ebee-45ea-a01e-1651f80756a1\\scratch';
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  console.log('1. 로컬 개발 서버 접속 중...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  
  // 스플래시 로딩 확인
  await page.screenshot({ path: path.join(scratchDir, '1_splash.png') });
  console.log('스플래시 화면 캡처 완료');
  
  // 스플래시 스크린이 제거될 때까지 대기
  console.log('스플래시 제거 대기 중...');
  try {
    await page.waitForSelector('.sba-splash-screen', { hidden: true, timeout: 15000 });
  } catch (e) {
    console.log('스플래시 화면이 지정 시간 내에 사라지지 않았거나 이미 사라졌습니다.');
  }
  
  // 메인 데이터 로딩(.sba-loading) 대기
  console.log('메인 스케줄/말씀 데이터 로딩 완료 대기 중...');
  try {
    await page.waitForSelector('.sba-loading', { hidden: true, timeout: 15000 });
  } catch (e) {
    console.log('로딩 표시(.sba-loading) 대기 중 에러 또는 타임아웃 발생 (무시하고 계속 진행)');
  }

  // 앱 컨테이너 렌더링 확인
  await page.waitForSelector('.sba-app-container', { timeout: 10000 });
  
  // 잠시 UI가 안정화되도록 1초 추가 대기
  await new Promise(r => setTimeout(r, 1000));

  // 오늘 묵상 탭 확인
  await page.screenshot({ path: path.join(scratchDir, '2_today_tab.png') });
  console.log('오늘 묵상 탭 캡처 완료');

  // 말씀 카드 만들기 버튼 클릭 테스트
  console.log('말씀 카드 모달 띄우기 시도...');
  
  // 말씀 카드 만들기 버튼이 화면에 나타날 때까지 대기
  let cardBtn = null;
  try {
    await page.waitForSelector('.sba-action-link', { timeout: 10000 });
    const buttons = await page.$$('.sba-action-link');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('말씀 카드 만들기')) {
        cardBtn = btn;
        break;
      }
    }
  } catch (e) {
    console.log('sba-action-link 클래스 선택자로 찾지 못해 일반 button 태그를 스캔합니다.');
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('말씀 카드 만들기')) {
        cardBtn = btn;
        break;
      }
    }
  }

  if (cardBtn) {
    await cardBtn.click();
    console.log('말씀 카드 만들기 클릭 완료, 모달 오버레이 대기 중...');
    await page.waitForSelector('.sba-modal-overlay', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1000)); // 애니메이션 안정을 위해 추가 대기
    await page.screenshot({ path: path.join(scratchDir, '3_image_card_modal.png') });
    console.log('말씀 카드 모달 캡처 완료');
    
    // 모달 닫기
    const closeBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent.includes('닫기'));
    });
    if (closeBtn && closeBtn.asElement()) {
      await closeBtn.asElement().click();
      console.log('모달 닫기 클릭 완료');
      await page.waitForSelector('.sba-modal-overlay', { hidden: true, timeout: 5000 });
    }
  } else {
    console.log('말씀 카드 만들기 버튼을 찾을 수 없습니다.');
  }
  
  // 나눔 탭 클릭 테스트
  console.log('나눔 탭으로 전환 중...');
  await page.waitForSelector('.sba-nav-item', { timeout: 10000 });
  const navItems = await page.$$('.sba-nav-item');
  if (navItems.length >= 5) {
    await navItems[4].click(); // 다섯 번째 탭인 '나눔' 클릭
    console.log('나눔 탭 클릭 완료, 피드 로딩 대기 중...');
    
    // 나눔 탭 내부의 로딩 상태가 사라질 때까지 대기
    try {
      await page.waitForSelector('.sba-loading', { hidden: true, timeout: 10000 });
    } catch (e) {
      console.log('나눔 피드 로딩 완료 대기 중 에러 또는 타임아웃 발생 (계속 진행)');
    }
    
    await new Promise(r => setTimeout(r, 1500)); // 나눔 피드 렌더링 안정을 위해 대기
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
