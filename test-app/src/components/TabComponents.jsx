import React, { useState, useEffect, useRef } from 'react';
import { SHORT_TO_FULL, FULL_TO_SHORT } from '../utils/bibleLogic';
import { bibleStorage } from '../utils/BibleStorage';
import { supabase } from '../utils/supabaseClient';

// ==========================================
// 1. 메모(QT 노트) 에디터 컴포넌트
// ==========================================
function NoteEditor({ targetDate, session }) {
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('저장 완료'); // '저장 완료', '저장 중...', '저장 오류'
  const timerRef = useRef(null);
  const isDirtyRef = useRef(false);

  const dateStr = targetDate.toISOString().split('T')[0];

  // 날짜 변경 시 로컬 및 클라우드에서 메모 읽어오기
  useEffect(() => {
    // 먼저 로컬 스토리지 확인
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

    // 만약 로그인되어 있으면 클라우드에서 최신 데이터 패치 후 갱신
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
            // 로컬 스토리지도 갱신
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

  // 메모 저장 수행 함수
  const saveNote = async (text) => {
    setSaveStatus('저장 중...');
    const now = new Date().toISOString();

    // 1. 로컬 저장
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

    // 2. 로그인되어 있다면 클라우드 저장
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

  // 입력 핸들러 및 5초 Autosave 구현
  const handleChange = (e) => {
    const val = e.target.value;
    setContent(val);
    isDirtyRef.current = true;
    setSaveStatus('변경됨 (저장 대기)');

    if (timerRef.current) clearTimeout(timerRef.current);
    
    // 5초 타이머 작동
    timerRef.current = setTimeout(() => {
      if (isDirtyRef.current) {
        saveNote(val);
      }
    }, 5000);
  };

  // 컴포넌트 언마운트 혹은 날짜 변경 시 즉시 저장
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (isDirtyRef.current) {
        saveNote(content);
      }
    };
  }, [content]);

  // 포커스 아웃(블러) 시 즉시 저장
  const handleBlur = () => {
    if (isDirtyRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      saveNote(content);
    }
  };

  return (
    <div className="sba-note-section">
      <h3>오늘의 메모 (QT 노트)</h3>
      <textarea
        className="sba-note-textarea"
        placeholder="오늘 말씀에서 깨달은 은혜와 묵상 내용을 기록해 보세요..."
        value={content}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      <div className="sba-note-status">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
        <span>{saveStatus}</span>
      </div>
    </div>
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
      <NoteEditor targetDate={todayPlan.dateObj} session={session} />
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
      <NoteEditor targetDate={todayPlan.dateObj} session={session} />
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
// 6. SharingTab (나눔 탭 + 로딩 스켈레톤 및 예외처리)
// ==========================================
export function SharingTab({ isDark }) {
  const [loading, setLoading] = useState(true);
  const [timeoutError, setTimeoutError] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    // 10초 타임아웃 타이머
    const timer = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setTimeoutError(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [loading]);

  const handleLoad = () => {
    setLoading(false);
  };

  const iframeSrc = `https://joey.team/block/?id=6gzZZCkcb0Y9up7wcgIGKybikFb2&block_id=YIRdJxInnDpsBJOGdDXO${isDark ? '&theme=dark' : ''}`;

  return (
    <div className="sba-tab-content" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', position: 'relative' }}>
      {loading && (
        <div className="sba-skeleton-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 }}>
          <div className="sba-skeleton-box" style={{ width: '80%', height: '32px', marginBottom: '16px' }} />
          <div className="sba-skeleton-box" style={{ width: '100%', height: '140px', marginBottom: '16px' }} />
          <div className="sba-skeleton-box" style={{ width: '90%', height: '18px', marginBottom: '8px' }} />
          <div className="sba-skeleton-box" style={{ width: '95%', height: '18px', marginBottom: '8px' }} />
          <div className="sba-skeleton-box" style={{ width: '60%', height: '18px', marginBottom: '24px' }} />
          <div className="sba-skeleton-box" style={{ width: '100%', height: '180px' }} />
        </div>
      )}

      {timeoutError ? (
        <div className="sba-retry-container">
          <div className="sba-retry-title">나눔 공간을 불러오지 못했습니다</div>
          <div className="sba-retry-desc">네트워크 연결 상태를 확인하고 아래 버튼을 다시 클릭해 보세요.</div>
          <button className="sba-btn" onClick={() => { setTimeoutError(false); setLoading(true); }}>재시도</button>
        </div>
      ) : (
        <iframe 
          ref={iframeRef}
          src={iframeSrc}
          style={{ width: '100%', flex: 1, border: 'none', background: 'transparent' }}
          title="Joey Sharing Block"
          onLoad={handleLoad}
        />
      )}
    </div>
  );
}
