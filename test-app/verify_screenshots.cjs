const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const scratchDir = 'C:\\Users\\WISH\\.gemini\\antigravity\\brain\\0f115f8d-ebee-45ea-a01e-1651f80756a1\\scratch';
if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true });
}

async function runCapture(url, prefix) {
  console.log(`\n=== Starting capture for ${prefix} (${url}) ===`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Mobile viewport layout
  await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });

  const errors = [];
  const logs = [];

  page.on('console', msg => {
    const text = msg.text();
    logs.push(`[CONSOLE ${msg.type().toUpperCase()}] ${text}`);
    if (msg.type() === 'error') {
      console.log(`[${prefix} BROWSER ERROR]`, text);
    }
  });

  page.on('pageerror', err => {
    errors.push(err.toString());
    console.error(`[${prefix} BROWSER UNCAUGHT ERROR]`, err.toString());
  });

  // 1. Splash Screen
  console.log('1. Page loading (Splash)...');
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: path.join(scratchDir, `${prefix}_1_splash.png`) });
  console.log(`Saved: ${prefix}_1_splash.png`);

  // Wait for Splash screen to disappear
  console.log('Waiting for splash screen to hide...');
  try {
    await page.waitForSelector('.sba-splash-screen', { hidden: true, timeout: 15000 });
  } catch (e) {
    console.log('Splash screen did not disappear, waiting 3.5 seconds...');
    await new Promise(r => setTimeout(r, 3500));
  }

  // Wait for app container
  try {
    await page.waitForSelector('.sba-app-container', { timeout: 10000 });
  } catch (e) {
    console.log('sba-app-container not found, taking fallback screenshot');
  }

  // Wait for data loading
  try {
    await page.waitForSelector('.sba-loading', { hidden: true, timeout: 10000 });
  } catch (e) {}

  await new Promise(r => setTimeout(r, 1000));

  // 2. Day Change Test via Weekly Tab
  console.log('2. Navigating to Weekly tab & changing day...');
  
  // Find '주간' tab button
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
    await new Promise(r => setTimeout(r, 1000));
    
    // Click first weekly card
    const cards = await page.$$('.sba-weekly-card');
    if (cards.length > 0) {
      console.log(`Clicking first weekly card out of ${cards.length} cards...`);
      await cards[0].click(); // This navigates back to today/day tab and updates currentDate
      await new Promise(r => setTimeout(r, 1500));
      
      // Screen capture after changing date
      await page.screenshot({ path: path.join(scratchDir, `${prefix}_2_day_changed.png`) });
      console.log(`Saved: ${prefix}_2_day_changed.png`);
    } else {
      console.log('No weekly cards found, capturing current view.');
      await page.screenshot({ path: path.join(scratchDir, `${prefix}_2_day_changed.png`) });
    }
  } else {
    console.log('Weekly tab not found.');
    await page.screenshot({ path: path.join(scratchDir, `${prefix}_2_day_changed.png`) });
  }

  // 3. Calendar Modal Capture
  console.log('3. Clicking date header to trigger Calendar Modal...');
  const headerH1 = await page.$('.sba-header h1');
  if (headerH1) {
    await headerH1.click();
    await new Promise(r => setTimeout(r, 1000));
    
    // Calendar modal screen capture
    await page.screenshot({ path: path.join(scratchDir, `${prefix}_3_calendar_modal.png`) });
    console.log(`Saved: ${prefix}_3_calendar_modal.png`);
  } else {
    console.log('Date header h1 not found, trying other header components...');
    const headerTitle = await page.$('[class*="header"] h1');
    if (headerTitle) {
      await headerTitle.click();
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(scratchDir, `${prefix}_3_calendar_modal.png`) });
      console.log(`Saved: ${prefix}_3_calendar_modal.png`);
    } else {
      console.log('Header elements not found for calendar modal.');
    }
  }

  await browser.close();
  console.log(`=== Done capturing for ${prefix} ===`);
  
  return {
    errors,
    logs: logs.filter(l => l.includes('ERROR') || l.includes('Warning') || l.includes('exception') || l.includes('uncaught'))
  };
}

(async () => {
  // Capture on local port 5174 and live production site
  const localRes = await runCapture('http://localhost:5174/', 'local');
  const liveRes = await runCapture('https://sba-qt.onrender.com/', 'live');
  
  console.log('\n--- VERIFICATION SUMMARY ---');
  console.log('Local Errors count:', localRes.errors.length);
  console.log('Local Critical Logs:', localRes.logs);
  console.log('Live Errors count:', liveRes.errors.length);
  console.log('Live Critical Logs:', liveRes.logs);
  
  fs.writeFileSync(
    path.join(scratchDir, 'verification_summary.json'),
    JSON.stringify({ local: localRes, live: liveRes }, null, 2)
  );
  console.log('Verification log saved to verification_summary.json');
})().catch(err => {
  console.error('Fatal testing error:', err);
  process.exit(1);
});
