import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import styled from 'styled-components';
import { SHORT_TO_FULL, FULL_TO_SHORT } from '../utils/bibleLogic';
import { bibleStorage } from '../utils/BibleStorage';
import { supabase } from '../utils/supabaseClient';

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
  bottom: calc(70px + env(safe-area-inset-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 600px;
  
  background: ${props => props.$isExpanded ? 'var(--sba-modal-bg, #ffffff)' : 'transparent'};
  border-top: ${props => props.$isExpanded ? '1px solid var(--sba-border-strong, #dddddd)' : 'none'};
  border-left: ${props => props.$isExpanded ? '1px solid var(--sba-border-strong, #dddddd)' : 'none'};
  border-right: ${props => props.$isExpanded ? '1px solid var(--sba-border-strong, #dddddd)' : 'none'};
  border-radius: 8px 8px 0 0;
  box-shadow: ${props => props.$isExpanded ? '0 -4px 16px rgba(0, 0, 0, 0.08)' : 'none'};
  
  height: ${props => props.$isExpanded ? '310px' : '24px'};
  z-index: 100;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: ${props => props.$isExpanded ? 'default' : 'pointer'};
  
  transition: 
    background 0.22s ease-in-out,
    border 0.22s ease-in-out,
    box-shadow 0.22s ease-in-out,
    height 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    
  &:hover {
    border-top-color: ${props => props.$isExpanded ? 'var(--sba-border-strong)' : 'transparent'};
  }
`;

const CompactHandle = styled.div`
  width: 100%;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
  border: none;
  cursor: pointer;
  pointer-events: auto;
  touch-action: manipulation;
  
  .handle-arrow {
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: ${props => props.$isExpanded ? 'none' : '6px solid var(--sba-text-muted, #cccccc)'};
    border-top: ${props => props.$isExpanded ? '6px solid var(--sba-text-muted, #cccccc)' : 'none'};
    transition: transform 0.22s ease-in-out, border-color 0.2s ease;
  }

  &:hover .handle-arrow {
    border-bottom-color: var(--sba-text-main, #888888);
    border-top-color: var(--sba-text-main, #888888);
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

function NoteEditor({ targetDate, session }) {
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('저장 완료');
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
          <CompactHandle $isExpanded={isExpanded}>
            <div className="handle-arrow" />
          </CompactHandle>
        ) : (
          <>
            <ExpandedHandle onClick={() => setIsExpanded(false)}>
              <div className="handle-arrow" style={{
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid var(--sba-text-muted, #cccccc)'
              }} />
            </ExpandedHandle>

            <DrawerHeader>
              <HeaderTitle>
                오늘의 메모
                <StatusBadge>{saveStatus}</StatusBadge>
              </HeaderTitle>
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
export function TabToday({ todayPlan, session, addToast, onBookmarkChange }) {
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
      />
    </div>
  );
}

// ==========================================
// 4. TabReading (통독 탭)
// ==========================================
export function TabReading({ todayPlan, session, addToast, onBookmarkChange }) {
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
                  <div 
                    key={`${b.book}-${b.chapter}-${b.verse}-${idx}`}
                    className="sba-bookmark-item"
                    onClick={() => setSelectedBookmark(b)}
                  >
                    <div className="sba-bookmark-info">
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
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </div>
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
            <span style={{ fontSize: '0.8rem', color: 'var(--sba-primary)', fontWeight: 'bold', textDecoration: 'underline' }}>
              소셜 로그인으로 1초 만에 로그인하기
            </span>
          </GuestNotice>
        ) : loadingReflections ? (
          <div className="sba-loading">내 나눔 기록을 불러오는 중...</div>
        ) : myReflections.length === 0 ? (
          <div className="sba-empty-state">아직 공유한 묵상 나눔 기록이 없습니다. 나눔 탭에서 오늘의 묵상을 지체들과 나누어 보세요!</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {myReflections.map(r => (
              <div 
                key={r.id} 
                style={{
                  background: 'var(--sba-card-bg)',
                  border: '1px solid var(--sba-border-strong)',
                  borderRadius: '8px',
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
                    padding: '4px'
                  }}
                  title="삭제"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                </button>
              </div>
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

export function SharingTab({ session, onOpenAuthModal, addToast, isDark }) {
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
            묵상 나눔은 로그인이 필요한 기능입니다.<br />
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
                북마크에서 선택
              </OutlinedButton>
              <OutlinedButton 
                type="button" 
                onClick={handleImportMemo}
              >
                내 메모 긁어오기
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
                        style={{ background: 'none', border: 'none', color: 'var(--sba-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
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
  const cardRef = useRef(null);
  
  if (!isOpen) return null;

  // 모든 선택된 구절을 가져와서 렌더링 텍스트 구성
  let verseText = "말씀 데이터를 불러올 수 없습니다.";
  if (verses) {
    const verseList = Object.entries(verses);
    if (verseList.length > 0) {
      // 모든 구절을 모아서 띄우기
      verseText = verseList.map(([num, text]) => `${num}절 ${text}`).join(' ');
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
    if (len < 50) return '1.35rem';
    if (len < 100) return '1.15rem';
    if (len < 180) return '1.0rem';
    if (len < 260) return '0.85rem';
    return '0.75rem';
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
    <div className="sba-modal-overlay" onClick={onClose} style={{ zIndex: 130 }}>
      {/* SVG 노이즈 필터 정의 */}
      <svg style={{ display: 'none' }}>
        <filter id="card-paper-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.07 0" />
          <feComposite operator="in" in2="SourceGraphic" />
          <feBlend mode="multiply" in="SourceGraphic" in2="noise" />
        </filter>
      </svg>

      <div className="sba-modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '400px', padding: '20px'}}>
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
            padding: '36px 28px',
            borderRadius: '12px',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            aspectRatio: '4 / 5',
            color: currentTheme.textColor,
            fontFamily: "'Nanum Myeongjo', 'Georgia', serif",
            position: 'relative',
            overflow: 'hidden',
            border: `1px solid ${currentTheme.borderColor}`
          }}
        >
          {/* 장식용 프레임 라인 */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            right: '12px',
            bottom: '12px',
            border: `1px solid ${currentTheme.borderColor}`,
            opacity: 0.5,
            pointerEvents: 'none'
          }} />

          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '2px', opacity: 0.6, color: currentTheme.metaColor, textAlign: 'center', zIndex: 1 }}>
            SBA QT
          </div>
          
          <div style={{ margin: '20px 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 1 }}>
            <p style={{ 
              fontSize: fontSize, 
              lineHeight: '1.75', 
              margin: 0, 
              fontWeight: '500', 
              wordBreak: 'keep-all', 
              textAlign: 'center',
              whiteSpace: 'pre-wrap'
            }}>
              “ {verseText} ”
            </p>
          </div>

          <div style={{ borderTop: `1px solid ${currentTheme.borderColor}`, paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1, opacity: 0.9 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: currentTheme.textColor }}>
              {passage}
            </span>
            <span style={{ fontSize: '0.7rem', color: currentTheme.metaColor }}>
              서울북부교회 청년회
            </span>
          </div>
        </div>

        {/* 테마 셀렉터 */}
        <div style={{marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '16px'}}>
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
        <div style={{display: 'flex', gap: '8px', marginTop: '24px'}}>
          <button className="sba-btn" style={{flex: 1, marginTop: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'}} onClick={handleShare}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            공유
          </button>
          <button className="sba-btn" style={{flex: 1, marginTop: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--sba-card-sub-bg)', color: 'var(--sba-text)', border: '1px solid var(--sba-border-strong)'}} onClick={handleDownload}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
