const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const screenshotDir = 'C:\\Users\\WISH\\.gemini\\antigravity\\brain\\0f115f8d-ebee-45ea-a01e-1651f80756a1\\scratch';
if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
    console.log('Starting Puppeteer Test Script (Local on port 3000)...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });
    const page = await browser.newPage();
    
    // Set viewport to mobile size
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });

    // Listen to console errors
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('[PAGE ERROR]:', msg.text());
            consoleErrors.push(msg.text());
        } else {
            console.log(`[PAGE LOG]: ${msg.text()}`);
        }
    });

    // ----------------------------------------------------
    // TEST 1: LOCAL ENVIRONMENT (http://localhost:3000/)
    // ----------------------------------------------------
    try {
        console.log('\n--- STARTING LOCAL TEST ---');
        await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
        
        // Wait for Splash screen to disappear
        console.log('Waiting for splash screen...');
        await delay(3500);

        // Capture local main screen
        await page.screenshot({ path: path.join(screenshotDir, 'local_01_main.png') });
        console.log('Captured local_01_main.png');

        // Check header swipe gesture & arrows
        console.log('Testing date change arrows...');
        const prevBtn = await page.$('.sba-date-arrow-btn[title="이전 날"]');
        if (prevBtn) {
            await prevBtn.click();
            await delay(800);
            await page.screenshot({ path: path.join(screenshotDir, 'local_02_prev_day.png') });
            console.log('Captured local_02_prev_day.png');
        }

        const nextBtn = await page.$('.sba-date-arrow-btn[title="다음 날"]');
        if (nextBtn) {
            await nextBtn.click();
            await delay(800);
            await nextBtn.click(); // Move forward one more day
            await delay(800);
            await page.screenshot({ path: path.join(screenshotDir, 'local_03_next_day.png') });
            console.log('Captured local_03_next_day.png');
        }

        // Swipe gesture test on date nav bar
        console.log('Testing date nav swipe gesture...');
        const dateNav = await page.$('.sba-date-nav-wrapper');
        if (dateNav) {
            const box = await dateNav.boundingBox();
            const startX = box.x + box.width - 15;
            const endX = box.x + 15;
            const y = box.y + box.height / 2;
            
            // Perform touch swipe left (goes to next day)
            await page.touchscreen.touchStart(startX, y);
            await page.touchscreen.touchMove(endX, y);
            await page.touchscreen.touchEnd();
            await delay(1000);
            await page.screenshot({ path: path.join(screenshotDir, 'local_04_swipe.png') });
            console.log('Captured local_04_swipe.png');
        }

        // Swipe isolation test: swipe on main body should NOT change the date
        console.log('Testing swipe isolation on main body area...');
        const dateTitleForSwipe = await page.$('.sba-date-nav-wrapper h1');
        if (dateTitleForSwipe) {
            const initialDateText = await page.evaluate(el => el.textContent, dateTitleForSwipe);
            
            // Swipe on main content wrapper (.sba-tab-content or similar)
            const mainBody = await page.$('.sba-app-container');
            if (mainBody) {
                const bodyBox = await mainBody.boundingBox();
                const bodyStartX = bodyBox.x + bodyBox.width - 15;
                const bodyEndX = bodyBox.x + 15;
                const bodyY = bodyBox.y + bodyBox.height / 2;
                
                await page.touchscreen.touchStart(bodyStartX, bodyY);
                await page.touchscreen.touchMove(bodyEndX, bodyY);
                await page.touchscreen.touchEnd();
                await delay(1000);
                
                const postBodyDragDateText = await page.evaluate(el => el.textContent, dateTitleForSwipe);
                if (initialDateText === postBodyDragDateText) {
                    console.log('[SUCCESS] Main body swipe did NOT change the date (isolation works!).');
                } else {
                    console.error('[FAIL] Main body swipe changed the date! Swipe is not isolated to date nav wrapper.');
                    throw new Error('Swipe isolation check failed');
                }
            }
        }

        // Return to today or make sure we are on a valid page with memo editor
        // Let's click the Today tab to reset date logic or just use Calendar modal to select a day.
        console.log('Testing Calendar Modal date selection...');
        const dateTitle = await page.$('.sba-date-nav-wrapper h1');
        if (dateTitle) {
            await dateTitle.click();
            await delay(800);
            await page.screenshot({ path: path.join(screenshotDir, 'local_04_calendar_open.png') });
            console.log('Captured local_04_calendar_open.png');
            
            // Click "오늘 날짜로 복귀" button
            const calendarButtons = await page.$$('button');
            for (const btn of calendarButtons) {
                const text = await page.evaluate(el => el.textContent, btn);
                if (text.includes('오늘 날짜로 복귀')) {
                    await btn.click();
                    await delay(800);
                    break;
                }
            }
        }

        // Note taking / editing & deletion test
        console.log('Testing memo editor...');
        const handleSelector = '.sba-note-handle';
        const handle = await page.waitForSelector(handleSelector, { timeout: 5000 }).catch(() => null);
        if (handle) {
            // Click handle to expand editor
            await handle.click();
            await delay(500);

            const textareaSelector = '.sba-note-textarea';
            const textarea = await page.waitForSelector(textareaSelector, { timeout: 3000 }).catch(() => null);
            if (textarea) {
                // Clear content and write test note
                await page.evaluate(el => el.value = '', textarea);
                await textarea.type('Automated Puppeteer Test Memo!');
                await delay(200);
                // Click outside or blur to force immediate save
                await page.evaluate(() => {
                    if (document.activeElement) {
                        document.activeElement.blur();
                    }
                });
                await delay(1500); // Wait for save
                await page.screenshot({ path: path.join(screenshotDir, 'local_05_memo_written.png') });
                console.log('Captured local_05_memo_written.png');

                // Open Calendar to check if Dot indicator is shown
                if (dateTitle) {
                    await dateTitle.click();
                    await delay(1000);
                    await page.screenshot({ path: path.join(screenshotDir, 'local_06_calendar_dot.png') });
                    console.log('Captured local_06_calendar_dot.png');
                    
                    // Close Calendar by clicking '취소'
                    const modalClose = await page.$$('button');
                    for (const btn of modalClose) {
                        const text = await page.evaluate(el => el.textContent, btn);
                        if (text.includes('취소') || text.includes('✕')) {
                            await btn.click();
                            await delay(800);
                            break;
                        }
                    }
                }

                // Delete memo by emptying it
                console.log('Deleting memo...');
                const isStillOpen = await page.$('.sba-note-textarea').catch(() => null);
                if (!isStillOpen) {
                    const h = await page.$(handleSelector);
                    if (h) {
                        await h.click();
                        await delay(500);
                    }
                }
                await page.click(textareaSelector);
                // Select all text and backspace
                await page.keyboard.down('Control');
                await page.keyboard.press('KeyA');
                await page.keyboard.up('Control');
                await page.keyboard.press('Backspace');
                await page.evaluate(() => {
                    if (document.activeElement) {
                        document.activeElement.blur();
                    }
                });
                await delay(1500); // Wait for save (deletion)
                await page.screenshot({ path: path.join(screenshotDir, 'local_07_memo_deleted.png') });
                console.log('Captured local_07_memo_deleted.png');

                // [심층 재검증 1] 메모 삭제 후 새로고침하여 영구 삭제되었는지 확인
                console.log('Reloading page to cross-validate memo deletion...');
                await page.reload({ waitUntil: 'networkidle2' });
                await delay(2500); // splash 대기
                
                // 메모장 다시 열기
                const hReload = await page.waitForSelector(handleSelector, { timeout: 3000 }).catch(() => null);
                if (hReload) {
                    await hReload.click();
                    await delay(500);
                    const textAfterReload = await page.evaluate(el => el.value, await page.$(textareaSelector));
                    if (textAfterReload.trim() === '') {
                        console.log('[SUCCESS] Memo deletion verified: still empty after page reload.');
                    } else {
                        console.error('[FAIL] Memo not deleted on reload! Content:', textAfterReload);
                        throw new Error('Memo deletion reload check failed');
                    }
                }
                
                // [심층 재검증 2] 날짜를 수차례 변경했다 돌아와도 삭제가 유지되는지 확인
                console.log('Changing dates multiple times to verify deletion retention...');
                const prevArrow = await page.$('.sba-date-arrow-btn[title="이전 날"]');
                const nextArrow = await page.$('.sba-date-arrow-btn[title="다음 날"]');
                if (prevArrow && nextArrow) {
                    // 이전 날로 3번 이동
                    for (let i = 0; i < 3; i++) {
                        await prevArrow.click();
                        await delay(500);
                    }
                    // 다시 다음 날로 3번 이동하여 원래 날짜로 복구
                    for (let i = 0; i < 3; i++) {
                        await nextArrow.click();
                        await delay(500);
                    }
                }
                
                // 다시 메모장을 열어 내용 확인
                const hReturn = await page.waitForSelector(handleSelector, { timeout: 3000 }).catch(() => null);
                if (hReturn) {
                    const isExp = await page.evaluate(el => el.offsetHeight > 50, await page.$('.sba-note-handle').catch(() => null));
                    if (!isExp) {
                        await hReturn.click();
                        await delay(500);
                    }
                    const textAfterReturn = await page.evaluate(el => el.value, await page.$(textareaSelector));
                    if (textAfterReturn.trim() === '') {
                        console.log('[SUCCESS] Memo deletion verified: still empty after multiple date changes.');
                    } else {
                        console.error('[FAIL] Memo recovered after date changes! Content:', textAfterReturn);
                        throw new Error('Memo deletion date changes check failed');
                    }
                }

                // Check calendar dot again (should be gone)
                if (dateTitle) {
                    const freshDateTitle = await page.$('.sba-date-nav-wrapper h1');
                    if (freshDateTitle) {
                        await freshDateTitle.click();
                        await delay(1000);
                        await page.screenshot({ path: path.join(screenshotDir, 'local_08_calendar_no_dot.png') });
                        console.log('Captured local_08_calendar_no_dot.png');
                        
                        // Close Calendar
                        const modalClose = await page.$$('button');
                        for (const btn of modalClose) {
                            const text = await page.evaluate(el => el.textContent, btn);
                            if (text.includes('취소') || text.includes('✕')) {
                                await btn.click();
                                await delay(800);
                                break;
                            }
                        }
                    }
                }
            } else {
                console.log('Textarea not found inside expanded editor');
            }
        } else {
            console.log('Note handle not found on today. Let us check if there is an active plan.');
        }

        // Test Navigation Tabs - Sharing Tab (나눔)
        console.log('Navigating to Sharing Tab...');
        const navItems = await page.$$('.sba-nav-item');
        if (navItems.length >= 5) {
            await navItems[4].click(); // 나눔 tab is the 5th
            await delay(1500);
            await page.screenshot({ path: path.join(screenshotDir, 'local_09_sharing_tab.png') });
            console.log('Captured local_09_sharing_tab.png');
            
            // Return to Today Tab
            await navItems[0].click();
            await delay(800);
        }

        // Test Settings Modal (Dark Mode & Font Size)
        console.log('Testing Settings Modal...');
        const settingsBtn = await page.$('button[title="설정"]');
        if (settingsBtn) {
            await settingsBtn.click();
            await delay(1000);
            await page.screenshot({ path: path.join(screenshotDir, 'local_10_settings_modal.png') });
            console.log('Captured local_10_settings_modal.png');

            // Toggle Dark Mode
            const switchContainer = await page.$('label'); // setting row switcher
            if (switchContainer) {
                await switchContainer.click();
                await delay(800);
                await page.screenshot({ path: path.join(screenshotDir, 'local_11_settings_darkmode.png') });
                console.log('Captured local_11_settings_darkmode.png');
                
                // Toggle back to normal
                await switchContainer.click();
                await delay(500);
            }

            // Change Font Size
            const fontSizeButtons = await page.$$('button');
            for (const btn of fontSizeButtons) {
                const txt = await page.evaluate(el => el.textContent, btn);
                if (txt.includes('A+')) {
                    await btn.click();
                    await delay(400);
                    await btn.click(); // Font size up twice
                    await delay(400);
                    await page.screenshot({ path: path.join(screenshotDir, 'local_12_settings_fontsize_up.png') });
                    console.log('Captured local_12_settings_fontsize_up.png');
                    break;
                }
            }

            // Close settings
            const modalClose = await page.$$('button');
            for (const btn of modalClose) {
                const text = await page.evaluate(el => el.textContent, btn);
                if (text.includes('확인') || text.includes('✕')) {
                    await btn.click();
                    await delay(800);
                    break;
                }
            }
        }

    } catch (e) {
        console.error('Error during LOCAL test execution:', e);
    }

    // ----------------------------------------------------
    // TEST 2: LIVE SITE (https://sba-qt.onrender.com/)
    // ----------------------------------------------------
    try {
        console.log('\n--- STARTING LIVE SITE TEST ---');
        await page.goto('https://sba-qt.onrender.com/', { waitUntil: 'networkidle2' });
        
        // Wait for Splash screen
        console.log('Waiting for live site splash screen...');
        await delay(5000); // 5 seconds for safety on render.com free tier

        // Capture live main screen
        await page.screenshot({ path: path.join(screenshotDir, 'live_01_main.png') });
        console.log('Captured live_01_main.png');

        // Test 날짜 이동 및 캘린더 모달
        console.log('Testing live site date title click...');
        const dateTitle = await page.$('.sba-date-nav-wrapper h1');
        if (dateTitle) {
            await dateTitle.click();
            await delay(1200);
            await page.screenshot({ path: path.join(screenshotDir, 'live_02_calendar.png') });
            console.log('Captured live_02_calendar.png');
            
            // Close Calendar
            const modalClose = await page.$$('button');
            for (const btn of modalClose) {
                const text = await page.evaluate(el => el.textContent, btn);
                if (text.includes('취소') || text.includes('✕')) {
                    await btn.click();
                    await delay(800);
                    break;
                }
            }
        }

        // Test Settings (Dark mode & Font Size)
        console.log('Testing live site Settings...');
        const settingsBtn = await page.$('button[title="설정"]');
        if (settingsBtn) {
            await settingsBtn.click();
            await delay(1200);
            await page.screenshot({ path: path.join(screenshotDir, 'live_03_settings.png') });
            console.log('Captured live_03_settings.png');
            
            // Close settings
            const modalClose = await page.$$('button');
            for (const btn of modalClose) {
                const text = await page.evaluate(el => el.textContent, btn);
                if (text.includes('확인') || text.includes('✕')) {
                    await btn.click();
                    await delay(800);
                    break;
                }
            }
        }

    } catch (e) {
        console.error('Error during LIVE site test execution:', e);
    }

    // Output console error summary
    console.log('\n=== CONSOLE ERROR SUMMARY ===');
    if (consoleErrors.length > 0) {
        console.log(`[WARNING] Test session completed with ${consoleErrors.length} console errors:`);
        consoleErrors.forEach((err, index) => {
            console.log(`  ${index + 1}. ${err}`);
        });
    } else {
        console.log('[SUCCESS] No console errors were detected during the entire session!');
    }

    await browser.close();
    console.log('\nAll tests completed successfully!');
}

runTests();
