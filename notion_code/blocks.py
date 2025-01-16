import os
import sqlite3
import csv
from datetime import datetime, timedelta
from notion_code.settings import notion

# 노션 제목2 생성 함수
def create_heading_2_block(parent_page_id, heading_text):
    try:
        notion.blocks.children.append(
            block_id=parent_page_id,
            children=[
                {
                    "object": "block",
                    "type": "heading_2",
                    "heading_2": {
                        "rich_text": [{"type": "text", "text": {"content": heading_text}}]
                    },
                }
            ],
        )
        print(f"제목2 블록 추가 완료: {heading_text}")
    except Exception as e:
        print(f"제목2 블록 추가 중 오류 발생: {e}")

# 구분선 생성 함수
def create_divider_block(parent_page_id):
    try:
        notion.blocks.children.append(
            block_id=parent_page_id,
            children=[
                {"object": "block", "type": "divider", "divider": {}}
            ],
        )
        print("구분선 블록 추가 완료")
    except Exception as e:
        print(f"구분선 블록 추가 중 오류 발생: {e}")

# 링크 블록 생성 함수
def create_link_block(parent_page_id, link_text, link_url):
    """
    Notion 페이지에 링크 블록을 추가합니다.

    :param parent_page_id: 부모 페이지 ID
    :param link_text: 링크에 표시할 텍스트
    :param link_url: 링크의 URL
    """
    try:
        # 링크 블록 생성
        notion.blocks.children.append(
            block_id=parent_page_id,
            children=[
                {
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [
                            {
                                "type": "text",
                                "text": {"content": link_text, "link": {"url": link_url}},
                            }
                        ]
                    },
                }
            ],
        )
        print(f"링크 블록 추가 완료: {link_text} -> {link_url}")
    except Exception as e:
        print(f"링크 블록 추가 중 오류 발생: {e}")

# 페이지 내용 업데이트 함수
def update_existing_page(page_id, content_blocks, new_title=None):
    """
    기존 페이지의 내용을 업데이트합니다.

    :param page_id: 기존 페이지의 ID
    :param content_blocks: 업데이트할 블록의 목록
    :param new_title: 페이지 제목을 업데이트할 경우 새 제목
    """
    try:
        # 페이지 제목 업데이트 (옵션)
        if new_title:
            notion.pages.update(page_id, properties={
                "title": [{"type": "text", "text": {"content": new_title}}],
            })
            print(f"페이지 제목 업데이트 완료: {new_title}")

        # 기존 블록 삭제
        existing_blocks = notion.blocks.children.list(block_id=page_id)["results"]
        for block in existing_blocks:
            notion.blocks.delete(block_id=block["id"])

        # 새 블록 추가
        for block in content_blocks:
            notion.blocks.children.append(block_id=page_id, children=[block])

        print(f"페이지 내용 업데이트 완료: {page_id}")

    except Exception as e:
        print(f"페이지 업데이트 중 오류 발생: {e}")

def update_block_date(block_id):
    """
    Notion 블록 이름을 '오늘은 (이번달)월 (오늘)일입니다 🍀'로 업데이트합니다.
    :param block_id: 업데이트할 블록 ID
    """
    try:
        # 현재 날짜 가져오기
        today = datetime.now()
        new_title = f"오늘은 {today.month}월 {today.day}일입니다 🍀"
        
        # 블록 업데이트
        notion.blocks.update(
            block_id=block_id,
            heading_2={
                "rich_text": [
                    {
                        "type": "text",
                        "text": {"content": new_title},
                    }
                ]
            },
        )
        print(f"블록 ID {block_id} 업데이트 완료: {new_title}")
    except Exception as e:
        print(f"블록 업데이트 중 오류 발생: {e}")

