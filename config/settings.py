import os

# 현재 파일이 있는 디렉토리 경로 가져오기
current_dir = os.path.dirname(os.path.abspath(__file__))

# 데이터베이스 및 CSV 파일 경로 설정
db_path = os.path.join(current_dir, "../data/bible_database.db")
csv_file_path = os.path.join(current_dir, "data/book_map.csv")
qt_file_path = os.path.join(current_dir, "data/qt_data.txt")

# 아이콘
bible_icon="https://cdn.discordapp.com/attachments/923909506717585451/1310340987196801024/free-icon-bible-3004416.png?ex=6744dda4&is=67438c24&hm=38758bc26aa14760969d43d0f327346ccc6941afde479dd0d2bcd6cb4951a51d&"
