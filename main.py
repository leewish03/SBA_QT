from config.settings import book_map_csv_path, reading_schedule_csv_path
from notion_code.blocks import update_block_date
from database.database import load_book_map, load_reading_schedule

from notion_code.settings import today_block_id
from qt.update import update_today_page, update_weekly_pages

if __name__ == "__main__":
    book_map = load_book_map(book_map_csv_path)
    #qt_data = read_qt_data(qt_file_path)
    #qt_schedule = parse_qt_data(qt_data)
    reading_schedule = load_reading_schedule(reading_schedule_csv_path)  # CSV에서 일정 불러오기


    update_block_date(today_block_id)
    update_today_page(reading_schedule, book_map)
    update_weekly_pages(reading_schedule, book_map)
