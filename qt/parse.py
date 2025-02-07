''' qt_data 텍스트 파일에서 불러오기
def read_qt_data(file_path):
    """
    qt_data.txt 파일에서 QT 일정 데이터를 읽어옵니다.

    :param file_path: qt_data.txt 파일의 경로
    :return: QT 일정 데이터 (문자열 리스트)
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            qt_data = file.readlines()
        return [line.strip() for line in qt_data if line.strip()]
    except FileNotFoundError:
        return ["qt_data.txt 파일을 찾을 수 없습니다."]
    except Exception as e:
        return [f"파일 읽기 중 오류가 발생했습니다: {str(e)}"]
'''

''' QT 데이터를 파싱하여 딕셔너리로 변환
def parse_qt_data(data):
    """
    QT 데이터를 파싱하여 일정 딕셔너리로 변환합니다.

    :param data: QT 데이터 문자열 리스트
    :return: 일정 딕셔너리
    """
    qt_schedule = {}
    lines = data[1:]  # 첫 번째 줄은 제목이므로 제외
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
    
    return qt_schedule'''

from datetime import datetime, timedelta
import csv

start_date = "2024-12-17"  # 시작 날짜

def days_since_start(start_date, target_date):
    """
    주어진 시작 날짜로부터 목표 날짜까지의 경과 일수를 계산하되, 일요일은 제외.

    Parameters:
    start_date (str): 시작 날짜 (형식: YYYY-MM-DD).
    target_date (str or datetime): 목표 날짜 (형식: YYYY-MM-DD 또는 datetime 객체).

    Returns:
    int: 경과한 일수 (일요일 제외).
    """
    start = datetime.strptime(start_date, "%Y-%m-%d")
    
    # target_date가 문자열이면 datetime으로 변환
    if isinstance(target_date, str):
        target = datetime.strptime(target_date, "%Y-%m-%d")
    elif isinstance(target_date, datetime):
        target = target_date
    else:
        raise TypeError("target_date must be either a string or datetime object.")

    # 경과한 모든 날짜 계산
    delta_days = (target - start).days + 1  # 시작일 포함

    # 일요일 개수 계산
    sundays = sum(1 for day in range(delta_days) if (start + timedelta(days=day)).weekday() == 6)

    # 일요일 제외한 경과일 반환
    return delta_days - sundays


def find_qt_chapter_verse(number, qt_plan_path, book_map):
    """
    주어진 숫자에 해당하는 QT의 장(chapter)과 절(verse)을 찾는 함수.

    Parameters:
    number (int): 찾고자 하는 번째 숫자.
    qt_plan_path (str): QT 데이터 경로.
    book_map (dict): 책 이름 매핑 데이터.

    Returns:
    tuple: (qt_chapter, qt_verse) 형태로 반환.
    """
    count = 0

    # qt_plan 읽기
    with open(qt_plan_path, 'r', encoding='utf-8') as qt_file:
        qt_reader = csv.DictReader(qt_file)
        qt_plan = list(qt_reader)

    # qt_plan 데이터 순회
    for row in qt_plan:
        idx = int(row['idx'])
        chapter = row['chapter']
        start_paragraph = int(row['start_paragraph'])
        end_paragraph = int(row['end_paragraph'])
        paragraphs_in_index = end_paragraph - start_paragraph + 1

        # 현재 인덱스 내 범위 확인
        if count + paragraphs_in_index >= number:
            verse = start_paragraph + (number - count - 1)

            # book_map에서 chapter에 해당하는 korean_name 찾기
            for key, book in book_map.items():
                if book['full_name'] == chapter:
                    qt_chapter = key
                    return qt_chapter, verse

        count += paragraphs_in_index

    return None, None  # 숫자가 범위를 벗어나는 경우
