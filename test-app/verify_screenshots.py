import asyncio
import os
import json
from playwright.async_api import async_playwright

scratch_dir = r"C:\Users\WISH\.gemini\antigravity\brain\0f115f8d-ebee-45ea-a01e-1651f80756a1\scratch"
if not os.path.exists(scratch_dir):
    os.makedirs(scratch_dir, exist_ok=True)

async def run_capture(p, url, prefix):
    print(f"\n=== Starting capture for {prefix} ({url}) ===")
    browser = await p.chromium.launch(headless=True)
    page = await browser.new_page()
    await page.set_viewport_size({"width": 375, "height": 812})

    errors = []
    logs = []

    # Listen for console messages
    page.on("console", lambda msg: logs.append(f"[{msg.type.upper()}] {msg.text}"))
    # Listen for uncaught page errors
    page.on("pageerror", lambda err: errors.append(str(err)))

    # 1. Splash Screen
    print("1. Loading splash screen...")
    await page.goto(url, wait_until="domcontentloaded")
    # Take screenshot of splash screen immediately
    splash_path = os.path.join(scratch_dir, f"{prefix}_1_splash.png")
    await page.screenshot(path=splash_path)
    print(f"Saved: {prefix}_1_splash.png")

    # Wait for splash screen to disappear
    print("Waiting for splash screen to hide...")
    try:
        # wait for hidden
        splash_selector = page.locator(".sba-splash-screen")
        await splash_selector.wait_for(state="hidden", timeout=15000)
    except Exception as e:
        print("Splash screen wait timeout, sleeping 3.5s...")
        await asyncio.sleep(3.5)

    # Wait for app container
    try:
        app_container = page.locator(".sba-app-container")
        await app_container.wait_for(state="visible", timeout=10000)
    except Exception as e:
        print("sba-app-container not visible")

    # Wait for loading indicator to disappear
    try:
        loading_indicator = page.locator(".sba-loading")
        await loading_indicator.wait_for(state="hidden", timeout=10000)
    except Exception as e:
        pass

    await asyncio.sleep(1)

    # Clear lists to focus on day change errors
    errors.clear()
    logs.clear()

    # 2. Navigate to '주간' tab and change day
    print("2. Navigating to Weekly tab & changing day...")
    try:
        weekly_tab = page.locator(".sba-nav-item", has_text="주간").first
        await weekly_tab.click()
        await asyncio.sleep(1)

        # Click the first weekly card
        weekly_cards = page.locator(".sba-weekly-card")
        card_count = await weekly_cards.count()
        if card_count > 0:
            print(f"Clicking first weekly card (out of {card_count})...")
            await weekly_cards.first.click()
            await asyncio.sleep(2)  # Wait for transition/render
            
            # Save day changed screenshot
            day_changed_path = os.path.join(scratch_dir, f"{prefix}_2_day_changed.png")
            await page.screenshot(path=day_changed_path)
            print(f"Saved: {prefix}_2_day_changed.png")
        else:
            print("No weekly cards found.")
            day_changed_path = os.path.join(scratch_dir, f"{prefix}_2_day_changed.png")
            await page.screenshot(path=day_changed_path)
    except Exception as e:
        print(f"Failed during weekly tab navigation/day change: {e}")
        day_changed_path = os.path.join(scratch_dir, f"{prefix}_2_day_changed.png")
        await page.screenshot(path=day_changed_path)

    # 3. Calendar Modal
    print("3. Opening Calendar Modal...")
    try:
        header_h1 = page.locator(".sba-header h1").first
        if await header_h1.is_visible():
            await header_h1.click()
            await asyncio.sleep(1)
            
            calendar_path = os.path.join(scratch_dir, f"{prefix}_3_calendar_modal.png")
            await page.screenshot(path=calendar_path)
            print(f"Saved: {prefix}_3_calendar_modal.png")
        else:
            # Try alternate selector
            header_h1_alt = page.locator("h1").first
            await header_h1_alt.click()
            await asyncio.sleep(1)
            calendar_path = os.path.join(scratch_dir, f"{prefix}_3_calendar_modal.png")
            await page.screenshot(path=calendar_path)
            print(f"Saved: {prefix}_3_calendar_modal.png")
    except Exception as e:
        print(f"Failed to trigger Calendar Modal: {e}")

    await browser.close()
    print(f"=== Completed capture for {prefix} ===")
    
    return {
        "errors": errors,
        "logs": [l for l in logs if "error" in l.lower() or "warning" in l.lower() or "exception" in l.lower()]
    }

async def main():
    async with async_playwright() as p:
        # Capture for Local (port 3000 - production server)
        local_res = await run_capture(p, "http://localhost:3000/", "local")
        
        # Capture for Live (Render deploy complete)
        live_res = await run_capture(p, "https://sba-qt.onrender.com/", "live")
        
        summary = {
            "local": local_res,
            "live": live_res
        }
        
        print("\n--- VERIFICATION SUMMARY ---")
        print("Local Errors:", len(local_res["errors"]))
        for err in local_res["errors"]:
            print(f"  [Local Error] {err}")
        print("Local Critical Logs:", local_res["logs"])
        
        print("\nLive Errors:", len(live_res["errors"]))
        for err in live_res["errors"]:
            print(f"  [Live Error] {err}")
        print("Live Critical Logs:", live_res["logs"])

        with open(os.path.join(scratch_dir, "verification_summary.json"), "w", encoding="utf-8") as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        print("\nSummary saved to verification_summary.json")

if __name__ == "__main__":
    asyncio.run(main())
