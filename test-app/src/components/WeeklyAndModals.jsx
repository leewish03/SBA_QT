import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { calcQtDays, getEffectiveDate, SHORT_TO_FULL } from '../utils/bibleLogic';
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

export function AdminModal({ isOpen, onClose, startDateStr, setStartDateStr, addToast }) {
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
                let errorMsg = '알 수 없는 오류';
                const contentType = res.headers.get('content-type') || '';
                
                if (contentType.includes('application/json')) {
                    try {
                        const errData = await res.json();
                        errorMsg = errData.error || errData.message || JSON.stringify(errData);
                    } catch (parseErr) {
                        console.error('JSON parsing failed:', parseErr);
                    }
                } else {
                    try {
                        const textData = await res.text();
                        errorMsg = textData || `상태 코드: ${res.status}`;
                    } catch (parseErr) {
                        console.error('Text parsing failed:', parseErr);
                    }
                }
                
                if (res.status === 401) {
                    alert(`동기화 실패 (401 Unauthorized): 입력하신 관리자 토큰이 올바르지 않거나 만료되었습니다. 토큰 값을 다시 확인해 주세요.\n(상세 에러: ${errorMsg})`);
                } else if (res.status === 403) {
                    alert(`동기화 실패 (403 Forbidden): 이 요청을 수행할 권한이 없습니다.\n(상세 에러: ${errorMsg})`);
                } else if (res.status === 500) {
                    alert(`동기화 실패 (500 Internal Server Error): 서버 내부 오류가 발생했습니다. 구글 시트 API 연동을 확인해 주세요.\n(상세 에러: ${errorMsg})`);
                } else {
                    alert(`동기화 실패 (상태 코드 ${res.status}): ${errorMsg}`);
                }
            }
        } catch (e) {
            console.error(e);
            alert('API 호출 도중 오류가 발생했습니다. 네트워크 연결 상태를 확인해 주세요.');
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

export function CalendarModal({ isOpen, onClose, currentDate, onSetDate }) {
    const [noteDates, setNoteDates] = useState(new Set());
    const [viewDate, setViewDate] = useState(() => {
        return isValidDate(currentDate) ? new Date(currentDate) : getEffectiveDate();
    });

    useEffect(() => {
        if (isOpen && isValidDate(currentDate)) {
            setViewDate(new Date(currentDate));
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
