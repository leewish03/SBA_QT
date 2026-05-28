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
    -webkit-tap-highlight-color: transparent;
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
    -webkit-tap-highlight-color: transparent;
}
@media (hover: hover) {
    .sba-verse-block:hover {
        background-color: var(--sba-card-active);
    }
}

.sba-verse-block.highlighted {
    background-color: var(--sba-highlight);
}
@media (hover: hover) {
    .sba-verse-block.highlighted:hover {
        background-color: var(--sba-highlight-hover);
    }
}

.sba-verse-block.focused {
    background-color: var(--sba-card-active);
}
.sba-verse-block.focused.highlighted {
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

/* 날짜 스와이프 및 네비게이션 스타일 */
.sba-date-arrow-btn:hover {
    background: var(--sba-card-active) !important;
    color: var(--sba-text) !important;
}

.sba-date-arrow-btn:active {
    transform: scale(0.92);
}

.sba-date-nav-wrapper:hover {
    border-color: var(--sba-text-muted) !important;
}

/* 구절 선택 액션바 활성화 시 오늘의 메모 플로팅 버튼을 위로 회피시킴 */
.sba-app-container:has(.sba-floating-bar) .sba-memo-float-btn {
    bottom: calc(166px + env(safe-area-inset-bottom, 0px)) !important;
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
  let d = dateObj;
  
  // 1. 입력 인자 유효성 선검증
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    d = new Date(d);
  }
  if (isNaN(d.getTime())) {
    d = new Date(); // 변환에 완전히 실패할 경우 오늘 날짜로 폴백
  }
  
  try {
    // ko-KR 로케일과 Asia/Seoul 타임존 고정
    const formatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(d);
    
    let year, month, day;
    for (const part of parts) {
      if (part.type === 'year') year = parseInt(part.value, 10);
      if (part.type === 'month') month = parseInt(part.value, 10);
      if (part.type === 'day') day = parseInt(part.value, 10);
    }
    
    if (year && month && day) {
      // UTC 기준으로 연, 월(0~11), 일을 설정하여 시간 오프셋 혼선 차단
      return new Date(Date.UTC(year, month - 1, day));
    }
  } catch (e) {
    console.warn("Intl formatToParts 파싱 실패, 로컬 시간대 기준 폴백 작동:", e);
  }
  
  // 2. Fallback: Intl 미지원 혹은 예외 발생 시 로컬 연/월/일 추출 기반 안전 계산
  const localYear = d.getFullYear();
  const localMonth = d.getMonth();
  const localDate = d.getDate();
  return new Date(Date.UTC(localYear, localMonth, localDate));
}

function safeToISODateString(dateObj) {
  let d = dateObj;
  
  // 입력 인자 유효성 및 포맷 검증
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    console.warn("safeToISODateString: Invalid date, fallback to today.");
    d = new Date();
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
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
  const toDeleteDates = [];
  const mergedNotes = { ...localNotes };

  // 1. 클라우드 메모를 순회하며 로컬과 병합 (updated_at 타임스탬프 기준)
  cloudNotes.forEach(cloud => {
    const date = cloud.target_date;
    const local = localNotes[date];

    if (!local) {
      // 클라우드에만 존재하는 메모 -> 로컬에 반영
      if (cloud.content && cloud.content.trim() !== '') {
        mergedNotes[date] = {
          content: cloud.content,
          updated_at: cloud.updated_at
        };
      } else {
        delete mergedNotes[date];
      }
    } else {
      // 로컬과 클라우드 모두 존재
      const localTime = new Date(local.updated_at || 0).getTime();
      const cloudTime = new Date(cloud.updated_at || 0).getTime();

      if (localTime > cloudTime) {
        // 로컬이 더 최신인 경우
        if (!local.content || local.content.trim() === '') {
          toDeleteDates.push(date);
          delete mergedNotes[date];
        } else {
          // 클라우드를 로컬 내용으로 업데이트
          toUpload.push({
            user_id: userId,
            target_date: date,
            content: local.content,
            updated_at: local.updated_at
          });
          mergedNotes[date] = local;
        }
      } else if (cloudTime > localTime) {
        // 클라우드가 더 최신인 경우
        if (!cloud.content || cloud.content.trim() === '') {
          delete mergedNotes[date];
        } else {
          mergedNotes[date] = {
            content: cloud.content,
            updated_at: cloud.updated_at
          };
        }
      } else {
        // 타임스탬프가 같은 경우 -> 내용 다를 때만 동기화
        if (local.content !== cloud.content) {
          if (!local.content || local.content.trim() === '') {
            toDeleteDates.push(date);
            delete mergedNotes[date];
          } else if (!cloud.content || cloud.content.trim() === '') {
            delete mergedNotes[date];
          } else {
            if (cloud.content.length > local.content.length) {
              mergedNotes[date] = {
                content: cloud.content,
                updated_at: cloud.updated_at
              };
            } else {
              toUpload.push({
                user_id: userId,
                target_date: date,
                content: local.content,
                updated_at: local.updated_at
              });
            }
          }
        }
      }
    }
  });

  // 2. 로컬에만 존재하는 메모를 클라우드 업로드 대상으로 지정
  const cloudDates = new Set(cloudNotes.map(n => n.target_date));
  Object.entries(localNotes).forEach(([date, note]) => {
    if (!cloudDates.has(date)) {
      if (!note.content || note.content.trim() === '') {
        delete mergedNotes[date];
      } else {
        toUpload.push({
          user_id: userId,
          target_date: date,
          content: note.content,
          updated_at: note.updated_at || new Date().toISOString()
        });
      }
    }
  });

  // 클라우드 삭제 (100개 청크 단위)
  if (toDeleteDates.length > 0) {
    const chunks = chunkArray(toDeleteDates, 100);
    for (const chunk of chunks) {
      const { error: deleteError } = await supabase
        .from('qt_notes')
        .delete()
        .eq('user_id', userId)
        .in('target_date', chunk);
      if (deleteError) throw deleteError;
    }
  }

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

  // 최종 확인: 로컬 스토리지에 빈 메모들이 남아있지 않도록 제거
  Object.keys(mergedNotes).forEach(date => {
    if (!mergedNotes[date] || !mergedNotes[date].content || mergedNotes[date].content.trim() === '') {
      delete mergedNotes[date];
    }
  });

  // 로컬 스토리지 최종 갱신
  localStorage.setItem('sba_qt_notes', JSON.stringify(mergedNotes));
}


// ==========================================
// 4. Components
// ==========================================

// ==========================================
// 1. ShinyText (은은하게 지나가는 펄 광원 텍스트 효과)
// ==========================================
const shine = keyframes`
  0% {
    background-position: 120% 0;
  }
  100% {
    background-position: -20% 0;
  }
`;

const StyledShinySpan = styled.span`
  color: ${({ $disabled }) => $disabled ? 'inherit' : 'transparent'};
  background: ${({ $disabled, $shineColor, $baseColor }) => $disabled 
    ? 'none' 
    : `linear-gradient(120deg, ${$baseColor || 'var(--sba-text-secondary, rgba(128, 128, 128, 0.6))'} 30%, ${$shineColor || 'var(--sba-text, #ffffff)'} 50%, ${$baseColor || 'var(--sba-text-secondary, rgba(128, 128, 128, 0.6))'} 70%)`
  };
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  animation: ${shine} ${({ $speed }) => $speed || '2.5s'} linear infinite;
  display: inline-block;
  font-weight: inherit;
`;

function ShinyText({ text, speed = '2.5s', shineColor, baseColor, disabled = false, className, style }) {
  return (
    <StyledShinySpan 
      $speed={speed} 
      $shineColor={shineColor} 
      $baseColor={baseColor}
      $disabled={disabled}
      className={className}
      style={style}
    >
      {text}
    </StyledShinySpan>
  );
}

// ==========================================
// 2. DecryptedText (깜빡이는 해독 텍스트 효과)
// ==========================================
function DecryptedText({ 
  text, 
  speed = 40, 
  maxIterations = 8, 
  className, 
  style 
}) {
  const [displayText, setDisplayText] = useState('');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+?';

  useEffect(() => {
    let active = true;
    let iteration = 0;
    const targetText = text || '';
    
    const interval = setInterval(() => {
      if (!active) return;
      
      const scrambled = targetText
        .split('')
        .map((char, index) => {
          if (char === ' ') return ' ';
          
          // 순차적 노출: 이터레이션이 특정 횟수를 지날 때마다 앞의 글자들을 고정
          if (index < iteration / maxIterations) {
            return char;
          }
          
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');
      
      setDisplayText(scrambled);
      
      if (iteration >= targetText.length * maxIterations) {
        setDisplayText(targetText);
        clearInterval(interval);
      }
      
      iteration++;
    }, speed);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [text, speed, maxIterations]);

  return <span className={className} style={style}>{displayText}</span>;
}

// ==========================================
// 3. SpotlightCard (마우스/터치 중심 광원 카드 효과)
// ==========================================
const CardWrapper = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: inherit;
  width: 100%;
  height: 100%;
`;

const SpotlightOverlay = styled.div.attrs(props => ({
  style: {
    opacity: props.$opacity,
    background: `radial-gradient(circle 140px at ${props.$x}px ${props.$y}px, var(--sba-spotlight-color, rgba(0, 102, 204, 0.12)), transparent 80%)`
  }
}))`
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 1;
  transition: opacity 0.4s ease;
`;

const CardContent = styled.div`
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
`;

function SpotlightCard({ children, className, style, ...rest }) {
  const containerRef = useRef(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleTouchMove = (e) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    setCoords({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
  };

  return (
    <CardWrapper
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      onTouchStart={(e) => {
        setOpacity(1);
        handleTouchMove(e);
      }}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setOpacity(0)}
      className={className}
      style={style}
      {...rest}
    >
      <SpotlightOverlay $x={coords.x} $y={coords.y} $opacity={opacity} />
      <CardContent>
        {children}
      </CardContent>
    </CardWrapper>
  );
}



const ICONS = {
    today: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>,
    reading: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/><path d="m9 10 2 2 4-4"/></svg>,
    bookmarks: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>,
    weekly: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    sharing: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
};

function TopHeader({ currentDate, setCurrentDate, onOpenCalendar, session, onOpenAuth, onOpenSettings, addToast }) {
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const dayName = days[currentDate.getDay()];

    const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });

    const handlePrevDay = (e) => {
        if (e) e.stopPropagation();
        setCurrentDate(prev => {
            const next = new Date(prev.getTime());
            next.setDate(next.getDate() - 1);
            return next;
        });
        if (addToast) addToast("이전 날짜로 이동했습니다.");
    };

    const handleNextDay = (e) => {
        if (e) e.stopPropagation();
        setCurrentDate(prev => {
            const next = new Date(prev.getTime());
            next.setDate(next.getDate() + 1);
            return next;
        });
        if (addToast) addToast("다음 날짜로 이동했습니다.");
    };

    const handleTouchStart = (e) => {
        setTouchStart({
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        });
    };

    const handleTouchEnd = (e) => {
        if (touchStart.x === 0 && touchStart.y === 0) return;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStart.x;
        const diffY = touchEndY - touchStart.y;

        if (Math.abs(diffX) > 40 && Math.abs(diffY) < 50) {
            if (diffX > 40) {
                handlePrevDay();
            } else if (diffX < -40) {
                handleNextDay();
            }
        }
        setTouchStart({ x: 0, y: 0 });
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
            <div 
                className="sba-date-nav-wrapper"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'var(--sba-card-active)',
                    padding: '6px 10px',
                    borderRadius: '20px',
                    border: '1px solid var(--sba-border-strong)',
                    userSelect: 'none',
                    transition: 'all 0.2s ease',
                    flex: 1,
                    maxWidth: '210px'
                }}
            >
                <button 
                    onClick={handlePrevDay} 
                    className="sba-date-arrow-btn"
                    title="이전 날"
                    style={{
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--sba-text-secondary)', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        borderRadius: '50%',
                        transition: 'background 0.2s'
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                
                <h1 
                    onClick={onOpenCalendar} 
                    style={{
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '2px', 
                        margin: 0,
                        fontSize: '0.92rem',
                        fontWeight: '700',
                        color: 'var(--sba-text)'
                    }}
                >
                    {month}월 {day}일 {dayName}요일
                </h1>
                
                <button 
                    onClick={handleNextDay} 
                    className="sba-date-arrow-btn"
                    title="다음 날"
                    style={{
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--sba-text-secondary)', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                        borderRadius: '50%',
                        transition: 'background 0.2s'
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
            </div>
            <div style={{display:'flex', gap:'6px', alignItems: 'center'}}>
                {/* 설정 버튼 */}
                <button className="sba-header-icon" onClick={onOpenSettings} title="설정" style={{width:'32px', height:'32px', padding:0}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </button>

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
        { id: 'bookmarks', icon: ICONS.bookmarks, label: '기록' },
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
            <p style={{margin: '0 0 4px'}}>Developed by <b>leewish</b></p>
            <p style={{margin: '0 0 4px'}}>문의 및 피드백: <a href="mailto:lekas1217@gmail.com" style={{color: 'var(--sba-text-muted)', textDecoration:'underline'}}>lekas1217@gmail.com</a></p>
        </footer>
    );
}



// ==========================================
// 0. 말씀 뷰어 관련 styled-components
// ==========================================
const VerseTitle = styled.h2`
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--sba-verse-title);
  margin-bottom: 24px;
  margin-top: 10px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--sba-border-strong);
  text-align: left;
`;

const VerseContainer = styled.div`
  font-family: 'Noto Serif KR', serif;
`;

const VerseBlock = styled.div`
  margin-bottom: 12px;
  padding: 8px;
  border-radius: 8px;
  line-height: 1.9;
  letter-spacing: -0.02em;
  font-family: 'Noto Serif KR', serif;
  color: var(--sba-verse-text);
  font-size: var(--sba-bible-font-size, 1.1rem);
  text-align: left; 
  word-break: break-all;
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  transition: background-color 0.2s;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    background-color: var(--sba-card-active);
  }
  
  &.highlighted {
    background-color: var(--sba-highlight);
    &:hover {
      background-color: var(--sba-highlight-hover);
    }
  }
  
  &.focused {
    background-color: var(--sba-card-active);
    &.highlighted {
      background-color: var(--sba-highlight-hover);
    }
  }
`;

const VerseNumber = styled.div`
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
`;

const VerseText = styled.div`
  flex: 1;
`;

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
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 600px;
  
  background: var(--sba-modal-bg, #ffffff);
  border-top: 1px solid var(--sba-border-strong, #dddddd);
  border-left: 1px solid var(--sba-border-strong, #dddddd);
  border-right: 1px solid var(--sba-border-strong, #dddddd);
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.12);
  
  height: ${props => props.$isExpanded ? '360px' : '0px'};
  z-index: 100;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  transition: height 0.25s cubic-bezier(0.16, 1, 0.3, 1);
`;

const MemoFloatingButton = styled.button`
  position: fixed;
  bottom: calc(102px + env(safe-area-inset-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  z-index: 95;
  
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid var(--sba-border-strong, #dddddd);
  background: var(--sba-modal-bg, #ffffff);
  color: var(--sba-text, #111827);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(8px);
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  
  &:hover {
    transform: translateX(-50%) translateY(-3px) scale(1.05);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.16);
    background: var(--sba-card-sub-bg, #f3f4f6);
  }
  
  &:active {
    transform: translateX(-50%) translateY(0) scale(0.95);
  }
  
  animation: sba-memo-bounce-in 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, sba-memo-pulse 2.5s infinite;
  
  @keyframes sba-memo-bounce-in {
    0% {
      transform: translateX(-50%) translateY(30px) scale(0.8);
      opacity: 0;
    }
    70% {
      transform: translateX(-50%) translateY(-4px) scale(1.03);
      opacity: 0.9;
    }
    100% {
      transform: translateX(-50%) translateY(0) scale(1);
      opacity: 1;
    }
  }
  
  @keyframes sba-memo-pulse {
    0% {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }
    50% {
      box-shadow: 0 4px 20px var(--sba-border-strong, rgba(0, 0, 0, 0.25));
    }
    100% {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }
  }
`;

const SheetHandleBar = styled.div`
  width: 40px;
  height: 4px;
  background: var(--sba-border-strong, #cccccc);
  border-radius: 2px;
  margin: 10px auto 4px;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: var(--sba-text-muted, #999999);
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

function NoteEditor({ targetDate, session }) {
  const [content, setContent] = useState('');
  const contentRef = useRef(content);
  const [saveStatus, setSaveStatus] = useState('저장 완료');
  const [isExpanded, setIsExpanded] = useState(false);
  const timerRef = useRef(null);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  const dateStr = safeToISODateString(targetDate);

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
        .select('content, updated_at')
        .eq('user_id', session.user.id)
        .eq('target_date', dateStr)
        .single()
        .then(({ data, error }) => {
          if (data && !isDirtyRef.current) {
            let localTime = 0;
            try {
              const raw = localStorage.getItem('sba_qt_notes');
              if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed[dateStr] && parsed[dateStr].updated_at) {
                  localTime = new Date(parsed[dateStr].updated_at).getTime();
                }
              }
            } catch (e) {
              console.error(e);
            }

            const cloudTime = new Date(data.updated_at || 0).getTime();
            if (cloudTime >= localTime) {
              setContent(data.content || '');
              try {
                const raw = localStorage.getItem('sba_qt_notes');
                const parsed = raw ? JSON.parse(raw) : {};
                if (!data.content || data.content.trim() === '') {
                  delete parsed[dateStr];
                } else {
                  parsed[dateStr] = {
                    content: data.content,
                    updated_at: data.updated_at || new Date().toISOString()
                  };
                }
                localStorage.setItem('sba_qt_notes', JSON.stringify(parsed));
              } catch (e) {
                console.error(e);
              }
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
        content: text || '',
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
        if (!text || text.trim() === '') {
          const { error } = await supabase
            .from('qt_notes')
            .delete()
            .eq('user_id', session.user.id)
            .eq('target_date', dateStr);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('qt_notes')
            .upsert({
              user_id: session.user.id,
              target_date: dateStr,
              content: text,
              updated_at: now
            }, { onConflict: 'user_id,target_date' });
          if (error) throw error;
        }
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
    const handleBeforeUnload = () => {
      if (isDirtyRef.current) {
        const text = contentRef.current;
        const now = new Date().toISOString();
        try {
          const raw = localStorage.getItem('sba_qt_notes');
          const parsed = raw ? JSON.parse(raw) : {};
          parsed[dateStr] = {
            content: text || '',
            updated_at: now
          };
          localStorage.setItem('sba_qt_notes', JSON.stringify(parsed));
        } catch (e) {
          console.error(e);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (isDirtyRef.current) {
        saveNote(contentRef.current);
      }
    };
  }, [dateStr]);

  const handleBlur = (e) => {
    if (isDirtyRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      saveNote(e.target.value);
    }
  };

  return (
    <>
      {!isExpanded && (
        <MemoFloatingButton onClick={() => setIsExpanded(true)} className="sba-memo-float-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}>
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          오늘의 메모
        </MemoFloatingButton>
      )}

      {isExpanded && <DrawerOverlay onClick={() => setIsExpanded(false)} />}

      <DrawerContainer $isExpanded={isExpanded}>
        <SheetHandleBar onClick={() => setIsExpanded(false)} />
        <DrawerHeader>
          <HeaderTitle>
            오늘의 메모
            <StatusBadge>{saveStatus}</StatusBadge>
          </HeaderTitle>
          <button 
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--sba-text-secondary)', padding: '4px' }} 
            onClick={() => setIsExpanded(false)}
          >
            ✕
          </button>
        </DrawerHeader>
        <TextareaWrapper>
          <StyledTextarea
            className="sba-note-textarea"
            placeholder="오늘 말씀에서 깨달은 은혜와 묵상 내용을 기록해 보세요..."
            value={content}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </TextareaWrapper>
      </DrawerContainer>
    </>
  );
}

// ==========================================
// 2. 말씀 구절 하이라이트 / 북마크 팝업 매니저 헬퍼
// ==========================================
const FloatingBar = styled.div`
  position: fixed;
  bottom: calc(102px + env(safe-area-inset-bottom, 0px));
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

    let textToCopy = "";
    if (vNums.length === 1) {
      textToCopy = selectedVerses[vNums[0]].trim();
    } else {
      const fullName = SHORT_TO_FULL[book] || book;
      const rangeStr = `${vNums[0]}~${vNums[vNums.length - 1]}`;
      const sortedTexts = vNums.map(v => `${v} ${selectedVerses[v].trim()}`).join('\n');
      textToCopy = `[${fullName} ${chapter}:${rangeStr}]\n${sortedTexts}`;
    }

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
      <VerseTitle>{fullName} {chapter}장</VerseTitle>
      <VerseContainer className="serif-text">
        {Object.entries(verses).map(([vNum, text]) => {
          const bookmarked = isBookmarked(vNum);
          const isFocused = !!selectedVerses[vNum];
          const elementId = `verse-${book}-${chapter}-${vNum}`;

          return (
            <VerseBlock 
              id={elementId}
              key={vNum}
              className={`${bookmarked ? 'highlighted' : ''} ${isFocused ? 'focused' : ''}`}
              onClick={() => handleVerseClick(vNum, text)}
            >
              <VerseNumber>{vNum}</VerseNumber>
              <VerseText>{text}</VerseText>
            </VerseBlock>
          );
        })}
      </VerseContainer>

      {selectedCount > 0 && (
        <FloatingBar className="sba-floating-bar">
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
        dateStr={safeToISODateString(todayPlan.dateObj)}
        session={session}
        addToast={addToast}
        onBookmarkChange={onBookmarkChange}
      />
      <NoteEditor 
        targetDate={todayPlan.dateObj} 
        session={session} 
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
            dateStr={safeToISODateString(todayPlan.dateObj)}
            session={session}
            addToast={addToast}
            onBookmarkChange={onBookmarkChange}
          />
        </div>
      ))}
      <NoteEditor 
        targetDate={todayPlan.dateObj} 
        session={session} 
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

function BookmarkDetailModal({ bookmark, onClose, onSaveMemo, onDelete, onGoToVerse, onMakeCard, addToast }) {
  const [memoText, setMemoText] = useState(bookmark.memo || '');

  const handleImportTodayMemo = () => {
    const todayStr = safeToISODateString(getEffectiveDate());
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

        <div style={{ marginBottom: '16px' }}>
          <button 
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              border: '1px solid var(--sba-border-strong)', 
              background: 'var(--sba-card-sub-bg)', 
              color: 'var(--sba-text)', 
              fontWeight: '600', 
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onClick={() => onMakeCard(bookmark)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            말씀 카드 제작
          </button>
        </div>

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

const RecordToggleContainer = styled.div`
  display: flex;
  background: var(--sba-card-sub-bg, #f3f4f6);
  padding: 4px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid var(--sba-border-strong, #e5e7eb);
`;

const RecordToggleButton = styled.button`
  flex: 1;
  background: ${props => props.$active ? 'var(--sba-card-bg, #ffffff)' : 'transparent'};
  color: ${props => props.$active ? 'var(--sba-text, #111827)' : 'var(--sba-text-secondary, #4b5563)'};
  border: none;
  padding: 8px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: ${props => props.$active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: ${props => props.$active ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'};
  
  &:hover {
    color: var(--sba-text);
  }
`;

function TabBookmarks({ session, onOpenAuthModal, onNavigateToVerse, updateTrigger, addToast }) {
  const [subTab, setSubTab] = useState('bookmarks'); // 'bookmarks' or 'sharings'
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookmark, setSelectedBookmark] = useState(null);

  // 나의 나눔 데이터
  const [myReflections, setMyReflections] = useState([]);
  const [loadingReflections, setLoadingReflections] = useState(false);

  // 말씀 카드 관련 상태
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [activeCardBookmark, setActiveCardBookmark] = useState(null);

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

  const loadMyReflections = async () => {
    if (!session) return;
    setLoadingReflections(true);
    try {
      const { data, error } = await supabase
        .from('qt_shared_reflections')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyReflections(data || []);
    } catch (err) {
      console.error(err);
      if (addToast) addToast('내 나눔 기록을 불러오지 못했습니다.');
    } finally {
      setLoadingReflections(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, [updateTrigger]);

  useEffect(() => {
    if (subTab === 'sharings' && session) {
      loadMyReflections();
    }
  }, [subTab, session]);

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

      const { data: { session: activeSession } } = await supabase.auth.getSession();
      if (activeSession) {
        await supabase
          .from('qt_bookmarks')
          .delete()
          .eq('user_id', activeSession.user.id)
          .eq('book', b.book)
          .eq('chapter', b.chapter)
          .eq('verse', b.verse)
          .eq('verses', b.verses || null);
      }
    }
  };

  const handleDeleteReflection = async (id) => {
    if (!confirm('정말로 이 나눔 기록을 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase
        .from('qt_shared_reflections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (addToast) addToast('나눔 기록이 삭제되었습니다.');
      setMyReflections(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      alert('삭제 실패: ' + err.message);
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
      
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      if (activeSession) {
        await supabase
          .from('qt_bookmarks')
          .update({ memo: newMemo })
          .eq('user_id', activeSession.user.id)
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

  const handleMakeCard = (b) => {
    const versesObj = {};
    if (b.verseTextList) {
      b.verseTextList.forEach(item => {
        versesObj[item.vNum] = item.text;
      });
    }
    const fullName = SHORT_TO_FULL[b.book] || b.book;
    let rangeStr = `${b.verse}`;
    if (b.verses && b.verses.includes(',')) {
      const list = b.verses.split(',');
      rangeStr = `${list[0]}~${list[list.length - 1]}`;
    }
    setActiveCardBookmark({
      passage: `${fullName} ${b.chapter}:${rangeStr}`,
      verses: versesObj
    });
    setCardModalOpen(true);
  };

  const formatDateTime = (isoString) => {
    const d = new Date(isoString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
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

  return (
    <div className="sba-tab-content">
      <RecordToggleContainer>
        <RecordToggleButton 
          $active={subTab === 'bookmarks'} 
          onClick={() => setSubTab('bookmarks')}
        >
          내 북마크
        </RecordToggleButton>
        <RecordToggleButton 
          $active={subTab === 'sharings'} 
          onClick={() => setSubTab('sharings')}
        >
          나눔 기록
        </RecordToggleButton>
      </RecordToggleContainer>

      {subTab === 'bookmarks' ? (
        <>
          <BookmarkSearchWrapper>
            <StyledInput 
              type="text" 
              placeholder="성경 구절명, 말씀 텍스트, 메모 검색..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </BookmarkSearchWrapper>

          {loading ? (
            <div className="sba-loading">북마크 리스트를 로드 중...</div>
          ) : filteredBookmarks.length === 0 ? (
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
                  <SpotlightCard
                    key={`${b.book}-${b.chapter}-${b.verse}-${idx}`}
                    className="sba-bookmark-item"
                    style={{ padding: 0, overflow: 'hidden', display: 'block' }}
                  >
                    <div 
                      onClick={() => setSelectedBookmark(b)}
                      style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', textAlign: 'left' }}
                    >
                      <div className="sba-bookmark-info" style={{ flex: 1 }}>
                        <span className="sba-bookmark-name">{fullName} {b.chapter}장 {rangeStr}절</span>
                        <span className="sba-bookmark-snippet">{b.text}</span>
                        {b.memo && <span className="sba-bookmark-snippet" style={{ color: 'var(--sba-text-secondary)', fontStyle: 'italic', marginTop: '4px', borderLeft: '2px solid var(--sba-border-strong)', paddingLeft: '6px' }}>[메모] {b.memo}</span>}
                      </div>
                      <button 
                        className="sba-bookmark-delete-btn" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(b);
                        }}
                        style={{ marginLeft: '12px', flexShrink: 0 }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      </button>
                    </div>
                  </SpotlightCard>
                );
              })}
            </div>
          )}
        </>
      ) : (
        // 나눔 기록
        !session ? (
          <GuestNotice onClick={onOpenAuthModal} style={{ marginTop: '10px' }}>
            나눔 기록은 로그인이 필요한 기능입니다.<br />
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', textDecoration: 'underline' }}>
              <ShinyText 
                text="소셜 로그인으로 1초 만에 로그인하기" 
                speed="2s" 
                baseColor="var(--sba-primary-light, #ff8c42)" 
                shineColor="var(--sba-primary, #ef4444)" 
              />
            </span>
          </GuestNotice>
        ) : loadingReflections ? (
          <div className="sba-loading">내 나눔 기록을 불러오는 중...</div>
        ) : myReflections.length === 0 ? (
          <div className="sba-empty-state">아직 공유한 묵상 나눔 기록이 없습니다. 나눔 탭에서 오늘의 묵상을 지체들과 나누어 보세요!</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {myReflections.map(r => (
              <SpotlightCard
                key={r.id}
                style={{
                  background: 'var(--sba-card-bg)',
                  border: '1px solid var(--sba-border-strong)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}
              >
                <div 
                  style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    textAlign: 'left',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--sba-text-secondary)', fontWeight: 'bold' }}>
                      {r.passage}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--sba-text-muted)' }}>
                      {formatDateTime(r.created_at)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--sba-text)', whiteSpace: 'pre-wrap', lineHeight: '1.5', paddingRight: '24px' }}>
                    {r.content}
                  </div>
                  <button 
                    onClick={() => handleDeleteReflection(r.id)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      bottom: '12px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--sba-text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px',
                      zIndex: 3
                    }}
                    title="삭제"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </SpotlightCard>
            ))}
          </div>
        )
      )}

      {selectedBookmark && (
        <BookmarkDetailModal
          bookmark={selectedBookmark}
          onClose={() => setSelectedBookmark(null)}
          onSaveMemo={handleSaveMemo}
          onDelete={() => handleDelete(selectedBookmark)}
          onGoToVerse={onNavigateToVerse}
          onMakeCard={handleMakeCard}
          addToast={addToast}
        />
      )}

      {cardModalOpen && activeCardBookmark && (
        <ImageCardModal
          isOpen={cardModalOpen}
          onClose={() => {
            setCardModalOpen(false);
            setActiveCardBookmark(null);
          }}
          passage={activeCardBookmark.passage}
          verses={activeCardBookmark.verses}
        />
      )}
    </div>
  );
}

// ==========================================
// 6. SharingTab (자체 묵상 나눔 피드 및 댓글 피드 + 관리자 삭제 지원) - shadcn/ui 스타일 적용
// ==========================================
const FeedCard = styled(SpotlightCard)`
  background: var(--sba-card-bg);
  border: 1px solid var(--sba-border-strong);
  border-radius: 8px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02);
`;

const FeedCardInner = styled.div`
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  
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
                      [메모] {b.memo}
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

// ==========================================
const SharingCard = styled.div`
  background: var(--sba-card-bg);
  border: 1px solid var(--sba-border-strong);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
`;

function SharingTab({ session, onOpenAuthModal, addToast, isDark, userChurch }) {
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

  const isAdmin = userChurch?.role === 'admin' || session?.user?.email === 'lekas1217@gmail.com';

  const getTodayDateStr = () => {
    return safeToISODateString(getEffectiveDate());
  };

  const todayStr = getTodayDateStr();

  const loadReflections = async () => {
    if (!userChurch) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('qt_shared_reflections')
        .select('*')
        .eq('church_id', userChurch.id)
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
  }, [session, userChurch]);

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
    if (!userChurch) {
      addToast('소속된 교회가 없습니다.');
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
          church_id: userChurch.id,
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
            묵상 나눔은 로그인이 필요한 기능입니다.<br />
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', textDecoration: 'underline' }}>
              <ShinyText 
                text="소셜 로그인으로 1초 만에 로그인하기" 
                speed="2s" 
                baseColor="var(--sba-primary-light, #ff8c42)" 
                shineColor="var(--sba-primary, #ef4444)" 
              />
            </span>
          </GuestNotice>
        ) : (
          <form onSubmit={handleSubmitReflection} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              <StyledInput 
                type="text" 
                placeholder="예: 마태복음 1:1"
                value={passage}
                onChange={e => setPassage(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <OutlinedButton 
                  type="button" 
                  onClick={() => setIsBookmarkSelectOpen(true)}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  북마크에서 선택
                </OutlinedButton>
                <OutlinedButton 
                  type="button" 
                  onClick={handleImportMemo}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  내 메모 긁어오기
                </OutlinedButton>
              </div>
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
                <FeedCardInner>
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
                          style={{ background: 'none', border: 'none', color: 'var(--sba-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', zIndex: 3 }}
                          title="삭제"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
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
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={hasLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                      <span>{likeCount}</span>
                    </ActionButton>
                    
                    <ActionButton 
                      onClick={() => setActiveCommentId(activeCommentId === r.id ? null : r.id)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
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
                                    style={{ background: 'none', border: 'none', color: 'var(--sba-text-secondary)', cursor: 'pointer', fontSize: '0.75rem', padding: 0, display: 'flex', alignItems: 'center' }}
                                    title="댓글 삭제"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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
                </FeedCardInner>
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
// ==========================================
// 7. ImageCardModal (말씀 이미지 카드 생성 및 공유/다운로드 모달)
// ==========================================
function ImageCardModal({ isOpen, onClose, passage, verses }) {
  const [activeTheme, setActiveTheme] = useState('hanji');
  const [cardRatio, setCardRatio] = useState('4/5'); // '4/5' or '9/16'
  const cardRef = useRef(null);
  
  if (!isOpen) return null;

  // 모든 선택된 구절을 가져와서 렌더링 텍스트 구성
  let verseText = "말씀 데이터를 불러올 수 없습니다.";
  if (verses) {
    const verseList = Object.entries(verses);
    if (verseList.length > 0) {
      // 절 번호 제거하고 순수 구절 내용만 결합
      verseText = verseList.map(([num, text]) => text.trim()).join(' ');
    }
  }

  // 종이 질감 테마 정의
  const themes = {
    hanji: {
      name: '한지',
      bgColor: '#FAF8F5',
      textColor: '#2C2A29',
      metaColor: '#78716C',
      borderColor: '#D4CFC9',
      noiseOpacity: 0.08
    },
    parchment: {
      name: '양피지',
      bgColor: '#F4EFE6',
      textColor: '#3D332D',
      metaColor: '#8C7E6C',
      borderColor: '#C8BCA6',
      noiseOpacity: 0.12
    },
    craft: {
      name: '크래프트',
      bgColor: '#E5D3B3',
      textColor: '#4A3B32',
      metaColor: '#7D6A5A',
      borderColor: '#BBA888',
      noiseOpacity: 0.15
    },
    canvas: {
      name: '캔버스',
      bgColor: '#EAE8E4',
      textColor: '#2E3033',
      metaColor: '#6B6F73',
      borderColor: '#C5C2BD',
      noiseOpacity: 0.10
    }
  };

  const currentTheme = themes[activeTheme] || themes.hanji;

  // 글자 수에 비례하여 동적으로 폰트 크기 계산 (안 잘리고 다 들어가도록 자동 조절)
  const getFontSize = (text) => {
    const len = text.length;
    if (len < 50) return '1.05rem';
    if (len < 100) return '0.92rem';
    if (len < 180) return '0.80rem';
    if (len < 260) return '0.72rem';
    return '0.65rem';
  };

  const fontSize = getFontSize(verseText);

  // 일반 다운로드 함수 (Fallback용)
  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2, // 해상도 업 스케일링
      });
      const link = document.createElement('a');
      link.download = `SBA_QT_${passage.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('다운로드 중 에러 발생:', e);
      alert('이미지 생성에 실패했습니다.');
    }
  };

  // Web Share API를 사용한 공유 기능 (파일 공유)
  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          handleDownload();
          return;
        }

        const file = new File([blob], `SBA_QT_${passage.replace(/\s+/g, '_')}.png`, { type: 'image/png' });
        
        // 공유 가능한지 체크
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: '오늘의 말씀 카드',
              text: `${passage} 말씀`
            });
          } catch (shareErr) {
            // 사용자가 취소한 게 아니라면 다운로드로 폴백
            if (shareErr.name !== 'AbortError') {
              console.warn('Web Share API 호출 에러, 이미지 다운로드로 전환:', shareErr);
              handleDownload();
            }
          }
        } else {
          // Web Share API 미지원 시 다운로드 실행
          handleDownload();
        }
      }, 'image/png');
    } catch (e) {
      console.error('공유 중 에러 발생:', e);
      handleDownload();
    }
  };

  return (
    <DetailModalOverlay onClick={onClose} style={{ zIndex: 130 }}>
      {/* SVG 노이즈 필터 정의 */}
      <svg style={{ display: 'none' }}>
        <filter id="card-paper-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.07 0" />
          <feComposite operator="in" in2="SourceGraphic" />
          <feBlend mode="multiply" in="SourceGraphic" in2="noise" />
        </filter>
      </svg>

      <DetailModalContent onClick={e => e.stopPropagation()} style={{maxWidth: '420px', padding: '20px'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{marginTop: 0, marginBottom: 0, fontSize: '1rem', fontWeight: 'bold'}}>말씀 카드 제작</h3>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--sba-text-muted)' }} onClick={onClose}>✕</button>
        </div>
        
        {/* 카드 영역 */}
        <div 
          ref={cardRef} 
          style={{
            backgroundColor: currentTheme.bgColor,
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4), rgba(0,0,0,0.01)),
              url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='${currentTheme.noiseOpacity}'/%3E%3C/svg%3E")
            `,
            padding: cardRatio === '9/16' ? '64px 36px' : '48px 40px',
            borderRadius: '12px',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            aspectRatio: cardRatio === '9/16' ? '9 / 16' : '4 / 5',
            maxHeight: '65vh',
            height: 'auto',
            width: '100%',
            maxWidth: cardRatio === '9/16' ? 'calc(65vh * 9 / 16)' : '100%',
            margin: '0 auto',
            color: currentTheme.textColor,
            fontFamily: "'Noto Serif KR', 'Nanum Myeongjo', 'Georgia', serif",
            position: 'relative',
            overflow: 'hidden',
            border: `1px solid ${currentTheme.borderColor}`,
            boxSizing: 'border-box'
          }}
        >
          {/* 장식용 프레임 라인 */}
          <div style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            right: '24px',
            bottom: '24px',
            border: `1px solid ${currentTheme.borderColor}`,
            opacity: 0.5,
            pointerEvents: 'none'
          }} />

          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '2px', opacity: 0.6, color: currentTheme.metaColor, textAlign: 'center', zIndex: 1 }}>
            SBA QT
          </div>
          
          <div style={{ margin: '20px 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
            <p style={{ 
              fontSize: fontSize, 
              lineHeight: '1.65', 
              margin: '0 0 8px 0', 
              fontWeight: '500', 
              wordBreak: 'keep-all', 
              textAlign: 'center',
              whiteSpace: 'pre-wrap'
            }}>
              “ {verseText} ”
            </p>
            <div style={{
              fontSize: '0.9rem',
              fontWeight: '600',
              color: currentTheme.textColor,
              opacity: 0.8,
              textAlign: 'center',
              marginTop: '8px',
              fontStyle: 'italic'
            }}>
              - {passage} -
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${currentTheme.borderColor}`, paddingTop: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1, opacity: 0.9 }}>
            <span style={{ fontSize: '0.7rem', color: currentTheme.metaColor, letterSpacing: '1px' }}>
              서울북부교회 청년회
            </span>
          </div>
        </div>

        {/* 비율 선택 토글 */}
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <button
            onClick={() => setCardRatio('4/5')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--sba-border-strong)',
              background: cardRatio === '4/5' ? 'var(--sba-text)' : 'var(--sba-card-sub-bg)',
              color: cardRatio === '4/5' ? 'var(--sba-bg)' : 'var(--sba-text)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            4:5 (기본)
          </button>
          <button
            onClick={() => setCardRatio('9/16')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--sba-border-strong)',
              background: cardRatio === '9/16' ? 'var(--sba-text)' : 'var(--sba-card-sub-bg)',
              color: cardRatio === '9/16' ? 'var(--sba-bg)' : 'var(--sba-text)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            9:16 (인스타 스토리)
          </button>
        </div>

        {/* 테마 셀렉터 */}
        <div style={{marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '16px'}}>
          {Object.entries(themes).map(([key, t]) => (
            <button 
              key={key}
              onClick={() => setActiveTheme(key)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: activeTheme === key ? '2px solid var(--sba-text)' : '1px solid var(--sba-border-strong)',
                background: t.bgColor,
                color: t.textColor,
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '600',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.2s'
              }}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* 하단 버튼 */}
        <div style={{display: 'flex', gap: '8px', marginTop: '20px'}}>
          <SolidButton style={{flex: 1, marginTop: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'}} onClick={handleShare}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            공유
          </SolidButton>
          <OutlinedButton style={{flex: 1, padding: '10px 16px', fontSize: '0.875rem', marginTop: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--sba-card-sub-bg)'}} onClick={handleDownload}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            저장
          </OutlinedButton>
        </div>
      </DetailModalContent>
    </DetailModalOverlay>
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
  backdrop-filter: blur(8px);
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
  max-height: 85vh;
  overflow-y: auto;
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
  padding: 10px 12px;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
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
                        <SpotlightCard 
                            key={dKey} 
                            className={`sba-weekly-card ${isSelected ? 'today' : ''}`}
                            onClick={() => onCardClick(plan.dateObj)}
                        >
                            <div className="sba-weekly-card-header">
                                <span>[{plan.dayName[0]}] {dKey}</span>
                                <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
                                    {hasNote && (
                                        <span title="메모 작성됨" style={{ display: 'flex', alignItems: 'center' }}>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--sba-text-secondary)' }}>
                                                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                                            </svg>
                                        </span>
                                    )}
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
                        </SpotlightCard>
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

const SettingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 8px 0;
  border-bottom: 1px solid var(--sba-border);
`;

const SettingLabel = styled.span`
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--sba-text);
`;

const SettingControl = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SwitchContainer = styled.label`
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 44px;
  height: 24px;
  cursor: pointer;
  user-select: none;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
`;

const SwitchSlider = styled.span`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: ${props => props.$checked ? 'var(--sba-text)' : 'var(--sba-border-strong)'};
  border: 1px solid ${props => props.$checked ? 'var(--sba-text)' : 'var(--sba-border-strong)'};
  transition: background-color 0.2s ease, border-color 0.2s ease;
  border-radius: 9999px;
  
  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 2px;
    bottom: 2px;
    background-color: var(--sba-bg);
    border-radius: 50%;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    transform: ${props => props.$checked ? 'translateX(20px)' : 'translateX(0)'};
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
`;

const FontSizeBtn = styled.button`
  background: var(--sba-card-sub-bg);
  border: 1px solid var(--sba-border-strong);
  color: var(--sba-text);
  font-size: 0.9rem;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  
  &:hover {
    background: var(--sba-border);
  }
`;

const FontSizeVal = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  min-width: 48px;
  text-align: center;
`;

function SettingsModal({ isOpen, onClose, isDark, setIsDark, addToast, session, userChurch, setUserChurch, scheduleData, loadSchedule }) {
    const [activeSubTab, setActiveSubTab] = useState('settings'); // 'settings' | 'admin_generate' | 'admin_edit'
    const [syncing, setSyncing] = useState(false);
    const [stats, setStats] = useState({ bookmarks: 0, notes: 0 });
    const [fontSize, setFontSize] = useState(() => {
        const saved = localStorage.getItem('sba_bible_font_size');
        return saved ? parseFloat(saved) : 17.6;
    });

    // 알림 설정 상태 정의
    const [alarmEnabled, setAlarmEnabled] = useState(() => {
        return localStorage.getItem('sba_qt_alarm_enabled') === 'true';
    });
    const [alarmTime, setAlarmTime] = useState(() => {
        return localStorage.getItem('sba_qt_alarm_time') || '08:00';
    });
    const [isTesting, setIsTesting] = useState(false);

    const [alarmHour, alarmMinute] = alarmTime.split(':');

    // 1. 일정 자동 생성용 상태
    const [genStartDate, setGenStartDate] = useState(safeToISODateString(getEffectiveDate()));
    const [genStartBook, setGenStartBook] = useState('GEN');
    const [genStartChap, setGenStartChap] = useState(1);
    const [genEndBook, setGenEndBook] = useState('REV');
    const [genEndChap, setGenEndChap] = useState(22);
    const [genPagesPerDay, setGenPagesPerDay] = useState(1);
    const [genExcludeDays, setGenExcludeDays] = useState([0]); // 기본 일요일 제외

    // 2. 일정 수동 수정용 상태
    const [editDate, setEditDate] = useState(safeToISODateString(getEffectiveDate()));
    const [editQtBook, setEditQtBook] = useState('');
    const [editQtStartChap, setEditQtStartChap] = useState(1);
    const [editQtStartVerse, setEditQtStartVerse] = useState(1);
    const [editQtEndChap, setEditQtEndChap] = useState(1);
    const [editQtEndVerse, setEditQtEndVerse] = useState(30);
    const [editQtTitle, setEditQtTitle] = useState('');
    const [editReadingBook, setEditReadingBook] = useState('');
    const [editReadingStartChap, setEditReadingStartChap] = useState(1);
    const [editReadingEndChap, setEditReadingEndChap] = useState(1);

    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const isAdmin = userChurch?.role === 'admin';

    const changeFontSize = (delta) => {
        setFontSize(prev => {
            const next = Math.min(30, Math.max(12, prev + delta));
            localStorage.setItem('sba_bible_font_size', next.toFixed(1));
            document.documentElement.style.setProperty('--sba-bible-font-size', `${next.toFixed(1)}px`);
            return next;
        });
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

    const checkPushSubscriptionStatus = async () => {
        if (!('serviceWorker' in navigator)) return;
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                setAlarmEnabled(true);
                localStorage.setItem('sba_qt_alarm_enabled', 'true');
                if (session) {
                    const { data, error } = await supabase
                        .from('qt_push_subscriptions')
                        .select('alarm_time')
                        .eq('endpoint', sub.endpoint)
                        .maybeSingle();
                    if (!error && data) {
                        setAlarmTime(data.alarm_time);
                        localStorage.setItem('sba_qt_alarm_time', data.alarm_time);
                    }
                }
            } else {
                setAlarmEnabled(false);
                localStorage.setItem('sba_qt_alarm_enabled', 'false');
            }
        } catch (e) {
            console.error('푸시 상태 감지 실패:', e);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadStats();
            setActiveSubTab('settings');
            if (session) {
                checkPushSubscriptionStatus();
            }
        }
    }, [isOpen, session]);

    // 날짜 변경 시 해당 날짜의 일정을 찾아서 수동 폼 채우기
    useEffect(() => {
        if (scheduleData && editDate) {
            const row = scheduleData.find(s => s.date === editDate);
            if (row) {
                setEditQtBook(row.qt_book || '');
                setEditQtStartChap(row.qt_start_chap || 1);
                setEditQtStartVerse(row.qt_start_verse || 1);
                setEditQtEndChap(row.qt_end_chap || 1);
                setEditQtEndVerse(row.qt_end_verse || 30);
                setEditQtTitle(row.qt_title || '');
                setEditReadingBook(row.reading_book || '');
                setEditReadingStartChap(row.reading_start_chap || 1);
                setEditReadingEndChap(row.reading_end_chap || 1);
            } else {
                setEditQtBook('');
                setEditQtStartChap(1);
                setEditQtStartVerse(1);
                setEditQtEndChap(1);
                setEditQtEndVerse(30);
                setEditQtTitle('');
                setEditReadingBook('');
                setEditReadingStartChap(1);
                setEditReadingEndChap(1);
            }
        }
    }, [editDate, scheduleData]);

    const handleAlarmToggle = async (e) => {
        const checked = e.target.checked;
        if (!('serviceWorker' in navigator)) {
            alert('이 브라우저는 웹 알림 기능을 지원하지 않습니다.');
            return;
        }

        if (checked) {
            try {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    alert('알림 권한이 거부되었습니다. 브라우저 설정에서 알림 권한을 허용해 주세요.');
                    return;
                }

                const reg = await navigator.serviceWorker.ready;
                const publicVapidKey = 'BBRULQ6u9snBnV2LAfyu410fLl9Hhcc9VyE70wkgeEdeYjYCewDSPJ_t19oK_AzVtLDVBUYNc8YjuVb-B5sx8TQ';
                const subscription = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
                });

                const subJson = subscription.toJSON();
                const p256dh = subJson.keys?.p256dh || '';
                const auth = subJson.keys?.auth || '';

                const { error } = await supabase
                    .from('qt_push_subscriptions')
                    .upsert({
                        user_id: session ? session.user.id : null,
                        endpoint: subscription.endpoint,
                        p256dh: p256dh,
                        auth: auth,
                        alarm_time: alarmTime,
                        church_id: userChurch?.id,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'endpoint' });

                if (error) throw error;

                setAlarmEnabled(true);
                localStorage.setItem('sba_qt_alarm_enabled', 'true');
                addToast('브라우저 푸시 알림이 활성화되었습니다.');
            } catch (err) {
                console.error('푸시 구독 실패:', err);
                alert('푸시 알림 활성화 도중 오류가 발생했습니다: ' + err.message);
            }
        } else {
            try {
                const reg = await navigator.serviceWorker.ready;
                const sub = await reg.pushManager.getSubscription();
                if (sub) {
                    await sub.unsubscribe();
                    await supabase
                        .from('qt_push_subscriptions')
                        .delete()
                        .eq('endpoint', sub.endpoint);
                }
                setAlarmEnabled(false);
                localStorage.setItem('sba_qt_alarm_enabled', 'false');
                addToast('브라우저 푸시 알림이 비활성화되었습니다.');
            } catch (err) {
                console.error('푸시 해제 실패:', err);
            }
        }
    };

    const handleAlarmTimeChange = async (h, m) => {
        const newTime = `${h}:${m}`;
        setAlarmTime(newTime);
        localStorage.setItem('sba_qt_alarm_time', newTime);

        if ('serviceWorker' in navigator) {
            try {
                const reg = await navigator.serviceWorker.ready;
                const sub = await reg.pushManager.getSubscription();
                if (sub) {
                    const { error } = await supabase
                        .from('qt_push_subscriptions')
                        .update({ alarm_time: newTime })
                        .eq('endpoint', sub.endpoint);
                    if (error) throw error;
                }
            } catch (e) {
                console.error('알림 시간 클라우드 동기화 실패:', e);
            }
        }
        addToast(`브라우저 알림 시간이 ${h}시 ${m}분으로 변경되었습니다.`);
    };

    const handleTestNotification = async () => {
        setIsTesting(true);
        try {
            const reg = ('serviceWorker' in navigator) ? await navigator.serviceWorker.ready : null;
            const sub = reg ? await reg.pushManager.getSubscription() : null;
            if (!sub) {
                alert('브라우저 알림 수신이 활성화되어 있어야 테스트가 가능합니다.');
                return;
            }
            
            const reqBody = {
                user_id: session ? session.user.id : null,
                endpoint: sub.endpoint,
                test: true
            };

            const res = await fetch('https://ebfpjvwwbognddixrvyc.supabase.co/functions/v1/send-daily-push', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || ''}`
                },
                body: JSON.stringify(reqBody)
            });

            if (res.ok) {
                addToast('테스트 알림 요청이 전송되었습니다. 잠시 후 기기를 확인해 주세요.');
            } else {
                const errText = await res.text();
                throw new Error(errText || 'Edge Function 응답 실패');
            }
        } catch (err) {
            console.error('테스트 알림 오류:', err);
            alert('테스트 알림 전송에 실패했습니다: ' + err.message);
        } finally {
            setIsTesting(false);
        }
    };

    const handleLeaveChurch = async () => {
        if (!window.confirm(`정말로 '${userChurch?.name}' 교회에서 탈퇴하시겠습니까?`)) return;
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }
            const res = await fetch('/api/churches/leave', {
                method: 'POST',
                headers
            });
            const data = await res.json();
            if (res.ok && data.success) {
                addToast('교회에서 탈퇴 처리되었습니다.');
                setUserChurch(null);
                onClose();
            } else {
                throw new Error(data.error || '탈퇴 실패');
            }
        } catch (err) {
            alert('교회 탈퇴 중 오류가 발생했습니다: ' + err.message);
        }
    };

    // 관리자 일정 자동 생성 요청
    const handleGenerateSchedule = async () => {
        if (!window.confirm('기존 일정이 있는 날짜는 덮어씌워집니다. 계속하시겠습니까?')) return;
        setSyncing(true);
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }
            const res = await fetch('/api/qt-schedule/generate', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    church_id: userChurch.id,
                    start_date: genStartDate,
                    start_book: genStartBook,
                    start_chap: genStartChap,
                    end_book: genEndBook,
                    end_chap: genEndChap,
                    pages_per_day: genPagesPerDay,
                    exclude_days: genExcludeDays
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                addToast(data.message);
                if (loadSchedule) loadSchedule();
                setActiveSubTab('settings');
            } else {
                throw new Error(data.error || '생성 실패');
            }
        } catch (err) {
            alert('일정 자동 생성 실패: ' + err.message);
        } finally {
            setSyncing(false);
        }
    };

    // 관리자 일정 수동 단일 저장 요청
    const handleUpdateSchedule = async () => {
        setSyncing(true);
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }
            const existing = scheduleData?.find(s => s.date === editDate);
            const res = await fetch('/api/qt-schedule/update', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    id: existing?.id || null,
                    church_id: userChurch.id,
                    date: editDate,
                    qt_book: editQtBook || null,
                    qt_start_chap: editQtStartChap || null,
                    qt_start_verse: editQtStartVerse || null,
                    qt_end_chap: editQtEndChap || null,
                    qt_end_verse: editQtEndVerse || null,
                    qt_title: editQtTitle || null,
                    reading_book: editReadingBook || null,
                    reading_start_chap: editReadingStartChap || null,
                    reading_end_chap: editReadingEndChap || null
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                addToast('일정이 성공적으로 저장되었습니다.');
                if (loadSchedule) loadSchedule();
                setActiveSubTab('settings');
            } else {
                throw new Error(data.error || '저장 실패');
            }
        } catch (err) {
            alert('일정 저장 실패: ' + err.message);
        } finally {
            setSyncing(false);
        }
    };

    const handleClearLocalCache = () => {
        if (!window.confirm('로컬 캐시(북마크, 메모)를 모두 초기화하고 화면을 재로드하시겠습니까?')) return;
        localStorage.removeItem('sba_qt_bookmarks');
        localStorage.removeItem('sba_qt_notes');
        localStorage.removeItem('sba_bible_font_size');
        localStorage.removeItem('sba_qt_alarm_enabled');
        localStorage.removeItem('sba_qt_alarm_time');
        localStorage.removeItem('sba_qt_last_notified_date');
        addToast('로컬 데이터가 완전히 초기화되었습니다.');
        window.location.reload();
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', width: '95%' }}>
                {activeSubTab === 'settings' && (
                    <>
                        <ModalHeader>
                            <ModalTitle>설정 (Settings)</ModalTitle>
                            <ModalCloseButton onClick={onClose}>✕</ModalCloseButton>
                        </ModalHeader>
                        
                        {/* 소속 교회 정보 */}
                        {userChurch && (
                            <div style={{ background: 'var(--sba-card-sub-bg)', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--sba-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--sba-text-secondary)', fontWeight: 'bold' }}>소속 교회</span>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--sba-text)', fontWeight: '700' }}>
                                        {userChurch.name} ({userChurch.role === 'admin' ? '관리자' : '지체'})
                                    </span>
                                </div>
                                <ShadButton $variant="outline" onClick={handleLeaveChurch} style={{ flex: 'none', padding: '6px 12px', fontSize: '0.75rem', borderColor: '#ef4444', color: '#ef4444' }}>
                                    탈퇴하기
                                </ShadButton>
                            </div>
                        )}

                        {/* 다크모드 설정 */}
                        <SettingRow>
                            <SettingLabel>다크 테마 (Dark Mode)</SettingLabel>
                            <SettingControl>
                                <SwitchContainer>
                                    <SwitchInput 
                                        type="checkbox" 
                                        checked={isDark} 
                                        onChange={e => setIsDark(e.target.checked)} 
                                    />
                                    <SwitchSlider $checked={isDark} />
                                </SwitchContainer>
                            </SettingControl>
                        </SettingRow>

                        {/* 글자 크기 설정 */}
                        <SettingRow>
                            <SettingLabel>글자 크기 (Font Size)</SettingLabel>
                            <SettingControl>
                                <FontSizeBtn onClick={() => changeFontSize(-1.6)}>A-</FontSizeBtn>
                                <FontSizeVal>{fontSize.toFixed(1)}px</FontSizeVal>
                                <FontSizeBtn onClick={() => changeFontSize(1.6)}>A+</FontSizeBtn>
                            </SettingControl>
                        </SettingRow>

                        {/* 매일 말씀 알림 설정 */}
                        <div style={{ borderTop: '1px dashed var(--sba-border-strong)', paddingTop: '16px', marginTop: '16px' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--sba-text-secondary)', margin: '0 0 12px 0' }}>
                                <b>매일 말씀 알림 설정</b>
                            </p>
                            
                            <div style={{ background: 'var(--sba-card-sub-bg)', padding: '12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid var(--sba-border)' }}>
                                <SettingRow style={{ borderBottom: 'none', padding: '0 0 8px 0', margin: 0 }}>
                                    <SettingLabel style={{ fontSize: '0.85rem' }}>브라우저 알림 수신</SettingLabel>
                                    <SettingControl>
                                        <SwitchContainer>
                                            <SwitchInput 
                                                type="checkbox" 
                                                checked={alarmEnabled} 
                                                onChange={handleAlarmToggle} 
                                            />
                                            <SwitchSlider $checked={alarmEnabled} />
                                        </SwitchContainer>
                                    </SettingControl>
                                </SettingRow>
                                {alarmEnabled && (
                                    <SettingRow style={{ borderBottom: 'none', padding: '8px 0 0 0', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <SettingLabel style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--sba-text-secondary)' }}>알림 시간</SettingLabel>
                                        <SettingControl style={{ gap: '6px' }}>
                                            <select 
                                                value={alarmHour} 
                                                onChange={(e) => handleAlarmTimeChange(e.target.value, alarmMinute)}
                                                style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--sba-border-strong)',
                                                    background: 'var(--sba-card-bg)',
                                                    color: 'var(--sba-text)',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                {Array.from({ length: 24 }).map((_, i) => {
                                                    const h = String(i).padStart(2, '0');
                                                    return <option key={h} value={h}>{h}시</option>;
                                                })}
                                            </select>
                                            <select 
                                                value={alarmMinute} 
                                                onChange={(e) => handleAlarmTimeChange(alarmHour, e.target.value)}
                                                style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--sba-border-strong)',
                                                    background: 'var(--sba-card-bg)',
                                                    color: 'var(--sba-text)',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                {Array.from({ length: 12 }).map((_, i) => {
                                                    const m = String(i * 5).padStart(2, '0');
                                                    return <option key={m} value={m}>{m}분</option>;
                                                })}
                                            </select>
                                        </SettingControl>
                                    </SettingRow>
                                )}
                                <p style={{ fontSize: '0.7rem', color: 'var(--sba-text-muted)', margin: '6px 0 0 0', lineHeight: '1.4' }}>
                                    ※ 화면이 꺼져도 수신됩니다. iOS는 '홈 화면에 추가(PWA)'한 경우에만 수신 가능합니다.
                                </p>
                            </div>

                            {/* 알림 즉시 테스트 버튼 */}
                            {alarmEnabled && (
                                <button 
                                    onClick={handleTestNotification}
                                    disabled={isTesting}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        fontSize: '0.85rem',
                                        border: '1px solid var(--sba-border-strong)',
                                        borderRadius: '8px',
                                        background: 'transparent',
                                        color: 'var(--sba-text)',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        transition: 'background-color 0.2s',
                                        marginTop: '4px'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--sba-card-sub-bg)'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    {isTesting ? '테스트 발송 중...' : '알림 즉시 테스트하기'}
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--sba-text-secondary)', margin: '16px 0 8px', borderTop: '1px solid var(--sba-border)', paddingTop: '12px' }}>
                            <span>북마크: {stats.bookmarks}개 | 메모: {stats.notes}개</span>
                            <DeleteTextButton style={{ color: 'var(--sba-text)' }} onClick={handleClearLocalCache}>로컬 데이터 초기화</DeleteTextButton>
                        </div>

                        {/* 교회 관리자용 대시보드 버튼 */}
                        {isAdmin && (
                            <div style={{ borderTop: '1px dashed var(--sba-border-strong)', paddingTop: '16px', marginTop: '16px' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--sba-text-secondary)', margin: '0 0 12px 0' }}>
                                    <b>교회 관리자 대시보드</b>
                                </p>
                                <ButtonGroup style={{ display: 'flex', gap: '8px' }}>
                                    <ShadButton onClick={() => setActiveSubTab('admin_generate')} $variant="accent">
                                        일정 자동 생성기
                                    </ShadButton>
                                    <ShadButton onClick={() => setActiveSubTab('admin_edit')} $variant="outline">
                                        일정 달력 수동 수정
                                    </ShadButton>
                                </ButtonGroup>
                            </div>
                        )}
                        
                        <ButtonGroup style={{ marginTop: '20px' }}>
                            <ShadButton onClick={onClose}>
                                확인
                            </ShadButton>
                        </ButtonGroup>
                    </>
                )}

                {activeSubTab === 'admin_generate' && (
                    <>
                        <ModalHeader>
                            <ModalTitle>일정 자동 생성기</ModalTitle>
                            <ModalCloseButton onClick={() => setActiveSubTab('settings')}>✕</ModalCloseButton>
                        </ModalHeader>
                        
                        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
                            <FormGroup>
                                <FormLabel>큐티 일정 시작 날짜</FormLabel>
                                <FormInput 
                                    type="date" 
                                    value={genStartDate}
                                    onChange={e => setGenStartDate(e.target.value)}
                                />
                            </FormGroup>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <FormGroup style={{ flex: 1 }}>
                                    <FormLabel>시작 성경</FormLabel>
                                    <select 
                                        value={genStartBook} 
                                        onChange={e => setGenStartBook(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--sba-border-strong)', background: 'var(--sba-bg)', color: 'var(--sba-text)' }}
                                    >
                                        {BIBLE_BOOKS.map(b => (
                                            <option key={b.eng} value={b.eng}>{b.kor}</option>
                                        ))}
                                    </select>
                                </FormGroup>
                                <FormGroup style={{ flex: 1 }}>
                                    <FormLabel>시작 장</FormLabel>
                                    <FormInput 
                                        type="number" 
                                        min="1" 
                                        value={genStartChap}
                                        onChange={e => setGenStartChap(parseInt(e.target.value) || 1)}
                                    />
                                </FormGroup>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <FormGroup style={{ flex: 1 }}>
                                    <FormLabel>종료 성경</FormLabel>
                                    <select 
                                        value={genEndBook} 
                                        onChange={e => setGenEndBook(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--sba-border-strong)', background: 'var(--sba-bg)', color: 'var(--sba-text)' }}
                                    >
                                        {BIBLE_BOOKS.map(b => (
                                            <option key={b.eng} value={b.eng}>{b.kor}</option>
                                        ))}
                                    </select>
                                </FormGroup>
                                <FormGroup style={{ flex: 1 }}>
                                    <FormLabel>종료 장</FormLabel>
                                    <FormInput 
                                        type="number" 
                                        min="1" 
                                        value={genEndChap}
                                        onChange={e => setGenEndChap(parseInt(e.target.value) || 1)}
                                    />
                                </FormGroup>
                            </div>

                            <FormGroup>
                                <FormLabel>하루당 진행할 분량 (장수)</FormLabel>
                                <FormInput 
                                    type="number" 
                                    min="1" 
                                    value={genPagesPerDay}
                                    onChange={e => setGenPagesPerDay(parseInt(e.target.value) || 1)}
                                />
                            </FormGroup>

                            <FormGroup>
                                <FormLabel>제외할 요일 선택</FormLabel>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '6px' }}>
                                    {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                                        <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={genExcludeDays.includes(idx)}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        setGenExcludeDays([...genExcludeDays, idx]);
                                                    } else {
                                                        setGenExcludeDays(genExcludeDays.filter(d => d !== idx));
                                                    }
                                                }}
                                            />
                                            {day}요일
                                        </label>
                                    ))}
                                </div>
                            </FormGroup>
                        </div>

                        <ButtonGroup style={{ marginTop: '20px' }}>
                            <ShadButton $variant="outline" onClick={() => setActiveSubTab('settings')}>
                                취소
                            </ShadButton>
                            <ShadButton onClick={handleGenerateSchedule} disabled={syncing} $variant="accent">
                                {syncing ? '생성 계산 중...' : '자동 생성 및 덮어쓰기'}
                            </ShadButton>
                        </ButtonGroup>
                    </>
                )}

                {activeSubTab === 'admin_edit' && (
                    <>
                        <ModalHeader>
                            <ModalTitle>일정 달력 수동 수정</ModalTitle>
                            <ModalCloseButton onClick={() => setActiveSubTab('settings')}>✕</ModalCloseButton>
                        </ModalHeader>
                        
                        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
                            <FormGroup>
                                <FormLabel>수정할 날짜 선택</FormLabel>
                                <FormInput 
                                    type="date" 
                                    value={editDate}
                                    onChange={e => setEditDate(e.target.value)}
                                />
                            </FormGroup>

                            <div style={{ background: 'var(--sba-card-sub-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--sba-border)', marginBottom: '16px' }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: 'bold', margin: '0 0 10px 0', borderBottom: '1px solid var(--sba-border-strong)', paddingBottom: '4px' }}>1. 오늘의 묵상 (QT)</p>
                                
                                <FormGroup>
                                    <FormLabel>묵상 성경 권</FormLabel>
                                    <select 
                                        value={editQtBook} 
                                        onChange={e => setEditQtBook(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--sba-border-strong)', background: 'var(--sba-bg)', color: 'var(--sba-text)' }}
                                    >
                                        <option value="">없음</option>
                                        {BIBLE_BOOKS.map(b => (
                                            <option key={b.eng} value={b.eng}>{b.kor}</option>
                                        ))}
                                    </select>
                                </FormGroup>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <FormGroup style={{ flex: 1 }}>
                                        <FormLabel>시작 장</FormLabel>
                                        <FormInput type="number" min="1" value={editQtStartChap} onChange={e => setEditQtStartChap(parseInt(e.target.value) || 1)} />
                                    </FormGroup>
                                    <FormGroup style={{ flex: 1 }}>
                                        <FormLabel>시작 절</FormLabel>
                                        <FormInput type="number" min="1" value={editQtStartVerse} onChange={e => setEditQtStartVerse(parseInt(e.target.value) || 1)} />
                                    </FormGroup>
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <FormGroup style={{ flex: 1 }}>
                                        <FormLabel>종료 장</FormLabel>
                                        <FormInput type="number" min="1" value={editQtEndChap} onChange={e => setEditQtEndChap(parseInt(e.target.value) || 1)} />
                                    </FormGroup>
                                    <FormGroup style={{ flex: 1 }}>
                                        <FormLabel>종료 절</FormLabel>
                                        <FormInput type="number" min="1" value={editQtEndVerse} onChange={e => setEditQtEndVerse(parseInt(e.target.value) || 1)} />
                                    </FormGroup>
                                </div>

                                <FormGroup>
                                    <FormLabel>묵상 본문 제목</FormLabel>
                                    <FormInput type="text" placeholder="예: 말씀으로 굳건히 서는 교회" value={editQtTitle} onChange={e => setEditQtTitle(e.target.value)} />
                                </FormGroup>
                            </div>

                            <div style={{ background: 'var(--sba-card-sub-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--sba-border)' }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: 'bold', margin: '0 0 10px 0', borderBottom: '1px solid var(--sba-border-strong)', paddingBottom: '4px' }}>2. 성경 통독 (Reading)</p>
                                
                                <FormGroup>
                                    <FormLabel>통독 성경 권</FormLabel>
                                    <select 
                                        value={editReadingBook} 
                                        onChange={e => setEditReadingBook(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--sba-border-strong)', background: 'var(--sba-bg)', color: 'var(--sba-text)' }}
                                    >
                                        <option value="">없음</option>
                                        {BIBLE_BOOKS.map(b => (
                                            <option key={b.eng} value={b.eng}>{b.kor}</option>
                                        ))}
                                    </select>
                                </FormGroup>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <FormGroup style={{ flex: 1 }}>
                                        <FormLabel>시작 장</FormLabel>
                                        <FormInput type="number" min="1" value={editReadingStartChap} onChange={e => setEditReadingStartChap(parseInt(e.target.value) || 1)} />
                                    </FormGroup>
                                    <FormGroup style={{ flex: 1 }}>
                                        <FormLabel>종료 장</FormLabel>
                                        <FormInput type="number" min="1" value={editReadingEndChap} onChange={e => setEditReadingEndChap(parseInt(e.target.value) || 1)} />
                                    </FormGroup>
                                </div>
                            </div>
                        </div>

                        <ButtonGroup style={{ marginTop: '20px' }}>
                            <ShadButton $variant="outline" onClick={() => setActiveSubTab('settings')}>
                                취소
                            </ShadButton>
                            <ShadButton onClick={handleUpdateSchedule} disabled={syncing} $variant="accent">
                                {syncing ? '저장 중...' : '일정 저장하기'}
                            </ShadButton>
                        </ButtonGroup>
                    </>
                )}
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

function CalendarModal({ isOpen, onClose, currentDate, onSetDate, dailyPlans }) {
    const [mode, setMode] = useState('weekly'); // 'weekly' | 'calendar'
    const [noteDates, setNoteDates] = useState(new Set());
    const [viewDate, setViewDate] = useState(() => {
        return isValidDate(currentDate) ? new Date(currentDate) : getEffectiveDate();
    });

    useEffect(() => {
        if (isOpen) {
            setMode('weekly');
            if (isValidDate(currentDate)) {
                setViewDate(new Date(currentDate));
            }
        }
    }, [isOpen, currentDate]);

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

    if (!isOpen) return null;

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
            <ModalContent onClick={e => e.stopPropagation()} $maxWidth={mode === 'weekly' ? '440px' : '360px'}>
                {mode === 'weekly' ? (
                    <>
                        <ModalHeader>
                            <ModalTitle>주간 일정 요약</ModalTitle>
                            <ModalCloseButton onClick={onClose}>✕</ModalCloseButton>
                        </ModalHeader>
                        
                        <div className="sba-weekly-list-modal" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '55vh', overflowY: 'auto', paddingRight: '4px' }}>
                            {dailyPlans && Object.entries(dailyPlans).map(([dKey, plan]) => {
                                const actualToday = getEffectiveDate();
                                const tMonth = actualToday.getMonth() + 1;
                                const tDay = actualToday.getDate();
                                const realTodayKey = `${String(tMonth).padStart(2, '0')}.${String(tDay).padStart(2, '0')}`;

                                const dMonth = safeCurrentDate.getMonth() + 1;
                                const dDay = safeCurrentDate.getDate();
                                const currentKey = `${String(dMonth).padStart(2, '0')}.${String(dDay).padStart(2, '0')}`;

                                const isRealToday = dKey === realTodayKey;
                                const isSelected = dKey === currentKey;
                                const dateStr = plan.dateObj.toISOString().split('T')[0];
                                const hasNote = noteDates.has(dateStr);
                                
                                return (
                                    <div 
                                        key={dKey} 
                                        className={`sba-weekly-card-modal ${isSelected ? 'selected' : ''} ${isRealToday ? 'today' : ''}`}
                                        onClick={() => handleSelectDate(plan.dateObj)}
                                        style={{
                                            padding: '12px 14px',
                                            borderRadius: '10px',
                                            border: isSelected ? '1.5px solid var(--sba-text)' : '1px solid var(--sba-border-strong)',
                                            background: isSelected ? 'var(--sba-card-active)' : 'var(--sba-card-bg)',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px',
                                            boxShadow: isSelected ? '0 4px 12px rgba(0, 0, 0, 0.05)' : 'none'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--sba-text)' }}>
                                                [{plan.dayName[0]}] {dKey}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {hasNote && (
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--sba-text-secondary)' }}>
                                                        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                                                    </svg>
                                                )}
                                                {isRealToday && <span style={{ fontSize: '0.7rem', background: 'var(--sba-text)', color: 'var(--sba-bg)', padding: '1px 6px', borderRadius: '8px', fontWeight: '600' }}>오늘</span>}
                                                {isSelected && !isRealToday && <span style={{ fontSize: '0.7rem', background: 'var(--sba-text-secondary)', color: 'var(--sba-bg)', padding: '1px 6px', borderRadius: '8px', fontWeight: '600' }}>선택됨</span>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem' }}>
                                            <div style={{ flex: 1, background: 'var(--sba-card-sub-bg)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--sba-border)', display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ color: 'var(--sba-text-muted)', fontSize: '0.65rem', fontWeight: '600' }}>묵상</span>
                                                <span style={{ color: 'var(--sba-text)', fontWeight: '500', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {plan.old ? `${SHORT_TO_FULL[plan.old.abbrev] || plan.old.abbrev} ${plan.old.verse}장` : '일정 없음'}
                                                </span>
                                            </div>
                                            <div style={{ flex: 1, background: 'var(--sba-card-sub-bg)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--sba-border)', display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ color: 'var(--sba-text-muted)', fontSize: '0.65rem', fontWeight: '600' }}>통독</span>
                                                <span style={{ color: 'var(--sba-text)', fontWeight: '500', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {plan.new ? `${plan.new.books.map(b => SHORT_TO_FULL[b] || b).join(', ')} ${plan.new.verseRaw}장` : '일정 없음'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <ShadButton $variant="outline" onClick={() => setMode('calendar')}>
                                달력에서 선택하기
                            </ShadButton>
                            <ShadButton onClick={onClose}>
                                닫기
                            </ShadButton>
                        </div>
                    </>
                ) : (
                    <>
                        <ModalHeader>
                            <ModalTitle>
                                날짜 이동 (달력)
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
                                
                                const dateStr = safeToISODateString(date);
                                const isSelected = dateStr === safeToISODateString(safeCurrentDate);
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
         
                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <ShadButton $variant="outline" onClick={() => setMode('weekly')} style={{ flex: 1 }}>
                                    주간 일정
                                </ShadButton>
                                <ShadButton 
                                    $variant="outline"
                                    onClick={() => {
                                        onSetDate(getEffectiveDate());
                                        onClose();
                                    }}
                                    style={{ flex: 1 }}
                                >
                                    오늘 날짜 복귀
                                </ShadButton>
                            </div>
                            <ShadButton onClick={onClose}>
                                취소
                            </ShadButton>
                        </div>
                    </>
                )}
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
// 5. Accordion (styled-components)
// ==========================================
const Accordion = styled.div`
  border: 1px solid var(--sba-border-strong);
  border-radius: 8px;
  overflow: hidden;
  background: var(--sba-card-bg);
  width: 100%;
`;

const AccordionItem = styled.div`
  border-bottom: 1px solid var(--sba-border);
  &:last-child {
    border-bottom: none;
  }
`;

const AccordionTrigger = styled.button`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 14px 16px;
  background: transparent;
  border: none;
  color: var(--sba-text);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--sba-card-sub-bg);
  }
`;

const AccordionContent = styled.div`
  padding: 16px;
  background-color: var(--sba-card-sub-bg);
  color: var(--sba-text-secondary);
  font-size: 0.875rem;
  line-height: 1.5;
  border-top: 1px solid var(--sba-border);
  display: ${props => props.$isOpen ? 'block' : 'none'};
`;

// ==========================================
// 6. Table (styled-components)
// ==========================================
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 0.875rem;
  text-align: left;
  border: 1px solid var(--sba-border-strong);
  border-radius: 8px;
  overflow: hidden;
`;

const TableHeader = styled.thead`
  background-color: var(--sba-card-sub-bg);
  border-bottom: 2px solid var(--sba-border-strong);
`;

const TableRow = styled.tr`
  border-bottom: 1px solid var(--sba-border);
  transition: background-color 0.15s ease;

  &:hover {
    background-color: var(--sba-card-active);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const TableHead = styled.th`
  padding: 12px 16px;
  font-weight: 600;
  color: var(--sba-text);
`;

const TableBody = styled.tbody`
  background-color: var(--sba-card-bg);
`;

const TableCell = styled.td`
  padding: 12px 16px;
  color: var(--sba-text-secondary);
`;


// ==========================================
// 5. Main Export App
// ==========================================


// ====================================================
// Theme Configs (Shadcn Slate 무채색 기반)
// ====================================================
const baseShadcnTheme = {
  light: {
    primary: '#0f172a', // slate-900
    primaryRgb: '15, 23, 42',
    bg: '#fafafa',
    text: '#09090b',
    textSecondary: '#4b5563',
    textMuted: '#9ca3af',
    textSubtle: '#d1d5db',
    border: '#e2e8f0',
    borderStrong: '#cbd5e1',
    cardBg: '#ffffff',
    cardHover: '#f8fafc',
    cardActive: '#f1f5f9',
    cardTodayBg: '#ffffff',
    cardTodayBorder: '#0f172a',
    cardSubBg: '#f8fafc',
    navBg: 'rgba(255, 255, 255, 0.85)',
    navActive: '#0f172a',
    navInactive: '#94a3b8',
    modalBg: '#ffffff',
    inputBorder: '#cbd5e1',
    btnBg: '#0f172a',
    btnText: '#ffffff',
    btnHover: '#000000',
    verseTitle: '#0f172a',
    verseText: '#1e293b',
    verseNum: '#64748b',
    splashBg: '#f8fafc',
    splashTitle: '#0f172a',
    splashSub: '#64748b',
    splashDesc: '#94a3b8',
    highlight: 'rgba(245, 158, 11, 0.25)',
    highlightHover: 'rgba(245, 158, 11, 0.4)',
    skeletonBg: '#e2e8f0',
    skeletonShine: '#f1f5f9',
    accent: '#f1f5f9',
  },
  dark: {
    primary: '#f1f5f9', // slate-100
    primaryRgb: '241, 245, 249',
    bg: '#09090b', // slate-950
    text: '#fafafa',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    textSubtle: '#475569',
    border: '#1e293b',
    borderStrong: '#334155',
    cardBg: '#0f172a',
    cardHover: '#1e293b',
    cardActive: '#1e293b',
    cardTodayBg: '#0f172a',
    cardTodayBorder: '#f1f5f9',
    cardSubBg: '#09090b',
    navBg: 'rgba(9, 9, 11, 0.85)',
    navActive: '#f1f5f9',
    navInactive: '#475569',
    modalBg: '#0f172a',
    inputBorder: '#334155',
    btnBg: '#f1f5f9',
    btnText: '#0f172a',
    btnHover: '#cbd5e1',
    verseTitle: '#fafafa',
    verseText: '#cbd5e1',
    verseNum: '#475569',
    splashBg: '#09090b',
    splashTitle: '#f1f5f9',
    splashSub: '#94a3b8',
    splashDesc: '#475569',
    highlight: 'rgba(245, 158, 11, 0.4)',
    highlightHover: 'rgba(245, 158, 11, 0.55)',
    skeletonBg: '#1e293b',
    skeletonShine: '#334155',
    accent: '#1e293b',
  }
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '15, 23, 42';
};

const getDynamicTheme = (isDark, userChurch) => {
  const mode = isDark ? 'dark' : 'light';
  const base = baseShadcnTheme[mode];
  if (userChurch && userChurch.theme_color) {
    return {
      ...base,
      primary: userChurch.theme_color,
      primaryRgb: hexToRgb(userChurch.theme_color),
    };
  }
  return base;
};

const GlobalStyle = createGlobalStyle`
  :root {
    --sba-primary: ${props => props.theme.primary};
    --sba-primary-rgb: ${props => props.theme.primaryRgb};
    --sba-bg: ${props => props.theme.bg};
    --sba-text: ${props => props.theme.text};
    --sba-text-secondary: ${props => props.theme.textSecondary};
    --sba-text-muted: ${props => props.theme.textMuted};
    --sba-text-subtle: ${props => props.theme.textSubtle};
    --sba-border: ${props => props.theme.border};
    --sba-border-strong: ${props => props.theme.borderStrong};
    --sba-card-bg: ${props => props.theme.cardBg};
    --sba-card-hover: ${props => props.theme.cardHover};
    --sba-card-active: ${props => props.theme.cardActive};
    --sba-card-today-bg: ${props => props.theme.cardTodayBg};
    --sba-card-today-border: ${props => props.theme.cardTodayBorder};
    --sba-card-sub-bg: ${props => props.theme.cardSubBg};
    --sba-nav-bg: ${props => props.theme.navBg};
    --sba-nav-active: ${props => props.theme.navActive};
    --sba-nav-inactive: ${props => props.theme.navInactive};
    --sba-modal-bg: ${props => props.theme.modalBg};
    --sba-input-border: ${props => props.theme.inputBorder};
    --sba-btn-bg: ${props => props.theme.btnBg};
    --sba-btn-text: ${props => props.theme.btnText};
    --sba-btn-hover: ${props => props.theme.btnHover};
    --sba-verse-title: ${props => props.theme.verseTitle};
    --sba-verse-text: ${props => props.theme.verseText};
    --sba-verse-num: ${props => props.theme.verseNum};
    --sba-splash-bg: ${props => props.theme.splashBg};
    --sba-splash-title: ${props => props.theme.splashTitle};
    --sba-splash-sub: ${props => props.theme.splashSub};
    --sba-splash-desc: ${props => props.theme.splashDesc};
    --sba-highlight: ${props => props.theme.highlight};
    --sba-highlight-hover: ${props => props.theme.highlightHover};
    --sba-skeleton-bg: ${props => props.theme.skeletonBg};
    --sba-skeleton-shine: ${props => props.theme.skeletonShine};
    --sba-accent: ${props => props.theme.accent};
  }
`;

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

// ----------------------------------------------------
// Styled Components for Onboarding UI (Shadcn-like)
// ----------------------------------------------------
const OnboardingOverlay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: var(--sba-bg, #f9fafb);
  color: var(--sba-text, #111827);
  font-family: inherit;
`;

const OnboardingCard = styled.div`
  width: 100%;
  max-width: 440px;
  background: var(--sba-modal-bg, #ffffff);
  border: 1px solid var(--sba-border-strong, #e5e7eb);
  border-radius: 16px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  padding: 32px 28px;
`;

const OnboardingHeader = styled.div`
  margin-bottom: 24px;
  text-align: center;
`;

const OnboardingTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0 0 8px 0;
  color: var(--sba-text);
`;

const OnboardingDesc = styled.p`
  font-size: 0.875rem;
  color: var(--sba-text-secondary, #6b7280);
  margin: 0;
  line-height: 1.5;
`;

const TabButtonGroup = styled.div`
  display: flex;
  background: var(--sba-card-sub-bg, #f3f4f6);
  padding: 4px;
  border-radius: 8px;
  margin-bottom: 24px;
`;

const TabButton = styled.button`
  flex: 1;
  border: none;
  background: ${props => props.$active ? 'var(--sba-modal-bg, #ffffff)' : 'transparent'};
  color: ${props => props.$active ? 'var(--sba-text, #111827)' : 'var(--sba-text-secondary, #6b7280)'};
  font-size: 0.875rem;
  font-weight: 600;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: ${props => props.$active ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'};
  transition: all 0.2s;
`;

const FormField = styled.div`
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FormLabel = styled.label`
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--sba-text-secondary);
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--sba-border-strong, #d1d5db);
  background: var(--sba-bg, #ffffff);
  color: var(--sba-text, #111827);
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
  &:focus {
    border-color: var(--sba-primary, #8B4513);
  }
`;

const ColorPresetGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 4px;
`;

const ColorCircle = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: ${props => props.$color};
  cursor: pointer;
  border: 2px solid ${props => props.$active ? 'var(--sba-text)' : 'transparent'};
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: transform 0.15s;
  &:hover {
    transform: scale(1.1);
  }
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: none;
  background: var(--sba-primary, #8B4513);
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  &:hover {
    opacity: 0.9;
  }
  &:disabled {
    background: var(--sba-border-strong, #cccccc);
    cursor: not-allowed;
  }
`;

const SocialButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-top: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: ${props => props.$provider === 'google' ? '1px solid var(--sba-border-strong)' : 'none'};
  background: ${props => props.$provider === 'google' ? 'var(--sba-modal-bg)' : '#fee500'};
  color: ${props => props.$provider === 'google' ? 'var(--sba-text)' : '#191919'};
  &:hover {
    background: ${props => props.$provider === 'google' ? 'var(--sba-card-sub-bg)' : '#fdd835'};
  }
`;

const SearchResultList = styled.div`
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid var(--sba-border);
  border-radius: 8px;
  margin-top: 8px;
  background: var(--sba-card-sub-bg);
`;

const SearchResultItem = styled.div`
  padding: 10px 12px;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => props.$selected ? 'var(--sba-border)' : 'transparent'};
  &:hover {
    background: var(--sba-border-strong);
  }
`;

 function SBA_QT_App() {
    const [scheduleData, setScheduleData] = useState(null);
    const [currentDate, setCurrentDate] = useState(getEffectiveDate());
    const [activeTab, setActiveTab] = useState('today');

    // 뒤로가기(popstate) 제어용 상태
    const [isPopStateActive, setIsPopStateActive] = useState(false);
    const loadDateStrRef = React.useRef(safeToISODateString(getEffectiveDate()));

    // UI 상태 관리
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toasts, setToasts] = useState([]);
    
    // 다크모드 및 소셜 세션 / 교회 정보
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('sba_theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    const [session, setSession] = useState(null);
    const [userChurch, setUserChurch] = useState(null);
    const [checkingChurch, setCheckingChurch] = useState(true);
    const [bookmarkTrigger, setBookmarkTrigger] = useState(0);

    // 모달 관리
    const [showCalendar, setShowCalendar] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    
    // 온보딩 가입/개설 탭
    const [onboardingTab, setOnboardingTab] = useState('join');
    
    // 온보딩 관련 인풋 상태들
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedChurch, setSelectedChurch] = useState(null);
    const [inviteCode, setInviteCode] = useState('');
    const [newChurchName, setNewChurchName] = useState('');
    const [newInviteCode, setNewInviteCode] = useState('');
    const [newIsPublic, setNewIsPublic] = useState(true);
    const [newThemeColor, setNewThemeColor] = useState('#8B4513');
    const [submitting, setSubmitting] = useState(false);

    // 스플래시 스크린 관리
    const [isSplashVisible, setIsSplashVisible] = useState(true);
    const [isSplashFading, setIsSplashFading] = useState(false);

    const colorPresets = ['#8B4513', '#556B2F', '#1A365D', '#2D3748', '#4A5568'];
    const lastSyncedUserRef = React.useRef(null);

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
    }, [isDark]);

    const theme = useMemo(() => getDynamicTheme(isDark, userChurch), [isDark, userChurch]);

    // 소속 교회 확인 함수
    const fetchUserChurch = async (userId) => {
        setCheckingChurch(true);
        try {
            const headers = { 'Content-Type': 'application/json' };
            const authKey = 'sb-ebfpjvwwbognddixrvyc-auth-token';
            const savedSession = localStorage.getItem(authKey);
            if (savedSession) {
                try {
                    const parsed = JSON.parse(savedSession);
                    if (parsed?.access_token) {
                        headers['Authorization'] = `Bearer ${parsed.access_token}`;
                    }
                } catch (e) {}
            }

            const res = await fetch('/api/churches/mine', {
                method: 'GET',
                headers
            });
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            setUserChurch(data);
        } catch (err) {
            console.error('교회 정보 조회 실패:', err);
            addToast('교회 정보를 불러오지 못했습니다.');
        } finally {
            setCheckingChurch(false);
        }
    };

    // 1. Supabase Auth 상태 감지 및 세션 바인딩
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });
        return () => subscription.unsubscribe();
    }, []);

    // 2. 세션/사용자 ID 변화 시 정보 로드 및 1회 동기화 (중복 실행 완전 차단)
    useEffect(() => {
        if (!session) {
            setUserChurch(null);
            setCheckingChurch(false);
            lastSyncedUserRef.current = null;
            return;
        }

        const userId = session.user.id;
        if (lastSyncedUserRef.current === userId) {
            return; // 이미 이 사용자 ID로 동기화 완료됨
        }
        lastSyncedUserRef.current = userId;

        const initUserSession = async () => {
            // 알림 설정 동기화
            if (session.user.user_metadata) {
                const meta = session.user.user_metadata;
                if (meta.sba_qt_alarm_enabled !== undefined) {
                    localStorage.setItem('sba_qt_alarm_enabled', String(meta.sba_qt_alarm_enabled));
                }
                if (meta.sba_qt_alarm_time) {
                    localStorage.setItem('sba_qt_alarm_time', meta.sba_qt_alarm_time);
                }
            }

            // 소속 교회 정보 불러오기
            await fetchUserChurch(userId);

            // 로컬-클라우드 데이터 동기화
            const res = await syncLocalDataToCloud();
            if (res.success) {
                addToast('소셜 클라우드와 북마크/메모가 동기화되었습니다.');
                setBookmarkTrigger(prev => prev + 1);
            }
        };

        initUserSession();
    }, [session]);

    // 브라우저 알림 스케줄러 구동
    useEffect(() => {
        const checkNotification = () => {
            const enabledStr = localStorage.getItem('sba_qt_alarm_enabled');
            const alarmTime = localStorage.getItem('sba_qt_alarm_time') || "08:00";
            const lastNotified = localStorage.getItem('sba_qt_last_notified_date');

            const isEnabled = enabledStr === 'true';
            
            if (isEnabled && session && Notification.permission === 'granted') {
                const now = new Date();
                const yyyy = now.getFullYear();
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const dd = String(now.getDate()).padStart(2, '0');
                const todayStr = `${yyyy}-${mm}-${dd}`;
                
                const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

                if (currentHourMin === alarmTime && lastNotified !== todayStr) {
                    try {
                        const notification = new Notification("교회 QT & 통독", {
                            body: "오늘의 말씀 일정이 도착했습니다. 말씀과 함께 은혜로운 하루를 시작해 보세요!",
                            icon: "/favicon.ico"
                        });
                        notification.onclick = () => {
                            window.focus();
                            setActiveTab('today');
                        };
                        localStorage.setItem('sba_qt_last_notified_date', todayStr);
                    } catch (err) {
                        console.error("알림 발송 실패:", err);
                    }
                }
            }
        };

        const timer = setInterval(checkNotification, 30000);
        checkNotification();

        return () => clearInterval(timer);
    }, [session, setActiveTab]);

    // 스케줄 데이터 로딩 함수 (백엔드 API 연동)
    const loadSchedule = async () => {
        if (!userChurch) return;
        setLoading(true);
        setError(null);
        try {
            const year = currentDate.getFullYear();
            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;

            const headers = {};
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }

            const data = await fetchWithRetry(`/api/qt-schedule?church_id=${userChurch.id}&start_date=${startDate}&end_date=${endDate}`, { headers });
            setScheduleData(data);
        } catch (err) {
            console.error("일정 불러오기 실패:", err);
            setError("일정 데이터를 불러오지 못했습니다. 관리자에게 문의해 주세요.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userChurch) {
            loadSchedule();
        }
    }, [userChurch, currentDate]);

    useEffect(() => {
        // 첫 진입 시 히스토리 초기화
        window.history.replaceState({ tab: activeTab }, '');

        // 서비스 워커 등록
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('Service Worker 등록 성공:', reg.scope))
                .catch(err => console.error('Service Worker 등록 실패:', err));
        }

        // 스플래시 애니메이션 타이머
        const fadeTimer = setTimeout(() => setIsSplashFading(true), 2200);
        const removeTimer = setTimeout(() => setIsSplashVisible(false), 3000);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(removeTimer);
        };
    }, []);

    // 탭 변경 시 히스토리 스택에 push
    useEffect(() => {
        if (!isPopStateActive) {
            window.history.pushState({ tab: activeTab }, '');
        }
        setIsPopStateActive(false);
    }, [activeTab]);

    // 뒤로가기(popstate) 가로채기 처리
    useEffect(() => {
        const handlePopState = (e) => {
            const isAnyModalOpen = showCalendar || showSettings || showAuth;
            if (isAnyModalOpen) {
                setShowCalendar(false);
                setShowSettings(false);
                setShowAuth(false);
                window.history.pushState({ tab: activeTab }, '');
                return;
            }

            if (e.state && e.state.tab && e.state.tab !== activeTab) {
                setIsPopStateActive(true);
                setActiveTab(e.state.tab);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [showCalendar, showSettings, showAuth, activeTab, isPopStateActive]);

    // 다음 날 앱 접속 시 자동 새로고침(리로드) 처리
    useEffect(() => {
        const checkDateChange = () => {
            const currentEffectiveStr = safeToISODateString(getEffectiveDate());
            if (currentEffectiveStr !== loadDateStrRef.current) {
                console.log("날짜 변경 감지: 새로고침을 실행합니다.");
                window.location.reload();
            }
        };

        window.addEventListener('focus', checkDateChange);
        const interval = setInterval(checkDateChange, 60000);

        return () => {
            window.removeEventListener('focus', checkDateChange);
            clearInterval(interval);
        };
    }, []);

    const effectiveDate = useMemo(() => {
        if (currentDate instanceof Date && !isNaN(currentDate.getTime())) {
            return currentDate;
        }
        return getMidnightKST(new Date());
    }, [currentDate]);

    useEffect(() => {
        if (!currentDate || isNaN(currentDate.getTime())) {
            setCurrentDate(getMidnightKST(new Date()));
        }
    }, [currentDate]);

    const targetKST = useMemo(() => {
        return getMidnightKST(effectiveDate);
    }, [effectiveDate]);

    const weekDayIdx = targetKST.getUTCDay();

    // 주간 7일간의 일정 계산
    const dailyPlans = useMemo(() => {
        if (!scheduleData) return {};
        
        const diffToMonday = weekDayIdx === 0 ? -6 : 1 - weekDayIdx;
        const plans = {};

        for (let i = 0; i < 7; i++) {
            const d = new Date(targetKST.getTime());
            d.setUTCDate(targetKST.getUTCDate() + diffToMonday + i);
            
            const dateStr = d.toISOString().split('T')[0];
            const dMonth = d.getUTCMonth() + 1;
            const dDay = d.getUTCDate();
            const dKey = `${String(dMonth).padStart(2, '0')}.${String(dDay).padStart(2, '0')}`;
            const dayName = DAYS_ARR[d.getUTCDay()];
            
            const row = scheduleData.find(s => s.date === dateStr);
            
            let oldPlan = null;
            let newPlan = null;

            if (row) {
                if (row.qt_book) {
                    oldPlan = {
                        abbrev: row.qt_book,
                        verse: row.qt_start_chap?.toString() || "1",
                        start_verse: row.qt_start_verse || 1,
                        end_verse: row.qt_end_verse || 30,
                        title: row.qt_title || ""
                    };
                }
                if (row.reading_book) {
                    newPlan = {
                        books: [row.reading_book],
                        verseRaw: `${row.reading_start_chap}-${row.reading_end_chap}`
                    };
                }
            }

            plans[dKey] = { dayName, old: oldPlan, new: newPlan, dateObj: d, rawRow: row };
        }
        return plans;
    }, [scheduleData, targetKST, weekDayIdx]);

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
            // 1. 묵상(QT)에서 검색
            const qtMatch = scheduleData.find(s => 
                s.qt_book === book && 
                s.qt_start_chap <= chapter && chapter <= s.qt_end_chap
            );
            if (qtMatch) {
                const parts = qtMatch.date.split('-');
                targetDateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                targetTab = 'today';
                found = true;
            }

            // 2. 통독에서 검색 (묵상에서 발견되지 않은 경우)
            if (!found) {
                const rdMatch = scheduleData.find(s => 
                    s.reading_book === book && 
                    s.reading_start_chap <= chapter && chapter <= s.reading_end_chap
                );
                if (rdMatch) {
                    const parts = rdMatch.date.split('-');
                    targetDateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    targetTab = 'reading';
                    found = true;
                }
            }
        }

        if (targetDateObj instanceof Date && !isNaN(targetDateObj.getTime())) {
            setCurrentDate(targetDateObj);
            setActiveTab(targetTab);
        }

        setTimeout(() => {
            const elId = `verse-${book}-${chapter}-${verse}`;
            const el = document.getElementById(elId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('flash-focus');
                setTimeout(() => el.classList.remove('flash-focus'), 2000);
            }
        }, 600);
    };

    // ----------------------------------------------------
    // 온보딩 가입/개설 요청 처리 함수
    // ----------------------------------------------------
    const handleSearchChurch = async () => {
        if (!searchQuery.trim()) return;
        try {
            const res = await fetch(`/api/churches?query=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (res.ok) {
                setSearchResults(data);
                if (data.length === 0) addToast('검색 결과가 없습니다.');
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            alert('교회 검색 실패: ' + e.message);
        }
    };

    const handleJoinChurch = async () => {
        if (!selectedChurch) return;
        setSubmitting(true);
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }
            const res = await fetch('/api/churches/join', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    church_id: selectedChurch.id,
                    invite_code: inviteCode
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                addToast(`${selectedChurch.name} 교회 가입이 완료되었습니다.`);
                await fetchUserChurch(session.user.id);
            } else {
                throw new Error(data.error || '가입 실패');
            }
        } catch (err) {
            alert('교회 가입에 실패했습니다: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateChurch = async () => {
        if (!newChurchName.trim()) {
            alert('교회 이름을 입력해 주세요.');
            return;
        }
        setSubmitting(true);
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }
            const res = await fetch('/api/churches', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    name: newChurchName.trim(),
                    invite_code: newInviteCode.trim() || null,
                    theme_color: newThemeColor,
                    is_public: newIsPublic
                })
            });
            const data = await res.json();
            if (res.ok && data.id) {
                addToast(`'${newChurchName}' 교회가 신규 개설 및 가입되었습니다.`);
                await fetchUserChurch(session.user.id);
            } else {
                throw new Error(data.error || '개설 실패');
            }
        } catch (err) {
            alert('교회 개설에 실패했습니다: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleOAuthLogin = async (provider) => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: { redirectTo: window.location.origin }
            });
            if (error) throw error;
        } catch (e) {
            alert('로그인 에러: ' + e.message);
        }
    };

    // ----------------------------------------------------
    // 메인 콘텐츠 렌더러
    // ----------------------------------------------------
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
                        session={session}
                        onOpenAuthModal={() => setShowAuth(true)}
                    />
                );

            case 'sharing':
                return (
                    <SharingTab 
                        session={session} 
                        onOpenAuthModal={() => setShowAuth(true)} 
                        addToast={addToast} 
                        isDark={isDark} 
                        userChurch={userChurch}
                    />
                );
            default:
                return null;
        }
    };

    // 로딩 혹은 RLS 조회 대기
    if (checkingChurch) {
        return (
            <ThemeProvider theme={theme}>
                <GlobalStyle />
                <OnboardingOverlay>
                    <div className="sba-loading">사용자 소속 정보를 조회하는 중...</div>
                </OnboardingOverlay>
            </ThemeProvider>
        );
    }

    // 1. 비로그인 상태일 때 온보딩 노출 (소셜 로그인 유도)
    if (!session) {
        return (
            <ThemeProvider theme={theme}>
                <GlobalStyle />
                <OnboardingOverlay className={isDark ? 'dark' : ''}>
                    <OnboardingCard>
                        <OnboardingHeader>
                            <OnboardingTitle>말씀 QT & 통독</OnboardingTitle>
                            <OnboardingDesc>
                                교회별 일정 관리 및 묵상 공유, 매일 알림 설정을 위해 소셜 계정으로 로그인해 주세요.
                            </OnboardingDesc>
                        </OnboardingHeader>
                        
                        <SocialButton $provider="google" onClick={() => handleOAuthLogin('google')}>
                            <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px' }}><path fill="#EA4335" d="M12 5.04c1.74 0 3.3.6 4.53 1.78l3.38-3.38C17.86 1.54 15.17 1 12 1 7.24 1 3.2 3.82 1.34 7.92l3.96 3.07C6.26 7.63 8.92 5.04 12 5.04z"/><path fill="#4285F4" d="M23.49 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.69 2.87c2.16-2 3.74-4.94 3.74-8.58z"/><path fill="#FBBC05" d="M5.3 14.79a7.16 7.16 0 0 1 0-4.54L1.34 7.18a11.96 11.96 0 0 0 0 9.64l3.96-3.03z"/><path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.69-2.87c-1.02.68-2.33 1.09-4.27 1.09-3.08 0-5.74-2.59-6.7-5.96L1.34 15.38C3.2 19.48 7.24 23 12 23z"/></svg>
                            Google로 로그인
                        </SocialButton>
                        
                        <SocialButton $provider="kakao" onClick={() => handleOAuthLogin('kakao')}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px' }}><path d="M12 3c-4.97 0-9 3.185-9 7.11 0 2.507 1.644 4.717 4.148 5.918-.173.65-.626 2.34-.716 2.684-.112.433.155.427.327.311.135-.09 2.148-1.464 3.003-2.046C10.428 17.054 11.2 17.11 12 17.11c4.97 0 9-3.185 9-7.11C21 6.185 16.97 3 12 3z"/></svg>
                            카카오로 로그인
                        </SocialButton>
                    </OnboardingCard>
                    
                    {/* 토스트 팝업 렌더러 */}
                    <div className="sba-toast-container">
                        {toasts.map(t => (
                            <div key={t.id} className="sba-toast">{t.message}</div>
                        ))}
                    </div>
                </OnboardingOverlay>
            </ThemeProvider>
        );
    }

    // 2. 로그인되었으나 소속 교회가 없을 때 온보딩 노출 (가입/개설 유도)
    if (!userChurch) {
        return (
            <ThemeProvider theme={theme}>
                <GlobalStyle />
                <OnboardingOverlay className={isDark ? 'dark' : ''}>
                    <OnboardingCard>
                        <OnboardingHeader>
                            <OnboardingTitle>교회 연결하기</OnboardingTitle>
                            <OnboardingDesc>
                                기존 교회를 찾아 가입하거나, 본인의 소속 교회를 직접 개설하여 일정을 시작하세요.
                            </OnboardingDesc>
                        </OnboardingHeader>
                        
                        <TabButtonGroup>
                            <TabButton $active={onboardingTab === 'join'} onClick={() => setOnboardingTab('join')}>교회 검색 가입</TabButton>
                            <TabButton $active={onboardingTab === 'create'} onClick={() => setOnboardingTab('create')}>새 교회 개설</TabButton>
                        </TabButtonGroup>

                        {onboardingTab === 'join' ? (
                            <>
                                <FormField>
                                    <FormLabel>교회 이름 검색</FormLabel>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <FormInput 
                                            type="text" 
                                            placeholder="교회 이름 입력 (예: 서울북부)" 
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSearchChurch()}
                                        />
                                        <button 
                                            onClick={handleSearchChurch}
                                            style={{ flex: 'none', padding: '10px 16px', background: 'var(--sba-text)', color: 'var(--sba-bg)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            검색
                                        </button>
                                    </div>
                                </FormField>

                                {searchResults.length > 0 && (
                                    <FormField>
                                        <FormLabel>검색 결과 ({searchResults.length}건)</FormLabel>
                                        <SearchResultList>
                                            {searchResults.map(c => (
                                                <SearchResultItem 
                                                    key={c.id} 
                                                    $selected={selectedChurch?.id === c.id}
                                                    onClick={() => setSelectedChurch(c)}
                                                >
                                                    <span>{c.name}</span>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--sba-text-secondary)' }}>
                                                        {c.invite_code ? '초대코드 필요' : '공개'}
                                                    </span>
                                                </SearchResultItem>
                                            ))}
                                        </SearchResultList>
                                    </FormField>
                                )}

                                {selectedChurch && selectedChurch.invite_code && (
                                    <FormField>
                                        <FormLabel>초대 코드 (Invite Code)</FormLabel>
                                        <FormInput 
                                            type="password" 
                                            placeholder="교회 관리자에게 받은 초대 코드를 입력해 주세요." 
                                            value={inviteCode}
                                            onChange={e => setInviteCode(e.target.value)}
                                        />
                                    </FormField>
                                )}

                                <ActionButton 
                                    onClick={handleJoinChurch}
                                    disabled={!selectedChurch || submitting}
                                    style={{ marginTop: '12px' }}
                                >
                                    {submitting ? '가입 처리 중...' : selectedChurch ? `'${selectedChurch.name}' 가입하기` : '가입할 교회를 선택해 주세요'}
                                </ActionButton>
                            </>
                        ) : (
                            <>
                                <FormField>
                                    <FormLabel>교회 이름</FormLabel>
                                    <FormInput 
                                        type="text" 
                                        placeholder="예: 서울북부교회" 
                                        value={newChurchName}
                                        onChange={e => setNewChurchName(e.target.value)}
                                    />
                                </FormField>

                                <FormField>
                                    <FormLabel>초대 코드 (선택)</FormLabel>
                                    <FormInput 
                                        type="text" 
                                        placeholder="가입 시 필수로 요구할 비밀 코드를 입력하세요." 
                                        value={newInviteCode}
                                        onChange={e => setNewInviteCode(e.target.value)}
                                    />
                                </FormField>

                                <FormField>
                                    <FormLabel>교회 공개 여부</FormLabel>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                        <input 
                                            type="checkbox" 
                                            id="isPublic"
                                            checked={newIsPublic} 
                                            onChange={e => setNewIsPublic(e.target.checked)} 
                                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                        />
                                        <label htmlFor="isPublic" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>교회 검색 목록에 노출합니다.</label>
                                    </div>
                                </FormField>

                                <FormField>
                                    <FormLabel>대표 테마 색상</FormLabel>
                                    <ColorPresetGroup>
                                        {colorPresets.map(color => (
                                            <ColorCircle 
                                                key={color} 
                                                $color={color} 
                                                $active={newThemeColor === color}
                                                onClick={() => setNewThemeColor(color)}
                                            />
                                        ))}
                                    </ColorPresetGroup>
                                </FormField>

                                <ActionButton 
                                    onClick={handleCreateChurch}
                                    disabled={!newChurchName.trim() || submitting}
                                    style={{ marginTop: '12px' }}
                                >
                                    {submitting ? '교회 개설 중...' : '교회 개설하고 가입하기'}
                                </ActionButton>
                            </>
                        )}
                        
                        <button 
                            onClick={() => supabase.auth.signOut()}
                            style={{ width: '100%', border: 'none', background: 'transparent', color: 'var(--sba-text-secondary)', fontSize: '0.8rem', marginTop: '16px', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            로그아웃 (다른 계정으로 로그인)
                        </button>
                    </OnboardingCard>
                    
                    {/* 토스트 팝업 렌더러 */}
                    <div className="sba-toast-container">
                        {toasts.map(t => (
                            <div key={t.id} className="sba-toast">{t.message}</div>
                        ))}
                    </div>
                </OnboardingOverlay>
            </ThemeProvider>
        );
    }

    // 3. 정상 접속 화면 (로그인 완료 + 소속 교회 존재)
    return (
        <ThemeProvider theme={theme}>
            <GlobalStyle />
            <SbaStyledWrapper className={`sba-app-container ${isDark ? 'dark' : ''}`}>
        <GlobalStyle />
                {isSplashVisible && (
                    <div className={`sba-splash-screen ${isSplashFading ? 'fade-out' : ''}`}>
                        <div className="sba-splash-content">
                            <h1 className="sba-splash-main-title">
                                <DecryptedText text={userChurch.name} speed={15} maxIterations={4} />
                            </h1>
                            <h2 className="sba-splash-sub-title">
                                <DecryptedText text="QT & 통독" speed={20} maxIterations={4} />
                            </h2>
                            <p className="sba-splash-desc">
                                <DecryptedText text="말씀으로 하루를 여는 은혜의 시간" speed={20} maxIterations={4} />
                            </p>
                        </div>
                        <div className="sba-splash-footer">
                            개발: leewish
                        </div>
                    </div>
                )}

                <TopHeader 
                    currentDate={effectiveDate} 
                    setCurrentDate={setCurrentDate}
                    onOpenCalendar={() => setShowCalendar(true)} 
                    session={session}
                    onOpenAuth={() => setShowAuth(true)}
                    onOpenSettings={() => setShowSettings(true)}
                    addToast={addToast}
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
                    dailyPlans={dailyPlans}
                />
                
                <SettingsModal 
                    isOpen={showSettings} 
                    onClose={() => setShowSettings(false)} 
                    isDark={isDark}
                    setIsDark={setIsDark}
                    addToast={addToast}
                    session={session}
                    userChurch={userChurch}
                    setUserChurch={setUserChurch}
                    scheduleData={scheduleData}
                    loadSchedule={loadSchedule}
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
            </div>
        </ThemeProvider>
    );
}

