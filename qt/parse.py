# qt_data 텍스트 파일에서 불러오기
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

# QT 데이터를 파싱하여 딕셔너리로 변환
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
    
    return qt_schedule
