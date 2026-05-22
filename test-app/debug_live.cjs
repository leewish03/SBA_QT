const puppeteer = require('puppeteer');

(async () => {
  console.log('Puppeteer 실행 중...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // 모바일 규격 뷰포트 설정
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });

  // 콘솔 에러 수집
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE ${msg.type().toUpperCase()}]`, msg.text());
  });

  page.on('pageerror', err => {
    console.log('[BROWSER UNCAUGHT ERROR]', err.message);
    console.log(err.stack);
  });

  console.log('1. 라이브 웹페이지 접속 중 (https://sba-qt.onrender.com/)...');
  await page.goto('https://sba-qt.onrender.com/', { waitUntil: 'networkidle2' });
  
  console.log('스플래시 대기 중 (3.5초)...');
  await new Promise(r => setTimeout(r, 3500));

  // 현재 활성화된 탭 정보 확인
  const activeTabText = await page.evaluate(() => {
    const el = document.querySelector('.sba-nav-item.active');
    return el ? el.textContent.trim() : '없음';
  });
  console.log(`현재 활성 탭: ${activeTabText}`);

  // '주간' 탭 클릭 시도
  console.log('2. 주간 탭 클릭 시도...');
  const navItems = await page.$$('.sba-nav-item');
  let weeklyTabBtn = null;
  for (const item of navItems) {
    const text = await page.evaluate(el => el.textContent.trim(), item);
    if (text.includes('주간')) {
      weeklyTabBtn = item;
      break;
    }
  }

  if (weeklyTabBtn) {
    await weeklyTabBtn.click();
    console.log('주간 탭 클릭 완료. 1초 대기...');
    await new Promise(r => setTimeout(r, 1000));

    // 주간 카드 중 첫 번째 요일 카드 클릭 시도
    console.log('3. 주간 요일 카드 클릭 시도...');
    const cards = await page.$$('.sba-weekly-card');
    if (cards.length > 0) {
      console.log(`발견된 주간 카드 개수: ${cards.length}개. 첫 번째 카드를 클릭합니다.`);
      await cards[0].click();
      console.log('요일 카드 클릭 완료. 2초 대기 후 에러 여부 확인...');
      await new Promise(r => setTimeout(r, 2000));
    } else {
      console.log('주간 카드를 찾을 수 없습니다.');
    }
  } else {
    console.log('주간 탭을 찾을 수 없습니다.');
  }

  // 상단 헤더의 '요일' 영역 클릭 시도 (5월 22일 금요일 v)
  console.log('4. 상단 날짜 헤더 클릭 시도...');
  const headerH1 = await page.$('.sba-header h1');
  if (headerH1) {
    const headerText = await page.evaluate(el => el.textContent.trim(), headerH1);
    console.log(`헤더 텍스트: ${headerText}`);
    await headerH1.click();
    console.log('상단 헤더 클릭 완료. 달력 모달 팝업 확인용 1초 대기...');
    await new Promise(r => setTimeout(r, 1000));
  } else {
    console.log('상단 헤더 h1 요소를 찾을 수 없습니다.');
  }

  await browser.close();
  console.log('디버깅 스크립트 실행 종료.');
})().catch(err => {
  console.error('스크립트 실행 실패:', err);
  process.exit(1);
});
