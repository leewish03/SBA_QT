import asyncio
import os
from playwright.async_api import async_playwright

async def run():
    print("브라우저 콘솔 에러 수집 모드로 Playwright 시작...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_viewport_size({"width": 375, "height": 812})

        # 콘솔 메시지 이벤트 핸들러 등록
        console_errors = []
        page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type in ["error", "warning"] else None)
        
        # 페이지 내 에러 발생 이벤트 핸들러 등록
        page_errors = []
        page.on("pageerror", lambda err: page_errors.append(f"Page Error: {err}"))

        url = "https://sba-qt.onrender.com/"
        print(f"{url} 접속 중...")
        try:
            await page.goto(url, wait_until="networkidle", timeout=90000)
        except Exception as e:
            print(f"접속 실패: {e}")
            await browser.close()
            return

        # 스플래시 대기
        await asyncio.sleep(5)
        
        print("초기 접속 후 발생한 에러/경고 목록:")
        for err in page_errors:
            print(f"  [PAGE_ERR] {err}")
        for err in console_errors:
            print(f"  [CONSOLE] {err}")
            
        # 콘솔/페이지 에러 비우고 요일 클릭 테스트 진행
        page_errors.clear()
        console_errors.clear()

        days = ["월", "화", "수", "목", "금", "토", "일"]
        for day in days:
            try:
                day_btn = page.locator(f"text={day}").first
                if await day_btn.is_visible():
                    print(f"'{day}' 요일 카드 클릭 시도...")
                    await day_btn.click()
                    await asyncio.sleep(3)
                    
                    # 클릭 후 에러 분석
                    print(f"'{day}' 요일 클릭 후 발생한 에러/경고 목록:")
                    if not page_errors and not console_errors:
                        print("  [성공] 발생한 브라우저 콘솔 에러가 없습니다.")
                    else:
                        for err in page_errors:
                            print(f"  [PAGE_ERR] {err}")
                        for err in console_errors:
                            print(f"  [CONSOLE] {err}")
                    
                    # 렌더링된 텍스트 확인
                    body_text = await page.inner_text("body")
                    print(f"  [텍스트 검증] body 텍스트 길이: {len(body_text.strip())}")
                    break # 첫 요일 클릭만 확인
            except Exception as click_err:
                print(f"'{day}' 요일 클릭 실패: {click_err}")

        await browser.close()
        print("검증 완료")

if __name__ == "__main__":
    asyncio.run(run())
