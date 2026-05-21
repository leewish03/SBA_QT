import json
import os

KOR_TO_ENG = {
    "창": "GEN", "출": "EXO", "레": "LEV", "민": "NUM", "신": "DEU",
    "수": "JOS", "삿": "JDG", "룻": "RUT", "삼상": "1SA", "삼하": "2SA",
    "왕상": "1KI", "왕하": "2KI", "대상": "1CH", "대하": "2CH", "스": "EZR",
    "느": "NEH", "에": "EST", "욥": "JOB", "시": "PSA", "잠": "PRO",
    "전": "ECC", "아": "SNG", "사": "ISA", "렘": "JER", "애": "LAM",
    "겔": "EZK", "단": "DAN", "호": "HOS", "욜": "JOL", "암": "AMO",
    "옵": "OBA", "욘": "JON", "미": "MIC", "나": "NAM", "합": "HAB",
    "습": "ZEP", "학": "HAG", "슥": "ZEC", "말": "MAL", "마": "MAT",
    "막": "MRK", "눅": "LUK", "요": "JHN", "행": "ACT", "롬": "ROM",
    "고전": "1CO", "고후": "2CO", "갈": "GAL", "엡": "EPH", "빌": "PHP",
    "골": "COL", "살전": "1TH", "살후": "2TH", "딤전": "1TI", "딤후": "2TI",
    "딛": "TIT", "몬": "PHM", "히": "HEB", "약": "JAS", "벧전": "1PE",
    "벧후": "2PE", "요일": "1JN", "요이": "2JN", "요삼": "3JN", "유": "JUD",
    "계": "REV"
}

def split_bible_data(json_path, output_dir):
    """
    4.4MB의 bible_data.json을 분석하여 public/bible/ 폴더 하위에 
    각 성경 권별로 독립적인 JSON 파일(예: GEN.json)로 분할합니다.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"[*] Complete bible data 로딩 중: {json_path}")
    if not os.path.exists(json_path):
        print(f"[!] Error: 원본 파일이 없습니다: {json_path}")
        return
        
    with open(json_path, "r", encoding="utf-8") as f:
        bible_data = json.load(f)
        
    print("[*] 66권 성경 데이터 분할 분기 시작...")
    success_count = 0
    
    for kor_key, book_data in bible_data.items():
        eng_code = KOR_TO_ENG.get(kor_key)
        if not eng_code:
            print(f"[!] Warning: 영문 약어 매핑을 찾을 수 없음: {kor_key}. 한글 파일명으로 저장합니다.")
            filename = f"{kor_key}.json"
        else:
            filename = f"{eng_code}.json"
            
        out_path = os.path.join(output_dir, filename)
        
        # 파일 저장 시 separators=(',', ':') 옵션으로 공백 제거 압축 저장
        with open(out_path, "w", encoding="utf-8") as out_f:
            json.dump(book_data, out_f, ensure_ascii=False, separators=(',', ':'))
        success_count += 1
            
    print(f"[+] 성공적으로 {success_count}개의 성경 JSON 파일로 분할되었습니다. 경로: {output_dir}")

if __name__ == "__main__":
    # 스크립트 파일 위치를 기준으로 경로 설정
    current_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(current_dir, "test-app", "public", "bible_data.json")
    output_dir = os.path.join(current_dir, "test-app", "public", "bible")
    
    split_bible_data(json_path, output_dir)
