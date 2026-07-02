const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const scratchDir = 'C:\\Users\\WISH\\.gemini\\antigravity\\brain\\422f04a7-3ffc-4808-8ad2-71471a2d77d8\\scratch';
if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate random UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

(async () => {
    console.log('=== Starting E2E QA Test Script (Sheets Rollback) ===');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Override clipboard permissions to read/write clipboard contents during test
    const context = browser.defaultBrowserContext();
    await context.overridePermissions('http://localhost:3000', ['clipboard-read', 'clipboard-write']);
    const page = await browser.newPage();

    // Mock confirm, alert & clipboard to prevent Puppeteer blocking and permission errors
    await page.evaluateOnNewDocument(() => {
        window.confirm = () => true;
        window.alert = () => {};
        
        let mockText = '';
        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText: async (text) => { mockText = text; return Promise.resolve(); },
                readText: async () => { return Promise.resolve(mockText); }
            },
            configurable: true,
            writable: true
        });
    });
    
    // Set viewport to mobile size
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });

    // Listen to console error/log
    page.on('console', msg => {
        const text = msg.text();
        if (msg.type() === 'error') {
            console.log('[BROWSER ERROR]:', text);
        } else {
            console.log(`[BROWSER LOG]: ${text}`);
        }
    });

    page.on('pageerror', err => {
        console.log('[BROWSER PAGE ERROR (UNCAUGHT)]:', err.stack || err.message);
    });
    
    // Listen to network responses for API debugging
    page.on('response', async response => {
        const status = response.status();
        const url = response.url();
        if (url.includes('/api/')) {
            console.log(`[API RESPONSE]: ${status} - ${url}`);
            if (status >= 400) {
                try {
                    const text = await response.text();
                    console.log(`[API ERROR BODY]: ${text}`);
                } catch (e) {}
            }
        }
    });

    try {
        async function captureAndLog(filename) {
            const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 150));
            console.log(`[CAPTURE ${filename}] Body Text Preview: "${bodyText.replace(/\n/g, ' ')}"`);
            await page.screenshot({ path: path.join(scratchDir, filename) });
            console.log(`Saved: ${filename}`);
        }

        // 1. Splash & Guest Onboarding
        console.log('1. Navigating to http://localhost:3000/...');
        await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
        
        console.log('Waiting for splash screen...');
        await delay(4500); // 4.5s delay to ensure splash is fully gone

        await captureAndLog('qa_1_guest_page.png');

        console.log('Dismissing push prompt for subsequent test reliability...');
        await page.evaluate(() => {
            localStorage.setItem('sba_qt_push_prompt_dismissed', 'true');
        });

        // 2. Inject Session Mock & Reload
        const testUuid = generateUUID();
        console.log(`2. Injecting mock session for user: ${testUuid}`);
        await page.evaluate((uuid) => {
            const header = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"; // {"alg":"HS256","typ":"JWT"}
            const iat = Math.floor(Date.now() / 1000);
            const exp = iat + 3600;
            const payloadObj = {
                sub: uuid,
                email: "test-qa@example.com",
                role: "authenticated",
                aud: "authenticated",
                iat: iat,
                exp: exp
            };
            const payload = btoa(JSON.stringify(payloadObj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
            const token = `${header}.${payload}.dummy_sig`;

            const session = {
                access_token: token,
                token_type: "bearer",
                expires_in: 3600,
                refresh_token: "mock-refresh-token",
                user: {
                    id: uuid,
                    email: "test-qa@example.com",
                    role: "authenticated",
                    aud: "authenticated",
                    user_metadata: {
                        name: "QA Tester"
                    }
                },
                expires_at: Math.floor(Date.now() / 1000) + 3600
            };
            localStorage.setItem('sb-ebfpjvwwbognddixrvyc-auth-token', JSON.stringify(session));
            localStorage.setItem('sb-localhost-auth-token', JSON.stringify(session));
            localStorage.setItem('sb-localhost-3000-auth-token', JSON.stringify(session));
            localStorage.setItem('sb-127.0.0.1-auth-token', JSON.stringify(session));
        }, testUuid);

        console.log('Reloading page to apply mock session...');
        await page.reload({ waitUntil: 'networkidle2' });
        
        console.log('Waiting for splash screen after reload...');
        try {
            await page.waitForSelector('.sba-splash-screen', { hidden: true, timeout: 15000 });
        } catch (e) {
            await delay(4500);
        }
        await delay(1500); // Ensure state updates complete

        await captureAndLog('qa_2_main_meditation.png');

        // 3. Open Settings Modal for Admin operations (Google Sheet Admin view)
        console.log('3. Opening Settings Modal...');
        const settingsBtn = await page.$('button[title="설정"]');
        if (settingsBtn) {
            await page.evaluate((btn) => btn.click(), settingsBtn);
            await delay(1500);
        } else {
            console.error('Failed to find Settings button');
        }

        // Capture Settings Modal showing admin section (Purge)
        await captureAndLog('qa_5_settings_admin_tab.png');

        // Click Google Sheets Purge button
        console.log('Triggering Google Sheets Purge sync...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const purgeBtn = btns.find(b => b.textContent.includes('구글 스프레드시트 캐시 갱신'));
            if (purgeBtn) purgeBtn.click();
        });
        await delay(3000); // Wait for API sync to complete & settings modal to auto-close

        // 4. Open Calendar Modal & Change Date
        console.log('4. Opening Calendar Modal...');
        const dateNavHeader = await page.$('.sba-date-nav-wrapper h1');
        if (dateNavHeader) {
            await page.evaluate((el) => el.click(), dateNavHeader);
            await delay(1500);
        } else {
            console.error('Failed to find Date navigation header for calendar');
        }

        // Switch to CalendarGrid View (달력에서 선택하기 버튼 클릭)
        console.log('Switching to Calendar Grid mode...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const calBtn = btns.find(b => b.textContent.includes('달력에서 선택하기'));
            if (calBtn) calBtn.click();
        });
        await delay(1000);

        // Capture Calendar grid view
        await captureAndLog('qa_6_calendar_grid.png');

        // Select a date from calendar grid (e.g. 15th)
        console.log('Selecting 15th from calendar grid...');
        await page.evaluate(() => {
            const dayCell = document.querySelector('div[data-qa="calendar-day-cell"][data-date="15"]');
            if (dayCell) {
                dayCell.click();
            } else {
                const fallbackCell = document.querySelector('div[data-qa="calendar-day-cell"]');
                if (fallbackCell) fallbackCell.click();
            }
        });
        await delay(1500); // Wait for transition and schedule recalculation

        // 5. Verify the updated schedule on main screen
        console.log('5. Verifying applied schedule...');
        await captureAndLog('qa_7_main_schedule_applied.png');

        // === 5.1 단일 구절 복사 테스트 ===
        console.log('5.1 Testing single verse copy...');
        await page.waitForSelector('div[id^="verse-"]');
        
        const firstVerseBlock = await page.$('div[id^="verse-"]');
        if (firstVerseBlock) {
            const verseNum = await page.evaluate(el => el.children[0].textContent.trim(), firstVerseBlock);
            const verseText = await page.evaluate(el => el.children[1].textContent.trim(), firstVerseBlock);
            console.log(`First Verse Num: ${verseNum}, Text: ${verseText}`);
            
            await page.evaluate(el => el.click(), firstVerseBlock);
            await delay(500);
            
            const isFloatingBarVisible = await page.evaluate(() => document.querySelector('.sba-floating-bar') !== null);
            console.log(`Is Floating Bar visible? ${isFloatingBarVisible}`);
            
            await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('.sba-floating-bar button'));
                const copyBtn = btns.find(b => b.textContent.includes('복사'));
                if (copyBtn) copyBtn.click();
            });
            await delay(800);
            
            const copiedText = await page.evaluate(() => navigator.clipboard.readText());
            console.log(`Copied text: \n"${copiedText}"`);
            
            const lines = copiedText.split('\n');
            const headerValid = lines[0].startsWith('[') && lines[0].endsWith(']');
            const bodyText = lines.slice(1).join('\n').trim();
            const bodyValid = bodyText === verseText;
            
            console.log(`Header Valid: ${headerValid} ("${lines[0]}")`);
            console.log(`Body Valid (No Verse Num): ${bodyValid} ("${bodyText}" vs "${verseText}")`);
            
            if (headerValid && bodyValid) {
                console.log('▶ [SUCCESS] Single verse copy format verified! Header has citation and body has no verse number.');
            } else {
                console.error('▶ [FAILURE] Single verse copy format failed validation.');
            }
            
            const isFloatingBarCleared = await page.evaluate(() => document.querySelector('.sba-floating-bar') === null);
            console.log(`Is Floating Bar cleared after copy? ${isFloatingBarCleared}`);
        } else {
            console.error('Failed to find verse block for single verse copy test');
        }

        // === 5.2 다중 구절 복사 테스트 ===
        console.log('5.2 Testing multiple verses copy...');
        const verseBlocks = await page.$$('div[id^="verse-"]');
        if (verseBlocks.length >= 2) {
            const v1Num = await page.evaluate(el => el.children[0].textContent.trim(), verseBlocks[0]);
            const v1Text = await page.evaluate(el => el.children[1].textContent.trim(), verseBlocks[0]);
            const v2Num = await page.evaluate(el => el.children[0].textContent.trim(), verseBlocks[1]);
            const v2Text = await page.evaluate(el => el.children[1].textContent.trim(), verseBlocks[1]);
            
            console.log(`Verse 1: ${v1Num} - ${v1Text}`);
            console.log(`Verse 2: ${v2Num} - ${v2Text}`);
            
            await page.evaluate(el => el.click(), verseBlocks[0]);
            await page.evaluate(el => el.click(), verseBlocks[1]);
            await delay(500);
            
            await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('.sba-floating-bar button'));
                const copyBtn = btns.find(b => b.textContent.includes('복사'));
                if (copyBtn) copyBtn.click();
            });
            await delay(800);
            
            const copiedTextMult = await page.evaluate(() => navigator.clipboard.readText());
            console.log(`Copied text (Multiple): \n"${copiedTextMult}"`);
            
            const linesMult = copiedTextMult.split('\n');
            const headerMultValid = linesMult[0].startsWith('[') && linesMult[0].endsWith(']');
            
            const expectedLine1 = `${v1Num} ${v1Text}`;
            const expectedLine2 = `${v2Num} ${v2Text}`;
            const actualLine1 = linesMult[1]?.trim();
            const actualLine2 = linesMult[2]?.trim();
            
            const bodyMultValid = actualLine1 === expectedLine1 && actualLine2 === expectedLine2;
            
            console.log(`Header Mult Valid: ${headerMultValid} ("${linesMult[0]}")`);
            console.log(`Body Mult Valid (With Verse Nums): ${bodyMultValid}`);
            
            if (headerMultValid && bodyMultValid) {
                console.log('▶ [SUCCESS] Multiple verses copy format verified! Format is "[Citation]\\n1 Text1\\n2 Text2".');
            } else {
                console.error('▶ [FAILURE] Multiple verses copy format failed validation.');
            }
            
            const isFloatingBarClearedMult = await page.evaluate(() => document.querySelector('.sba-floating-bar') === null);
            console.log(`Is Floating Bar cleared after multiple copy? ${isFloatingBarClearedMult}`);
        } else {
            console.error('Failed to find at least 2 verse blocks for multiple verses copy test');
        }

        // 6. Re-open settings to check push/theme configuration
        console.log('6. Re-opening Settings Modal to check configurations...');
        const settingsBtnFinal = await page.$('button[title="설정"]');
        if (settingsBtnFinal) {
            await page.evaluate((btn) => btn.click(), settingsBtnFinal);
            await delay(1500);
        }

        await captureAndLog('qa_8_settings_push_only.png');

        // Close Settings Modal
        console.log('Closing Settings modal...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const closeBtn = btns.find(b => b.textContent.includes('✕') || b.textContent.includes('확인'));
            if (closeBtn) closeBtn.click();
        });
        await delay(1000);

    } catch (e) {
        console.error('Fatal error during E2E QA run:', e);
    } finally {
        await browser.close();
        console.log('=== E2E QA Test Script Finished ===');
    }
})();
