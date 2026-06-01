import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { calcQtDays, getEffectiveDate, SHORT_TO_FULL, safeToISODateString, BIBLE_BOOKS } from '../utils/bibleLogic';
import { supabase } from '../utils/supabaseClient';
import { SpotlightCard } from './ReactBits';

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

export function SettingsModal({ isOpen, onClose, isDark, setIsDark, addToast, session, userChurch, setUserChurch, scheduleData, loadSchedule, startDateStr, setStartDateStr }) {
    if (!isOpen) return null;
    const [syncing, setSyncing] = useState(false);
    const [stats, setStats] = useState({ bookmarks: 0, notes: 0 });
    const [localStartDate, setLocalStartDate] = useState(startDateStr);

    const handleClose = () => {
        if (localStartDate && localStartDate !== startDateStr) {
            setStartDateStr(localStartDate);
        }
        onClose();
    };
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

    // Purge 관리자 토큰 상태 정의
    const [token, setToken] = useState(() => {
        return localStorage.getItem('sba_qt_admin_token') || 'sba_qt_admin_secret_token';
    });

    const [alarmHour, alarmMinute] = alarmTime.split(':');

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
            if (session) {
                checkPushSubscriptionStatus();
            }
        }
    }, [isOpen, session]);

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

    // 구글 스프레드시트 즉시 동기화 (Purge) 요청
    const handleSync = async () => {
        setSyncing(true);
        try {
            localStorage.setItem('sba_qt_admin_token', token);
            const headers = {};
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }
            const res = await fetch(`/api/sba-qt?purge=true&token=${token}`, { headers });
            if (res.ok) {
                addToast('구글 스프레드시트 데이터가 즉시 강제 갱신(Purge)되었습니다.');
                if (loadSchedule) loadSchedule();
                onClose();
            } else {
                let errText = '알 수 없는 오류';
                try {
                    const errData = await res.json();
                    errText = errData.error || errText;
                } catch (e) {}
                alert(`동기화 실패: ${errText}`);
            }
        } catch (e) {
            console.error(e);
            alert('API 호출 도중 오류가 발생했습니다.');
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
        localStorage.removeItem('sba_qt_start_date');
        addToast('로컬 데이터가 완전히 초기화되었습니다.');
        window.location.reload();
    };

    return (
        <ModalOverlay onClick={handleClose}>
            <ModalContent onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', width: '95%' }}>
                <ModalHeader>
                    <ModalTitle>설정 (Settings)</ModalTitle>
                    <ModalCloseButton data-qa="settings-close-btn" onClick={handleClose}>✕</ModalCloseButton>
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

                {/* 묵상 시작 기준일 설정 */}
                <div style={{ borderTop: '1px dashed var(--sba-border-strong)', paddingTop: '16px', marginTop: '16px' }}>
                    <FormGroup>
                        <FormLabel>묵상 기준일 설정 (startDateStr)</FormLabel>
                        <FormInput 
                            type="date" 
                            value={localStartDate}
                            onChange={e => setLocalStartDate(e.target.value)}
                        />
                    </FormGroup>
                </div>

                {/* 교회 관리자용 대시보드 버튼 */}
                {isAdmin && (
                    <div style={{ borderTop: '1px dashed var(--sba-border-strong)', paddingTop: '16px', marginTop: '16px' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--sba-text-secondary)', margin: '0 0 12px 0' }}>
                            <b>교회 관리자 대시보드</b>
                        </p>
                        <FormGroup>
                            <FormLabel>Purge 관리자 토큰</FormLabel>
                            <FormInput 
                                type="password" 
                                value={token} 
                                onChange={e => setToken(e.target.value)}
                            />
                        </FormGroup>
                        <ButtonGroup style={{ display: 'flex', gap: '8px' }}>
                            <ShadButton onClick={handleSync} disabled={syncing} $variant="accent">
                                {syncing ? '구글 시트 최신화 중...' : '구글 스프레드시트 캐시 갱신 (Purge)'}
                            </ShadButton>
                        </ButtonGroup>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--sba-text-secondary)', margin: '16px 0 8px', borderTop: '1px solid var(--sba-border)', paddingTop: '12px' }}>
                    <span>북마크: {stats.bookmarks}개 | 메모: {stats.notes}개</span>
                    <DeleteTextButton style={{ color: 'var(--sba-text)' }} onClick={handleClearLocalCache}>로컬 데이터 초기화</DeleteTextButton>
                </div>
                
                <ButtonGroup style={{ marginTop: '20px' }}>
                    <ShadButton data-qa="settings-confirm-btn" onClick={handleClose}>
                        확인
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

export function CalendarModal({ isOpen, onClose, currentDate, onSetDate, dailyPlans }) {
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
                                        data-qa="calendar-day-cell"
                                        data-date={date.getDate()}
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
export const Accordion = styled.div`
  border: 1px solid var(--sba-border-strong);
  border-radius: 8px;
  overflow: hidden;
  background: var(--sba-card-bg);
  width: 100%;
`;

export const AccordionItem = styled.div`
  border-bottom: 1px solid var(--sba-border);
  &:last-child {
    border-bottom: none;
  }
`;

export const AccordionTrigger = styled.button`
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

export const AccordionContent = styled.div`
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
export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 0.875rem;
  text-align: left;
  border: 1px solid var(--sba-border-strong);
  border-radius: 8px;
  overflow: hidden;
`;

export const TableHeader = styled.thead`
  background-color: var(--sba-card-sub-bg);
  border-bottom: 2px solid var(--sba-border-strong);
`;

export const TableRow = styled.tr`
  border-bottom: 1px solid var(--sba-border);
  transition: background-color 0.15s ease;

  &:hover {
    background-color: var(--sba-card-active);
  }

  &:last-child {
    border-bottom: none;
  }
`;

export const TableHead = styled.th`
  padding: 12px 16px;
  font-weight: 600;
  color: var(--sba-text);
`;

export const TableBody = styled.tbody`
  background-color: var(--sba-card-bg);
`;

export const TableCell = styled.td`
  padding: 12px 16px;
  color: var(--sba-text-secondary);
`;
