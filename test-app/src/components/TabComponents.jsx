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
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 600px;
  background: var(--sba-modal-bg);
  border-top: 1px solid var(--sba-border-strong);
  border-left: 1px solid var(--sba-border-strong);
  border-right: 1px solid var(--sba-border-strong);
  border-radius: 8px 8px 0 0;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 100;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: ${props => props.$isExpanded ? '310px' : '16px'};
  cursor: ${props => props.$isExpanded ? 'default' : 'pointer'};
  
  &:hover {
    border-top-color: ${props => props.$isExpanded ? 'var(--sba-border-strong)' : 'var(--sba-text-muted)'};
  }
`;

const CompactHandle = styled.div`
  width: 100%;
  height: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--sba-text-secondary);
  user-select: none;
  transition: color 0.2s;
  
  &:hover {
    color: var(--sba-text);
  }
`;

const DrawerHeader = styled.div`
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 6px 16px 8px;
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

const CloseIconButton = styled.button`
  background: none;
  border: none;
  color: var(--sba-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    color: var(--sba-text);
    background: var(--sba-card-sub-bg);
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

function NoteEditor({ targetDate, session, passage, verses }) {
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('저장 완료');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
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
          <CompactHandle>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 5l4-4 4 4"/>
            </svg>
          </CompactHandle>
        ) : (
          <>
            <div 
              onClick={() => setIsExpanded(false)}
              style={{
                width: '100%',
                height: '10px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                paddingTop: '4px'
              }}
            >
              <div style={{
                width: '32px',
                height: '4px',
                borderRadius: '2px',
                background: 'var(--sba-border-strong)'
              }} />
            </div>

            <DrawerHeader>
              <HeaderTitle>
                오늘의 메모
                <StatusBadge>{saveStatus}</StatusBadge>
              </HeaderTitle>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {verses && (
                  <CardButton onClick={() => setIsImageModalOpen(true)}>
                    🎨 말씀 카드
                  </CardButton>
                )}
                <CloseIconButton onClick={() => setIsExpanded(false)}>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 1l4 4 4-4"/>
                  </svg>
                </CloseIconButton>
              </div>
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

      <ImageCardModal 
        isOpen={isImageModalOpen} 
        onClose={() => setIsImageModalOpen(false)} 
        passage={passage} 
        verses={verses} 
      />
    </>
  );
}

// ==========================================
// 2. 말씀 구절 하이라이트 / 북마크 팝업 매니저 헬퍼
// ==========================================
function VerseReader({ book, chapter, verses, dateStr, session, addToast, onBookmarkChange }) {
  const [selectedVerse, setSelectedVerse] = useState(null); // { vNum, text }
  const [bookmarks, setBookmarks] = useState([]);
  const tooltipRef = useRef(null);

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
    return bookmarks.some(b => b.book === book && b.chapter === parseInt(chapter) && b.verse === parseInt(vNum));
  };

  const handleVerseClick = (vNum, text) => {
    if (selectedVerse && selectedVerse.vNum === vNum) {
      setSelectedVerse(null);
    } else {
      setSelectedVerse({ vNum, text });
    }
  };

  const toggleBookmark = async () => {
    if (!selectedVerse) return;
    const vNum = parseInt(selectedVerse.vNum);
    const chNum = parseInt(chapter);
    const targetText = selectedVerse.text;

    let localBookmarks = [];
    try {
      const raw = localStorage.getItem('sba_qt_bookmarks');
      if (raw) localBookmarks = JSON.parse(raw);
    } catch (e) {}

    const index = localBookmarks.findIndex(b => b.book === book && b.chapter === chNum && b.verse === vNum);
    const now = new Date().toISOString();

    if (index > -1) {
      // 북마크 삭제
      localBookmarks.splice(index, 1);
      localStorage.setItem('sba_qt_bookmarks', JSON.stringify(localBookmarks));
      setBookmarks(localBookmarks);
      addToast('북마크가 해제되었습니다.');

      if (session) {
        await supabase
          .from('qt_bookmarks')
          .delete()
          .eq('user_id', session.user.id)
          .eq('book', book)
          .eq('chapter', chNum)
          .eq('verse', vNum);
      }
    } else {
      // 북마크 등록
      const newBookmark = {
        book,
        chapter: chNum,
        verse: vNum,
        created_at: now
      };
      localBookmarks.push(newBookmark);
      localStorage.setItem('sba_qt_bookmarks', JSON.stringify(localBookmarks));
      setBookmarks(localBookmarks);
      addToast('구절이 북마크에 저장되었습니다.');

      if (session) {
        await supabase
          .from('qt_bookmarks')
          .insert({
            user_id: session.user.id,
            book,
            chapter: chNum,
            verse: vNum,
            created_at: now
          });
      }
    }

    if (onBookmarkChange) onBookmarkChange();
    setSelectedVerse(null);
  };

  const copyToClipboard = () => {
    if (!selectedVerse) return;
    const fullName = SHORT_TO_FULL[book] || book;
    const textToCopy = `[${fullName} ${chapter}:${selectedVerse.vNum}] ${selectedVerse.text}`;
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        addToast('구절이 클립보드에 복사되었습니다.');
      })
      .catch(err => {
        console.error('클립보드 복사 실패:', err);
      });
    setSelectedVerse(null);
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target) && !e.target.closest('.sba-verse-block')) {
        setSelectedVerse(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const fullName = SHORT_TO_FULL[book] || book;

  return (
    <>
      <h2 className="sba-verse-title">{fullName} {chapter}장</h2>
      <div className="serif-text sba-verse-container">
        {Object.entries(verses).map(([vNum, text]) => {
          const bookmarked = isBookmarked(vNum);
          const isFocused = selectedVerse && selectedVerse.vNum === vNum;
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

      {selectedVerse && (
        <div className="sba-tooltip-menu" ref={tooltipRef}>
          <button className="sba-tooltip-btn" onClick={toggleBookmark}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={isBookmarked(selectedVerse.vNum) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
            {isBookmarked(selectedVerse.vNum) ? '북마크 해제' : '북마크 저장'}
          </button>
          <button className="sba-tooltip-btn" onClick={copyToClipboard}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            복사하기
          </button>
        </div>
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
        passage={`${SHORT_TO_FULL[abbrev] || abbrev} ${verse}장`} 
        verses={verses} 
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
        passage={todayPlan.new ? `${todayPlan.new.books.map(b => SHORT_TO_FULL[b] || b).join(', ')} ${todayPlan.new.verseRaw}장` : '통독 말씀'} 
        verses={blocks.length > 0 ? blocks[0].verses : null} 
      />
    </div>
  );
}

// ==========================================
// 5. TabBookmarks (북마크 리스트 탭 - 신설)
// ==========================================
export function TabBookmarks({ onNavigateToVerse, updateTrigger }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBookmarks = async () => {
    setLoading(true);
    let localBookmarks = [];
    try {
      const raw = localStorage.getItem('sba_qt_bookmarks');
      if (raw) localBookmarks = JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }

    // 각각의 북마크 말씀 구절 구글/IndexedDB 로딩 후 간략 텍스트 스니펫 생성
    const bookmarkedDetails = [];
    for (const b of localBookmarks) {
      try {
        const bookData = await bibleStorage.getBook(b.book);
        if (bookData && bookData[b.chapter] && bookData[b.chapter][b.verse]) {
          bookmarkedDetails.push({
            ...b,
            text: bookData[b.chapter][b.verse]
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    
    // 최근에 등록된 순으로 정렬
    bookmarkedDetails.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    setBookmarks(bookmarkedDetails);
    setLoading(false);
  };

  useEffect(() => {
    loadBookmarks();
  }, [updateTrigger]);

  const handleDelete = async (e, b) => {
    e.stopPropagation();
    let localBookmarks = [];
    try {
      const raw = localStorage.getItem('sba_qt_bookmarks');
      if (raw) localBookmarks = JSON.parse(raw);
    } catch (err) {}

    const index = localBookmarks.findIndex(item => item.book === b.book && item.chapter === b.chapter && item.verse === b.verse);
    if (index > -1) {
      localBookmarks.splice(index, 1);
      localStorage.setItem('sba_qt_bookmarks', JSON.stringify(localBookmarks));
      loadBookmarks();

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase
          .from('qt_bookmarks')
          .delete()
          .eq('user_id', session.user.id)
          .eq('book', b.book)
          .eq('chapter', b.chapter)
          .eq('verse', b.verse);
      }
    }
  };

  if (loading) return <div className="sba-loading">북마크 리스트를 로드 중...</div>;
  if (bookmarks.length === 0) return <div className="sba-empty-state">저장된 북마크가 없습니다. 말씀 본문에서 구절을 터치하여 북마크로 추가해 보세요.</div>;

  return (
    <div className="sba-tab-content">
      <h2 className="sba-verse-title" style={{ borderLeft: 'none', marginBottom: '16px' }}>내 북마크</h2>
      <div className="sba-bookmark-list">
        {bookmarks.map((b, idx) => {
          const fullName = SHORT_TO_FULL[b.book] || b.book;
          return (
            <div 
              key={`${b.book}-${b.chapter}-${b.verse}-${idx}`}
              className="sba-bookmark-item"
              onClick={() => onNavigateToVerse(b.book, b.chapter, b.verse)}
            >
              <div className="sba-bookmark-info">
                <span className="sba-bookmark-name">{fullName} {b.chapter}장 {b.verse}절</span>
                <span className="sba-bookmark-snippet">{b.text}</span>
              </div>
              <button className="sba-bookmark-delete-btn" onClick={(e) => handleDelete(e, b)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </button>
            </div>
          );
        })}
      </div>
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
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  
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
            🔒 묵상 나눔은 로그인이 필요한 기능입니다.<br />
            <span style={{ fontSize: '0.8rem', color: 'var(--sba-primary)', fontWeight: 'bold', textDecoration: 'underline' }}>
              소셜 로그인으로 1초 만에 로그인하기
            </span>
          </GuestNotice>
        ) : (
          <form onSubmit={handleSubmitReflection} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <StyledInput 
                type="text" 
                placeholder="예: 마태복음 1:1"
                value={passage}
                onChange={e => setPassage(e.target.value)}
              />
              <OutlinedButton 
                type="button" 
                onClick={handleImportMemo}
              >
                ✏️ 내 메모 긁어오기
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
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', padding: '2px', display: 'flex', alignItems: 'center' }}
                        title="삭제"
                      >
                        🗑️
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
                    <span>{hasLiked ? '❤️' : '🤍'}</span>
                    <span>{likeCount}</span>
                  </ActionButton>
                  
                  <ActionButton 
                    onClick={() => setActiveCommentId(activeCommentId === r.id ? null : r.id)}
                  >
                    <span>💬</span>
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
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}
                                >
                                  ❌
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
export function ImageCardModal({ isOpen, onClose, passage, verses }) {
  const [activeTheme, setActiveTheme] = useState('sunset'); // sunset, ocean, forest, charcoal, ivory
  const cardRef = useRef(null);
  
  if (!isOpen) return null;

  // 대표 구절 하나 혹은 처음 2개 구절만 요약해서 띄우기
  let verseText = "말씀 데이터를 불러올 수 없습니다.";
  if (verses) {
    const verseList = Object.entries(verses);
    if (verseList.length > 0) {
      verseText = verseList.slice(0, 2).map(([num, text]) => `${num}. ${text}`).join(' ');
      if (verseList.length > 2) {
        verseText += " ...";
      }
    }
  }

  const themes = {
    sunset: {
      background: 'linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6)',
      textColor: '#ffffff',
      metaColor: 'rgba(255, 255, 255, 0.85)',
      cardBg: 'rgba(0, 0, 0, 0.25)',
      borderColor: 'rgba(255, 255, 255, 0.15)'
    },
    ocean: {
      background: 'linear-gradient(135deg, #06b6d4, #3b82f6, #1e3a8a)',
      textColor: '#ffffff',
      metaColor: 'rgba(255, 255, 255, 0.85)',
      cardBg: 'rgba(0, 0, 0, 0.25)',
      borderColor: 'rgba(255, 255, 255, 0.15)'
    },
    forest: {
      background: 'linear-gradient(135deg, #10b981, #064e3b, #022c22)',
      textColor: '#ffffff',
      metaColor: 'rgba(255, 255, 255, 0.85)',
      cardBg: 'rgba(0, 0, 0, 0.25)',
      borderColor: 'rgba(255, 255, 255, 0.15)'
    },
    charcoal: {
      background: 'linear-gradient(135deg, #1f2937, #111827, #030712)',
      textColor: '#f3f4f6',
      metaColor: '#9ca3af',
      cardBg: 'rgba(255, 255, 255, 0.03)',
      borderColor: 'rgba(255, 255, 255, 0.08)'
    },
    ivory: {
      background: 'linear-gradient(135deg, #fafaf9, #f5f5f4, #e7e5e4)',
      textColor: '#1c1917',
      metaColor: '#78716c',
      cardBg: 'rgba(255, 255, 255, 0.6)',
      borderColor: 'rgba(0, 0, 0, 0.05)'
    }
  };

  const currentTheme = themes[activeTheme];

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2, // 해상도 높이기
      });
      const link = document.createElement('a');
      link.download = `SBA_QT_${passage.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error(e);
      alert('이미지 생성에 실패했습니다.');
    }
  };

  return (
    <div className="sba-modal-overlay" onClick={onClose}>
      <div className="sba-modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '400px', padding: '20px'}}>
        <h3 style={{marginTop: 0, marginBottom: '16px'}}>말씀 카드 다운로드</h3>
        
        {/* 카드 영역 */}
        <div 
          ref={cardRef} 
          style={{
            background: currentTheme.background,
            padding: '40px 30px',
            borderRadius: '16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            aspectRatio: '4 / 5',
            color: currentTheme.textColor,
            fontFamily: "'Nanum Myeongjo', 'Georgia', serif",
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '2px', opacity: 0.7, color: currentTheme.metaColor }}>
            SBA QT
          </div>
          
          <div style={{ margin: '30px 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{ fontSize: '1.25rem', lineHeight: '1.8', margin: 0, fontWeight: '500', wordBreak: 'keep-all', textAlign: 'center' }}>
              “ {verseText} ”
            </p>
          </div>

          <div style={{ borderTop: `1px solid ${currentTheme.borderColor}`, paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: currentTheme.textColor }}>
              {passage}
            </span>
            <span style={{ fontSize: '0.75rem', color: currentTheme.metaColor }}>
              서울북부교회 청년회
            </span>
          </div>
        </div>

        {/* 테마 셀렉터 */}
        <div style={{marginTop: '20px', display: 'flex', justifyContent: 'space-around'}}>
          {Object.keys(themes).map(themeName => (
            <button 
              key={themeName}
              onClick={() => setActiveTheme(themeName)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: activeTheme === themeName ? '2px solid var(--sba-text)' : '1px solid var(--sba-border)',
                background: themes[themeName].background,
                cursor: 'pointer',
                boxShadow: 'inset 0 0 4px rgba(0,0,0,0.2)'
              }}
              title={themeName}
            />
          ))}
        </div>

        {/* 하단 버튼 */}
        <div style={{display: 'flex', gap: '8px', marginTop: '24px'}}>
          <button className="sba-btn" style={{flex: 1, marginTop: 0}} onClick={handleDownload}>
            이미지 저장
          </button>
          <button className="sba-btn" style={{flex: 1, marginTop: 0, background: 'var(--sba-card-sub-bg)', color: 'var(--sba-text)', border: '1px solid var(--sba-border)'}} onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
