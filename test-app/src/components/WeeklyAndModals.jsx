import React, { useState, useEffect } from 'react';
import { calcQtDays, getEffectiveDate, SHORT_TO_FULL } from '../utils/bibleLogic';
import { supabase } from '../utils/supabaseClient';

// ==========================================
// 1. TabWeekly (주간 탭)
// ==========================================
export function TabWeekly({ dailyPlans, currentDate, onCardClick }) {
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
// 2. AdminModal (관리자 모달)
// ==========================================
export function AdminModal({ isOpen, onClose, startDateStr, setStartDateStr, addToast }) {
    const [token, setToken] = useState('sba_qt_admin_secret_token');
    const [syncing, setSyncing] = useState(false);

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

    return (
        <div className="sba-modal-overlay" onClick={onClose}>
            <div className="sba-modal-content" onClick={e => e.stopPropagation()}>
                <h3 style={{marginTop: 0, borderBottom: '1px solid var(--sba-border)', paddingBottom: '10px'}}>관리자 설정 (Admin)</h3>
                <p style={{fontSize: '0.9rem', color: 'var(--sba-text-secondary)'}}>큐티 기준일 변경 및 시트 캐시 초기화</p>
                <div style={{marginTop: '16px'}}>
                    <label style={{display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '0.9rem'}}>시작 기준일 (localStorage)</label>
                    <input 
                        type="date" 
                        value={startDateStr} 
                        onChange={e => setStartDateStr(e.target.value)}
                        className="sba-input"
                    />
                </div>
                <div style={{marginTop: '16px'}}>
                    <label style={{display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '0.9rem'}}>Purge 관리자 토큰</label>
                    <input 
                        type="password" 
                        value={token} 
                        onChange={e => setToken(e.target.value)}
                        className="sba-input"
                    />
                </div>
                <button className="sba-btn" onClick={handleSync} disabled={syncing} style={{background: '#d97706', color: '#fff'}}>
                    {syncing ? '구글 시트 즉시 갱신 중...' : '구글 시트 즉시 동기화 (Purge)'}
                </button>
                <button className="sba-btn" onClick={onClose}>
                    닫기 및 저장
                </button>
            </div>
        </div>
    );
}

// ==========================================
// 3. CalendarModal (커스텀 달력 모달 - 펜 아이콘 렌더링 지원)
// ==========================================
export function CalendarModal({ isOpen, onClose, currentDate, onSetDate }) {
    const [noteDates, setNoteDates] = useState(new Set());
    const [viewDate, setViewDate] = useState(new Date(currentDate));

    if (!isOpen) return null;

    useEffect(() => {
        // 로컬스토리지에서 메모가 있는 날짜 목록 파싱
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

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    // 이달의 첫 요일
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = getDaysInMonth(year, month);
    
    // 달력 칸 생성
    const days = [];
    // 빈칸 채우기
    for (let i = 0; i < firstDayIndex; i++) {
        days.push(null);
    }
    // 날짜 채우기
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
        <div className="sba-modal-overlay" onClick={onClose}>
            <div className="sba-modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '350px'}}>
                <h3 style={{marginTop: 0, marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span>날짜 이동</span>
                    <span style={{fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--sba-text-secondary)'}}>✏️ 메모 있음</span>
                </h3>
                
                {/* 캘린더 네비게이션 */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                    <button onClick={prevMonth} style={{background: 'none', border: 'none', color: 'var(--sba-text)', cursor: 'pointer', padding: '4px 8px', fontSize: '1rem'}}>◀</button>
                    <span style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{year}년 {month + 1}월</span>
                    <button onClick={nextMonth} style={{background: 'none', border: 'none', color: 'var(--sba-text)', cursor: 'pointer', padding: '4px 8px', fontSize: '1rem'}}>▶</button>
                </div>

                {/* 캘린더 요일 헤더 */}
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '8px'}}>
                    {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                        <span key={d} style={{color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : 'var(--sba-text-secondary)'}}>{d}</span>
                    ))}
                </div>

                {/* 캘린더 그리드 */}
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: '6px', textAlign: 'center'}}>
                    {days.map((date, idx) => {
                        if (!date) return <div key={`empty-${idx}`} />;
                        
                        const dateStr = date.toISOString().split('T')[0];
                        const isSelected = dateStr === currentDate.toISOString().split('T')[0];
                        const hasNote = noteDates.has(dateStr);
                        
                        return (
                            <div 
                                key={dateStr}
                                onClick={() => handleSelectDate(date)}
                                style={{
                                    padding: '6px 0',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    fontSize: '0.9rem',
                                    background: isSelected ? 'var(--sba-text)' : 'transparent',
                                    color: isSelected ? 'var(--sba-bg)' : 'var(--sba-text)',
                                    fontWeight: isSelected ? 'bold' : 'normal',
                                }}
                            >
                                {date.getDate()}
                                {hasNote && !isSelected && (
                                    <span style={{
                                        position: 'absolute',
                                        bottom: '1px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        fontSize: '0.5rem'
                                    }}>✏️</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div style={{display: 'flex', gap: '8px', marginTop: '16px'}}>
                    <button 
                        className="sba-btn" 
                        style={{marginTop: 0, flex: 1, background: 'var(--sba-card-sub-bg)', color: 'var(--sba-text)', border: '1px solid var(--sba-border)'}}
                        onClick={() => {
                            onSetDate(getEffectiveDate());
                            onClose();
                        }}
                    >
                        오늘 날짜로 복귀
                    </button>
                    <button className="sba-btn" style={{marginTop: 0, flex: 1}} onClick={onClose}>
                        취소
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 4. AuthModal (소셜 로그인 모달 - 신설)
// ==========================================
export function AuthModal({ isOpen, onClose, addToast }) {
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
        <div className="sba-modal-overlay" onClick={onClose}>
            <div className="sba-modal-content" onClick={e => e.stopPropagation()} style={{textAlign: 'center'}}>
                <h3 style={{marginTop: 0, borderBottom: '1px solid var(--sba-border)', paddingBottom: '10px'}}>로그인</h3>
                <p style={{fontSize: '0.9rem', color: 'var(--sba-text-secondary)', marginBottom: '24px'}}>
                    소셜 로그인으로 로그인하시면 작성하신 북마크와 메모가 안전하게 클라우드에 백업되어 다른 기기에서도 자유롭게 연동됩니다.
                </p>
                
                <button className="sba-auth-btn google" onClick={() => handleOAuthLogin('google')}>
                    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.04c1.74 0 3.3.6 4.53 1.78l3.38-3.38C17.86 1.54 15.17 1 12 1 7.24 1 3.2 3.82 1.34 7.92l3.96 3.07C6.26 7.63 8.92 5.04 12 5.04z"/><path fill="#4285F4" d="M23.49 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.69 2.87c2.16-2 3.74-4.94 3.74-8.58z"/><path fill="#FBBC05" d="M5.3 14.79a7.16 7.16 0 0 1 0-4.54L1.34 7.18a11.96 11.96 0 0 0 0 9.64l3.96-3.03z"/><path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.69-2.87c-1.02.68-2.33 1.09-4.27 1.09-3.08 0-5.74-2.59-6.7-5.96L1.34 15.38C3.2 19.48 7.24 23 12 23z"/></svg>
                    Google로 시작하기
                </button>
                
                <button className="sba-auth-btn kakao" onClick={() => handleOAuthLogin('kakao')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c-4.97 0-9 3.185-9 7.11 0 2.507 1.644 4.717 4.148 5.918-.173.65-.626 2.34-.716 2.684-.112.433.155.427.327.311.135-.09 2.148-1.464 3.003-2.046C10.428 17.054 11.2 17.11 12 17.11c4.97 0 9-3.185 9-7.11C21 6.185 16.97 3 12 3z"/></svg>
                    카카오로 시작하기
                </button>

                <p style={{fontSize: '0.8rem', color: 'var(--sba-text-muted)', marginTop: '20px', textDecoration: 'underline', cursor: 'pointer'}} onClick={onClose}>
                    로그인 없이 계속 사용하기 (로컬 저장)
                </p>
            </div>
        </div>
    );
}
