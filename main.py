from config.settings import current_dir, db_path, csv_file_path, qt_file_path, bible_icon
from notion_code.blocks import create_heading_2_block, create_divider_block, create_link_block, update_existing_page, update_block_date
from qt.parse import read_qt_data, parse_qt_data
from database.database import load_book_map
from notion_code.settings import today_block_id
from qt.update import update_today_page, update_weekly_pages

if __name__ == "__main__":
    book_map = load_book_map(csv_file_path)
    qt_data = read_qt_data(qt_file_path)
    qt_schedule = parse_qt_data(qt_data)
    
    update_block_date(today_block_id)
    update_today_page(qt_schedule, book_map)
    update_weekly_pages(qt_schedule, book_map)
