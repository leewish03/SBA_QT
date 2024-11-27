import os
import sqlite3
import csv
from datetime import datetime, timedelta
from notion_client import Client

# Notion API 설정
NOTION_API_KEY = "ntn_F4158704991w2VEa4eHR8G83VH4wKosqeshxbZmKGO64Kc"
PARENT_PAGE_ID = "1470f7e0cd5f804a91dfcf468c578e45"  # 상위 페이지 ID
notion = Client(auth=NOTION_API_KEY)

PAGE_IDS = {
    "오늘의 묵상": "1490f7e0cd5f810182a9f7d2c06dcc22",  # "오늘의 묵상" 페이지 ID
    "월요일": "1490f7e0cd5f8142830cfeaa8275ec2f",       # 월요일 페이지 ID
    "화요일": "1490f7e0cd5f812a8978e353d41ff0de",       # 화요일 페이지 ID
    "수요일": "1490f7e0cd5f81f1ae1aff5421b465d2",       # 수요일 페이지 ID
    "목요일": "1490f7e0cd5f81acac33f996fea133ca",       # 목요일 페이지 ID
    "금요일": "1490f7e0cd5f81fe937fd99184e6aeee",       # 금요일 페이지 ID
    "토요일": "1490f7e0cd5f814ba312da5ebb45ca6f",       # 토요일 페이지 ID
    "일요일": "1490f7e0cd5f8159bf03ce40225d955e",       # 일요일 페이지 ID
    
}

# 날짜블록 ID
today_block_id = "1490f7e0cd5f815b9f76c9cf899a49ab"

# 현재 파일이 있는 디렉토리 경로 가져오기
current_dir = os.path.dirname(os.path.abspath(__file__))

# 데이터베이스 및 CSV 파일 경로 설정
db_path = os.path.join(current_dir, "bible_database.db")
csv_file_path = os.path.join(current_dir, "book_map.csv")

# 아이콘
bible_icon="https://cdn.discordapp.com/attachments/923909506717585451/1310340987196801024/free-icon-bible-3004416.png?ex=6744dda4&is=67438c24&hm=38758bc26aa14760969d43d0f327346ccc6941afde479dd0d2bcd6cb4951a51d&"

# QT 일정 데이터
qt_data = """
[11월 QT/통독 범위]            
11.25 (월) 시145 / 롬3-4
11.26 (화) 시146 / 롬5-8
11.27 (수) 시147 / 롬9-12
11.28 (목) 시148 / 롬13-16
11.29 (금) 시149 / 고전1-4
11.30 (토) 시150 / 고전5-8
12.1 (일) 없음 / 고전9-12
"""

# QT 데이터를 파싱하여 딕셔너리로 변환
def parse_qt_data(data):
    """
    QT 데이터를 파싱하여 일정 딕셔너리로 변환합니다.

    :param data: QT 데이터 문자열
    :return: 일정 딕셔너리
    """
    qt_schedule = {}
    lines = data.strip().split("\n")[1:]  # 첫 번째 줄은 제목이므로 제외
    for line in lines:
        try:
            # 디버깅용 출력
            print(f"[DEBUG] Parsing line: {line}")
            
            # 날짜와 내용 분리
            date_part, content_part = line.split(" ", 1)

            # 날짜 포맷 수정 (11.9 -> 11.09, 12.1 -> 12.01)
            month, day = date_part.split(".")
            formatted_date = f"{int(month):02}.{int(day):02}"
            print(f"[DEBUG] Formatted date: {formatted_date}")

            # 내용 분리
            old_testament, new_testament = content_part.split(" / ")
            qt_schedule[formatted_date] = {
                "old": None if old_testament == "없음" else old_testament.split(" ", 1)[1].strip(),
                "new": None if new_testament == "없음" else new_testament.strip(),
            }
            print(f"[DEBUG] Parsed schedule for {formatted_date}: {qt_schedule[formatted_date]}")

        except ValueError as e:
            print(f"[ERROR] Parsing error for line: {line} -> {e}")
    
    return qt_schedule

# CSV 파일에서 성경 책 이름 매핑 읽기
def load_book_map(csv_file):
    """
    CSV 파일에서 성경 약어, ID, 풀네임을 읽어와 book_map을 생성합니다.

    :param csv_file: CSV 파일 경로
    :return: 약어를 키로 하고 ID와 풀네임을 담은 딕셔너리
    """
    book_map = {}
    with open(csv_file, mode="r", encoding="utf-8-sig") as file:
        reader = csv.DictReader(file)
        for row in reader:
            book_map[row["korean_name"]] = {
                "book_id": int(row["book_id"]),
                "full_name": row["full_name"],
            }
    return book_map

# 성경 구절 형식화 함수
def format_bible_verses(book_and_chapters, book_map):
    """
    성경 구절 데이터를 가져오고, 지정된 형식으로 출력합니다.

    :param book_and_chapters: 책 이름과 장 범위를 포함한 문자열
    :param book_map: 성경 책 이름과 ID 매핑 데이터
    :return: 각 장과 절이 포함된 리스트 (각 항목은 블록 단위로 구성됨)
    """
    if not book_and_chapters:
        return ["없음"]
    
    try:
        # 책 이름과 장 범위 분리
        import re
        match = re.match(r"([가-힣]+)([0-9\-]+)", book_and_chapters.strip())
        if not match:
            print(f"형식 오류: {book_and_chapters}")  # 디버깅: 형식 오류
            return [f"형식이 잘못되었습니다: {book_and_chapters}"]

        book_name, chapters = match.groups()
        if book_name not in book_map:
            print(f"책 이름 오류: {book_name}")  # 디버깅: 책 이름 오류
            return [f"책 이름을 찾을 수 없습니다: {book_name}"]

        book_data = book_map[book_name]
        book_id = book_data["book_id"]
        full_name = book_data["full_name"]

        print(f"책 이름: {book_name}, ID: {book_id}, 풀네임: {full_name}")  # 디버깅

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        formatted_output = []

        # 범위 처리
        if "-" in chapters:  # 장 범위
            start_chap, end_chap = map(int, chapters.split("-"))
            for chapter in range(start_chap, end_chap + 1):
                formatted_output.extend(fetch_and_format_chapter(book_name, book_map, chapter, cursor))
        else:  # 단일 장
            chapter = int(chapters)
            formatted_output.extend(fetch_and_format_chapter(book_name, book_map, chapter, cursor))

        conn.close()
        return formatted_output

    except Exception as e:
        return [f"구절 데이터를 가져오는 데 실패했습니다: {str(e)}"]

# 장별 데이터 형식화 함수
def fetch_and_format_chapter(book_name, book_map, chapter, cursor):
    """
    특정 장의 데이터를 가져와서 형식화합니다.

    :param book_name: 책 이름 (약어)
    :param book_map: 성경 책 데이터
    :param chapter: 장 번호
    :param cursor: SQLite 커서 객체
    :return: 형식화된 장과 절의 블록 리스트
    """
    book_data = book_map.get(book_name)
    if not book_data:
        return [f"{book_name} 책을 찾을 수 없습니다."]

    book_id = book_data["book_id"]
    full_name = book_data["full_name"]

    cursor.execute("""
        SELECT paragraph, sentence 
        FROM bible2 
        WHERE book = ? AND chapter = ? 
        ORDER BY paragraph;
    """, (book_id, chapter))
    verses = cursor.fetchall()

    if not verses:
        return [f"{full_name} {chapter}장을 찾을 수 없습니다."]

    # 장 제목 추가
    chapter_title = f"{full_name} {chapter}장"
    formatted_output = [chapter_title]

    # 절 묶기 (10개씩)
    current_block = ""
    for i, (paragraph, sentence) in enumerate(verses, start=1):
        current_block += f"{paragraph} {sentence} "
        if i % 30 == 0:  # 30개 절마다 블록 생성
            formatted_output.append(current_block.strip())
            current_block = ""

    if current_block:  # 남은 절 추가
        formatted_output.append(current_block.strip())

    # 장 뒤에 빈 블록 추가
    formatted_output.append("")
    return formatted_output

# 노션 제목2 생성 함수
def create_heading_2_block(parent_page_id, heading_text):
    try:
        notion.blocks.children.append(
            block_id=parent_page_id,
            children=[
                {
                    "object": "block",
                    "type": "heading_2",
                    "heading_2": {
                        "rich_text": [{"type": "text", "text": {"content": heading_text}}]
                    },
                }
            ],
        )
        print(f"제목2 블록 추가 완료: {heading_text}")
    except Exception as e:
        print(f"제목2 블록 추가 중 오류 발생: {e}")

# 구분선 생성 함수
def create_divider_block(parent_page_id):
    try:
        notion.blocks.children.append(
            block_id=parent_page_id,
            children=[
                {"object": "block", "type": "divider", "divider": {}}
            ],
        )
        print("구분선 블록 추가 완료")
    except Exception as e:
        print(f"구분선 블록 추가 중 오류 발생: {e}")

# 빈 블록 생성 함수
def create_empty_block(parent_page_id):
    """
    Notion 페이지에 빈 텍스트 블록을 추가합니다.

    :param parent_page_id: 부모 페이지 ID
    """
    try:
        # 빈 텍스트 블록 생성
        notion.blocks.children.append(
            block_id=parent_page_id,
            children=[
                {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": []  # 내용 없는 빈 블록
                    },
                }
            ],
        )
        print(f"빈 블록 추가 완료: {parent_page_id}")
    except Exception as e:
        print(f"빈 블록 추가 중 오류 발생: {e}")

# 링크 블록 생성 함수
def create_link_block(parent_page_id, link_text, link_url):
    """
    Notion 페이지에 링크 블록을 추가합니다.

    :param parent_page_id: 부모 페이지 ID
    :param link_text: 링크에 표시할 텍스트
    :param link_url: 링크의 URL
    """
    try:
        # 링크 블록 생성
        notion.blocks.children.append(
            block_id=parent_page_id,
            children=[
                {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [
                            {
                                "type": "text",
                                "text": {"content": link_text, "link": {"url": link_url}},
                            }
                        ]
                    },
                }
            ],
        )
        print(f"링크 블록 추가 완료: {link_text} -> {link_url}")
    except Exception as e:
        print(f"링크 블록 추가 중 오류 발생: {e}")

''' 노션 페이지 생성 함수
def create_or_update_page(title, content_blocks, parent_id, icon=None):
    """
    Notion 페이지를 생성하거나 업데이트합니다.

    :param title: 페이지 제목
    :param content_blocks: 블록의 목록 (각 블록의 내용과 형식 정의)
    :param parent_id: 부모 페이지 ID
    :param icon: 페이지 아이콘 (이모지 또는 URL)
    """
    # 페이지 속성
    page_properties = {
        "title": [{"type": "text", "text": {"content": title}}],
    }

    # 아이콘 설정
    icon_property = None
    if icon:
        if len(icon) == 1:
            icon_property = {"type": "emoji", "emoji": icon}  # 이모지 설정
        else:
            icon_property = {"type": "external", "external": {"url": icon}}  # URL 설정

    try:
        # 페이지 생성
        page = notion.pages.create(
            parent={"type": "page_id", "page_id": parent_id},
            properties=page_properties,
            icon=icon_property,  # 아이콘 추가
            children=content_blocks,
        )
        print(f"페이지 생성 완료: {title}")
        return page
    except Exception as e:
        print(f"페이지 생성 중 오류 발생: {e}")
        return None
'''
# 페이지 내용 업데이트 함수
def update_existing_page(page_id, content_blocks, new_title=None):
    """
    기존 페이지의 내용을 업데이트합니다.

    :param page_id: 기존 페이지의 ID
    :param content_blocks: 업데이트할 블록의 목록
    :param new_title: 페이지 제목을 업데이트할 경우 새 제목
    """
    try:
        # 페이지 제목 업데이트 (옵션)
        if new_title:
            notion.pages.update(page_id, properties={
                "title": [{"type": "text", "text": {"content": new_title}}],
            })
            print(f"페이지 제목 업데이트 완료: {new_title}")

        # 기존 블록 삭제
        existing_blocks = notion.blocks.children.list(block_id=page_id)["results"]
        for block in existing_blocks:
            notion.blocks.delete(block_id=block["id"])

        # 새 블록 추가
        for block in content_blocks:
            notion.blocks.children.append(block_id=page_id, children=[block])

        print(f"페이지 내용 업데이트 완료: {page_id}")

    except Exception as e:
        print(f"페이지 업데이트 중 오류 발생: {e}")

def update_block_date(block_id):
    """
    Notion 블록 이름을 '오늘은 (이번달)월 (오늘)일입니다 🍀'로 업데이트합니다.
    :param block_id: 업데이트할 블록 ID
    """
    try:
        # 현재 날짜 가져오기
        today = datetime.now()
        new_title = f"오늘은 {today.month}월 {today.day}일입니다 🍀"
        
        # 블록 업데이트
        notion.blocks.update(
            block_id=block_id,
            heading_2={
                "rich_text": [
                    {
                        "type": "text",
                        "text": {"content": new_title},
                    }
                ]
            },
        )
        print(f"블록 ID {block_id} 업데이트 완료: {new_title}")
    except Exception as e:
        print(f"블록 업데이트 중 오류 발생: {e}")

''' 모든 블록 제거 함수
def clear_all_blocks(page_id):
    try:
        blocks = notion.blocks.children.list(block_id=page_id)["results"]
        for block in blocks:
            block_id = block["id"]
            notion.blocks.delete(block_id=block_id)
        print("모든 블록 삭제 완료")
    except Exception as e:
        print(f"블록 삭제 중 오류 발생: {e}")
'''
# 오늘의 묵상
def update_today_page(qt_schedule, book_map):
    today = datetime.now().strftime("%m.%d")
    today_info = qt_schedule.get(today, {"old": None, "new": None})
    print(f"[DEBUG] 오늘의 QT 데이터: {today_info}")  # 디버깅

    old_testament = format_bible_verses(today_info["old"], book_map)
    #print(f"[DEBUG] 오늘의 구약: {old_testament}")  # 디버깅
    new_testament = format_bible_verses(today_info["new"], book_map)
    #print(f"[DEBUG] 오늘의 신약: {new_testament}")  # 디버깅

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

# 금주의 묵상
def update_weekly_pages(qt_schedule, book_map):
    now = datetime.now()
    for i, day in enumerate(["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"], start=1):
        day_date = (now + timedelta(days=i - now.weekday() - 1)).strftime("%m.%d")
        day_info = qt_schedule.get(day_date, {"old": None, "new": None})
        print(f"[DEBUG] {day} ({day_date}): {day_info}")  # 디버깅

        old_testament = format_bible_verses(day_info["old"], book_map)
        #print(f"[DEBUG] {day} 구약: {old_testament}")  # 디버깅
        new_testament = format_bible_verses(day_info["new"], book_map)
        #print(f"[DEBUG] {day} 신약: {new_testament}")  # 디버깅

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

# 메인 실행
if __name__ == "__main__":
    book_map = load_book_map(csv_file_path)
    qt_schedule = parse_qt_data(qt_data)
    
    update_block_date(today_block_id)
    update_today_page(qt_schedule, book_map)
    update_weekly_pages(qt_schedule, book_map)
