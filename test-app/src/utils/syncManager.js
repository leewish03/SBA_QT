import { supabase } from './supabaseClient';

export async function syncLocalDataToCloud() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { success: false, error: '로그인되어 있지 않습니다.' };

  const userId = session.user.id;

  try {
    // 1. 북마크 동기화
    await syncBookmarks(userId);

    // 2. 메모 동기화
    await syncNotes(userId);

    return { success: true };
  } catch (error) {
    console.error('데이터 동기화 오류:', error);
    return { success: false, error: error.message };
  }
}

// 100개씩 청크 분할 헬퍼
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

async function syncBookmarks(userId) {
  // 로컬 북마크 로드 (예: [{ book, chapter, verse, created_at }])
  let localBookmarks = [];
  try {
    const raw = localStorage.getItem('sba_qt_bookmarks');
    if (raw) localBookmarks = JSON.parse(raw);
  } catch (e) {
    console.error('로컬 북마크 로딩 실패:', e);
  }

  // 클라우드 북마크 로드
  const { data: cloudBookmarks, error } = await supabase
    .from('qt_bookmarks')
    .select('book, chapter, verse, created_at')
    .eq('user_id', userId);

  if (error) throw error;

  const cloudSet = new Set(cloudBookmarks.map(b => `${b.book}-${b.chapter}-${b.verse}`));

  // 로컬에서 클라우드에 없는 것 추출
  const toUpload = [];
  localBookmarks.forEach(local => {
    const key = `${local.book}-${local.chapter}-${local.verse}`;
    if (!cloudSet.has(key)) {
      toUpload.push({
        user_id: userId,
        book: local.book,
        chapter: local.chapter,
        verse: local.verse,
        created_at: local.created_at || new Date().toISOString()
      });
    }
  });

  // 클라우드 데이터를 로컬에 없는 것 병합하기 위해 로컬 Set 구성
  const localSet = new Set(localBookmarks.map(b => `${b.book}-${b.chapter}-${b.verse}`));
  const mergedBookmarks = [...localBookmarks];

  cloudBookmarks.forEach(cloud => {
    const key = `${cloud.book}-${cloud.chapter}-${cloud.verse}`;
    if (!localSet.has(key)) {
      mergedBookmarks.push({
        book: cloud.book,
        chapter: cloud.chapter,
        verse: cloud.verse,
        created_at: cloud.created_at
      });
    }
  });

  // 클라우드 업로드 (100개 청크 단위)
  if (toUpload.length > 0) {
    const chunks = chunkArray(toUpload, 100);
    for (const chunk of chunks) {
      const { error: insertError } = await supabase
        .from('qt_bookmarks')
        .insert(chunk);
      if (insertError) throw insertError;
    }
  }

  // 로컬 스토리지 최종 갱신
  localStorage.setItem('sba_qt_bookmarks', JSON.stringify(mergedBookmarks));
}

async function syncNotes(userId) {
  // 로컬 메모 로드 (구조: { "YYYY-MM-DD": { content, updated_at } })
  let localNotes = {};
  try {
    const raw = localStorage.getItem('sba_qt_notes');
    if (raw) localNotes = JSON.parse(raw);
  } catch (e) {
    console.error('로컬 메모 로딩 실패:', e);
  }

  // 클라우드 메모 로드
  const { data: cloudNotes, error } = await supabase
    .from('qt_notes')
    .select('target_date, content, updated_at')
    .eq('user_id', userId);

  if (error) throw error;

  const toUpload = [];
  const mergedNotes = { ...localNotes };

  // 1. 클라우드 메모를 순회하며 로컬과 병합
  cloudNotes.forEach(cloud => {
    const date = cloud.target_date;
    const local = localNotes[date];

    if (!local) {
      // 클라우드에만 존재하는 메모 -> 로컬에 반영
      mergedNotes[date] = {
        content: cloud.content,
        updated_at: cloud.updated_at
      };
    } else {
      // 로컬과 클라우드 모두 존재
      const localContent = (local.content || '').trim();
      const cloudContent = (cloud.content || '').trim();

      if (localContent !== cloudContent) {
        // 내용이 다른 경우 병합 정책 (Append)
        // 만약 로컬 내용에 클라우드 내용이 이미 포함되어 있거나 그 반대인 경우 중복 병합 방지
        let finalContent = localContent;
        if (!localContent.includes(cloudContent) && !cloudContent.includes(localContent)) {
          finalContent = `${localContent}\n---\n${cloudContent}`;
        } else if (cloudContent.length > localContent.length) {
          finalContent = cloudContent;
        }

        const now = new Date().toISOString();
        mergedNotes[date] = {
          content: finalContent,
          updated_at: now
        };

        toUpload.push({
          user_id: userId,
          target_date: date,
          content: finalContent,
          updated_at: now
        });
      }
    }
  });

  // 2. 로컬에만 존재하는 메모를 클라우드 업로드 대상으로 지정
  const cloudDates = new Set(cloudNotes.map(n => n.target_date));
  Object.entries(localNotes).forEach(([date, note]) => {
    if (!cloudDates.has(date)) {
      toUpload.push({
        user_id: userId,
        target_date: date,
        content: note.content,
        updated_at: note.updated_at || new Date().toISOString()
      });
    }
  });

  // 클라우드 업서트 (100개 청크 단위)
  if (toUpload.length > 0) {
    const chunks = chunkArray(toUpload, 100);
    for (const chunk of chunks) {
      const { error: upsertError } = await supabase
        .from('qt_notes')
        .upsert(chunk, { onConflict: 'user_id,target_date' });
      if (upsertError) throw upsertError;
    }
  }

  // 로컬 스토리지 최종 갱신
  localStorage.setItem('sba_qt_notes', JSON.stringify(mergedNotes));
}
