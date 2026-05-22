import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { createClient } from '@supabase/supabase-js';

// ==========================================
// 1. Global Styles & Nested CSS (Styled-components)
// ==========================================
const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&family=Pretendard:wght@400;600;700&display=swap');
`;

const SbaStyledWrapper = styled.div`

/* Reset and Base Styles */
* {
    box-sizing: border-box;
    font-family: 'Pretendard', sans-serif;
}

.sba-app-container {
    /* 라이트 모드 (기본값) */
    --sba-bg: #fdfcfb;
    --sba-text: #111111;
    --sba-text-secondary: #555555;
    --sba-text-muted: #888888;
    --sba-text-subtle: #aaaaaa;
    --sba-header-bg: rgba(253, 252, 251, 0.85);
    --sba-border: #f0f0f0;
    --sba-border-strong: #eaeaea;
    --sba-card-bg: #fdfcfb;
    --sba-card-hover: #ffffff;
    --sba-card-active: #f5f5f5;
    --sba-card-today-border: #222;
    --sba-card-today-bg: #fff;
    --sba-card-sub-bg: #f5f7f9;
    --sba-nav-bg: rgba(255, 255, 255, 0.85);
    --sba-nav-active: #111111;
    --sba-nav-inactive: #aaaaaa;
    --sba-modal-bg: #ffffff;
    --sba-input-border: #dddddd;
    --sba-btn-bg: #222222;
    --sba-btn-text: #ffffff;
    --sba-btn-hover: #000000;
    --sba-verse-title: #222;
    --sba-verse-text: #333;
    --sba-verse-num: #6a737b;
    --sba-splash-bg: #fafafa;
    --sba-splash-title: #09090b;
    --sba-splash-sub: #71717a;
    --sba-splash-desc: #a1a1aa;
    --sba-highlight: rgba(245, 158, 11, 0.25);
    --sba-highlight-hover: rgba(245, 158, 11, 0.4);
    --sba-skeleton-bg: #e1e4e8;
    --sba-skeleton-shine: #f6f8fa;
    --sba-accent: #f5e6d3;

    max-width: 600px;
    margin: 0 auto;
    background-color: var(--sba-bg);
    color: var(--sba-text);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    position: relative;
    padding-bottom: 97px; /* Space for bottom nav (70px) + closed NoteEditor drawer (16px) + margin */
    transition: background-color 0.3s, color 0.3s;
}

.sba-app-container.dark {
    /* 다크 모드 */
    --sba-bg: #121212;
    --sba-text: #e0e0e0;
    --sba-text-secondary: #aaaaaa;
    --sba-text-muted: #777777;
    --sba-text-subtle: #555555;
    --sba-header-bg: rgba(18, 18, 18, 0.85);
    --sba-border: #2c2c2c;
    --sba-border-strong: #3a3a3a;
    --sba-card-bg: #1e1e1e;
    --sba-card-hover: #252525;
    --sba-card-active: #2a2a2a;
    --sba-card-today-border: #ffffff;
    --sba-card-today-bg: #1e1e1e;
    --sba-card-sub-bg: #1a1a1a;
    --sba-nav-bg: rgba(18, 18, 18, 0.85);
    --sba-nav-active: #ffffff;
    --sba-nav-inactive: #666666;
    --sba-modal-bg: #1e1e1e;
    --sba-input-border: #444444;
    --sba-btn-bg: #ffffff;
    --sba-btn-text: #121212;
    --sba-btn-hover: #e0e0e0;
    --sba-verse-title: #ffffff;
    --sba-verse-text: #cccccc;
    --sba-verse-num: #888888;
    --sba-splash-bg: #09090b;
    --sba-splash-title: #fafafa;
    --sba-splash-sub: #a1a1aa;
    --sba-splash-desc: #71717a;
    --sba-highlight: rgba(245, 158, 11, 0.4);
    --sba-highlight-hover: rgba(245, 158, 11, 0.55);
    --sba-skeleton-bg: #2d2d2d;
    --sba-skeleton-shine: #3a3a3a;
    --sba-accent: #2c251e;
}

/* Typography styles */
.serif-text {
    font-family: 'Noto Serif KR', serif;
}

/* Header Styles */
.sba-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 20px 16px;
    background: var(--sba-header-bg);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--sba-border);
    position: sticky;
    top: 0;
    z-index: 10;
}

.sba-header h1 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    color: var(--sba-text);
}

.sba-header-icon {
    font-size: 1.4rem;
    cursor: pointer;
    background: none;
    border: none;
    padding: 8px;
    border-radius: 50%;
    color: var(--sba-text);
    transition: background 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}
.sba-header-icon:hover {
    background: var(--sba-card-active);
}

/* Content Area */
.sba-content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
}

/* Verse Styles (Typography) */
.sba-verse-title {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--sba-verse-title);
    margin-bottom: 24px;
    margin-top: 10px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--sba-border-strong);
    text-align: left;
}

.sba-verse-block {
    margin-bottom: 12px;
    padding: 8px;
    border-radius: 8px;
    line-height: 1.85;
    color: var(--sba-verse-text);
    font-size: var(--sba-bible-font-size, 1.1rem);
    text-align: left; 
    word-break: break-all;
    display: flex;
    align-items: flex-start;
    cursor: pointer;
    transition: background-color 0.2s;
}
.sba-verse-block:hover {
    background-color: var(--sba-card-active);
}

.sba-verse-block.highlighted {
    background-color: var(--sba-highlight);
}
.sba-verse-block.highlighted:hover {
    background-color: var(--sba-highlight-hover);
}

.sba-verse-number {
    font-weight: 700;
    color: var(--sba-verse-num);
    font-size: 0.75em;
    margin-right: 8px;
    margin-top: 0.35em;
    min-width: 1.2em;
    text-align: right;
    user-select: none;
    flex-shrink: 0;
    white-space: nowrap;
}

.sba-verse-text {
    flex: 1;
}

/* Empty State */
.sba-empty-state {
    text-align: center;
    padding: 50px 20px;
    color: var(--sba-text-muted);
    font-size: 1.1rem;
}

/* Bottom Navigation */
.sba-bottom-nav {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 600px;
    display: flex;
    justify-content: space-around;
    background: var(--sba-nav-bg);
    backdrop-filter: blur(12px);
    box-shadow: 0 -2px 10px rgba(0,0,0,0.03);
    border-top: 1px solid var(--sba-border-strong);
    padding: 10px 0 calc(10px + env(safe-area-inset-bottom));
    z-index: 20;
}

.sba-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: none;
    border: none;
    color: var(--sba-nav-inactive);
    font-size: 0.75rem;
    cursor: pointer;
    padding: 8px 16px;
    border-radius: 8px;
    transition: all 0.2s;
}

.sba-nav-item.active {
    color: var(--sba-nav-active);
    font-weight: 600;
}

.sba-nav-icon {
    font-size: 1.4rem;
    margin-bottom: 4px;
}

/* Weekly Cards */
.sba-weekly-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.sba-weekly-card {
    background: var(--sba-card-bg);
    border: 1px solid var(--sba-border);
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.sba-weekly-card:active {
    transform: scale(0.98);
    background: var(--sba-card-active);
}

.sba-weekly-card:hover {
    background: var(--sba-card-hover);
    box-shadow: 0 4px 12px rgba(0,0,0,0.04);
    border-color: var(--sba-border-strong);
}

.sba-weekly-card.today {
    border-left: 5px solid var(--sba-nav-active);
    background: var(--sba-card-today-bg);
    box-shadow: 0 4px 14px rgba(0,0,0,0.06);
}

.sba-weekly-card-header {
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--sba-text);
    display: flex;
    justify-content: space-between;
}

.sba-weekly-card-body {
    font-size: 0.95rem;
    color: var(--sba-text-secondary);
    background: var(--sba-card-sub-bg);
    padding: 8px;
    border-radius: 6px;
}

/* Loading */
.sba-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    color: var(--sba-text-secondary);
    font-size: 1.1rem;
}

/* Modal / Admin / Auth */
.sba-modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
}

.sba-modal-content {
    background: var(--sba-modal-bg);
    color: var(--sba-text);
    padding: 24px;
    border-radius: 12px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    border: 1px solid var(--sba-border);
}

.sba-input {
    width: 100%;
    padding: 12px;
    background: var(--sba-bg);
    color: var(--sba-text);
    border: 1px solid var(--sba-input-border);
    border-radius: 8px;
    margin-top: 8px;
    font-size: 1rem;
}

.sba-btn {
    width: 100%;
    padding: 12px;
    background: var(--sba-btn-bg);
    color: var(--sba-btn-text);
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    margin-top: 16px;
    cursor: pointer;
    transition: background 0.2s;
}
.sba-btn:hover {
    background: var(--sba-btn-hover);
}

/* 소셜 로그인 버튼 */
.sba-auth-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    margin-top: 10px;
    cursor: pointer;
    transition: filter 0.2s;
}
.sba-auth-btn:hover {
    filter: brightness(0.95);
}
.sba-auth-btn.google {
    background: #ffffff;
    color: #3c4043;
    border: 1px solid #dadce0;
}
.sba-auth-btn.kakao {
    background: #fee500;
    color: #191919;
}

/* Splash Screen */
.sba-splash-screen {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: var(--sba-splash-bg);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.6s;
}

.sba-splash-screen.fade-out {
    opacity: 0;
    visibility: hidden;
}

.sba-splash-content {
    text-align: center;
    animation: fadeInSplash 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
}

.sba-splash-logo {
    font-size: 2rem;
    margin-bottom: 8px;
    animation: pulseLogo 2s infinite ease-in-out;
}

@keyframes pulseLogo {
    0% { transform: scale(1); opacity: 0.9; }
    50% { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(1); opacity: 0.9; }
}

.sba-splash-main-title {
    font-size: 1.85rem;
    font-weight: 700;
    color: var(--sba-splash-title);
    margin: 0;
    letter-spacing: -0.04em;
    line-height: 1.25;
    word-break: keep-all;
}

.sba-splash-sub-title {
    font-size: 1.15rem;
    font-weight: 500;
    color: var(--sba-splash-sub);
    margin: 0;
    letter-spacing: -0.02em;
    line-height: 1.2;
}

.sba-splash-desc {
    font-size: 0.85rem;
    color: var(--sba-splash-desc);
    margin-top: 12px;
    letter-spacing: -0.01em;
}

.sba-splash-footer {
    position: absolute;
    bottom: 40px;
    font-size: 0.75rem;
    color: var(--sba-text-subtle);
    letter-spacing: 0.03em;
    animation: fadeInSplash 1.2s ease-out forwards;
}

@keyframes fadeInSplash {
    from { opacity: 0; transform: translateY(15px); }
    to { opacity: 1; transform: translateY(0); }
}

/* QT 메모장 세션 */
.sba-note-section {
    margin-top: 30px;
    padding: 20px;
    background: var(--sba-accent);
    border-radius: 12px;
    border: 1px solid var(--sba-border);
}

.sba-note-section h3 {
    margin: 0 0 10px;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--sba-text);
}

.sba-note-textarea {
    width: 100%;
    height: 120px;
    padding: 12px;
    background: var(--sba-bg);
    color: var(--sba-text);
    border: 1px solid var(--sba-input-border);
    border-radius: 8px;
    font-size: 0.95rem;
    line-height: 1.6;
    resize: none;
}
.sba-note-textarea:focus {
    outline: none;
    border-color: var(--sba-text-secondary);
}

.sba-note-status {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 4px;
    margin-top: 6px;
    font-size: 0.75rem;
    color: var(--sba-text-muted);
}

/* Skeleton Loading */
.sba-skeleton-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
    background: var(--sba-bg);
}

.sba-skeleton-box {
    background: var(--sba-skeleton-bg);
    border-radius: 8px;
    animation: skeleton-loading 1.5s infinite ease-in-out;
}

@keyframes skeleton-loading {
    0% { opacity: 0.6; }
    50% { opacity: 0.3; }
    100% { opacity: 0.6; }
}

/* Toast 알림 */
.sba-toast-container {
    position: fixed;
    bottom: 85px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 200;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: calc(100% - 40px);
    max-width: 400px;
    pointer-events: none;
}

.sba-toast {
    background: rgba(0, 0, 0, 0.85);
    color: #ffffff;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 0.85rem;
    text-align: center;
    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    animation: toast-in-out 2.5s ease forwards;
}

@keyframes toast-in-out {
    0% { opacity: 0; transform: translateY(10px); }
    10% { opacity: 1; transform: translateY(0); }
    90% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-10px); }
}

/* 에러 및 네트워크 재시도 UI */
.sba-retry-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    color: var(--sba-text-secondary);
}

.sba-retry-title {
    font-size: 1.2rem;
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--sba-text);
}

.sba-retry-desc {
    font-size: 0.9rem;
    margin-bottom: 20px;
}

/* 북마크 아이템 리스트 */
.sba-bookmark-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.sba-bookmark-item {
    background: var(--sba-card-bg);
    border: 1px solid var(--sba-border);
    border-radius: 8px;
    padding: 12px 16px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background 0.2s;
}
.sba-bookmark-item:hover {
    background: var(--sba-card-hover);
    border-color: var(--sba-border-strong);
}

.sba-bookmark-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: left;
}

.sba-bookmark-name {
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--sba-text);
}

.sba-bookmark-snippet {
    font-size: 0.85rem;
    color: var(--sba-text-secondary);
}

.sba-bookmark-delete-btn {
    background: none;
    border: none;
    color: var(--sba-text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: color 0.2s, background-color 0.2s;
}
.sba-bookmark-delete-btn:hover {
    color: #ef4444;
    background-color: var(--sba-card-active);
}

/* 하이라이트/북마크 팝업 툴팁 */
.sba-tooltip-menu {
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--sba-modal-bg);
    border: 1px solid var(--sba-border-strong);
    border-radius: 30px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    display: flex;
    padding: 6px 12px;
    gap: 8px;
    z-index: 150;
    animation: tooltip-up 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes tooltip-up {
    from { opacity: 0; transform: translate(-50%, 15px); }
    to { opacity: 1; transform: translate(-50%, 0); }
}

.sba-tooltip-btn {
    background: none;
    border: none;
    color: var(--sba-text);
    padding: 8px 16px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background 0.2s;
}

.sba-tooltip-btn:hover {
    background-color: var(--sba-card-active);
}

/* 북마크 구절 포커싱 플래시 애니메이션 */
@keyframes flash-focus {
    0% { background-color: var(--sba-highlight); }
    50% { background-color: var(--sba-highlight-hover); }
    100% { background-color: transparent; }
}

.flash-focus {
    animation: flash-focus 2s ease-out;
}

/* 묵상 공유 작성 폼 추가 스타일 */
.sba-sharing-write-box {
    background: var(--sba-card-bg);
    border: 1px solid var(--sba-border);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}

`;

// ==========================================
// 2. Constants & Logic
// ==========================================
const FULL_TO_SHORT = {
    "창세기": "창", "출애굽기": "출", "레위기": "레", "민수기": "민", "신명기": "신", "여호수아": "수", "사사기": "삿", "룻기": "룻", "사무엘상": "삼상", "사무엘하": "삼하", "열왕기상": "왕상", "열왕기하": "왕하", "역대상": "대상", "역대하": "대하", "에스라": "스", "느헤미야": "느", "에스더": "에", "욥기": "욥", "시편": "시", "잠언": "잠", "전도서": "전", "아가": "아", "이사야": "사", "예레미야": "렘", "예레미야 애가": "애", "에스겔": "겔", "다니엘": "단", "호세아": "호", "요엘": "욜", "아모스": "암", "오바댜": "옵", "요나": "욘", "미가": "미", "나훔": "나", "하박국": "합", "스바냐": "습", "학개": "학", "스가랴": "슥", "말라기": "말", "마태복음": "마", "마가복음": "막", "누가복음": "눅", "요한복음": "요", "사도행전": "행", "로마서": "롬", "고린도전서": "고전", "고린도후서": "고후", "갈라디아서": "갈", "에베소서": "엡", "빌립보서": "빌", "골로새서": "골", "데살로니가전서": "살전", "데살로니가후서": "살후", "디모데전서": "딤전", "디모데후서": "딤후", "디도서": "딛", "빌레몬서": "몬", "히브리서": "히", "야고보서": "약", "베드로전서": "벧전", "베드로후서": "벧후", "요한일서": "요일", "요한이서": "요이", "요한삼서": "요삼", "유다서": "유", "요한계시록": "계"
};

const KOR_TO_ENG = {
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
};

const SHORT_TO_FULL = Object.fromEntries(
    Object.entries(FULL_TO_SHORT).map(([full, short]) => [short, full])
);

const DAYS_ARR = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

function getMidnightKST(dateObj) {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
    const [year, month, day] = formatter.format(dateObj).split('-');
    return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
}

function getEffectiveDate() {
    const formatter = new Intl.DateTimeFormat('en-US', { 
        timeZone: 'Asia/Seoul', 
        year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hour12: false
    });
    
    const parts = formatter.formatToParts(new Date());
    let y, m, d, h;
    for (let p of parts) {
        if (p.type === 'year') y = parseInt(p.value);
        if (p.type === 'month') m = parseInt(p.value);
        if (p.type === 'day') d = parseInt(p.value);
        if (p.type === 'hour') h = parseInt(p.value);
    }
    
    // 사용자의 로컬 환경 객체로 만듦 
    // (getMonth() 등의 일관성을 위해 Date.UTC가 아니라 로컬 Date 객체 이용)
    let kstDate = new Date(y, m - 1, d);
    
    // 아침 5시 이전이면, 큐티 달력상 '어제'로 간주
    if (h < 5) {
        kstDate.setDate(kstDate.getDate() - 1);
    }
    return kstDate;
}

function calcQtDays(startKST, targetKST) {
    if (targetKST < startKST) return 0;
    let days = 0;
    let current = new Date(startKST.getTime());
    while (current <= targetKST) {
        if (current.getUTCDay() !== 0) days++; // 일요일(0) 제외
        current.setUTCDate(current.getUTCDate() + 1);
    }
    return days;
}

function parseRange(rangeStr) {
    if (!rangeStr || rangeStr === "없음") return [];
    if (rangeStr === "전체") return ["전체"];
    const parts = String(rangeStr).split("-");
    if (parts.length === 2) {
        const res = [];
        for (let i = parseInt(parts[0]); i <= parseInt(parts[1]); i++) res.push(i);
        return res;
    }
    return [parseInt(parts[0])];
}


// ==========================================
// 3. Supabase & Local Caching Storages
// ==========================================

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 
  (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_SUPABASE_URL : undefined) || 
  'https://ebfpjvwwbognddixrvyc.supabase.co';
// .env 등 설정이 없을 시 기본 legacy anon API key를 Fallback으로 제공
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 
  (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined) || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZnBqdnd3Ym9nbmRkaXhydnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MzIyMzcsImV4cCI6MjA5NTAwODIzN30.m2FL3awa0zooqHGaHFeT7128HjuonWVjsuWDlsj5Oxs';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});



class BibleStorage {
  constructor() {
    this.dbName = 'sba_qt_bible_db';
    this.storeName = 'bible_books';
    this.dbVersion = 1;
    this.db = null;
    this.memoryCache = new Map();
    this.useMemoryOnly = false;
    this.initPromise = this.initDB();
  }

  async initDB() {
    if (typeof window === 'undefined' || !window.indexedDB) {
      this.useMemoryOnly = true;
      return;
    }
    return new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(this.dbName, this.dbVersion);
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName);
          }
        };

        request.onsuccess = (event) => {
          this.db = event.target.result;
          resolve();
        };

        request.onerror = (err) => {
          console.warn("IndexedDB 초기화 실패, 메모리 캐시 사용:", err);
          this.useMemoryOnly = true;
          resolve();
        };
      } catch (e) {
        console.warn("IndexedDB 지원 불가, 메모리 캐시 사용:", e);
        this.useMemoryOnly = true;
        resolve();
      }
    });
  }

  async getBook(bookAbbrev) {
    await this.initPromise;
    // 한글 약어인 경우 영어 3글자 코드로 변환
    let abbrev = bookAbbrev;
    if (KOR_TO_ENG[bookAbbrev]) {
      abbrev = KOR_TO_ENG[bookAbbrev];
    } else if (KOR_TO_ENG[bookAbbrev.toUpperCase()]) {
      abbrev = KOR_TO_ENG[bookAbbrev.toUpperCase()];
    } else {
      abbrev = bookAbbrev.toUpperCase();
    }

    // 1. 메모리 캐시 먼저 조회
    if (this.memoryCache.has(abbrev)) {
      return this.memoryCache.get(abbrev);
    }

    // 2. IndexedDB 조회
    if (!this.useMemoryOnly && this.db) {
      try {
        const data = await this.getFromIndexedDB(abbrev);
        if (data) {
          this.memoryCache.set(abbrev, data);
          return data;
        }
      } catch (err) {
        console.warn(`IndexedDB에서 ${abbrev} 읽기 실패, fetch 진행:`, err);
      }
    }

    // 3. 네트워크 Fetch
    try {
      const response = await fetch(`/bible/${abbrev}.json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // 4. 캐싱
      this.memoryCache.set(abbrev, data);
      if (!this.useMemoryOnly && this.db) {
        this.saveToIndexedDB(abbrev, data).catch(err => {
          console.warn("IndexedDB 저장 실패:", err);
        });
      }
      return data;
    } catch (error) {
      console.error(`${abbrev} 성경 로딩 오류:`, error);
      throw error;
    }
  }

  getFromIndexedDB(key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  saveToIndexedDB(key, val) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(val, key);

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  }
}

const bibleStorage = new BibleStorage();



export async function syncLocalDataToCloud() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { success: false, error: '로그인되어 있지 않습니다.' };

  const userId = session.user.id;

  try {
    // 1. 북마크 동기화
    await syncBookmarks(userId);

    // 2. 메모 동기화
    await syncNotes(userId);

    return { success: true };
  } catch (error) {
    console.error('데이터 동기화 오류:', error);
    return { success: false, error: error.message };
  }
}

// 100개씩 청크 분할 헬퍼
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

async function syncBookmarks(userId) {
  // 로컬 북마크 로드 (예: [{ book, chapter, verse, verses, memo, created_at }])
  let localBookmarks = [];
  try {
    const raw = localStorage.getItem('sba_qt_bookmarks');
    if (raw) localBookmarks = JSON.parse(raw);
  } catch (e) {
    console.error('로컬 북마크 로딩 실패:', e);
  }

  // 클라우드 북마크 로드
  const { data: cloudBookmarks, error } = await supabase
    .from('qt_bookmarks')
    .select('book, chapter, verse, verses, memo, created_at')
    .eq('user_id', userId);

  if (error) throw error;

  const makeKey = (b) => `${b.book}-${b.chapter}-${b.verses || b.verse}`;
  const cloudSet = new Set(cloudBookmarks.map(makeKey));

  // 로컬에서 클라우드에 없는 것 추출
  const toUpload = [];
  localBookmarks.forEach(local => {
    const key = makeKey(local);
    if (!cloudSet.has(key)) {
      toUpload.push({
        user_id: userId,
        book: local.book,
        chapter: local.chapter,
        verse: local.verse,
        verses: local.verses || null,
        memo: local.memo || null,
        created_at: local.created_at || new Date().toISOString()
      });
    }
  });

  // 클라우드 데이터를 로컬에 없는 것 병합하기 위해 로컬 Set 구성
  const localSet = new Set(localBookmarks.map(makeKey));
  const mergedBookmarks = [...localBookmarks];

  cloudBookmarks.forEach(cloud => {
    const key = makeKey(cloud);
    if (!localSet.has(key)) {
      mergedBookmarks.push({
        book: cloud.book,
        chapter: cloud.chapter,
        verse: cloud.verse,
        verses: cloud.verses || null,
        memo: cloud.memo || null,
        created_at: cloud.created_at
      });
    } else {
      // 로컬에 이미 동일한 북마크가 있지만 메모가 다르면 병합
      const localIdx = mergedBookmarks.findIndex(b => makeKey(b) === key);
      if (localIdx !== -1) {
        const localItem = mergedBookmarks[localIdx];
        if (cloud.memo && cloud.memo.trim() !== '' && (!localItem.memo || localItem.memo.trim() === '')) {
          mergedBookmarks[localIdx].memo = cloud.memo;
        } else if (cloud.memo && localItem.memo && cloud.memo !== localItem.memo) {
          if (!localItem.memo.includes(cloud.memo)) {
            mergedBookmarks[localIdx].memo = `${localItem.memo}\n---\n${cloud.memo}`;
          }
        }
      }
    }
  });

  // 클라우드 업로드 (100개 청크 단위)
  if (toUpload.length > 0) {
    const chunks = chunkArray(toUpload, 100);
    for (const chunk of chunks) {
      const { error: insertError } = await supabase
        .from('qt_bookmarks')
        .insert(chunk);
      if (insertError) throw insertError;
    }
  }

  // 로컬 스토리지 최종 갱신
  localStorage.setItem('sba_qt_bookmarks', JSON.stringify(mergedBookmarks));
}

async function syncNotes(userId) {
  // 로컬 메모 로드 (구조: { "YYYY-MM-DD": { content, updated_at } })
  let localNotes = {};
  try {
    const raw = localStorage.getItem('sba_qt_notes');
    if (raw) localNotes = JSON.parse(raw);
  } catch (e) {
    console.error('로컬 메모 로딩 실패:', e);
  }

  // 클라우드 메모 로드
  const { data: cloudNotes, error } = await supabase
    .from('qt_notes')
    .select('target_date, content, updated_at')
    .eq('user_id', userId);

  if (error) throw error;

  const toUpload = [];
  const mergedNotes = { ...localNotes };

  // 1. 클라우드 메모를 순회하며 로컬과 병합
  cloudNotes.forEach(cloud => {
    const date = cloud.target_date;
    const local = localNotes[date];

    if (!local) {
      // 클라우드에만 존재하는 메모 -> 로컬에 반영
      mergedNotes[date] = {
        content: cloud.content,
        updated_at: cloud.updated_at
      };
    } else {
      // 로컬과 클라우드 모두 존재
      const localContent = (local.content || '').trim();
      const cloudContent = (cloud.content || '').trim();

      if (localContent !== cloudContent) {
        // 내용이 다른 경우 병합 정책 (Append)
        // 만약 로컬 내용에 클라우드 내용이 이미 포함되어 있거나 그 반대인 경우 중복 병합 방지
        let finalContent = localContent;
        if (!localContent.includes(cloudContent) && !cloudContent.includes(localContent)) {
          finalContent = `${localContent}\n---\n${cloudContent}`;
        } else if (cloudContent.length > localContent.length) {
          finalContent = cloudContent;
        }

        const now = new Date().toISOString();
        mergedNotes[date] = {
          content: finalContent,
          updated_at: now
        };

        toUpload.push({
          user_id: userId,
          target_date: date,
          content: finalContent,
          updated_at: now
        });
      }
    }
  });

  // 2. 로컬에만 존재하는 메모를 클라우드 업로드 대상으로 지정
  const cloudDates = new Set(cloudNotes.map(n => n.target_date));
  Object.entries(localNotes).forEach(([date, note]) => {
    if (!cloudDates.has(date)) {
      toUpload.push({
        user_id: userId,
        target_date: date,
        content: note.content,
        updated_at: note.updated_at || new Date().toISOString()
      });
    }
  });

  // 클라우드 업서트 (100개 청크 단위)
  if (toUpload.length > 0) {
    const chunks = chunkArray(toUpload, 100);
    for (const chunk of chunks) {
      const { error: upsertError } = await supabase
        .from('qt_notes')
        .upsert(chunk, { onConflict: 'user_id,target_date' });
      if (upsertError) throw upsertError;
    }
  }

  // 로컬 스토리지 최종 갱신
  localStorage.setItem('sba_qt_notes', JSON.stringify(mergedNotes));
}


// ==========================================
// 4. Components
// ==========================================

const ICONS = {
    today: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>,
    reading: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/><path d="m9 10 2 2 4-4"/></svg>,
    bookmarks: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>,
    weekly: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    sharing: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
};

function TopHeader({ currentDate, onOpenCalendar, isDark, onToggleDark, session, onOpenAuth, onOpenAdmin }) {
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const dayName = days[currentDate.getDay()];

    const handleFontSize = (delta) => {
        const root = document.documentElement;
        let currentSize = parseFloat(root.style.getPropertyValue('--sba-bible-font-size') || '17.6');
        if (isNaN(currentSize)) currentSize = 17.6;
        let newSize = currentSize + delta;
        if (newSize < 12) newSize = 12;
        if (newSize > 24) newSize = 24;
        root.style.setProperty('--sba-bible-font-size', `${newSize}px`);
        localStorage.setItem('sba_bible_font_size', newSize);
    };

    const handleLogout = async () => {
        if (window.confirm("로그아웃 하시겠습니까?")) {
            await supabase.auth.signOut();
            window.location.reload();
        }
    };

    useEffect(() => {
        document.documentElement.style.fontSize = '';
        const saved = localStorage.getItem('sba_bible_font_size');
        if (saved) {
            document.documentElement.style.setProperty('--sba-bible-font-size', `${saved}px`);
        } else {
            document.documentElement.style.setProperty('--sba-bible-font-size', '17.6px');
        }
    }, []);

    return (
        <header className="sba-header">
            <h1 onClick={onOpenCalendar} style={{cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', userSelect:'none'}}>
                {month}월 {day}일 {dayName}요일
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </h1>
            <div style={{display:'flex', gap:'6px', alignItems: 'center'}}>
                {/* 글자 크기 변경 */}
                <button className="sba-header-icon" onClick={() => handleFontSize(-1)} title="글자 작게" style={{fontSize:'0.85rem', fontWeight:'bold', width:'32px', height:'32px', padding:0}} >A-</button>
                <button className="sba-header-icon" onClick={() => handleFontSize(1)} title="글자 크게" style={{fontSize:'1.05rem', fontWeight:'bold', width:'32px', height:'32px', padding:0}}>A+</button>
                
                {/* 다크모드 토글 */}
                <button className="sba-header-icon" onClick={onToggleDark} title={isDark ? "라이트 모드" : "다크 모드"} style={{width:'32px', height:'32px', padding:0}}>
                    {isDark ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                    )}
                </button>

                {/* 관리자 설정 버튼 */}
                {session?.user?.email === 'lekas1217@gmail.com' && (
                    <button className="sba-header-icon" onClick={onOpenAdmin} title="관리자 설정" style={{width:'32px', height:'32px', padding:0}}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    </button>
                )}

                {/* 소셜 로그인 / 사용자 정보 */}
                {session ? (
                    <button className="sba-header-icon" onClick={handleLogout} title="로그아웃" style={{width:'32px', height:'32px', padding:0}}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    </button>
                ) : (
                    <button className="sba-header-icon" onClick={onOpenAuth} title="로그인" style={{width:'32px', height:'32px', padding:0}}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </button>
                )}
            </div>
        </header>
    );
}

function BottomNav({ activeTab, setActiveTab }) {
    const tabs = [
        { id: 'today', icon: ICONS.today, label: '묵상' },
        { id: 'reading', icon: ICONS.reading, label: '통독' },
        { id: 'bookmarks', icon: ICONS.bookmarks, label: '북마크' },
        { id: 'weekly', icon: ICONS.weekly, label: '주간' },
        { id: 'sharing', icon: ICONS.sharing, label: '나눔' },
    ];

    return (
        <nav className="sba-bottom-nav">
            {tabs.map(tab => (
                <button 
                    key={tab.id} 
                    className={`sba-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                >
                    <div className="sba-nav-icon" style={{marginBottom:'4px'}}>{tab.icon}</div>
                    <span>{tab.label}</span>
                </button>
            ))}
        </nav>
    );
}

function AppFooter() {
    return (
        <footer style={{ textAlign: 'center', padding: '40px 20px 80px', color: 'var(--sba-text-muted)', fontSize: '0.75rem', lineHeight: '1.6', background: 'transparent' }}>
            <p style={{margin: '0 0 4px'}}>Based on <b>서울북부교회</b> Reading Schedule</p>
            <p style={{margin: '0 0 4px'}}>Developed by <b>이소원 형제</b></p>
            <p style={{margin: '0 0 4px'}}>문의 및 피드백: <a href="mailto:lekas1217@gmail.com" style={{color: 'var(--sba-text-muted)', textDecoration:'underline'}}>lekas1217@gmail.com</a></p>
        </footer>
    );
}



// ==========================================
// 1. 메모(QT 노트) 에디터 컴포넌트 스타일 및 컴포넌트
// ==========================================
const DrawerOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.15);
  z-index: 90;
  backdrop-filter: blur(1px);
  animation: fadeIn 0.15s ease-out;
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const DrawerContainer = styled.div`
  position: fixed;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 600px;
  background: var(--sba-modal-bg);
  border-top: 1px solid var(--sba-border-strong);
  border-left: 1px solid var(--sba-border-strong);
  border-right: 1px solid var(--sba-border-strong);
  border-radius: 8px 8px 0 0;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 100;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: ${props => props.$isExpanded ? '310px' : '16px'};
  cursor: ${props => props.$isExpanded ? 'default' : 'pointer'};
  
  &:hover {
    border-top-color: ${props => props.$isExpanded ? 'var(--sba-border-strong)' : 'var(--sba-text-muted)'};
  }
`;

const CompactHandle = styled.div`
  width: 100%;
  height: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--sba-card-sub-bg);
  border-bottom: 1px solid var(--sba-border-strong);
  color: var(--sba-text-subtle);
  user-select: none;
  transition: all 0.2s;
  
  &:hover {
    color: var(--sba-text-muted);
    background: var(--sba-border-strong);
  }
`;

const ExpandedHandle = styled.div`
  width: 100%;
  height: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--sba-card-sub-bg);
  border-bottom: 1px solid var(--sba-border-strong);
  color: var(--sba-text-subtle);
  user-select: none;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: var(--sba-text-muted);
    background: var(--sba-border-strong);
  }
`;

const DrawerHeader = styled.div`
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 8px 16px 8px;
  border-bottom: 1px solid var(--sba-border-strong);
`;

const HeaderTitle = styled.h3`
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--sba-text);
  display: flex;
  align-items: center;
  gap: 6px;
`;

const StatusBadge = styled.span`
  font-size: 0.7rem;
  color: var(--sba-text-secondary);
  background: var(--sba-card-sub-bg);
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;
  border: 1px solid var(--sba-border-strong);
`;

const CardButton = styled.button`
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: 1px solid var(--sba-border-strong);
  color: var(--sba-text);
  cursor: pointer;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    background: var(--sba-card-sub-bg);
    border-color: var(--sba-text-muted);
  }
`;

const TextareaWrapper = styled.div`
  padding: 12px 16px 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  height: 100%;
  min-height: 190px;
  padding: 10px;
  background: var(--sba-bg);
  color: var(--sba-text);
  border: 1px solid var(--sba-border-strong);
  border-radius: 6px;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: none;
  outline: none;
  font-family: inherit;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  
  &:focus {
    border-color: var(--sba-text);
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.03);
  }
`;

function NoteEditor({ targetDate, session, passage, verses }) {
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('저장 완료');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const timerRef = useRef(null);
  const isDirtyRef = useRef(false);

  const dateStr = targetDate.toISOString().split('T')[0];

  useEffect(() => {
    let localVal = '';
    try {
      const raw = localStorage.getItem('sba_qt_notes');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed[dateStr]) localVal = parsed[dateStr].content || '';
      }
    } catch (e) {
      console.error(e);
    }
    setContent(localVal);
    setSaveStatus('저장 완료');
    isDirtyRef.current = false;

    if (session) {
      supabase
        .from('qt_notes')
        .select('content')
        .eq('user_id', session.user.id)
        .eq('target_date', dateStr)
        .single()
        .then(({ data, error }) => {
          if (data && !isDirtyRef.current) {
            setContent(data.content || '');
            try {
              const raw = localStorage.getItem('sba_qt_notes');
              const parsed = raw ? JSON.parse(raw) : {};
              parsed[dateStr] = {
                content: data.content,
                updated_at: new Date().toISOString()
              };
              localStorage.setItem('sba_qt_notes', JSON.stringify(parsed));
            } catch (e) {
              console.error(e);
            }
          }
        });
    }
  }, [dateStr, session]);

  const saveNote = async (text) => {
    setSaveStatus('저장 중...');
    const now = new Date().toISOString();

    try {
      const raw = localStorage.getItem('sba_qt_notes');
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[dateStr] = {
        content: text,
        updated_at: now
      };
      localStorage.setItem('sba_qt_notes', JSON.stringify(parsed));
    } catch (e) {
      console.error('로컬 메모 저장 실패:', e);
      setSaveStatus('저장 오류');
      return;
    }

    if (session) {
      try {
        const { error } = await supabase
          .from('qt_notes')
          .upsert({
            user_id: session.user.id,
            target_date: dateStr,
            content: text,
            updated_at: now
          }, { onConflict: 'user_id,target_date' });

        if (error) throw error;
        setSaveStatus('저장 완료');
      } catch (err) {
        console.error('클라우드 메모 저장 실패:', err);
        setSaveStatus('클라우드 저장 대기');
      }
    } else {
      setSaveStatus('저장 완료 (로컬)');
    }
    isDirtyRef.current = false;
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setContent(val);
    isDirtyRef.current = true;
    setSaveStatus('변경됨 (저장 대기)');

    if (timerRef.current) clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(() => {
      if (isDirtyRef.current) {
        saveNote(val);
      }
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (isDirtyRef.current) {
        saveNote(content);
      }
    };
  }, [content]);

  const handleBlur = () => {
    if (isDirtyRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      saveNote(content);
    }
  };

  return (
    <>
      {isExpanded && <DrawerOverlay onClick={() => setIsExpanded(false)} />}

      <DrawerContainer $isExpanded={isExpanded} onClick={!isExpanded ? () => setIsExpanded(true) : undefined}>
        {!isExpanded ? (
          <CompactHandle>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 5l4-4 4 4"/>
            </svg>
          </CompactHandle>
        ) : (
          <>
            <ExpandedHandle onClick={() => setIsExpanded(false)}>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 1l4 4 4-4"/>
              </svg>
            </ExpandedHandle>

            <DrawerHeader>
              <HeaderTitle>
                오늘의 메모
                <StatusBadge>{saveStatus}</StatusBadge>
              </HeaderTitle>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {verses && (
                  <CardButton onClick={() => setIsImageModalOpen(true)}>
                    🎨 말씀 카드
                  </CardButton>
                )}
              </div>
            </DrawerHeader>

            <TextareaWrapper>
              <StyledTextarea
                placeholder="오늘 말씀에서 깨달은 은혜와 묵상 내용을 기록해 보세요..."
                value={content}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </TextareaWrapper>
          </>
        )}
      </DrawerContainer>

      <ImageCardModal 
        isOpen={isImageModalOpen} 
        onClose={() => setIsImageModalOpen(false)} 
        passage={passage} 
        verses={verses} 
      />
    </>
  );
}

// ==========================================
// 2. 말씀 구절 하이라이트 / 북마크 팝업 매니저 헬퍼
// ==========================================
const FloatingBar = styled.div`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 500px;
  background: var(--sba-modal-bg);
  border: 1px solid var(--sba-border-strong);
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 95;
  gap: 12px;
`;

const FloatingInfo = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--sba-text);
`;

const FloatingBtnGroup = styled.div`
  display: flex;
  gap: 6px;
`;

const FloatingBtn = styled.button`
  background: ${props => props.$variant === 'accent' ? 'var(--sba-text)' : 'transparent'};
  color: ${props => props.$variant === 'accent' ? 'var(--sba-bg)' : 'var(--sba-text)'};
  border: 1px solid ${props => props.$variant === 'accent' ? 'var(--sba-text)' : 'var(--sba-border-strong)'};
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$variant === 'accent' ? 'var(--sba-text-secondary)' : 'var(--sba-card-sub-bg)'};
  }
`;

function VerseReader({ book, chapter, verses, dateStr, session, addToast, onBookmarkChange }) {
  const [selectedVerses, setSelectedVerses] = useState({}); // { [vNum]: text }
  const [bookmarks, setBookmarks] = useState([]);

  // 로컬/클라우드 북마크 리스트 로드
  const loadBookmarks = () => {
    let localBookmarks = [];
    try {
      const raw = localStorage.getItem('sba_qt_bookmarks');
      if (raw) localBookmarks = JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
    setBookmarks(localBookmarks);
  };

  useEffect(() => {
    loadBookmarks();
    
    // 북마크 로컬 스토리지 이벤트 리스너 (동기화 대비)
    const handleStorageChange = () => loadBookmarks();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isBookmarked = (vNum) => {
    return bookmarks.some(b => {
      if (b.book !== book || b.chapter !== parseInt(chapter)) return false;
      if (b.verses) {
        const list = b.verses.split(',').map(Number);
        return list.includes(parseInt(vNum));
      }
      return b.verse === parseInt(vNum);
    });
  };

  const handleVerseClick = (vNum, text) => {
    setSelectedVerses(prev => {
      const next = { ...prev };
      if (next[vNum]) {
        delete next[vNum];
      } else {
        next[vNum] = text;
      }
      return next;
    });
  };

  const toggleBookmark = async () => {
    const vNums = Object.keys(selectedVerses).map(Number).sort((a, b) => a - b);
    if (vNums.length === 0) return;

    const minVerse = vNums[0];
    const versesStr = vNums.join(',');
    const now = new Date().toISOString();

    let localBookmarks = [];
    try {
      const raw = localStorage.getItem('sba_qt_bookmarks');
      if (raw) localBookmarks = JSON.parse(raw);
    } catch (e) {}

    // 중복 제거 및 기존 동일 구조 유무 체크
    const exists = localBookmarks.some(b => b.book === book && b.chapter === parseInt(chapter) && b.verses === versesStr);
    if (exists) {
      addToast('이미 북마크에 등록된 구절 조합입니다.');
      setSelectedVerses({});
      return;
    }

    const newBookmark = {
      book,
      chapter: parseInt(chapter),
      verse: minVerse,
      verses: versesStr,
      memo: '',
      created_at: now
    };

    localBookmarks.push(newBookmark);
    localStorage.setItem('sba_qt_bookmarks', JSON.stringify(localBookmarks));
    setBookmarks(localBookmarks);
    addToast(`${vNums.length}개 구절이 북마크에 저장되었습니다.`);

    if (session) {
      try {
        await supabase
          .from('qt_bookmarks')
          .insert({
            user_id: session.user.id,
            book,
            chapter: parseInt(chapter),
            verse: minVerse,
            verses: versesStr,
            memo: '',
            created_at: now
          });
      } catch (err) {
        console.error(err);
      }
    }

    if (onBookmarkChange) onBookmarkChange();
    setSelectedVerses({});
  };

  const copyToClipboard = () => {
    const vNums = Object.keys(selectedVerses).map(Number).sort((a, b) => a - b);
    if (vNums.length === 0) return;

    const fullName = SHORT_TO_FULL[book] || book;
    let rangeStr = `${vNums[0]}`;
    if (vNums.length > 1) {
      rangeStr = `${vNums[0]}~${vNums[vNums.length - 1]}`;
    }

    const sortedTexts = vNums.map(v => `${v}절 ${selectedVerses[v]}`).join('\n');
    const textToCopy = `[${fullName} ${chapter}:${rangeStr}]\n${sortedTexts}`;

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        addToast('선택한 구절이 복사되었습니다.');
      })
      .catch(err => {
        console.error('클립보드 복사 실패:', err);
      });
    setSelectedVerses({});
  };

  const fullName = SHORT_TO_FULL[book] || book;
  const selectedCount = Object.keys(selectedVerses).length;

  return (
    <>
      <h2 className="sba-verse-title">{fullName} {chapter}장</h2>
      <div className="serif-text sba-verse-container">
        {Object.entries(verses).map(([vNum, text]) => {
          const bookmarked = isBookmarked(vNum);
          const isFocused = !!selectedVerses[vNum];
          const elementId = `verse-${book}-${chapter}-${vNum}`;

          return (
            <div 
              id={elementId}
              key={vNum}
              className={`sba-verse-block ${bookmarked ? 'highlighted' : ''} ${isFocused ? 'focused' : ''}`}
              onClick={() => handleVerseClick(vNum, text)}
            >
              <div className="sba-verse-number">{vNum}</div>
              <div className="sba-verse-text">{text}</div>
            </div>
          );
        })}
      </div>

      {selectedCount > 0 && (
        <FloatingBar>
          <FloatingInfo>{selectedCount}개 구절 선택됨</FloatingInfo>
          <FloatingBtnGroup>
            <FloatingBtn onClick={copyToClipboard}>복사</FloatingBtn>
            <FloatingBtn $variant="accent" onClick={toggleBookmark}>북마크 추가</FloatingBtn>
            <FloatingBtn onClick={() => setSelectedVerses({})}>해제</FloatingBtn>
          </FloatingBtnGroup>
        </FloatingBar>
      )}
    </>
  );
}

// ==========================================
// 3. TabToday (묵상 탭)
// ==========================================
function TabToday({ todayPlan, session, addToast, onBookmarkChange }) {
  const [verses, setVerses] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!todayPlan || !todayPlan.old) {
      setVerses(null);
      return;
    }
    const { abbrev, verse } = todayPlan.old;
    setLoading(true);
    setError(null);

    bibleStorage.getBook(abbrev)
      .then(bookData => {
        if (bookData && bookData[verse]) {
          setVerses(bookData[verse]);
        } else {
          setError(`해당 구절을 찾을 수 없습니다 (${SHORT_TO_FULL[abbrev] || abbrev} ${verse}장).`);
        }
      })
      .catch(err => {
        console.error(err);
        setError('성경 데이터를 로드하는 중 오류가 발생했습니다.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [todayPlan]);

  if (!todayPlan || !todayPlan.old) {
    return <div className="sba-empty-state">선택하신 날짜의 묵상 일정이 없습니다.</div>;
  }

  if (loading) return <div className="sba-loading">말씀을 불러오는 중...</div>;
  if (error) return <div className="sba-empty-state">{error}</div>;
  if (!verses) return null;

  const { abbrev, verse } = todayPlan.old;

  return (
    <div className="sba-tab-content">
      <VerseReader 
        book={abbrev} 
        chapter={verse} 
        verses={verses} 
        dateStr={todayPlan.dateObj.toISOString().split('T')[0]}
        session={session}
        addToast={addToast}
        onBookmarkChange={onBookmarkChange}
      />
      <NoteEditor 
        targetDate={todayPlan.dateObj} 
        session={session} 
        passage={`${SHORT_TO_FULL[abbrev] || abbrev} ${verse}장`} 
        verses={verses} 
      />
    </div>
  );
}

// ==========================================
// 4. TabReading (통독 탭)
// ==========================================
function TabReading({ todayPlan, session, addToast, onBookmarkChange }) {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const parseRange = (rangeStr) => {
    const result = [];
    if (!rangeStr) return result;
    const parts = rangeStr.split(',');
    parts.forEach(part => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        for (let i = start; i <= end; i++) result.push(i);
      } else {
        result.push(Number(part));
      }
    });
    return result;
  };

  useEffect(() => {
    if (!todayPlan || !todayPlan.new) {
      setBlocks([]);
      return;
    }
    const { books, verseRaw } = todayPlan.new;
    setLoading(true);
    setError(null);

    // 병렬로 필요한 성경 로딩
    const loadPromises = books.map(abbrev => {
      const bookKey = abbrev.trim().toUpperCase();
      return bibleStorage.getBook(bookKey)
        .then(bookData => ({ abbrev: bookKey, bookData }))
        .catch(err => {
          console.error(err);
          return { abbrev: bookKey, bookData: null, error: err };
        });
    });

    Promise.all(loadPromises)
      .then(results => {
        const loadedBlocks = [];
        results.forEach(({ abbrev, bookData }) => {
          if (!bookData) return;
          
          let chaptersToFetch = [];
          if (verseRaw === "전체") {
            chaptersToFetch = Object.keys(bookData).map(Number).sort((a,b)=>a-b);
          } else {
            chaptersToFetch = parseRange(verseRaw);
          }

          chaptersToFetch.forEach(ch => {
            if (bookData[ch]) {
              loadedBlocks.push({
                book: abbrev,
                chapter: ch,
                verses: bookData[ch]
              });
            }
          });
        });
        setBlocks(loadedBlocks);
      })
      .catch(err => {
        console.error(err);
        setError('통독 성경 데이터를 가져오는 중 오류가 발생했습니다.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [todayPlan]);

  if (!todayPlan || !todayPlan.new) {
    return <div className="sba-empty-state">선택하신 날짜의 통독 일정이 없습니다.</div>;
  }

  if (loading) return <div className="sba-loading">말씀을 불러오는 중...</div>;
  if (error) return <div className="sba-empty-state">{error}</div>;
  if (blocks.length === 0) return <div className="sba-empty-state">성경 데이터를 찾을 수 없습니다.</div>;

  return (
    <div className="sba-tab-content">
      {blocks.map(block => (
        <div key={`${block.book}-${block.chapter}`} style={{ marginBottom: '30px' }}>
          <VerseReader
            book={block.book}
            chapter={block.chapter}
            verses={block.verses}
            dateStr={todayPlan.dateObj.toISOString().split('T')[0]}
            session={session}
            addToast={addToast}
            onBookmarkChange={onBookmarkChange}
          />
        </div>
      ))}
      <NoteEditor 
        targetDate={todayPlan.dateObj} 
        session={session} 
        passage={todayPlan.new ? `${todayPlan.new.books.map(b => SHORT_TO_FULL[b] || b).join(', ')} ${todayPlan.new.verseRaw}장` : '통독 말씀'} 
        verses={blocks.length > 0 ? blocks[0].verses : null} 
      />
    </div>
  );
}

// ==========================================
// 5. TabBookmarks (북마크 리스트 탭)
// ==========================================
const DetailModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DetailModalContent = styled.div`
  background: var(--sba-modal-bg);
  color: var(--sba-text);
  padding: 24px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--sba-border-strong);
  position: relative;
`;

const DetailVerseContainer = styled.div`
  max-height: 180px;
  overflow-y: auto;
  margin: 12px 0 16px;
  padding: 12px;
  background: var(--sba-card-sub-bg);
  border-radius: 8px;
  border: 1px solid var(--sba-border-strong);
  text-align: left;
`;

const DetailVerseLine = styled.div`
  margin-bottom: 8px;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--sba-text);
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailVerseNum = styled.span`
  font-weight: 600;
  color: var(--sba-text-secondary);
  margin-right: 6px;
`;

const BookmarkSearchWrapper = styled.div`
  margin-bottom: 16px;
  width: 100%;
`;

function BookmarkDetailModal({ bookmark, onClose, onSaveMemo, onDelete, onGoToVerse, addToast }) {
  const [memoText, setMemoText] = useState(bookmark.memo || '');

  const handleImportTodayMemo = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const raw = localStorage.getItem('sba_qt_notes');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed[todayStr] && parsed[todayStr].content) {
          setMemoText(parsed[todayStr].content);
          addToast('오늘의 묵상 노트를 성공적으로 불러왔습니다.');
          return;
        }
      }
      addToast('오늘 기록된 묵상 메모가 없습니다.');
    } catch (e) {
      console.error(e);
    }
  };

  const fullName = SHORT_TO_FULL[bookmark.book] || bookmark.book;
  let rangeStr = `${bookmark.verse}`;
  if (bookmark.verses && bookmark.verses.includes(',')) {
    const list = bookmark.verses.split(',');
    rangeStr = `${list[0]}~${list[list.length - 1]}`;
  }

  return (
    <DetailModalOverlay onClick={onClose}>
      <DetailModalContent onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--sba-border)', paddingBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>
            {fullName} {bookmark.chapter}장 {rangeStr}절 북마크
          </h3>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--sba-text-muted)' }} onClick={onClose}>✕</button>
        </div>

        <DetailVerseContainer className="serif-text">
          {bookmark.verseTextList && bookmark.verseTextList.map(item => (
            <DetailVerseLine key={item.vNum}>
              <DetailVerseNum>{item.vNum}</DetailVerseNum>
              {item.text}
            </DetailVerseLine>
          ))}
        </DetailVerseContainer>

        <div style={{ textAlign: 'left', marginBottom: '16px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: '600', color: 'var(--sba-text-secondary)', marginBottom: '6px' }}>
            <span>북마크 메모</span>
            <button 
              style={{ background: 'none', border: 'none', color: 'var(--sba-text)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.75rem' }}
              onClick={handleImportTodayMemo}
            >
              오늘의 메모에서 불러오기
            </button>
          </label>
          <textarea
            style={{ width: '100%', minHeight: '80px', padding: '10px', background: 'var(--sba-bg)', color: 'var(--sba-text)', border: '1px solid var(--sba-border-strong)', borderRadius: '6px', fontSize: '0.85rem', resize: 'none', outline: 'none' }}
            placeholder="이 말씀에 관한 개인적인 묵상이나 감동을 메모해 보세요..."
            value={memoText}
            onChange={e => setMemoText(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            style={{ flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--sba-border-strong)', background: 'transparent', color: 'var(--sba-text)', fontWeight: '600', fontSize: '0.85rem' }}
            onClick={() => onGoToVerse(bookmark.book, bookmark.chapter, bookmark.verse)}
          >
            본문으로 이동
          </button>
          <button 
            style={{ flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', border: 'none', background: 'var(--sba-text)', color: 'var(--sba-bg)', fontWeight: '600', fontSize: '0.85rem' }}
            onClick={() => onSaveMemo(memoText)}
          >
            저장
          </button>
          <button 
            style={{ padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontWeight: '600', fontSize: '0.85rem' }}
            onClick={onDelete}
          >
            삭제
          </button>
        </div>
      </DetailModalContent>
    </DetailModalOverlay>
  );
}

function TabBookmarks({ onNavigateToVerse, updateTrigger, addToast }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookmark, setSelectedBookmark] = useState(null);

  const loadBookmarks = async () => {
    setLoading(true);
    let localBookmarks = [];
    try {
      const raw = localStorage.getItem('sba_qt_bookmarks');
      if (raw) localBookmarks = JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }

    const bookmarkedDetails = [];
    for (const b of localBookmarks) {
      try {
        const bookData = await bibleStorage.getBook(b.book);
        if (bookData && bookData[b.chapter]) {
          let text = '';
          let verseTextList = [];
          if (b.verses) {
            const list = b.verses.split(',').map(Number);
            list.forEach(vNum => {
              if (bookData[b.chapter][vNum]) {
                verseTextList.push({ vNum, text: bookData[b.chapter][vNum] });
              }
            });
            text = verseTextList.map(item => `${item.vNum}절: ${item.text}`).join(' ');
          } else {
            text = bookData[b.chapter][b.verse] || '';
            verseTextList.push({ vNum: b.verse, text });
          }
          bookmarkedDetails.push({
            ...b,
            text,
            verseTextList
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    
    bookmarkedDetails.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    setBookmarks(bookmarkedDetails);
    setLoading(false);
  };

  useEffect(() => {
    loadBookmarks();
  }, [updateTrigger]);

  const handleDelete = async (b) => {
    if (!window.confirm('정말 북마크를 삭제하시겠습니까?')) return;
    let localBookmarks = [];
    try {
      const raw = localStorage.getItem('sba_qt_bookmarks');
      if (raw) localBookmarks = JSON.parse(raw);
    } catch (err) {}

    const index = localBookmarks.findIndex(item => 
      item.book === b.book && 
      item.chapter === b.chapter && 
      (item.verses === b.verses || item.verse === b.verse)
    );

    if (index > -1) {
      localBookmarks.splice(index, 1);
      localStorage.setItem('sba_qt_bookmarks', JSON.stringify(localBookmarks));
      loadBookmarks();
      setSelectedBookmark(null);
      if (addToast) addToast('북마크가 삭제되었습니다.');

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase
          .from('qt_bookmarks')
          .delete()
          .eq('user_id', session.user.id)
          .eq('book', b.book)
          .eq('chapter', b.chapter)
          .eq('verse', b.verse)
          .eq('verses', b.verses || null);
      }
    }
  };

  const handleSaveMemo = async (newMemo) => {
    if (!selectedBookmark) return;
    let localBookmarks = [];
    try {
      const raw = localStorage.getItem('sba_qt_bookmarks');
      if (raw) localBookmarks = JSON.parse(raw);
    } catch (err) {}

    const index = localBookmarks.findIndex(item => 
      item.book === selectedBookmark.book && 
      item.chapter === selectedBookmark.chapter && 
      (item.verses === selectedBookmark.verses || item.verse === selectedBookmark.verse)
    );

    if (index > -1) {
      localBookmarks[index].memo = newMemo;
      localStorage.setItem('sba_qt_bookmarks', JSON.stringify(localBookmarks));
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase
          .from('qt_bookmarks')
          .update({ memo: newMemo })
          .eq('user_id', session.user.id)
          .eq('book', selectedBookmark.book)
          .eq('chapter', selectedBookmark.chapter)
          .eq('verse', selectedBookmark.verse)
          .eq('verses', selectedBookmark.verses || null);
      }
      if (addToast) addToast('메모가 저장되었습니다.');
      loadBookmarks();
      setSelectedBookmark(null);
    }
  };

  const filteredBookmarks = bookmarks.filter(b => {
    const fullName = SHORT_TO_FULL[b.book] || b.book;
    const nameStr = `${fullName} ${b.chapter}장 ${b.verses || b.verse}`;
    const q = searchQuery.toLowerCase();
    return (
      nameStr.toLowerCase().includes(q) ||
      b.text.toLowerCase().includes(q) ||
      (b.memo && b.memo.toLowerCase().includes(q))
    );
  });

  if (loading) return <div className="sba-loading">북마크 리스트를 로드 중...</div>;

  return (
    <div className="sba-tab-content">
      <h2 className="sba-verse-title" style={{ borderLeft: 'none', marginBottom: '16px' }}>내 북마크</h2>
      
      <BookmarkSearchWrapper>
        <StyledInput 
          type="text" 
          placeholder="성경 구절명, 말씀 텍스트, 메모 검색..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </BookmarkSearchWrapper>

      {filteredBookmarks.length === 0 ? (
        <div className="sba-empty-state">
          {searchQuery ? '검색 결과가 없습니다.' : '저장된 북마크가 없습니다. 말씀 본문에서 구절을 터치하여 북마크로 추가해 보세요.'}
        </div>
      ) : (
        <div className="sba-bookmark-list">
          {filteredBookmarks.map((b, idx) => {
            const fullName = SHORT_TO_FULL[b.book] || b.book;
            let rangeStr = `${b.verse}`;
            if (b.verses && b.verses.includes(',')) {
              const list = b.verses.split(',');
              rangeStr = `${list[0]}~${list[list.length - 1]}`;
            }

            return (
              <div 
                key={`${b.book}-${b.chapter}-${b.verse}-${idx}`}
                className="sba-bookmark-item"
                onClick={() => setSelectedBookmark(b)}
              >
                <div className="sba-bookmark-info">
                  <span className="sba-bookmark-name">{fullName} {b.chapter}장 {rangeStr}절</span>
                  <span className="sba-bookmark-snippet">{b.text}</span>
                  {b.memo && <span className="sba-bookmark-snippet" style={{ color: 'var(--sba-text-secondary)', fontStyle: 'italic', marginTop: '4px', borderLeft: '2px solid var(--sba-border-strong)', paddingLeft: '6px' }}>📝 {b.memo}</span>}
                </div>
                <button 
                  className="sba-bookmark-delete-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(b);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {selectedBookmark && (
        <BookmarkDetailModal
          bookmark={selectedBookmark}
          onClose={() => setSelectedBookmark(null)}
          onSaveMemo={handleSaveMemo}
          onDelete={() => handleDelete(selectedBookmark)}
          onGoToVerse={onNavigateToVerse}
          addToast={addToast}
        />
      )}
    </div>
  );
}

// ==========================================
// 6. SharingTab (자체 묵상 나눔 피드 및 댓글 피드 + 관리자 삭제 지원) - shadcn/ui 스타일 적용
// ==========================================
const SharingCard = styled.div`
  background: var(--sba-card-bg);
  border: 1px solid var(--sba-border-strong);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
`;

const SharingTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--sba-text);
  letter-spacing: -0.01em;
`;

const GuestNotice = styled.div`
  background: var(--sba-card-sub-bg);
  border: 1px solid var(--sba-border-strong);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  color: var(--sba-text-secondary);
  font-size: 0.85rem;
  line-height: 1.5;
  transition: all 0.2s;
  
  &:hover {
    border-color: var(--sba-text-muted);
    background: var(--sba-card-active);
  }
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  background: var(--sba-bg);
  color: var(--sba-text);
  border: 1px solid var(--sba-border-strong);
  border-radius: 6px;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s;
  
  &:focus {
    border-color: var(--sba-text);
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
  }
`;

const OutlinedButton = styled.button`
  background: transparent;
  border: 1px solid var(--sba-border-strong);
  color: var(--sba-text);
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  
  &:hover {
    background: var(--sba-card-sub-bg);
    border-color: var(--sba-text-muted);
  }
`;

const SolidButton = styled.button`
  background: var(--sba-text);
  color: var(--sba-bg);
  border: 1px solid var(--sba-text);
  border-radius: 6px;
  padding: 10px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FeedCard = styled.div`
  background: var(--sba-card-bg);
  border: 1px solid var(--sba-border-strong);
  border-radius: 8px;
  padding: 18px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FeedHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--sba-border);
  padding-bottom: 10px;
`;

const AuthorInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const AuthorName = styled.span`
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--sba-text);
`;

const PostTime = styled.span`
  font-size: 0.75rem;
  color: var(--sba-text-muted);
`;

const PassageBadge = styled.span`
  font-size: 0.75rem;
  background: var(--sba-card-sub-bg);
  color: var(--sba-text-secondary);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  border: 1px solid var(--sba-border-strong);
`;

const FeedContent = styled.div`
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--sba-text);
  white-space: pre-wrap;
  word-break: break-all;
  margin: 4px 0;
`;

const ActionSection = styled.div`
  display: flex;
  gap: 16px;
  border-top: 1px solid var(--sba-border);
  padding-top: 10px;
  font-size: 0.85rem;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${props => props.$active ? '#ef4444' : 'var(--sba-text-secondary)'};
  cursor: pointer;
  font-size: 0.85rem;
  transition: transform 0.1s ease;
  
  &:active {
    transform: scale(0.95);
  }
`;

const CommentSection = styled.div`
  border-top: 1px solid var(--sba-border-strong);
  margin-top: 8px;
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CommentBox = styled.div`
  background: var(--sba-card-sub-bg);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  border: 1px solid var(--sba-border-strong);
`;

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
`;

const CommentAuthor = styled.span`
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--sba-text);
`;

const CommentTime = styled.span`
  font-size: 0.7rem;
  color: var(--sba-text-muted);
  margin-right: 6px;
`;

const CommentContent = styled.div`
  color: var(--sba-text-secondary);
  white-space: pre-wrap;
  line-height: 1.45;
`;

// 북마크에서 구절 및 메모를 선택하는 모달 컴포넌트
function BookmarkSelectModal({ isOpen, onClose, onSelect, addToast }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setLoading(true);
      let localBookmarks = [];
      try {
        const raw = localStorage.getItem('sba_qt_bookmarks');
        if (raw) localBookmarks = JSON.parse(raw);
      } catch (e) {
        console.error(e);
      }

      const bookmarkedDetails = [];
      for (const b of localBookmarks) {
        try {
          const bookData = await bibleStorage.getBook(b.book);
          if (bookData && bookData[b.chapter]) {
            let text = '';
            if (b.verses) {
              const list = b.verses.split(',').map(Number);
              const verseTextList = [];
              list.forEach(vNum => {
                if (bookData[b.chapter][vNum]) {
                  verseTextList.push(`${vNum}절: ${bookData[b.chapter][vNum]}`);
                }
              });
              text = verseTextList.join(' ');
            } else {
              text = bookData[b.chapter][b.verse] || '';
            }
            bookmarkedDetails.push({
              ...b,
              text
            });
          }
        } catch (err) {
          console.error(err);
        }
      }

      bookmarkedDetails.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setBookmarks(bookmarkedDetails);
      setLoading(false);
    };
    load();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <DetailModalOverlay onClick={onClose}>
      <DetailModalContent onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--sba-border)', paddingBottom: '12px', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>북마크에서 선택</h3>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--sba-text-muted)' }} onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--sba-text-secondary)', fontSize: '0.9rem' }}>북마크 로드 중...</div>
        ) : bookmarks.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--sba-text-secondary)', fontSize: '0.9rem' }}>저장된 북마크가 없습니다.</div>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {bookmarks.map((b, idx) => {
              const fullName = SHORT_TO_FULL[b.book] || b.book;
              let rangeStr = `${b.verse}`;
              if (b.verses && b.verses.includes(',')) {
                const list = b.verses.split(',');
                rangeStr = `${list[0]}~${list[list.length - 1]}`;
              }
              const passageName = `${fullName} ${b.chapter}:${rangeStr}`;

              return (
                <div
                  key={idx}
                  onClick={() => onSelect(b, passageName)}
                  style={{
                    padding: '12px',
                    border: '1px solid var(--sba-border-strong)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: 'var(--sba-card-bg)',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--sba-text)', marginBottom: '4px' }}>
                    {passageName}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--sba-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.text}
                  </div>
                  {b.memo && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--sba-text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                      📝 {b.memo}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DetailModalContent>
    </DetailModalOverlay>
  );
}

function SharingTab({ session, onOpenAuthModal, addToast, isDark }) {
  const [reflections, setReflections] = useState([]);
  const [comments, setComments] = useState({}); // { reflectionId: [] }
  const [likes, setLikes] = useState({}); // { reflectionId: { count: 0, liked: false } }
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [passage, setPassage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState(null); // 댓글창 열린 글 ID
  const [newCommentText, setNewCommentText] = useState({}); // { reflectionId: '' }
  const [isBookmarkSelectOpen, setIsBookmarkSelectOpen] = useState(false);

  const isAdmin = session?.user?.email === 'lekas1217@gmail.com';

  const getTodayDateStr = () => {
    const d = new Date();
    if (d.getHours() < 5) d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const todayStr = getTodayDateStr();

  const loadReflections = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('qt_shared_reflections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReflections(data || []);

      if (data) {
        data.forEach(async (r) => {
          await loadComments(r.id);
          await loadLikes(r.id);
        });
      }
    } catch (err) {
      console.error(err);
      addToast('나눔 피드를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (reflectionId) => {
    try {
      const { data, error } = await supabase
        .from('qt_comments')
        .select('*')
        .eq('reflection_id', reflectionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(prev => ({ ...prev, [reflectionId]: data || [] }));
    } catch (err) {
      console.error(err);
    }
  };

  const loadLikes = async (reflectionId) => {
    try {
      const { data: list, error } = await supabase
        .from('qt_likes')
        .select('user_id')
        .eq('reflection_id', reflectionId);

      if (error) throw error;
      const count = list?.length || 0;
      const liked = list?.some(l => l.user_id === session?.user?.id) || false;

      setLikes(prev => ({
        ...prev,
        [reflectionId]: { count, liked }
      }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadReflections();
  }, [session]);

  const handleImportMemo = () => {
    if (!session) {
      addToast('로그인이 필요한 기능입니다.');
      onOpenAuthModal();
      return;
    }
    try {
      const raw = localStorage.getItem('sba_qt_notes');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed[todayStr] && parsed[todayStr].content) {
          setContent(parsed[todayStr].content);
          addToast('오늘의 묵상 노트를 성공적으로 불러왔습니다.');
          return;
        }
      }
      addToast('오늘 기록된 묵상 메모가 없습니다.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectBookmark = (bookmark, passageName) => {
    setPassage(passageName);
    if (bookmark.memo) {
      setContent(bookmark.memo);
    } else {
      setContent('');
    }
    setIsBookmarkSelectOpen(false);
    addToast(`${passageName} 및 북마크 메모를 불러왔습니다.`);
  };

  const handleSubmitReflection = async (e) => {
    e.preventDefault();
    if (!session) {
      addToast('로그인이 필요한 기능입니다.');
      onOpenAuthModal();
      return;
    }
    if (!content.trim()) {
      alert('묵상 내용을 입력해 주세요.');
      return;
    }
    if (!passage.trim()) {
      alert('말씀 구절을 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const authorName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email.split('@')[0];
      const { error } = await supabase
        .from('qt_shared_reflections')
        .insert({
          user_id: session.user.id,
          author_name: authorName,
          author_email: session.user.email,
          target_date: todayStr,
          passage: passage,
          content: content
        });

      if (error) throw error;
      setContent('');
      setPassage('');
      addToast('묵상이 피드에 성공적으로 공유되었습니다.');
      loadReflections();
    } catch (err) {
      console.error(err);
      alert('공유 실패: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitComment = async (reflectionId) => {
    if (!session) {
      addToast('로그인이 필요한 기능입니다.');
      onOpenAuthModal();
      return;
    }
    const text = newCommentText[reflectionId] || '';
    if (!text.trim()) return;

    try {
      const authorName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email.split('@')[0];
      const { error } = await supabase
        .from('qt_comments')
        .insert({
          reflection_id: reflectionId,
          user_id: session.user.id,
          author_name: authorName,
          author_email: session.user.email,
          content: text
        });

      if (error) throw error;
      setNewCommentText(prev => ({ ...prev, [reflectionId]: '' }));
      addToast('댓글이 등록되었습니다.');
      loadComments(reflectionId);
    } catch (err) {
      console.error(err);
      alert('댓글 등록 실패: ' + err.message);
    }
  };

  const handleToggleLike = async (reflectionId) => {
    if (!session) {
      addToast('로그인이 필요한 기능입니다.');
      onOpenAuthModal();
      return;
    }
    const currentLike = likes[reflectionId] || { count: 0, liked: false };
    
    try {
      if (currentLike.liked) {
        const { error } = await supabase
          .from('qt_likes')
          .delete()
          .eq('reflection_id', reflectionId)
          .eq('user_id', session.user.id);

        if (error) throw error;
        setLikes(prev => ({
          ...prev,
          [reflectionId]: { count: Math.max(0, currentLike.count - 1), liked: false }
        }));
      } else {
        const { error } = await supabase
          .from('qt_likes')
          .insert({
            reflection_id: reflectionId,
            user_id: session.user.id
          });

        if (error) throw error;
        setLikes(prev => ({
          ...prev,
          [reflectionId]: { count: currentLike.count + 1, liked: true }
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReflection = async (id) => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase
        .from('qt_shared_reflections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      addToast('게시글이 성공적으로 삭제되었습니다.');
      setReflections(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      alert('삭제 실패: ' + err.message);
    }
  };

  const handleDeleteComment = async (commentId, reflectionId) => {
    if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase
        .from('qt_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      addToast('댓글이 삭제되었습니다.');
      loadComments(reflectionId);
    } catch (err) {
      console.error(err);
      alert('댓글 삭제 실패: ' + err.message);
    }
  };

  return (
    <div className="sba-tab-content">
      {/* 묵상 작성 폼 */}
      <SharingCard>
        <SharingTitle>오늘의 묵상 공유하기</SharingTitle>
        
        {!session ? (
          <GuestNotice onClick={onOpenAuthModal}>
            🔒 묵상 나눔은 로그인이 필요한 기능입니다.<br />
            <span style={{ fontSize: '0.8rem', color: 'var(--sba-primary)', fontWeight: 'bold', textDecoration: 'underline' }}>
              소셜 로그인으로 1초 만에 로그인하기
            </span>
          </GuestNotice>
        ) : (
          <form onSubmit={handleSubmitReflection} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <StyledInput 
                type="text" 
                placeholder="예: 마태복음 1:1"
                value={passage}
                onChange={e => setPassage(e.target.value)}
                style={{ flex: 1, minWidth: '120px' }}
              />
              <OutlinedButton 
                type="button" 
                onClick={() => setIsBookmarkSelectOpen(true)}
              >
                🔖 북마크에서 선택
              </OutlinedButton>
              <OutlinedButton 
                type="button" 
                onClick={handleImportMemo}
              >
                ✏️ 내 메모 긁어오기
              </OutlinedButton>
            </div>
            
            <StyledTextarea 
              style={{ minHeight: '80px' }}
              placeholder="오늘 나에게 주신 은혜와 결단한 점을 나누어 보세요..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            
            <SolidButton 
              type="submit" 
              disabled={submitting}
            >
              {submitting ? '공유 중...' : '피드에 공유하기'}
            </SolidButton>
          </form>
        )}
      </SharingCard>

      <BookmarkSelectModal
        isOpen={isBookmarkSelectOpen}
        onClose={() => setIsBookmarkSelectOpen(false)}
        onSelect={handleSelectBookmark}
        addToast={addToast}
      />

      <h2 className="sba-verse-title" style={{ borderLeft: 'none', margin: '24px 0 16px 0' }}>지체들의 나눔</h2>

      {/* 피드 리스트 */}
      {loading ? (
        <div className="sba-loading">피드를 로딩하는 중...</div>
      ) : reflections.length === 0 ? (
        <div className="sba-empty-state">아직 오늘 작성된 묵상 나눔이 없습니다. 첫 번째 묵상 나눔을 남겨주세요!</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reflections.map(r => {
            const hasLiked = likes[r.id]?.liked || false;
            const likeCount = likes[r.id]?.count || 0;
            const refComments = comments[r.id] || [];
            const isMyPost = session?.user?.id === r.user_id;
            const showDelete = isMyPost || isAdmin;

            return (
              <FeedCard key={r.id}>
                <FeedHeader>
                  <AuthorInfo>
                    <AuthorName>{r.author_name}</AuthorName>
                    <PostTime>
                      {new Date(r.created_at).toLocaleDateString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </PostTime>
                  </AuthorInfo>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PassageBadge>{r.passage}</PassageBadge>
                    {showDelete && (
                      <button 
                        onClick={() => handleDeleteReflection(r.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', padding: '2px', display: 'flex', alignItems: 'center' }}
                        title="삭제"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </FeedHeader>

                <FeedContent>{r.content}</FeedContent>

                {/* 반응 영역 */}
                <ActionSection>
                  <ActionButton 
                    onClick={() => handleToggleLike(r.id)}
                    $active={hasLiked}
                  >
                    <span>{hasLiked ? '❤️' : '🤍'}</span>
                    <span>{likeCount}</span>
                  </ActionButton>
                  
                  <ActionButton 
                    onClick={() => setActiveCommentId(activeCommentId === r.id ? null : r.id)}
                  >
                    <span>💬</span>
                    <span>{refComments.length}</span>
                  </ActionButton>
                </ActionSection>

                {/* 댓글 아코디언 */}
                {activeCommentId === r.id && (
                  <CommentSection>
                    {refComments.map(c => {
                      const isMyComment = session?.user?.id === c.user_id;
                      const showCommentDelete = isMyComment || isAdmin;

                      return (
                        <CommentBox key={c.id}>
                          <CommentHeader>
                            <CommentAuthor>{c.author_name}</CommentAuthor>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <CommentTime>
                                {new Date(c.created_at).toLocaleDateString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                              </CommentTime>
                              {showCommentDelete && (
                                <button 
                                  onClick={() => handleDeleteComment(c.id, r.id)}
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}
                                >
                                  ❌
                                </button>
                              )}
                            </div>
                          </CommentHeader>
                          <CommentContent>{c.content}</CommentContent>
                        </CommentBox>
                      );
                    })}

                    {/* 댓글 쓰기 */}
                    {!session ? (
                      <div 
                        onClick={onOpenAuthModal}
                        style={{ fontSize: '0.8rem', textAlign: 'center', color: 'var(--sba-primary)', cursor: 'pointer', textDecoration: 'underline', padding: '8px' }}
                      >
                        댓글 작성을 위해 로그인해 주세요.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <StyledInput 
                          type="text" 
                          style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                          placeholder="댓글을 입력해 주세요..."
                          value={newCommentText[r.id] || ''}
                          onChange={e => setNewCommentText(prev => ({ ...prev, [r.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') handleSubmitComment(r.id); }}
                        />
                        <OutlinedButton 
                          style={{ padding: '8px 16px' }}
                          onClick={() => handleSubmitComment(r.id)}
                        >
                          등록
                        </OutlinedButton>
                      </div>
                    )}
                  </CommentSection>
                )}
              </FeedCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 7. ImageCardModal (말씀 이미지 카드 생성 및 다운로드 모달)
// ==========================================
function ImageCardModal({ isOpen, onClose, passage, verses }) {
  const [activeTheme, setActiveTheme] = useState('sunset'); // sunset, ocean, forest, charcoal, ivory
  const cardRef = useRef(null);
  
  if (!isOpen) return null;

  // 대표 구절 하나 혹은 처음 2개 구절만 요약해서 띄우기
  let verseText = "말씀 데이터를 불러올 수 없습니다.";
  if (verses) {
    const verseList = Object.entries(verses);
    if (verseList.length > 0) {
      verseText = verseList.slice(0, 2).map(([num, text]) => `${num}. ${text}`).join(' ');
      if (verseList.length > 2) {
        verseText += " ...";
      }
    }
  }

  const themes = {
    sunset: {
      background: 'linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6)',
      textColor: '#ffffff',
      metaColor: 'rgba(255, 255, 255, 0.85)',
      cardBg: 'rgba(0, 0, 0, 0.25)',
      borderColor: 'rgba(255, 255, 255, 0.15)'
    },
    ocean: {
      background: 'linear-gradient(135deg, #06b6d4, #3b82f6, #1e3a8a)',
      textColor: '#ffffff',
      metaColor: 'rgba(255, 255, 255, 0.85)',
      cardBg: 'rgba(0, 0, 0, 0.25)',
      borderColor: 'rgba(255, 255, 255, 0.15)'
    },
    forest: {
      background: 'linear-gradient(135deg, #10b981, #064e3b, #022c22)',
      textColor: '#ffffff',
      metaColor: 'rgba(255, 255, 255, 0.85)',
      cardBg: 'rgba(0, 0, 0, 0.25)',
      borderColor: 'rgba(255, 255, 255, 0.15)'
    },
    charcoal: {
      background: 'linear-gradient(135deg, #1f2937, #111827, #030712)',
      textColor: '#f3f4f6',
      metaColor: '#9ca3af',
      cardBg: 'rgba(255, 255, 255, 0.03)',
      borderColor: 'rgba(255, 255, 255, 0.08)'
    },
    ivory: {
      background: 'linear-gradient(135deg, #fafaf9, #f5f5f4, #e7e5e4)',
      textColor: '#1c1917',
      metaColor: '#78716c',
      cardBg: 'rgba(255, 255, 255, 0.6)',
      borderColor: 'rgba(0, 0, 0, 0.05)'
    }
  };

  const currentTheme = themes[activeTheme];

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2, // 해상도 높이기
      });
      const link = document.createElement('a');
      link.download = `SBA_QT_${passage.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error(e);
      alert('이미지 생성에 실패했습니다.');
    }
  };

  return (
    <div className="sba-modal-overlay" onClick={onClose}>
      <div className="sba-modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '400px', padding: '20px'}}>
        <h3 style={{marginTop: 0, marginBottom: '16px'}}>말씀 카드 다운로드</h3>
        
        {/* 카드 영역 */}
        <div 
          ref={cardRef} 
          style={{
            background: currentTheme.background,
            padding: '40px 30px',
            borderRadius: '16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            aspectRatio: '4 / 5',
            color: currentTheme.textColor,
            fontFamily: "'Nanum Myeongjo', 'Georgia', serif",
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '2px', opacity: 0.7, color: currentTheme.metaColor }}>
            SBA QT
          </div>
          
          <div style={{ margin: '30px 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{ fontSize: '1.25rem', lineHeight: '1.8', margin: 0, fontWeight: '500', wordBreak: 'keep-all', textAlign: 'center' }}>
              “ {verseText} ”
            </p>
          </div>

          <div style={{ borderTop: `1px solid ${currentTheme.borderColor}`, paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: currentTheme.textColor }}>
              {passage}
            </span>
            <span style={{ fontSize: '0.75rem', color: currentTheme.metaColor }}>
              서울북부교회 청년회
            </span>
          </div>
        </div>

        {/* 테마 셀렉터 */}
        <div style={{marginTop: '20px', display: 'flex', justifyContent: 'space-around'}}>
          {Object.keys(themes).map(themeName => (
            <button 
              key={themeName}
              onClick={() => setActiveTheme(themeName)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: activeTheme === themeName ? '2px solid var(--sba-text)' : '1px solid var(--sba-border)',
                background: themes[themeName].background,
                cursor: 'pointer',
                boxShadow: 'inset 0 0 4px rgba(0,0,0,0.2)'
              }}
              title={themeName}
            />
          ))}
        </div>

        {/* 하단 버튼 */}
        <div style={{display: 'flex', gap: '8px', marginTop: '24px'}}>
          <button className="sba-btn" style={{flex: 1, marginTop: 0}} onClick={handleDownload}>
            이미지 저장
          </button>
          <button className="sba-btn" style={{flex: 1, marginTop: 0, background: 'var(--sba-card-sub-bg)', color: 'var(--sba-text)', border: '1px solid var(--sba-border)'}} onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}



// ==========================================
// 0. Animations & Common Modal Components (shadcn/ui Style)
// ==========================================
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: scale(0.95) translateY(10px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContent = styled.div`
  background: var(--sba-modal-bg);
  color: var(--sba-text);
  padding: 24px;
  border-radius: 12px;
  width: 90%;
  max-width: ${props => props.$maxWidth || '400px'};
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--sba-border-strong);
  position: relative;
  animation: ${slideUp} 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--sba-border);
  padding-bottom: 12px;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--sba-text);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ModalCloseButton = styled.button`
  background: none;
  border: none;
  color: var(--sba-text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    color: var(--sba-text);
    background: var(--sba-card-sub-bg);
  }
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
  text-align: left;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--sba-text-secondary);
  margin-bottom: 6px;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  background: var(--sba-bg);
  color: var(--sba-text);
  border: 1px solid var(--sba-border-strong);
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.2s;
  
  &:focus {
    border-color: var(--sba-text);
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 20px;
`;

const ShadButton = styled.button`
  flex: 1;
  padding: 10px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid ${props => props.$variant === 'outline' ? 'var(--sba-border-strong)' : 'transparent'};
  background: ${props => {
    if (props.$variant === 'outline') return 'transparent';
    if (props.$variant === 'accent') return '#d97706';
    return 'var(--sba-text)';
  }};
  color: ${props => {
    if (props.$variant === 'outline') return 'var(--sba-text)';
    if (props.$variant === 'accent') return '#fff';
    return 'var(--sba-bg)';
  }};

  &:hover {
    opacity: 0.9;
    background: ${props => {
      if (props.$variant === 'outline') return 'var(--sba-card-sub-bg)';
      return undefined;
    }};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ==========================================
// 1. TabWeekly (주간 탭)
// ==========================================
function TabWeekly({ dailyPlans, currentDate, onCardClick }) {
    const actualToday = getEffectiveDate();
    const tMonth = actualToday.getMonth() + 1;
    const tDay = actualToday.getDate();
    const realTodayKey = `${String(tMonth).padStart(2, '0')}.${String(tDay).padStart(2, '0')}`;

    const dMonth = currentDate.getMonth() + 1;
    const dDay = currentDate.getDate();
    const currentKey = `${String(dMonth).padStart(2, '0')}.${String(dDay).padStart(2, '0')}`;

    // 메모가 저장된 날짜 목록 확인 (주간 카드에 펜 아이콘 렌더링 목적)
    const [savedNoteDates, setSavedNoteDates] = useState(new Set());

    useEffect(() => {
        try {
            const raw = localStorage.getItem('sba_qt_notes');
            if (raw) {
                const parsed = JSON.parse(raw);
                const dates = new Set(Object.keys(parsed).filter(k => parsed[k] && parsed[k].content && parsed[k].content.trim() !== ''));
                setSavedNoteDates(dates);
            }
        } catch (e) {
            console.error(e);
        }
    }, [currentDate]);

    return (
        <div className="sba-tab-content">
            <h2 className="sba-verse-title" style={{borderLeft: 'none', marginBottom: '16px'}}>금주의 일정 요약</h2>
            <div className="sba-weekly-list">
                {Object.entries(dailyPlans).map(([dKey, plan]) => {
                    const isRealToday = dKey === realTodayKey;
                    const isSelected = dKey === currentKey;
                    const dateStr = plan.dateObj.toISOString().split('T')[0];
                    const hasNote = savedNoteDates.has(dateStr);
                    
                    return (
                        <div 
                            key={dKey} 
                            className={`sba-weekly-card ${isSelected ? 'today' : ''}`}
                            onClick={() => onCardClick(plan.dateObj)}
                        >
                            <div className="sba-weekly-card-header">
                                <span>[{plan.dayName[0]}] {dKey}</span>
                                <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
                                    {hasNote && <span title="메모 작성됨" style={{fontSize:'0.9rem'}}>✏️</span>}
                                    {isRealToday && <span style={{fontSize:'0.75rem', background:'var(--sba-text)', color:'var(--sba-bg)', padding:'2px 8px', borderRadius:'12px'}}>오늘</span>}
                                    {isSelected && !isRealToday && <span style={{fontSize:'0.75rem', background:'var(--sba-text-secondary)', color:'var(--sba-bg)', padding:'2px 8px', borderRadius:'12px'}}>선택됨</span>}
                                </div>
                            </div>
                            <div className="sba-weekly-card-body" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <div style={{ flex: 1, background: 'var(--sba-card-sub-bg)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--sba-border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--sba-text-muted)', fontWeight: 'bold' }}>묵상</span>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--sba-text)', fontWeight: '500' }}>{plan.old ? `${SHORT_TO_FULL[plan.old.abbrev] || plan.old.abbrev} ${plan.old.verse}장` : '일정 없음'}</span>
                                </div>
                                <div style={{ flex: 1, background: 'var(--sba-card-sub-bg)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--sba-border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--sba-text-muted)', fontWeight: 'bold' }}>성경 통독</span>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--sba-text)', fontWeight: '500' }}>{plan.new ? `${plan.new.books.map(b => SHORT_TO_FULL[b] || b).join(', ')} ${plan.new.verseRaw}장` : '일정 없음'}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <p style={{textAlign:'center', color:'var(--sba-text-muted)', fontSize:'0.85rem', marginTop:'20px', lineHeight: '1.5'}}>
                카드를 클릭하면 해당 일자의 말씀 탭으로 바로 이동합니다.<br />
                <span style={{color:'var(--sba-text-subtle)', fontSize:'0.75rem'}}>(※ 앱 내 날짜 기준은 매일 오전 5시 정각에 변경됩니다)</span>
            </p>
        </div>
    );
}

// ==========================================
// 2. AdminModal (관리자 설정 모달)
// ==========================================
const AdminSectionTitle = styled.h4`
  margin: 16px 0 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--sba-text);
  border-bottom: 1px solid var(--sba-border-strong);
  padding-bottom: 4px;
`;

const AdminReflList = styled.div`
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid var(--sba-border-strong);
  border-radius: 6px;
  padding: 8px;
  background: var(--sba-card-sub-bg);
  margin-bottom: 12px;
`;

const AdminReflItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  padding: 6px 4px;
  border-bottom: 1px solid var(--sba-border);
  
  &:last-child {
    border-bottom: none;
  }
`;

const DeleteTextButton = styled.button`
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  
  &:hover {
    background: rgba(239, 68, 68, 0.1);
  }
`;

function AdminModal({ isOpen, onClose, startDateStr, setStartDateStr, addToast }) {
    const [token, setToken] = useState('sba_qt_admin_secret_token');
    const [syncing, setSyncing] = useState(false);
    const [refls, setRefls] = useState([]);
    const [stats, setStats] = useState({ bookmarks: 0, notes: 0 });

    const loadRefls = async () => {
        try {
            const { data, error } = await supabase
                .from('qt_shared_reflections')
                .select('id, author_name, passage, created_at')
                .order('created_at', { ascending: false })
                .limit(20);
            if (!error && data) {
                setRefls(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadStats = () => {
        try {
            const bm = localStorage.getItem('sba_qt_bookmarks');
            const nt = localStorage.getItem('sba_qt_notes');
            setStats({
                bookmarks: bm ? JSON.parse(bm).length : 0,
                notes: nt ? Object.keys(JSON.parse(nt)).length : 0
            });
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadRefls();
            loadStats();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch(`/api/sba-qt?purge=true&token=${token}`);
            if (res.ok) {
                addToast('구글 스프레드시트 데이터가 즉시 강제 갱신(Purge)되었습니다.');
                onClose();
            } else {
                const errData = await res.json();
                alert(`동기화 실패: ${errData.error || '알 수 없는 오류'}`);
            }
        } catch (e) {
            console.error(e);
            alert('API 호출 도중 오류가 발생했습니다.');
        } finally {
            setSyncing(false);
        }
    };

    const handleDeleteRefl = async (id) => {
        if (!window.confirm('해당 묵상 공유글을 삭제하시겠습니까?')) return;
        try {
            const { error } = await supabase
                .from('qt_shared_reflections')
                .delete()
                .eq('id', id);
            if (error) throw error;
            addToast('묵상 공유글이 삭제되었습니다.');
            loadRefls();
        } catch (err) {
            alert('삭제 실패: ' + err.message);
        }
    };

    const handleClearLocalCache = () => {
        if (!window.confirm('로컬 캐시(북마크, 메모)를 모두 초기화하고 화면을 재로드하시겠습니까?')) return;
        localStorage.removeItem('sba_qt_bookmarks');
        localStorage.removeItem('sba_qt_notes');
        localStorage.removeItem('sba_bible_font_size');
        addToast('로컬 데이터가 완전히 초기화되었습니다.');
        window.location.reload();
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', width: '95%' }}>
                <ModalHeader>
                    <ModalTitle>관리자 설정 (Admin)</ModalTitle>
                    <ModalCloseButton onClick={onClose}>✕</ModalCloseButton>
                </ModalHeader>
                <p style={{fontSize: '0.85rem', color: 'var(--sba-text-secondary)', margin: '0 0 12px'}}>
                    큐티 기준일 변경 및 시트 캐시 초기화
                </p>
                
                <FormGroup>
                    <FormLabel>시작 기준일 (localStorage)</FormLabel>
                    <FormInput 
                        type="date" 
                        value={startDateStr} 
                        onChange={e => setStartDateStr(e.target.value)}
                    />
                </FormGroup>
                
                <FormGroup>
                    <FormLabel>Purge 관리자 토큰</FormLabel>
                    <FormInput 
                        type="password" 
                        value={token} 
                        onChange={e => setToken(e.target.value)}
                    />
                </FormGroup>

                <AdminSectionTitle>지체들의 묵상 공유글 관리</AdminSectionTitle>
                <AdminReflList>
                    {refls.length === 0 ? (
                        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--sba-text-muted)', padding: '10px 0' }}>공유된 글이 없습니다.</div>
                    ) : (
                        refls.map(r => (
                            <AdminReflItem key={r.id}>
                                <span>{r.author_name} - {r.passage}</span>
                                <DeleteTextButton onClick={() => handleDeleteRefl(r.id)}>삭제</DeleteTextButton>
                            </AdminReflItem>
                        ))
                    )}
                </AdminReflList>

                <AdminSectionTitle>로컬 데이터 진단</AdminSectionTitle>
                <div style={{ fontSize: '0.8rem', color: 'var(--sba-text-secondary)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>북마크: {stats.bookmarks}개 | 오늘의 메모: {stats.notes}개</span>
                    <DeleteTextButton style={{ color: 'var(--sba-text)' }} onClick={handleClearLocalCache}>로컬 캐시 초기화</DeleteTextButton>
                </div>
                
                <ButtonGroup style={{ flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                    <ShadButton $variant="accent" onClick={handleSync} disabled={syncing}>
                        {syncing ? '구글 시트 즉시 갱신 중...' : '구글 시트 즉시 동기화 (Purge)'}
                    </ShadButton>
                    <ShadButton $variant="outline" onClick={onClose}>
                        닫기 및 저장
                    </ShadButton>
                </ButtonGroup>
            </ModalContent>
        </ModalOverlay>
    );
}

// ==========================================
// 3. CalendarModal (커스텀 달력 모달)
// ==========================================
const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const CalendarTitleText = styled.span`
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--sba-text);
`;

const CalendarNavButton = styled.button`
  background: none;
  border: none;
  color: var(--sba-text);
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    background: var(--sba-card-sub-bg);
  }
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 8px;
  column-gap: 4px;
  text-align: center;
`;

const WeekdayHeader = styled.span`
  font-weight: 600;
  font-size: 0.75rem;
  padding-bottom: 8px;
  color: ${props => props.$isSunday ? '#ef4444' : props.$isSaturday ? '#3b82f6' : 'var(--sba-text-muted)'};
`;

const CalendarDayCell = styled.div`
  padding: 8px 0;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  font-size: 0.85rem;
  font-weight: ${props => props.$isSelected ? '600' : 'normal'};
  background: ${props => props.$isSelected ? 'var(--sba-text)' : 'transparent'};
  color: ${props => props.$isSelected ? 'var(--sba-bg)' : 'var(--sba-text)'};
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$isSelected ? 'var(--sba-text)' : 'var(--sba-card-sub-bg)'};
  }
`;

const NoteIndicator = styled.span`
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: ${props => props.$isSelected ? 'var(--sba-bg)' : 'var(--sba-text-secondary)'};
`;

const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());

function CalendarModal({ isOpen, onClose, currentDate, onSetDate }) {
    const [noteDates, setNoteDates] = useState(new Set());
    const [viewDate, setViewDate] = useState(() => {
        return isValidDate(currentDate) ? new Date(currentDate) : getEffectiveDate();
    });

    useEffect(() => {
        if (isOpen && isValidDate(currentDate)) {
            setViewDate(new Date(currentDate));
        }
    }, [isOpen, currentDate]);

    if (!isOpen) return null;

    useEffect(() => {
        try {
            const raw = localStorage.getItem('sba_qt_notes');
            if (raw) {
                const parsed = JSON.parse(raw);
                const dates = new Set(Object.keys(parsed).filter(k => parsed[k] && parsed[k].content && parsed[k].content.trim() !== ''));
                setNoteDates(dates);
            }
        } catch (e) {
            console.error(e);
        }
    }, [isOpen]);

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const safeCurrentDate = isValidDate(currentDate) ? currentDate : getEffectiveDate();
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = getDaysInMonth(year, month);
    
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }

    const prevMonth = () => {
        setViewDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setViewDate(new Date(year, month + 1, 1));
    };

    const handleSelectDate = (date) => {
        if (!date) return;
        onSetDate(date);
        onClose();
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()} $maxWidth="360px">
                <ModalHeader>
                    <ModalTitle>
                        날짜 이동
                        <span style={{fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--sba-text-muted)'}}>• 점(·) 표시: 메모 있음</span>
                    </ModalTitle>
                    <ModalCloseButton onClick={onClose}>✕</ModalCloseButton>
                </ModalHeader>
                
                <CalendarHeader>
                    <CalendarNavButton onClick={prevMonth}>◀</CalendarNavButton>
                    <CalendarTitleText>{year}년 {month + 1}월</CalendarTitleText>
                    <CalendarNavButton onClick={nextMonth}>▶</CalendarNavButton>
                </CalendarHeader>
 
                <CalendarGrid>
                    {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                        <WeekdayHeader key={d} $isSunday={i === 0} $isSaturday={i === 6}>{d}</WeekdayHeader>
                    ))}
                    
                    {days.map((date, idx) => {
                        if (!date) return <div key={`empty-${idx}`} />;
                        
                        const dateStr = date.toISOString().split('T')[0];
                        const isSelected = dateStr === safeCurrentDate.toISOString().split('T')[0];
                        const hasNote = noteDates.has(dateStr);
                        
                        return (
                            <CalendarDayCell 
                                key={dateStr}
                                onClick={() => handleSelectDate(date)}
                                $isSelected={isSelected}
                            >
                                {date.getDate()}
                                {hasNote && (
                                    <NoteIndicator $isSelected={isSelected} />
                                )}
                            </CalendarDayCell>
                        );
                    })}
                </CalendarGrid>
 
                <ButtonGroup>
                    <ShadButton 
                        $variant="outline"
                        onClick={() => {
                            onSetDate(getEffectiveDate());
                            onClose();
                        }}
                    >
                        오늘 날짜로 복귀
                    </ShadButton>
                    <ShadButton onClick={onClose}>
                        취소
                    </ShadButton>
                </ButtonGroup>
            </ModalContent>
        </ModalOverlay>
    );
}

// ==========================================
// 4. AuthModal (소셜 로그인 모달)
// ==========================================
const SocialButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  margin-top: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  border: ${props => props.$provider === 'google' ? '1px solid var(--sba-border-strong)' : 'none'};
  background: ${props => props.$provider === 'google' ? 'var(--sba-modal-bg)' : '#fee500'};
  color: ${props => props.$provider === 'google' ? 'var(--sba-text)' : '#191919'};
  
  &:hover {
    background: ${props => props.$provider === 'google' ? 'var(--sba-card-sub-bg)' : '#fdd835'};
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

function AuthModal({ isOpen, onClose, addToast }) {
    if (!isOpen) return null;

    const handleOAuthLogin = async (provider) => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (e) {
            console.error(e);
            addToast(`소셜 로그인에 실패했습니다: ${e.message}`);
        }
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()} style={{textAlign: 'center'}} $maxWidth="380px">
                <ModalHeader>
                    <ModalTitle style={{ margin: '0 auto' }}>로그인</ModalTitle>
                    <ModalCloseButton onClick={onClose} style={{ position: 'absolute', right: '16px', top: '16px' }}>✕</ModalCloseButton>
                </ModalHeader>
                <p style={{fontSize: '0.875rem', color: 'var(--sba-text-secondary)', lineHeight: '1.5', margin: '0 0 24px'}}>
                    소셜 로그인으로 로그인하시면 작성하신 북마크와 메모가 안전하게 클라우드에 백업되어 다른 기기에서도 자유롭게 연동됩니다.
                </p>
                
                <SocialButton $provider="google" onClick={() => handleOAuthLogin('google')}>
                    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.04c1.74 0 3.3.6 4.53 1.78l3.38-3.38C17.86 1.54 15.17 1 12 1 7.24 1 3.2 3.82 1.34 7.92l3.96 3.07C6.26 7.63 8.92 5.04 12 5.04z"/><path fill="#4285F4" d="M23.49 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.69 2.87c2.16-2 3.74-4.94 3.74-8.58z"/><path fill="#FBBC05" d="M5.3 14.79a7.16 7.16 0 0 1 0-4.54L1.34 7.18a11.96 11.96 0 0 0 0 9.64l3.96-3.03z"/><path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.69-2.87c-1.02.68-2.33 1.09-4.27 1.09-3.08 0-5.74-2.59-6.7-5.96L1.34 15.38C3.2 19.48 7.24 23 12 23z"/></svg>
                    Google로 시작하기
                </SocialButton>
                
                <SocialButton $provider="kakao" onClick={() => handleOAuthLogin('kakao')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c-4.97 0-9 3.185-9 7.11 0 2.507 1.644 4.717 4.148 5.918-.173.65-.626 2.34-.716 2.684-.112.433.155.427.327.311.135-.09 2.148-1.464 3.003-2.046C10.428 17.054 11.2 17.11 12 17.11c4.97 0 9-3.185 9-7.11C21 6.185 16.97 3 12 3z"/></svg>
                    카카오로 시작하기
                </SocialButton>

                <p 
                    style={{fontSize: '0.8rem', color: 'var(--sba-text-muted)', marginTop: '24px', textDecoration: 'underline', cursor: 'pointer', display: 'inline-block'}} 
                    onClick={onClose}
                >
                    로그인 없이 계속 사용하기 (로컬 저장)
                </p>
            </ModalContent>
        </ModalOverlay>
    );
}


// ==========================================
// 5. Main Export App
// ==========================================


const DEFAULT_START_DATE = "2024-12-17";

// 지수 백오프 기반 패치 유틸리티
async function fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
    try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return await res.json();
    } catch (error) {
        if (retries > 0) {
            console.warn(`Fetch 실패, ${delay}ms 후 재시도 중... (남은 횟수: ${retries})`, error);
            await new Promise(r => setTimeout(r, delay));
            return fetchWithRetry(url, options, retries - 1, delay * 2);
        }
        throw error;
    }
}

 function SBA_QT_App() {
    const [scheduleData, setScheduleData] = useState(null);
    const [currentDate, setCurrentDate] = useState(getEffectiveDate());
    const [activeTab, setActiveTab] = useState('today');

    // UI 상태 관리
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toasts, setToasts] = useState([]);
    
    // 다크모드 및 소셜 세션
    const [isDark, setIsDark] = useState(() => {
        // 초기화 시 로컬 스토리지 또는 OS 테마 상태 확인
        const saved = localStorage.getItem('sba_theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    const [session, setSession] = useState(null);
    const [bookmarkTrigger, setBookmarkTrigger] = useState(0);

    // 모달 관리
    const [showCalendar, setShowCalendar] = useState(false);
    const [showAdmin, setShowAdmin] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [adminClicks, setAdminClicks] = useState(0);
    
    // 시작 기준일 상태 (기본값 설정 및 로컬스토리지 로딩)
    const [startDateStr, setStartDateStr] = useState(() => {
        return localStorage.getItem('sba_admin_date') || DEFAULT_START_DATE;
    });

    // 스플래시 스크린 관리
    const [isSplashVisible, setIsSplashVisible] = useState(true);
    const [isSplashFading, setIsSplashFading] = useState(false);

    // Toast 토스트 알림 추가 함수
    const addToast = (message) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 2500);
    };

    // 다크모드 적용 효과
    useEffect(() => {
        localStorage.setItem('sba_theme', isDark ? 'dark' : 'light');
        const container = document.querySelector('.sba-app-container');
        if (container) {
            if (isDark) container.classList.add('dark');
            else container.classList.remove('dark');
        }
    }, [isDark]);

    // 시작 기준일 변경 시 로컬스토리지 반영
    const handleSetStartDateStr = (newDateStr) => {
        setStartDateStr(newDateStr);
        localStorage.setItem('sba_admin_date', newDateStr);
        addToast('큐티 시작 기준일이 수정되었습니다.');
    };

    // Supabase Auth 세션 감지 및 자동 동기화
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                syncLocalDataToCloud().then((res) => {
                    if (res.success) {
                        addToast('소셜 클라우드와 북마크/메모가 동기화되었습니다.');
                        setBookmarkTrigger(prev => prev + 1);
                    }
                });
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                syncLocalDataToCloud().then((res) => {
                    if (res.success) {
                        addToast('소셜 클라우드와 북마크/메모가 동기화되었습니다.');
                        setBookmarkTrigger(prev => prev + 1);
                    }
                });
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // 스케줄 데이터 로딩 함수 (지수 백오프 및 fallback 연동)
    const loadSchedule = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. 백엔드 시트 API 호출 시도
            const data = await fetchWithRetry('/api/sba-qt');
            setScheduleData(data);
        } catch (err) {
            console.warn("백엔드 API 호출 실패, 로컬 폴백 데이터를 로드합니다.", err);
            try {
                // 2. 실패 시 로컬 fallback_schedule.json 호출
                const fallbackData = await fetchWithRetry('/fallback_schedule.json');
                setScheduleData(fallbackData);
            } catch (fallbackErr) {
                console.error("폴백 데이터 로드도 실패했습니다.", fallbackErr);
                setError("일정 데이터를 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSchedule();

        // 스플래시 애니메이션 타이머
        const fadeTimer = setTimeout(() => setIsSplashFading(true), 2200);
        const removeTimer = setTimeout(() => setIsSplashVisible(false), 3000);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(removeTimer);
        };
    }, []);

    const effectiveDate = useMemo(() => {
        if (currentDate instanceof Date && !isNaN(currentDate.getTime())) {
            return currentDate;
        }
        return getEffectiveDate();
    }, [currentDate]);

    const targetKST = useMemo(() => {
        return getMidnightKST(effectiveDate);
    }, [effectiveDate]);

    const weekDayIdx = targetKST.getUTCDay();

    // 주간 7일간의 일정 계산 (O(1))
    const dailyPlans = useMemo(() => {
        if (!scheduleData) return {};
        
        const diffToMonday = weekDayIdx === 0 ? -6 : 1 - weekDayIdx;
        const plans = {};
        const parsedStartDate = new Date(startDateStr);
        const startKST = getMidnightKST(
            parsedStartDate instanceof Date && !isNaN(parsedStartDate.getTime()) 
                ? parsedStartDate 
                : new Date(DEFAULT_START_DATE)
        );

        for (let i = 0; i < 7; i++) {
            const d = new Date(targetKST.getTime());
            d.setUTCDate(targetKST.getUTCDate() + diffToMonday + i);
            
            const dMonth = d.getUTCMonth() + 1;
            const dDay = d.getUTCDate();
            const dKey = `${String(dMonth).padStart(2, '0')}.${String(dDay).padStart(2, '0')}`;
            const dayName = DAYS_ARR[d.getUTCDay()];
            
            let oldPlan = null;
            let newPlan = null;

            if (dayName !== "일요일") {
                const daysElapsed = calcQtDays(startKST, d);
                if (daysElapsed > 0) {
                    let count = 0;
                    for (const row of scheduleData.qt_plan) {
                        const sp = parseInt(row.start_paragraph);
                        const ep = parseInt(row.end_paragraph);
                        const paras = ep - sp + 1;
                        if (count + paras >= daysElapsed) {
                            const verse = sp + (daysElapsed - count - 1);
                            oldPlan = { abbrev: FULL_TO_SHORT[row.chapter] || row.chapter, verse: verse.toString() };
                            break;
                        }
                        count += paras;
                    }
                }
            }

            const readingRow = scheduleData.reading_plan.find(r => 
                parseInt(r.month) === dMonth && parseInt(r.day) === dDay
            );

            if (readingRow && readingRow.chapter !== "없음" && readingRow.verse !== "없음") {
                newPlan = { books: readingRow.chapter.replace(/"/g,'').split(','), verseRaw: readingRow.verse };
            }

            plans[dKey] = { dayName, old: oldPlan, new: newPlan, dateObj: d };
        }
        return plans;
    }, [scheduleData, targetKST, startDateStr, weekDayIdx]);

    const handleAdminClick = () => {
        const next = adminClicks + 1;
        if (next >= 5) {
            setShowAdmin(true);
            setAdminClicks(0);
        } else {
            setAdminClicks(next);
        }
    };

    const handleWeekCardClick = (dateObj) => {
        if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
            setCurrentDate(dateObj);
            setActiveTab('today');
        }
    };

    const handleSetDate = (newDate) => {
        if (newDate instanceof Date && !isNaN(newDate.getTime())) {
            setCurrentDate(newDate);
        }
        setShowCalendar(false);
    };

    // 북마크 구절 클릭 시 해당 일정 날짜/탭 역추적 및 포커싱 이동
    const handleNavigateToVerse = (book, chapter, verse) => {
        let targetDateObj = new Date();
        let targetTab = 'today';
        let found = false;

        if (scheduleData) {
            const parsedStartDate = new Date(startDateStr);
            const startKST = getMidnightKST(
                parsedStartDate instanceof Date && !isNaN(parsedStartDate.getTime()) 
                    ? parsedStartDate 
                    : new Date(DEFAULT_START_DATE)
            );
            
            if (startKST instanceof Date && !isNaN(startKST.getTime())) {
                let count = 0;
                for (const row of scheduleData.qt_plan) {
                    const sp = parseInt(row.start_paragraph);
                    const ep = parseInt(row.end_paragraph);
                    const paras = ep - sp + 1;
                    const rowBook = FULL_TO_SHORT[row.chapter] || row.chapter;
                    
                    if (rowBook === book && sp <= chapter && chapter <= ep) {
                        const daysElapsed = count + (chapter - sp) + 1;
                        const d = new Date(startKST.getTime());
                        d.setUTCDate(startKST.getUTCDate() + daysElapsed);
                        if (d instanceof Date && !isNaN(d.getTime())) {
                            targetDateObj = d;
                            targetTab = 'today';
                            found = true;
                        }
                        break;
                    }
                    count += paras;
                }
            }

            // 2. 통독 계획에서 검색 (묵상에서 발견되지 않은 경우)
            if (!found) {
                for (const row of scheduleData.reading_plan) {
                    const books = row.chapter.replace(/"/g,'').split(',').map(b => b.trim());
                    if (books.includes(book)) {
                        const d = getMidnightKST(new Date());
                        d.setUTCMonth(parseInt(row.month) - 1);
                        d.setUTCDate(parseInt(row.day));
                        if (d instanceof Date && !isNaN(d.getTime())) {
                            targetDateObj = d;
                            targetTab = 'reading';
                            found = true;
                        }
                        break;
                    }
                }
            }
        }

        // 해당 일정 날짜와 탭으로 강제 전환
        if (targetDateObj instanceof Date && !isNaN(targetDateObj.getTime())) {
            setCurrentDate(targetDateObj);
            setActiveTab(targetTab);
        }

        // Lazy Loading 통독/묵상 말씀 렌더링 후 DOM 탐색을 위해 600ms 딜레이
        setTimeout(() => {
            const elId = `verse-${book}-${chapter}-${verse}`;
            const el = document.getElementById(elId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('flash-focus');
                setTimeout(() => {
                    el.classList.remove('flash-focus');
                }, 2000);
            } else {
                console.warn("구절 엘리먼트를 찾지 못했습니다:", elId);
            }
        }, 600);
    };

    const renderContent = () => {
        if (loading) {
            return <div className="sba-loading">스케줄 로딩 중...</div>;
        }

        if (error) {
            return (
                <div className="sba-retry-container">
                    <div className="sba-retry-title">데이터를 가져올 수 없습니다</div>
                    <div className="sba-retry-desc">{error}</div>
                    <button className="sba-btn" onClick={loadSchedule}>다시 시도</button>
                </div>
            );
        }

        const dMonth = targetKST.getUTCMonth() + 1;
        const dDay = targetKST.getUTCDate();
        const currentKey = `${String(dMonth).padStart(2, '0')}.${String(dDay).padStart(2, '0')}`;
        const currentPlan = dailyPlans[currentKey];

        switch (activeTab) {
            case 'today':
                return (
                    <TabToday 
                        todayPlan={currentPlan} 
                        session={session} 
                        addToast={addToast}
                        onBookmarkChange={() => setBookmarkTrigger(prev => prev + 1)}
                    />
                );
            case 'reading':
                return (
                    <TabReading 
                        todayPlan={currentPlan} 
                        session={session} 
                        addToast={addToast}
                        onBookmarkChange={() => setBookmarkTrigger(prev => prev + 1)}
                    />
                );
            case 'bookmarks':
                return (
                    <TabBookmarks 
                        onNavigateToVerse={handleNavigateToVerse} 
                        updateTrigger={bookmarkTrigger}
                        addToast={addToast}
                    />
                );
            case 'weekly':
                return (
                    <TabWeekly 
                        dailyPlans={dailyPlans} 
                        currentDate={effectiveDate} 
                        onCardClick={handleWeekCardClick} 
                    />
                );
            case 'sharing':
                return (
                    <>
                        <SharingTab 
                            session={session} 
                            onOpenAuthModal={() => setShowAuth(true)} 
                            addToast={addToast} 
                            isDark={isDark} 
                        />
                        <div onClick={handleAdminClick} style={{textAlign: 'center', color: 'var(--sba-text-subtle)', padding: '10px', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none'}}>
                            v5.2 (Supabase)
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <SbaStyledWrapper className={`sba-app-container ${isDark ? 'dark' : ''}`}>
        <GlobalStyle />
            {isSplashVisible && (
                <div className={`sba-splash-screen ${isSplashFading ? 'fade-out' : ''}`}>
                    <div className="sba-splash-content">
                        <h1 className="sba-splash-main-title">서울북부교회</h1>
                        <h2 className="sba-splash-sub-title">QT & 통독</h2>
                        <p className="sba-splash-desc">말씀으로 하루를 여는 은혜의 시간</p>
                    </div>
                    <div className="sba-splash-footer">
                        개발: 이소원 형제
                    </div>
                </div>
            )}

            <TopHeader 
                currentDate={effectiveDate} 
                onOpenCalendar={() => setShowCalendar(true)} 
                isDark={isDark}
                onToggleDark={() => setIsDark(prev => !prev)}
                session={session}
                onOpenAuth={() => setShowAuth(true)}
                onOpenAdmin={() => setShowAdmin(true)}
            />
            
            <main className="sba-content">
                {renderContent()}
                <AppFooter />
            </main>

            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <CalendarModal 
                isOpen={showCalendar} 
                onClose={() => setShowCalendar(false)} 
                currentDate={effectiveDate} 
                onSetDate={handleSetDate} 
            />
            
            <AdminModal 
                isOpen={showAdmin} 
                onClose={() => setShowAdmin(false)} 
                startDateStr={startDateStr} 
                setStartDateStr={handleSetStartDateStr}
                addToast={addToast}
            />

            <AuthModal
                isOpen={showAuth}
                onClose={() => setShowAuth(false)}
                addToast={addToast}
            />

            {/* 토스트 팝업 렌더러 */}
            <div className="sba-toast-container">
                {toasts.map(t => (
                    <div key={t.id} className="sba-toast">{t.message}</div>
                ))}
            </div>
        </SbaStyledWrapper>
    );
}

