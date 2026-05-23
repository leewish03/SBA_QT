const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Starting Full QA Capture script...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // 콘솔 에러 로깅
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('[vite]') && !text.includes('HMR')) {
      console.log('PAGE LOG:', text);
    }
  });
  page.on('pageerror', err => console.error('PAGE ERROR:', err.toString()));
  
  // 모바일 규격 뷰포트
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
  
  const scratchDir = 'C:\\Users\\WISH\\.gemini\\antigravity\\brain\\0f115f8d-ebee-45ea-a01e-1651f80756a1\\scratch';
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  // 1. Splash Screen
  console.log('1. 로컬 5173 접속 (스플래시 화면 캡처)...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 400)); // 스플래시 문구 복호화 애니메이션 안정화 대기
  await page.screenshot({ path: path.join(scratchDir, 'qa_1_splash.png') });
  console.log(' qa_1_splash.png 저장 완료');

  // 스플래시 사라질 때까지 대기
  try {
    await page.waitForSelector('.sba-splash-screen', { hidden: true, timeout: 8000 });
  } catch (e) {
    console.log('스플래시 화면이 제시간에 사라지지 않았습니다.');
  }

  // 로딩바 사라질 때까지 대기
  try {
    await page.waitForSelector('.sba-loading', { hidden: true, timeout: 5000 });
  } catch (e) {}

  await page.waitForSelector('.sba-app-container', { timeout: 5000 });
  await new Promise(r => setTimeout(r, 1000));

  // 2. 오늘 묵상 탭 메인 화면
  console.log('2. 묵상 탭 메인 화면 캡처...');
  await page.screenshot({ path: path.join(scratchDir, 'qa_2_main_meditation.png') });
  console.log(' qa_2_main_meditation.png 저장 완료');

  // 3. 구절 선택 및 플로팅 바 활성화 후 북마크 등록
  console.log('3. 구절 선택 및 플로팅 바 캡처...');
  const verseBlock = await page.$('.sba-verse-block');
  if (verseBlock) {
    await verseBlock.click();
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(scratchDir, 'qa_3_verse_selected.png') });
    console.log(' qa_3_verse_selected.png 저장 완료');
    
    // 북마크 추가 버튼 클릭하여 실제 북마크 등록
    console.log('북마크 추가 버튼 클릭 중...');
    const floatButtons = await page.$$('.sba-floating-bar button');
    let bookmarkAddBtn = null;
    for (const btn of floatButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('북마크 추가')) {
        bookmarkAddBtn = btn;
        break;
      }
    }
    if (bookmarkAddBtn) {
      await bookmarkAddBtn.click();
      console.log('북마크 추가 클릭 완료');
      await new Promise(r => setTimeout(r, 800)); // 토스트 및 상태 변경 대기
    } else {
      console.log('북마크 추가 버튼을 찾지 못해 선택 해제합니다.');
      await verseBlock.click();
      await new Promise(r => setTimeout(r, 300));
    }
  } else {
    console.log('구절 블록을 찾지 못했습니다.');
  }

  // 4. 오늘의 메모 에디터 서랍 열기
  console.log('4. 오늘의 메모 서랍 오픈 캡처...');
  const memoFloatBtn = await page.$('.sba-memo-float-btn');
  if (memoFloatBtn) {
    await memoFloatBtn.click();
    await new Promise(r => setTimeout(r, 800)); // 에디터 올라오는 트랜지션 대기
    await page.screenshot({ path: path.join(scratchDir, 'qa_4_today_memo_open.png') });
    console.log(' qa_4_today_memo_open.png 저장 완료');

    // 닫기
    const closeMemoBtn = await page.$('button[style*="background: none"][style*="border: none"]');
    if (closeMemoBtn) {
      await closeMemoBtn.click();
      await new Promise(r => setTimeout(r, 800));
    } else {
      // 바깥 영역 클릭으로 닫기
      await page.click('body', { delay: 100 });
      await new Promise(r => setTimeout(r, 800));
    }
  } else {
    console.log('오늘의 메모 버튼을 찾지 못했습니다.');
  }

  // 5. 캘린더 모달
  console.log('5. 달력 선택 모달 캡처...');
  const dateNavWrapper = await page.$('.sba-date-nav-wrapper h1');
  if (dateNavWrapper) {
    await dateNavWrapper.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(scratchDir, 'qa_6_calendar_modal.png') });
    console.log(' qa_6_calendar_modal.png 저장 완료');

    // 캘린더 닫기
    const calendarCloseButtons = await page.$$('button');
    for (const btn of calendarCloseButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('취소') || text.includes('✕')) {
        await btn.click();
        await new Promise(r => setTimeout(r, 800));
        break;
      }
    }
  } else {
    console.log('날짜 네비게이션 헤더를 찾을 수 없습니다.');
  }

  // 6. 설정 모달
  console.log('6. 설정 모달 캡처...');
  const settingsBtn = await page.$('button[title="설정"]');
  if (settingsBtn) {
    await settingsBtn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(scratchDir, 'qa_7_settings_modal.png') });
    console.log(' qa_7_settings_modal.png 저장 완료');

    // 설정 닫기
    const settingsCloseButtons = await page.$$('button');
    for (const btn of settingsCloseButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('확인') || text.includes('✕')) {
        await btn.click();
        await new Promise(r => setTimeout(r, 800));
        break;
      }
    }
  } else {
    console.log('설정 버튼을 찾을 수 없습니다.');
  }

  // 7. 통독 탭 이동
  console.log('7. 통독 탭 캡처...');
  const navItems = await page.$$('.sba-nav-item');
  if (navItems.length >= 2) {
    await navItems[1].click(); // 통독
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(scratchDir, 'qa_8_bible_reading_tab.png') });
    console.log(' qa_8_bible_reading_tab.png 저장 완료');
  }

  // 8. 기록 탭 이동 및 말씀 카드 캡처
  console.log('8. 기록 탭 캡처...');
  if (navItems.length >= 3) {
    await navItems[2].click(); // 기록
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(scratchDir, 'qa_9_bookmarks_tab.png') });
    console.log(' qa_9_bookmarks_tab.png 저장 완료');

    // 생성된 북마크 클릭하여 북마크 상세 모달 오픈
    console.log('북마크 상세 모달 띄우기 시도...');
    const bookmarkItem = await page.$('.sba-bookmark-item');
    if (bookmarkItem) {
      await bookmarkItem.click();
      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({ path: path.join(scratchDir, 'qa_9_1_bookmark_detail.png') });
      console.log(' qa_9_1_bookmark_detail.png 저장 완료');

      // 말씀 카드 제작 버튼 클릭
      console.log('말씀 카드 제작 모달 띄우기 시도...');
      const detailButtons = await page.$$('button');
      let makeCardBtn = null;
      for (const btn of detailButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text.includes('말씀 카드 제작')) {
          makeCardBtn = btn;
          break;
        }
      }
      if (makeCardBtn) {
        await makeCardBtn.click();
        await new Promise(r => setTimeout(r, 1200));
        await page.screenshot({ path: path.join(scratchDir, 'qa_5_verse_card_modal.png') });
        console.log(' qa_5_verse_card_modal.png 저장 완료');

        // 말씀 카드 닫기
        const cardCloseButtons = await page.$$('button');
        for (const btn of cardCloseButtons) {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text.includes('닫기') || text.includes('✕')) {
            await btn.click();
            await new Promise(r => setTimeout(r, 800));
            break;
          }
        }
      } else {
        console.log('말씀 카드 제작 버튼을 찾지 못했습니다.');
      }

      // 북마크 상세 모달 닫기
      const detailCloseBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find(b => b.textContent.includes('✕') || b.textContent.includes('닫기'));
      });
      if (detailCloseBtn && detailCloseBtn.asElement()) {
        await detailCloseBtn.asElement().click();
        await new Promise(r => setTimeout(r, 800));
      }
    } else {
      console.log('등록된 북마크 아이템을 찾을 수 없습니다.');
    }
  }

  // 9. 주간 탭 이동
  console.log('9. 주간 탭 캡처...');
  if (navItems.length >= 4) {
    await navItems[3].click(); // 주간
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(scratchDir, 'qa_10_weekly_tab.png') });
    console.log(' qa_10_weekly_tab.png 저장 완료');
  }

  // 10. 나눔 탭 이동
  console.log('10. 나눔 탭 캡처...');
  if (navItems.length >= 5) {
    await navItems[4].click(); // 나눔
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(scratchDir, 'qa_11_sharing_tab.png') });
    console.log(' qa_11_sharing_tab.png 저장 완료');
  }

  await browser.close();
  console.log('Full QA Capture completed!');
})().catch(err => {
  console.error('Error in QA capture:', err);
  process.exit(1);
});
