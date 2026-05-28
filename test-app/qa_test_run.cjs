const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const scratchDir = 'C:\\Users\\WISH\\.gemini\\antigravity\\brain\\0f115f8d-ebee-45ea-a01e-1651f80756a1\\scratch';
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
    console.log('=== Starting E2E QA Test Script ===');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
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

    try {
        // 1. Splash & Guest Onboarding
        console.log('1. Navigating to http://localhost:3000/...');
        await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
        
        console.log('Waiting for splash screen...');
        await delay(3500); // Wait for splash to disappear

        await page.screenshot({ path: path.join(scratchDir, 'qa_1_login_page.png') });
        console.log('Saved: qa_1_login_page.png');

        // 2. Inject Session Mock & Reload
        const testUuid = generateUUID();
        console.log(`2. Injecting mock session for user: ${testUuid}`);
        await page.evaluate((uuid) => {
            // Create a valid 3-part mock JWT with dummy_sig signature
            const header = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"; // {"alg":"HS256","typ":"JWT"}
            const payloadObj = {
                sub: uuid,
                email: "test-qa@example.com",
                role: "authenticated",
                aud: "authenticated"
            };
            // Simple base64url encode helper
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
        await delay(3500); // Wait for splash again

        // Debug: print localStorage keys and session
        const lsKeys = await page.evaluate(() => {
            return {
                keys: Object.keys(localStorage),
                session: localStorage.getItem('sb-localhost-auth-token') ? 'FOUND_LOCALHOST' : 'NOT_FOUND_LOCALHOST'
            };
        });
        console.log('localStorage status after reload:', lsKeys);

        await page.screenshot({ path: path.join(scratchDir, 'qa_2_onboarding_join_create.png') });
        console.log('Saved: qa_2_onboarding_join_create.png');

        // 3. Switch to "새 교회 개설"
        console.log('3. Switching to Create Church Tab...');
        const tabButtons = await page.$$('button');
        let createTabBtn = null;
        for (const btn of tabButtons) {
            const text = await page.evaluate(el => el.textContent.trim(), btn);
            if (text.includes('새 교회 개설')) {
                createTabBtn = btn;
                break;
            }
        }

        if (createTabBtn) {
            await createTabBtn.click();
            await delay(500);
        } else {
            console.error('Failed to find "새 교회 개설" tab button');
        }

        // Fill Create Church form
        console.log('Filling Create Church form...');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const churchName = `QA 검증교회 ${randomNum}`;
        const inviteCode = `QA${randomNum}`;

        // Input selectors
        const inputs = await page.$$('input');
        // Find inputs by placeholder or index
        for (const input of inputs) {
            const placeholder = await page.evaluate(el => el.placeholder || '', input);
            if (placeholder.includes('예: 서울북부교회')) {
                await input.type(churchName);
            } else if (placeholder.includes('비밀 코드를 입력하세요')) {
                await input.type(inviteCode);
            }
        }

        // Select 3rd color preset
        console.log('Selecting color preset...');
        // Color circles have class or styled-component class. Let's find via evaluating or custom selector
        await page.evaluate(() => {
            const circles = Array.from(document.querySelectorAll('div')).filter(el => {
                const style = window.getComputedStyle(el);
                return style.borderRadius === '50%' && style.width === '28px';
            });
            if (circles.length >= 3) {
                circles[2].click(); // Click 3rd preset (theme_color)
            }
        });
        await delay(500);

        await page.screenshot({ path: path.join(scratchDir, 'qa_3_create_church_form.png') });
        console.log('Saved: qa_3_create_church_form.png');

        // Submit creation
        console.log('Submitting church creation...');
        const actionButtons = await page.$$('button');
        let submitBtn = null;
        for (const btn of actionButtons) {
            const text = await page.evaluate(el => el.textContent.trim(), btn);
            if (text.includes('교회 개설하고 가입하기')) {
                submitBtn = btn;
                break;
            }
        }

        if (submitBtn) {
            await submitBtn.click();
            console.log('Clicked submit. Waiting for onboarding finish & main load...');
            await delay(4000); // Wait for API response and redirect
        } else {
            console.error('Failed to find submit button');
        }

        // Verify we are on main page
        await page.screenshot({ path: path.join(scratchDir, 'qa_4_main_no_schedule.png') });
        console.log('Saved: qa_4_main_no_schedule.png');

        // 4. Open Settings Modal for Admin operations
        console.log('4. Opening Settings Modal...');
        const settingsBtn = await page.$('button[title="설정"]');
        if (settingsBtn) {
            await settingsBtn.click();
            await delay(1200);
        } else {
            console.error('Failed to find Settings button');
        }

        // Click Admin Generate tab inside settings
        console.log('Switching to Admin Schedule Generation tab...');
        await page.evaluate(() => {
            // Find tab button by text or index.
            const btns = Array.from(document.querySelectorAll('button'));
            const genBtn = btns.find(b => b.textContent.includes('일정 자동 생성기'));
            if (genBtn) genBtn.click();
        });
        await delay(800);

        // Fill Schedule Generation form
        console.log('Filling Schedule Generation form...');
        // Change Bible Range (Start Book, End Book, etc.)
        await page.evaluate(() => {
            const selects = Array.from(document.querySelectorAll('select'));
            // Start Book Select
            if (selects.length >= 2) {
                selects[0].value = 'MAT'; // Matthew
                selects[0].dispatchEvent(new Event('change', { bubbles: true }));
                selects[1].value = 'MAT'; // End Book
                selects[1].dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            // 종료 장을 2장으로 설정하기 위해 종료 장 인풋을 찾습니다.
            const divs = Array.from(document.querySelectorAll('div'));
            const endChapDiv = divs.find(d => d.innerText && d.innerText.includes('종료 장') && !d.innerText.includes('종료 성경'));
            if (endChapDiv) {
                const input = endChapDiv.querySelector('input');
                if (input) {
                    input.value = '2';
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        });
        
        await page.screenshot({ path: path.join(scratchDir, 'qa_5_settings_admin_tab.png') });
        console.log('Saved: qa_5_settings_admin_tab.png');

        // Handle dialog alert if any
        page.on('dialog', async dialog => {
            console.log('Accepting dialog:', dialog.message());
            await dialog.accept();
        });

        // Click Generate Bulk Schedules
        console.log('Triggering bulk schedule generation...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const genSubmitBtn = btns.find(b => b.textContent.includes('자동 생성 및 덮어쓰기'));
            if (genSubmitBtn) genSubmitBtn.click();
        });
        
        await delay(4000); // Wait for API bulk process

        // Re-open settings to test manual edit
        console.log('Re-opening Settings for manual edit...');
        const settingsBtn2 = await page.$('button[title="설정"]');
        if (settingsBtn2) {
            await settingsBtn2.click();
            await delay(1200);
        }

        // Switch to Manual Edit tab
        console.log('Switching to Admin Schedule Manual Edit tab...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const editBtn = btns.find(b => b.textContent.includes('일정 달력 수동 수정'));
            if (editBtn) editBtn.click();
        });
        await delay(800);

        // Fill manual edit form
        console.log('Filling manual schedule edit form...');
        await page.evaluate(() => {
            // 1. 날짜 설정 (수정할 날짜 선택)
            const dateInput = document.querySelector('input[type="date"]');
            if (dateInput) {
                const now = new Date();
                const y = now.getFullYear();
                const m = String(now.getMonth() + 1).padStart(2, '0');
                const d = String(now.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${d}`;
                dateInput.value = dateStr;
                dateInput.dispatchEvent(new Event('input', { bubbles: true }));
                dateInput.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // 2. 묵상/통독 성경 권 select
            const selects = Array.from(document.querySelectorAll('select'));
            if (selects.length >= 2) {
                // 묵상 성경 권
                selects[0].value = 'MAT';
                selects[0].dispatchEvent(new Event('change', { bubbles: true }));
                
                // 통독 성경 권
                selects[1].value = 'GEN';
                selects[1].dispatchEvent(new Event('change', { bubbles: true }));
            }

            // 3. 묵상 본문 제목 input
            const titleInput = document.querySelector('input[placeholder*="말씀으로"]');
            if (titleInput) {
                titleInput.value = '그리스도의 계보';
                titleInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
        await delay(500);

        await page.screenshot({ path: path.join(scratchDir, 'qa_6_settings_manual_edit.png') });
        console.log('Saved: qa_6_settings_manual_edit.png');

        // Save manual schedule
        console.log('Saving manual schedule...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const saveBtn = btns.find(b => b.textContent.includes('일정 저장하기'));
            if (saveBtn) saveBtn.click();
        });
        await delay(3000); // Wait for API update

        // Re-open settings to check settings push config & telegram removal
        console.log('Re-opening Settings for push config check...');
        const settingsBtn3 = await page.$('button[title="설정"]');
        if (settingsBtn3) {
            await settingsBtn3.click();
            await delay(1200);
        }

        await page.screenshot({ path: path.join(scratchDir, 'qa_8_settings_push_only.png') });
        console.log('Saved: qa_8_settings_push_only.png');

        // Close Settings modal
        console.log('Closing Settings modal...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const confirmBtn = btns.find(b => b.textContent.includes('✕') || b.textContent.includes('확인'));
            if (confirmBtn) confirmBtn.click();
        });
        await delay(1000);

        // Verify applied schedule on main screen
        await page.screenshot({ path: path.join(scratchDir, 'qa_7_main_schedule_applied.png') });
        console.log('Saved: qa_7_main_schedule_applied.png');

    } catch (e) {
        console.error('Fatal error during E2E QA run:', e);
    } finally {
        await browser.close();
        console.log('=== E2E QA Test Script Finished ===');
    }
})();
