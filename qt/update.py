import sqlite3
from datetime import datetime, timedelta
from config.settings import db_path
from notion_code.settings import PAGE_IDS
from database.database import fetch_and_format_chapter, format_bible_verses
from notion_code.blocks import update_existing_page


# 오늘의 묵상
def update_today_page(qt_schedule, book_map):
    today = datetime.now().strftime("%m.%d")
    today_info = qt_schedule.get(today, {"old": None, "new": None})

    conn = sqlite3.connect(db_path)  # 데이터베이스 연결
    cursor = conn.cursor()  # 커서 생성

    old_testament = format_bible_verses(today_info["old"], book_map, cursor)
    new_testament = format_bible_verses(today_info["new"], book_map, cursor)

    old_blocks = [
        {"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"type": "text", "text": {"content": block}}]}}
        for block in old_testament
    ]
    new_blocks = [
        {"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"type": "text", "text": {"content": block}}]}}
        for block in new_testament
    ]

    content_blocks = []
    content_blocks.append(
        {"object": "block", "type": "heading_2", "heading_2": {"rich_text": [{"type": "text", "text": {"content": "QT: " + (today_info['old'] or '없음')}}]}}
    )
    content_blocks.extend(old_blocks)

    content_blocks.append(
        {"object": "block", "type": "heading_2", "heading_2": {"rich_text": [{"type": "text", "text": {"content": "통독: " + (today_info['new'] or '없음')}}]}}
    )
    content_blocks.extend(new_blocks)

    # 기존 "오늘의 묵상" 페이지 업데이트
    update_existing_page(PAGE_IDS["오늘의 묵상"], content_blocks)

    conn.close()  # 데이터베이스 연결 종료

# 금주의 묵상
def update_weekly_pages(qt_schedule, book_map):
    now = datetime.now()
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()  # SQLite 커서 생성

    for i, day in enumerate(["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"], start=1):
        day_date = (now + timedelta(days=i - now.weekday() - 1)).strftime("%m.%d")
        day_info = qt_schedule.get(day_date, {"old": None, "new": None})

        old_testament = format_bible_verses(day_info["old"], book_map, cursor)
        new_testament = format_bible_verses(day_info["new"], book_map, cursor)

        old_blocks = [
            {"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"type": "text", "text": {"content": block}}]}}
            for block in old_testament
        ]
        new_blocks = [
            {"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"type": "text", "text": {"content": block}}]}}
            for block in new_testament
        ]

        content_blocks = []
        content_blocks.append(
            {"object": "block", "type": "heading_2", "heading_2": {"rich_text": [{"type": "text", "text": {"content": "QT: " + (day_info['old'] or '없음')}}]}}
        )
        content_blocks.extend(old_blocks)

        content_blocks.append(
            {"object": "block", "type": "heading_2", "heading_2": {"rich_text": [{"type": "text", "text": {"content": "통독: " + (day_info['new'] or '없음')}}]}}
        )
        content_blocks.extend(new_blocks)

        # 기존 요일 페이지 업데이트
        update_existing_page(PAGE_IDS[day], content_blocks, new_title=f"{day} ({day_date})")

    conn.close()  # 데이터베이스 연결 종료
