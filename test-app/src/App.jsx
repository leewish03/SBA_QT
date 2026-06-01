import React, { useState, useEffect, useMemo } from 'react';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
import './SBA_QT.css';

import { getMidnightKST, FULL_TO_SHORT, DAYS_ARR, getEffectiveDate, safeToISODateString, calcQtDays } from './utils/bibleLogic';
import { TopHeader, BottomNav, AppFooter } from './components/NavComponents';
import { TabToday, TabReading, TabBookmarks, SharingTab } from './components/TabComponents';
import { TabWeekly, SettingsModal, CalendarModal, AuthModal, PushPromptModal } from './components/WeeklyAndModals';
import { supabase } from './utils/supabaseClient';
import { syncLocalDataToCloud } from './utils/syncManager';
import { DecryptedText } from './components/ReactBits';

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

export default function App() {
    const [scheduleData, setScheduleData] = useState(null);
    const [currentDate, setCurrentDate] = useState(getEffectiveDate());
    const [activeTab, setActiveTab] = useState('today');

    // 묵상 시작 기준일은 원래의 올바른 시작일인 2024-12-17로 시스템 수준에서 영구 고정합니다.
    const START_DATE_STR = '2024-12-17';

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
    const [showPushPrompt, setShowPushPrompt] = useState(false);
    
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

    // 소속 교회 확인 및 라우팅 처리 통합 함수
    const handleRoutingAndLoad = async () => {
        setCheckingChurch(true);
        try {
            // 1. 세션 복구
            const { data: { session: curSession } } = await supabase.auth.getSession();
            if (curSession) {
                setSession(curSession);
            }

            // 2. URL 경로 파싱
            const pathParts = window.location.pathname.split('/').filter(Boolean);
            const slug = pathParts[0] || '';

            if (!slug) {
                // 루트 (/) 진입 시 지능형 리다이렉션
                if (curSession) {
                    // 로그인 사용자 (1순위): 본인 소속 교회 조회
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
                    const res = await fetch('/api/churches/mine', { headers });
                    if (res.ok) {
                        const mine = await res.json();
                        if (mine && mine.slug) {
                            window.location.replace(`/${mine.slug}`);
                            return;
                        }
                    }
                }

                // 비로그인 사용자 또는 소속 교회가 없는 로그인 사용자 (2순위): 로컬 캐시 조회
                const lastVisited = localStorage.getItem('sba_last_visited_church');
                if (lastVisited) {
                    window.location.replace(`/${lastVisited}`);
                    return;
                }

                // 최초 방문자 (3순위): 기본값으로 /seoul-north 리다이렉트
                window.location.replace('/seoul-north');
                return;
            }

            // 하위 경로 (/slug) 진입 시
            const res = await fetch(`/api/churches?slug=${slug}`);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            if (data && data.length > 0) {
                let church = data[0];
                setUserChurch(church);
                localStorage.setItem('sba_last_visited_church', slug);

                // 로그인된 사용자라면, 소속 교회 멤버십 연동 처리
                if (curSession) {
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
                        
                        // 현재 가입된 교회가 있는지 조회
                        const mineRes = await fetch('/api/churches/mine', { headers });
                        let mine = mineRes.ok ? await mineRes.json() : null;

                        // 소속이 없거나, 다른 교회인 경우 자동 가입(멤버십 연동) 및 동기화 수행
                        if (!mine || mine.id !== church.id) {
                            await fetch('/api/churches/join', {
                                method: 'POST',
                                headers: {
                                    ...headers,
                                    'Authorization': headers['Authorization'] || `Bearer ${curSession.access_token}`
                                },
                                body: JSON.stringify({ church_id: church.id })
                            });
                            addToast(`'${church.name}' 교회 소속으로 연동되었습니다.`);
                            // 다시 mine을 불러와 role을 세팅
                            const newMineRes = await fetch('/api/churches/mine', { headers });
                            mine = newMineRes.ok ? await newMineRes.json() : null;
                        }
                        
                        if (mine && mine.id === church.id) {
                            setUserChurch({ ...church, role: mine.role });
                        }
                    } catch (err) {
                        console.error('교회 멤버십 자동 연동 실패:', err);
                    }
                }
            } else {
                console.warn(`유효하지 않은 교회 슬러그: ${slug}. 서울북부교회로 이동합니다.`);
                window.location.replace('/seoul-north');
                return;
            }
        } catch (err) {
            console.error('라우팅 및 교회 로드 실패:', err);
            addToast('교회 정보를 불러오지 못했습니다.');
        } finally {
            setCheckingChurch(false);
        }
    };

    // 소속 교회 확인 함수 (가입/개설 후 호출용)
    const fetchUserChurch = async (userId) => {
        try {
            const headers = { 'Content-Type': 'application/json' };
            const authKey = 'sb-ebfpjvwwbognddixrvyc-auth-token';
            const savedSession = localStorage.getItem(authKey);
            let token = session?.access_token;
            if (savedSession) {
                try {
                    const parsed = JSON.parse(savedSession);
                    if (parsed?.access_token) {
                        token = parsed.access_token;
                    }
                } catch (e) {}
            }
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const mineRes = await fetch('/api/churches/mine', { headers });
            if (mineRes.ok) {
                const mine = await mineRes.json();
                if (mine) {
                    setUserChurch(mine);
                    if (mine.slug) {
                        localStorage.setItem('sba_last_visited_church', mine.slug);
                        const pathParts = window.location.pathname.split('/').filter(Boolean);
                        const curSlug = pathParts[0] || '';
                        if (curSlug !== mine.slug) {
                            window.location.replace(`/${mine.slug}`);
                        }
                    }
                } else {
                    setUserChurch(null);
                }
            }
        } catch (err) {
            console.error('fetchUserChurch error:', err);
        }
    };

    // 마운트 시 최초 라우팅 및 세션 복구 수행
    useEffect(() => {
        handleRoutingAndLoad();
    }, []);

    // 1. Supabase Auth 상태 실시간 감지
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, curSession) => {
            setSession(curSession);
            // 만약 로그인 이벤트라면 라우팅/멤버십 연동 재수행
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                handleRoutingAndLoad();
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    // 2. 세션 변화에 따른 데이터 동기화 관리
    useEffect(() => {
        if (!session) {
            lastSyncedUserRef.current = null;
            return;
        }

        const userId = session.user.id;
        if (lastSyncedUserRef.current === userId) {
            return;
        }
        lastSyncedUserRef.current = userId;

        const syncSessionData = async () => {
            if (session.user.user_metadata) {
                const meta = session.user.user_metadata;
                if (meta.sba_qt_alarm_enabled !== undefined) {
                    localStorage.setItem('sba_qt_alarm_enabled', String(meta.sba_qt_alarm_enabled));
                }
                if (meta.sba_qt_alarm_time) {
                    localStorage.setItem('sba_qt_alarm_time', meta.sba_qt_alarm_time);
                }
            }

            // 로컬-클라우드 데이터 동기화
            const res = await syncLocalDataToCloud();
            if (res.success) {
                addToast('소셜 클라우드와 북마크/메모가 동기화되었습니다.');
                setBookmarkTrigger(prev => prev + 1);
            }
        };

        syncSessionData();
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

    // 스케줄 데이터 로딩 함수 (구글 시트 연동 및 로컬 폴백)
    const loadSchedule = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchWithRetry('/api/sba-qt');
            setScheduleData(data);
        } catch (err) {
            console.warn("백엔드 API 호출 실패, 로컬 폴백 데이터를 로드합니다.", err);
            try {
                const fallbackData = await fetchWithRetry('/fallback_schedule.json');
                setScheduleData(fallbackData);
            } catch (fallbackErr) {
                console.error("폴백 데이터 로드 실패:", fallbackErr);
                setError("일정 데이터를 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.");
            }
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
        // 첫 진입 시 히스토리 및 불필요한 시작일 로컬스토리지 캐시 초기화
        window.history.replaceState({ tab: activeTab }, '');
        localStorage.removeItem('sba_qt_start_date');

        // 서비스 워커 등록
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('Service Worker 등록 성공:', reg.scope))
                .catch(err => console.error('Service Worker 등록 실패:', err));
        }

        // 스플래시 애니메이션 타이머
        const fadeTimer = setTimeout(() => setIsSplashFading(true), 2200);
        const removeTimer = setTimeout(() => setIsSplashVisible(false), 3000);

        // 알림 권한 유도 팝업 타이머 (스플래시 제거 후 2초인 5000ms 시점)
        const promptTimer = setTimeout(() => {
            if (Notification.permission === 'default' && localStorage.getItem('sba_qt_push_prompt_dismissed') !== 'true') {
                setShowPushPrompt(true);
            }
        }, 5000);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(removeTimer);
            clearTimeout(promptTimer);
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

    // 주간 7일간의 일정 계산 (구글 시트 연동 방식)
    const dailyPlans = useMemo(() => {
        if (!scheduleData || !scheduleData.qt_plan || !scheduleData.reading_plan) return {};
        
        const diffToMonday = weekDayIdx === 0 ? -6 : 1 - weekDayIdx;
        const plans = {};
        const parsedStartDate = new Date(START_DATE_STR);
        const startKST = getMidnightKST(
            parsedStartDate instanceof Date && !isNaN(parsedStartDate.getTime()) 
                ? parsedStartDate 
                : new Date('2024-12-17')
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
                            oldPlan = { 
                                abbrev: FULL_TO_SHORT[row.chapter] || row.chapter, 
                                verse: verse.toString(),
                                start_verse: 1,
                                end_verse: 30, // 기본값
                                title: `${row.chapter} ${verse}장`
                            };
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
                newPlan = { 
                    books: readingRow.chapter.replace(/"/g,'').split(',').map(b => b.trim()), 
                    verseRaw: readingRow.verse 
                };
            }

            plans[dKey] = { dayName, old: oldPlan, new: newPlan, dateObj: d };
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

    // 북마크 구절 클릭 시 해당 일정 날짜/탭 역추적 및 포커싱 이동 (구글 시트 연동 방식)
    const handleNavigateToVerse = (book, chapter, verse) => {
        let targetDateObj = new Date();
        let targetTab = 'today';
        let found = false;

        if (scheduleData) {
            // 1. 묵상(QT)에서 검색
            const parsedStartDate = new Date(START_DATE_STR);
            const startKST = getMidnightKST(
                parsedStartDate instanceof Date && !isNaN(parsedStartDate.getTime()) 
                    ? parsedStartDate 
                    : new Date('2024-12-17')
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
            if (!found && scheduleData.reading_plan) {
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
                        onOpenAuthModal={() => setShowAuth(true)}
                    />
                );
            case 'reading':
                return (
                    <TabReading 
                        todayPlan={currentPlan} 
                        session={session} 
                        addToast={addToast}
                        onBookmarkChange={() => setBookmarkTrigger(prev => prev + 1)}
                        onOpenAuthModal={() => setShowAuth(true)}
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
    if (checkingChurch || !userChurch) {
        return (
            <ThemeProvider theme={theme}>
                <GlobalStyle />
                <OnboardingOverlay>
                    <div className="sba-loading">교회 정보를 조회하는 중...</div>
                </OnboardingOverlay>
            </ThemeProvider>
        );
    }

    // 3. 정상 접속 화면 (로그인 완료 + 소속 교회 존재)
    return (
        <ThemeProvider theme={theme}>
            <GlobalStyle />
            <div className={`sba-app-container ${isDark ? 'dark' : ''}`}>
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

                <PushPromptModal
                    isOpen={showPushPrompt}
                    onClose={() => setShowPushPrompt(false)}
                    session={session}
                    userChurch={userChurch}
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
