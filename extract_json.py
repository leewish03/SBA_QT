import sqlite3
import csv
import json
import os

def load_book_map(csv_file):
    book_map = {}
    with open(csv_file, mode="r", encoding="utf-8-sig") as file:
        reader = csv.DictReader(file)
        for row in reader:
            book_map[int(row["book_id"])] = row["korean_name"]
    return book_map

def extract_bible_to_json(db_path, csv_path, out_json_path):
    print("Loading book map...")
    book_map = load_book_map(csv_path)
    
    print(f"Connecting to {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Query all verses ordered by book, chapter, verse to ensure correctness
    cursor.execute("SELECT book, chapter, verse, content FROM bible_korHRV ORDER BY book, chapter, verse")
    rows = cursor.fetchall()
    
    print(f"Fetched {len(rows)} verses. Structuring data...")
    
    # Structure: { "창": { "1": { "1": "태초에...", "2": "땅이 혼돈하고..." } } }
    bible_json = {}
    
    count = 0
    for book_id, chapter, verse, content in rows:
        book_name = book_map.get(book_id)
        if not book_name:
            continue
            
        if book_name not in bible_json:
            bible_json[book_name] = {}
            
        chapter_str = str(chapter)
        if chapter_str not in bible_json[book_name]:
            bible_json[book_name][chapter_str] = {}
        
        bible_json[book_name][chapter_str][str(verse)] = content
        count += 1
        
    conn.close()
    
    print(f"Writing {count} verses to {out_json_path}...")
    with open(out_json_path, "w", encoding="utf-8") as f:
        # separators=(',', ':') removes whitespace to dramatically compress size
        json.dump(bible_json, f, ensure_ascii=False, separators=(',', ':'))
        
    print("Optimization and extraction complete!")

if __name__ == "__main__":
    db_path = "../SBA_QT-4.1/data/korHRV.db"
    csv_path = "../SBA_QT-4.1/data/book_map.csv"
    out_json_path = "./public/bible_data.json"
    
    # Create public directory to store the static output
    os.makedirs("./public", exist_ok=True)
    
    extract_bible_to_json(db_path, csv_path, out_json_path)
