import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const ICONS = {
    today: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>,
    reading: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/><path d="m9 10 2 2 4-4"/></svg>,
    bookmarks: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>,
    weekly: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    sharing: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
};

export function TopHeader({ currentDate, setCurrentDate, onOpenCalendar, session, onOpenAuth, onOpenSettings, addToast }) {
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

export function BottomNav({ activeTab, setActiveTab }) {
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

export function AppFooter() {
    return (
        <footer style={{ textAlign: 'center', padding: '40px 20px 80px', color: 'var(--sba-text-muted)', fontSize: '0.75rem', lineHeight: '1.6', background: 'transparent' }}>
            <p style={{margin: '0 0 4px'}}>Based on <b>서울북부교회</b> Reading Schedule</p>
            <p style={{margin: '0 0 4px'}}>Developed by <b>leewish</b></p>
            <p style={{margin: '0 0 4px'}}>문의 및 피드백: <a href="mailto:lekas1217@gmail.com" style={{color: 'var(--sba-text-muted)', textDecoration:'underline'}}>lekas1217@gmail.com</a></p>
        </footer>
    );
}
