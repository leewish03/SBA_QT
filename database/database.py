import sqlite3
import csv
from config.settings import db_path

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

# 다중 범위 계산 함수수
def calculate_chapter_range(start, end, book_map):
    """
    여러 책과 장 범위를 계산하여 반환합니다.

    :param start: 시작 구절 (예: "딛1")
    :param end: 끝 구절 (예: "몬1")
    :param book_map: 성경 책 데이터 맵
    :return: [(책 이름, 장 번호)]의 리스트
    """
    import re
    chapter_range = []
    books = list(book_map.keys())

    # 시작과 끝 파싱
    start_match = re.match(r"([가-힣]+)(\d+)", start)
    end_match = re.match(r"([가-힣]+)(\d+)", end)

    if not start_match or not end_match:
        raise ValueError(f"잘못된 범위입니다: {start}-{end}")

    start_book, start_chapter = start_match.groups()
    end_book, end_chapter = end_match.groups()

    if start_book not in books or end_book not in books:
        raise ValueError(f"책 이름을 찾을 수 없습니다: {start_book}, {end_book}")

    start_index = books.index(start_book)
    end_index = books.index(end_book)

    for i in range(start_index, end_index + 1):
        book_name = books[i]
        if i == start_index:  # 시작 책의 범위
            for chapter in range(int(start_chapter), 51):  # 최대 50장 가정
                chapter_range.append((book_name, chapter))
        elif i == end_index:  # 끝 책의 범위
            for chapter in range(1, int(end_chapter) + 1):
                chapter_range.append((book_name, chapter))
        else:  # 중간 책들 (모든 장 포함)
            chapter_range.append((book_name, None))  # None은 모든 장을 의미

    return chapter_range

# 여러 책과 장의 데이터를 가져오는 함수
def fetch_range_verses(chapter_range, book_map):
    """
    범위 데이터에 맞는 구절을 가져옴.
    :param chapter_range: [(책 이름, 장 번호)]의 리스트
    :param book_map: 성경 책 데이터 맵
    :return: 구절 리스트
    """
    result = []
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()  # SQLite 커서 생성

    for book_name, chapter in chapter_range:
        if chapter:  # 특정 장만 포함
            chapter_data = fetch_and_format_chapter(book_name, book_map, chapter, cursor)
            if "찾을 수 없습니다" in chapter_data[0]:  # 데이터가 없으면 종료
                print(f"{book_name} {chapter}장 이후로 데이터 없음. 종료합니다.")
                break
            result.extend(chapter_data)
        else:  # 모든 장 포함
            for chapter_num in range(1, 51):  # 임의 최대 장 번호
                chapter_data = fetch_and_format_chapter(book_name, book_map, chapter_num, cursor)
                if "찾을 수 없습니다" in chapter_data[0]:  # 데이터가 없으면 종료
                    print(f"{book_name} {chapter_num}장 이후로 데이터 없음. 종료합니다.")
                    break
                result.extend(chapter_data)

    conn.close()
    return result

# 성경 구절 형식화 함수
def format_bible_verses(book_and_chapters, book_map, cursor):
    if not book_and_chapters:
        return ["없음"]

    if book_and_chapters.strip() == "없음":
        return ["오늘 QT는 없습니다."]
    
    try:
        import re
        match_range = re.match(r"([가-힣]+)(\d+)-(\d+)", book_and_chapters.strip())
        match_single = re.match(r"([가-힣]+)(\d+)", book_and_chapters.strip())

        if match_range:  # 같은 책 내 범위 (예: 딛1-3)
            book_name, start_chap, end_chap = match_range.groups()
            start_chap, end_chap = int(start_chap), int(end_chap)

            result = []
            for chapter in range(start_chap, end_chap + 1):  # 범위 내 모든 장 처리
                result.extend(fetch_and_format_chapter(book_name, book_map, chapter, cursor))

            return result

        elif match_single:  # 단일 책 단일 장 (예: 딛1)
            book_name, chapter = match_single.groups()
            return fetch_and_format_chapter(book_name, book_map, int(chapter), cursor)

        else:
            return [f"구절 형식이 잘못되었습니다: {book_and_chapters}"]

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

    # 데이터베이스 조회
    cursor.execute("""
        SELECT paragraph, sentence 
        FROM bible2 
        WHERE book = ? AND chapter = ? 
        ORDER BY paragraph;
    """, (book_id, chapter))
    verses = cursor.fetchall()

    # 데이터가 없으면 메시지 반환
    if not verses:
        return [f"{full_name} {chapter}장을 찾을 수 없습니다."]

    # 장 제목 추가
    chapter_title = f"{full_name} {chapter}장"
    formatted_output = [chapter_title]

    # 절 묶기 (10개씩 묶어서 출력)
    current_block = ""
    for i, (paragraph, sentence) in enumerate(verses, start=1):
        current_block += f"{paragraph} {sentence} "
        if i % 30 == 0:  # 30개 절마다 블록 생성
            formatted_output.append(current_block.strip())
            current_block = ""

    if current_block:  # 남은 절 추가
        formatted_output.append(current_block.strip())

    return formatted_output
