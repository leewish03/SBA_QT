import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import styled from 'styled-components';
import { SHORT_TO_FULL, FULL_TO_SHORT, safeToISODateString, getEffectiveDate } from '../utils/bibleLogic';
import { bibleStorage } from '../utils/BibleStorage';
import { supabase } from '../utils/supabaseClient';
import { ShinyText, SpotlightCard } from './ReactBits';

export function formatVersesRange(versesStr) {
  if (!versesStr) return '';
  const nums = versesStr.split(',').map(Number).sort((a, b) => a - b);
  if (nums.length === 0) return '';
  if (nums.length === 1) return `${nums[0]}`;

  const parts = [];
  let start = nums[0];
  let prev = nums[0];

  for (let i = 1; i < nums.length; i++) {
    const curr = nums[i];
    if (curr === prev + 1) {
      prev = curr;
    } else {
      if (start === prev) {
        parts.push(`${start}`);
      } else {
        parts.push(`${start}~${prev}`);
      }
      start = curr;
      prev = curr;
    }
  }
  if (start === prev) {
    parts.push(`${start}`);
  } else {
    parts.push(`${start}~${prev}`);
  }

  return parts.join(', ');
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

  @media (hover: hover) {
    &:hover {
      background-color: var(--sba-card-active);
    }
  }
  
  &.highlighted {
    background-color: var(--sba-highlight);
    @media (hover: hover) {
      &:hover {
        background-color: var(--sba-highlight-hover);
      }
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

function NoteEditor({ targetDate, session, onOpenAuthModal }) {
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
          {!session && (
            <div 
              onClick={onOpenAuthModal}
              style={{
                marginTop: '10px',
                padding: '10px',
                borderRadius: '6px',
                background: 'var(--sba-card-sub-bg)',
                border: '1px dashed var(--sba-border-strong)',
                fontSize: '0.8rem',
                textAlign: 'center',
                cursor: 'pointer',
                color: 'var(--sba-text-secondary)'
              }}
            >
              로그인하시면 메모를 안전하게 클라우드에 백업하고 여러 기기에서 동기화할 수 있습니다. 
              <span style={{ fontWeight: 'bold', textDecoration: 'underline', marginLeft: '6px', color: 'var(--sba-text)' }}>로그인하기</span>
            </div>
          )}
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

  const removeSelectedVersesFromBookmarks = async () => {
    const vNumsToRemove = Object.keys(selectedVerses).map(Number).sort((a, b) => a - b);
    if (vNumsToRemove.length === 0) return;

    let localBookmarks = [];
    try {
      const raw = localStorage.getItem('sba_qt_bookmarks');
      if (raw) localBookmarks = JSON.parse(raw);
    } catch (err) {}

    const updatedLocalBookmarks = [];
    const deleteList = [];
    const updateList = [];

    for (const b of localBookmarks) {
      if (b.book === book && b.chapter === parseInt(chapter)) {
        const bVerses = b.verses ? b.verses.split(',').map(Number) : [b.verse];
        const overlap = bVerses.filter(v => vNumsToRemove.includes(v));
        
        if (overlap.length > 0) {
          const remainingVerses = bVerses.filter(v => !vNumsToRemove.includes(v));
          
          if (remainingVerses.length === 0) {
            deleteList.push({
              book: b.book,
              chapter: b.chapter,
              verse: b.verse,
              verses: b.verses || null
            });
          } else {
            const sortedRemaining = remainingVerses.sort((a, b) => a - b);
            const newMinVerse = sortedRemaining[0];
            const newVersesStr = sortedRemaining.join(',');
            
            const updatedB = {
              ...b,
              verse: newMinVerse,
              verses: newVersesStr,
              updated_at: new Date().toISOString()
            };
            updatedLocalBookmarks.push(updatedB);
            
            updateList.push({
              old: {
                book: b.book,
                chapter: b.chapter,
                verse: b.verse,
                verses: b.verses || null
              },
              new: {
                verse: newMinVerse,
                verses: newVersesStr
              }
            });
          }
        } else {
          updatedLocalBookmarks.push(b);
        }
      } else {
        updatedLocalBookmarks.push(b);
      }
    }

    localStorage.setItem('sba_qt_bookmarks', JSON.stringify(updatedLocalBookmarks));
    setBookmarks(updatedLocalBookmarks);
    addToast('선택한 구절이 북마크에서 취소(제외)되었습니다.');
    setSelectedVerses({});

    if (session) {
      try {
        for (const item of deleteList) {
          await supabase
            .from('qt_bookmarks')
            .delete()
            .eq('user_id', session.user.id)
            .eq('book', item.book)
            .eq('chapter', item.chapter)
            .eq('verse', item.verse)
            .eq('verses', item.verses);
        }
        
        for (const item of updateList) {
          await supabase
            .from('qt_bookmarks')
            .update({
              verse: item.new.verse,
              verses: item.new.verses
            })
            .eq('user_id', session.user.id)
            .eq('book', item.old.book)
            .eq('chapter', item.old.chapter)
            .eq('verse', item.old.verse)
            .eq('verses', item.old.verses);
        }
      } catch (err) {
        console.error('클라우드 북마크 업데이트/삭제 실패:', err);
      }
    }

    if (onBookmarkChange) onBookmarkChange();
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
      const versesStr = vNums.join(',');
      const rangeStr = formatVersesRange(versesStr);
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
  
  const vNums = Object.keys(selectedVerses).map(Number).sort((a, b) => a - b);
  const versesStr = vNums.join(',');
  const hasOverlap = bookmarks.some(b => {
    if (b.book !== book || b.chapter !== parseInt(chapter)) return false;
    const bVerses = b.verses ? b.verses.split(',').map(Number) : [b.verse];
    return bVerses.some(v => vNums.includes(v));
  });

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
            {hasOverlap ? (
              <FloatingBtn 
                $variant="accent" 
                onClick={removeSelectedVersesFromBookmarks}
                style={{ background: '#ef4444', borderColor: '#ef4444', color: 'white' }}
              >
                북마크 해제
              </FloatingBtn>
            ) : (
              <FloatingBtn $variant="accent" onClick={toggleBookmark}>북마크 추가</FloatingBtn>
            )}
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
export function TabToday({ todayPlan, session, addToast, onBookmarkChange, onOpenAuthModal }) {
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
        onOpenAuthModal={onOpenAuthModal}
      />
    </div>
  );
}

// ==========================================
// 4. TabReading (통독 탭)
// ==========================================
export function TabReading({ todayPlan, session, addToast, onBookmarkChange, onOpenAuthModal }) {
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
        onOpenAuthModal={onOpenAuthModal}
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
  const rangeStr = bookmark.verses ? formatVersesRange(bookmark.verses) : `${bookmark.verse}`;

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

export function TabBookmarks({ session, onOpenAuthModal, onNavigateToVerse, updateTrigger, addToast }) {
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
    const rangeStr = b.verses ? formatVersesRange(b.verses) : `${b.verse}`;
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
                const rangeStr = b.verses ? formatVersesRange(b.verses) : `${b.verse}`;

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
              const rangeStr = b.verses ? formatVersesRange(b.verses) : `${b.verse}`;
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

export function SharingTab({ session, onOpenAuthModal, addToast, isDark, userChurch }) {
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
export function ImageCardModal({ isOpen, onClose, passage, verses }) {
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
