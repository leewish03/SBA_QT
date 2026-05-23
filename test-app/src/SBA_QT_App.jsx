import React, { useState, useEffect, useMemo } from 'react';
import './SBA_QT.css';

import { getMidnightKST, calcQtDays, FULL_TO_SHORT, DAYS_ARR, getEffectiveDate, safeToISODateString } from './utils/bibleLogic';
import { TopHeader, BottomNav, AppFooter } from './components/NavComponents';
import { TabToday, TabReading, TabBookmarks, SharingTab } from './components/TabComponents';
import { TabWeekly, SettingsModal, CalendarModal, AuthModal } from './components/WeeklyAndModals';
import { supabase } from './utils/supabaseClient';
import { syncLocalDataToCloud } from './utils/syncManager';
import { DecryptedText } from './components/ReactBits';

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

    // 뒤로가기(popstate) 제어용 상태
    const [isPopStateActive, setIsPopStateActive] = useState(false);
    const loadDateStrRef = React.useRef(safeToISODateString(getEffectiveDate()));

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
    const [showSettings, setShowSettings] = useState(false);
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
        const syncAlarmSettingsFromMetadata = (sess) => {
            if (sess && sess.user && sess.user.user_metadata) {
                const meta = sess.user.user_metadata;
                if (meta.sba_qt_alarm_enabled !== undefined) {
                    localStorage.setItem('sba_qt_alarm_enabled', String(meta.sba_qt_alarm_enabled));
                }
                if (meta.sba_qt_alarm_time) {
                    localStorage.setItem('sba_qt_alarm_time', meta.sba_qt_alarm_time);
                }
            }
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                syncAlarmSettingsFromMetadata(session);
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
                syncAlarmSettingsFromMetadata(session);
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
                        const notification = new Notification("서울북부교회 QT & 통독", {
                            body: "오늘의 큐티 말씀이 도착했습니다. 말씀과 함께 은혜로운 하루를 시작해 보세요!",
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
        
        // 첫 진입 시 히스토리 초기화
        window.history.replaceState({ tab: activeTab }, '');

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
                // 모달만 닫고 히스토리 스택 원복
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

    // 렌더링 안전성 보장 (State 유효 체크 및 복구)
    const effectiveDate = useMemo(() => {
        if (currentDate instanceof Date && !isNaN(currentDate.getTime())) {
            return currentDate;
        }
        console.error("Invalid Date가 감지되어 강제 복구를 실행합니다.");
        return getMidnightKST(new Date());
    }, [currentDate]);

    // 비동기 갱신 시점에 Invalid Date 상태가 기록된 경우 감지하여 정화
    useEffect(() => {
        if (!currentDate || isNaN(currentDate.getTime())) {
            setCurrentDate(getMidnightKST(new Date()));
        }
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
            setShowSettings(true);
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
                        
                        // 일요일을 제외하고 daysElapsed 경과한 날짜를 구함
                        let current = new Date(startKST.getTime());
                        let elapsedCount = 0;
                        let targetD = null;
                        while (true) {
                            if (current.getUTCDay() !== 0) {
                                elapsedCount++;
                                if (elapsedCount === daysElapsed) {
                                    targetD = new Date(current.getTime());
                                    break;
                                }
                            }
                            current.setUTCDate(current.getUTCDate() + 1);
                        }

                        if (targetD && !isNaN(targetD.getTime())) {
                            // targetDateObj는 currentDate 상태로 세팅되므로 로컬 타임존 기준으로 생성하여 날짜 밀림/요일 꼬임 방지
                            targetDateObj = new Date(targetD.getUTCFullYear(), targetD.getUTCMonth(), targetD.getUTCDate());
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
                            targetDateObj = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
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
                        session={session}
                        onOpenAuthModal={() => setShowAuth(true)}
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
        <div className={`sba-app-container ${isDark ? 'dark' : ''}`}>
            {isSplashVisible && (
                <div className={`sba-splash-screen ${isSplashFading ? 'fade-out' : ''}`}>
                    <div className="sba-splash-content">
                        <h1 className="sba-splash-main-title">
                            <DecryptedText text="서울북부교회" speed={15} maxIterations={4} />
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
            />
            
            <SettingsModal 
                isOpen={showSettings} 
                onClose={() => setShowSettings(false)} 
                isDark={isDark}
                setIsDark={setIsDark}
                startDateStr={startDateStr} 
                setStartDateStr={handleSetStartDateStr}
                addToast={addToast}
                session={session}
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
