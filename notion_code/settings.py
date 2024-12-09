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