import os

# 현재 파일이 있는 디렉토리 경로 가져오기
current_dir = os.path.dirname(os.path.abspath(__file__))

# 데이터베이스 및 CSV 파일 경로 설정
db_path = os.path.join(current_dir, "../data/korHRV.db")
reading_schedule_csv_path = os.path.join(current_dir, "../data/sba_reading_plan.csv")
book_map_csv_path = os.path.join(current_dir, "../data/book_map.csv")
qt_schedule_csv_path = os.path.join(current_dir, "../data/qt_plan.csv")
#qt_file_path = os.path.join(current_dir, "../data/qt_data.txt")

# 아이콘
bible_icon="https://cdn.discordapp.com/attachments/1183379295444406275/1333835699799068784/free-icon-bible-3004416.png?ex=679a56cc&is=6799054c&hm=120b94d4d270cda32cfdc23301d301e781ab369eb9cc049551af8f5abe46ed4c&"
bible_icon_local="../data/free-icon-bible.png"

#QT 기준 (잠언 1장)
start_date = "2024-12-17"