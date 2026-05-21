import React, { useState, useEffect, useMemo } from 'react';
import './SBA_QT.css';

import { getMidnightKST, calcQtDays, FULL_TO_SHORT, DAYS_ARR, getEffectiveDate } from './utils/bibleLogic';
import { TopHeader, BottomNav, AppFooter } from './components/NavComponents';
import { TabToday, TabReading, TabBookmarks, SharingTab } from './components/TabComponents';
import { TabWeekly, AdminModal, CalendarModal, AuthModal } from './components/WeeklyAndModals';
import { supabase } from './utils/supabaseClient';
import { syncLocalDataToCloud } from './utils/syncManager';

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

export default function SBA_QT_App() {
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

    const targetKST = getMidnightKST(currentDate);
    const weekDayIdx = targetKST.getUTCDay();

    // 주간 7일간의 일정 계산 (O(1))
    const dailyPlans = useMemo(() => {
        if (!scheduleData) return {};
        
        const diffToMonday = weekDayIdx === 0 ? -6 : 1 - weekDayIdx;
        const plans = {};
        const startKST = getMidnightKST(new Date(startDateStr));

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
        setCurrentDate(dateObj);
        setActiveTab('today');
    };

    const handleSetDate = (newDate) => {
        setCurrentDate(newDate);
        setShowCalendar(false);
    };

    // 북마크 구절 클릭 시 해당 일정 날짜/탭 역추적 및 포커싱 이동
    const handleNavigateToVerse = (book, chapter, verse) => {
        let targetDateObj = new Date();
        let targetTab = 'today';
        let found = false;

        if (scheduleData) {
            // 1. 묵상(QT) 계획에서 검색
            const startKST = getMidnightKST(new Date(startDateStr));
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
                    targetDateObj = d;
                    targetTab = 'today';
                    found = true;
                    break;
                }
                count += paras;
            }

            // 2. 통독 계획에서 검색 (묵상에서 발견되지 않은 경우)
            if (!found) {
                for (const row of scheduleData.reading_plan) {
                    const books = row.chapter.replace(/"/g,'').split(',').map(b => b.trim());
                    if (books.includes(book)) {
                        const d = getMidnightKST(new Date());
                        d.setUTCMonth(parseInt(row.month) - 1);
                        d.setUTCDate(parseInt(row.day));
                        targetDateObj = d;
                        targetTab = 'reading';
                        found = true;
                        break;
                    }
                }
            }
        }

        // 해당 일정 날짜와 탭으로 강제 전환
        setCurrentDate(targetDateObj);
        setActiveTab(targetTab);

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
                    />
                );
            case 'weekly':
                return (
                    <TabWeekly 
                        dailyPlans={dailyPlans} 
                        currentDate={currentDate} 
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
        <div className={`sba-app-container ${isDark ? 'dark' : ''}`}>
            {isSplashVisible && (
                <div className={`sba-splash-screen ${isSplashFading ? 'fade-out' : ''}`}>
                    <div className="sba-splash-content">
                        <div className="sba-splash-main-title">서울북부교회</div>
                        <div className="sba-splash-sub-title">QT & 통독</div>
                        <div className="sba-splash-desc">말씀으로 하루를 여는 은혜의 시간</div>
                    </div>
                    <div className="sba-splash-footer">
                        개발: 이소원 형제
                    </div>
                </div>
            )}

            <TopHeader 
                currentDate={currentDate} 
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
                currentDate={currentDate} 
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
        </div>
    );
}
