const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // JSON 바디 파서 필수 추가

// React 빌드 결과물(test-app/dist) 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'test-app/dist')));

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ebfpjvwwbognddixrvyc.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const memoryDB = {
  churches: [],
  members: [],
  schedules: [],
};

function isMock(req) {
  const authHeader = req.headers.authorization;
  return !!(authHeader && authHeader.includes('dummy_sig'));
}

function getMockUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        aud: payload.aud,
        user_metadata: { name: 'QA Tester' }
      };
    }
  } catch (e) {}
  return { id: 'mock-uid', email: 'test-qa@example.com', role: 'authenticated', aud: 'authenticated' };
}

function getSupabaseClient(authHeader) {
  if (authHeader && authHeader.includes('dummy_sig')) {
    const token = authHeader.replace('Bearer ', '');
    let user = { id: 'mock-uid', email: 'test-qa@example.com', role: 'authenticated', aud: 'authenticated' };
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        user = {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
          aud: payload.aud,
          user_metadata: { name: 'QA Tester' }
        };
      }
    } catch (e) {}

    const client = createClient(supabaseUrl, supabaseAnonKey);
    client.auth.getUser = async () => {
      return { data: { user }, error: null };
    };
    return client;
  }

  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

const BIBLE_BOOKS = [
  { name: "GEN", chaps: 50 }, { name: "EXO", chaps: 40 }, { name: "LEV", chaps: 27 }, { name: "NUM", chaps: 36 }, { name: "DEU", chaps: 34 },
  { name: "JOS", chaps: 24 }, { name: "JDG", chaps: 21 }, { name: "RUT", chaps: 4 }, { name: "1SA", chaps: 31 }, { name: "2SA", chaps: 24 },
  { name: "1KI", chaps: 22 }, { name: "2KI", chaps: 25 }, { name: "1CH", chaps: 29 }, { name: "2CH", chaps: 36 }, { name: "EZR", chaps: 10 },
  { name: "NEH", chaps: 13 }, { name: "EST", chaps: 10 }, { name: "JOB", chaps: 42 }, { name: "PSA", chaps: 150 }, { name: "PRO", chaps: 31 },
  { name: "ECC", chaps: 12 }, { name: "SNG", chaps: 8 }, { name: "ISA", chaps: 66 }, { name: "JER", chaps: 52 }, { name: "LAM", chaps: 5 },
  { name: "EZK", chaps: 48 }, { name: "DAN", chaps: 12 }, { name: "HOS", chaps: 14 }, { name: "JOL", chaps: 3 }, { name: "AMO", chaps: 9 },
  { name: "OBA", chaps: 1 }, { name: "JON", chaps: 4 }, { name: "MIC", chaps: 7 }, { name: "NAM", chaps: 3 }, { name: "HAB", chaps: 3 },
  { name: "ZEP", chaps: 3 }, { name: "HAG", chaps: 2 }, { name: "ZEC", chaps: 14 }, { name: "MAL", chaps: 4 },
  { name: "MAT", chaps: 28 }, { name: "MRK", chaps: 16 }, { name: "LUK", chaps: 24 }, { name: "JHN", chaps: 21 }, { name: "ACT", chaps: 28 },
  { name: "ROM", chaps: 16 }, { name: "1CO", chaps: 16 }, { name: "2CO", chaps: 13 }, { name: "GAL", chaps: 6 }, { name: "EPH", chaps: 6 },
  { name: "PHP", chaps: 4 }, { name: "COL", chaps: 4 }, { name: "1TH", chaps: 5 }, { name: "2TH", chaps: 3 }, { name: "1TI", chaps: 6 },
  { name: "2TI", chaps: 4 }, { name: "TIT", chaps: 3 }, { name: "PHM", chaps: 1 }, { name: "HEB", chaps: 13 }, { name: "JAS", chaps: 5 },
  { name: "1PE", chaps: 5 }, { name: "2PE", chaps: 3 }, { name: "1JN", chaps: 5 }, { name: "2JN", chaps: 1 }, { name: "3JN", chaps: 1 },
  { name: "JUD", chaps: 1 }, { name: "REV", chaps: 22 }
];

// 1. GET /api/churches
app.get('/api/churches', async (req, res) => {
  try {
    const query = req.query.query || '';
    if (isMock(req)) {
      const filtered = memoryDB.churches.filter(c => 
        c.is_public && c.name.toLowerCase().includes(query.toLowerCase())
      );
      return res.json(filtered);
    }
    const supabase = getSupabaseClient(req.headers.authorization);
    const { data, error } = await supabase
      .from('qt_churches')
      .select('*')
      .eq('is_public', true)
      .ilike('name', `%${query}%`);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. POST /api/churches (생성)
app.post('/api/churches', async (req, res) => {
  try {
    const { name, invite_code, is_public, theme_color } = req.body;
    if (!name) {
      return res.status(400).json({ error: '교회 이름은 필수입니다.' });
    }

    if (isMock(req)) {
      const user = getMockUser(req);
      if (!user) {
        return res.status(401).json({ error: '로그인이 필요합니다.' });
      }
      const church = {
        id: 'church-' + Math.random().toString(36).substr(2, 9),
        name,
        invite_code: invite_code || null,
        is_public: is_public !== false,
        theme_color: theme_color || '#8B4513',
        created_by: user.id,
        created_at: new Date().toISOString()
      };
      memoryDB.churches.push(church);
      memoryDB.members.push({
        id: 'member-' + Math.random().toString(36).substr(2, 9),
        user_id: user.id,
        church_id: church.id,
        role: 'admin',
        created_at: new Date().toISOString()
      });
      return res.status(201).json(church);
    }

    const supabase = getSupabaseClient(req.headers.authorization);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const { data: church, error: churchError } = await supabase
      .from('qt_churches')
      .insert({
        name,
        invite_code: invite_code || null,
        is_public: is_public !== false,
        theme_color: theme_color || '#8B4513',
        created_by: user.id
      })
      .select()
      .single();

    if (churchError) throw churchError;

    const { error: memberError } = await supabase
      .from('qt_church_members')
      .upsert({
        user_id: user.id,
        church_id: church.id,
        role: 'admin'
      });

    if (memberError) throw memberError;

    res.status(201).json(church);
  } catch (error) {
    console.error("POST /api/churches ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. POST /api/churches/join (가입)
app.post('/api/churches/join', async (req, res) => {
  try {
    const { church_id, invite_code } = req.body;
    if (!church_id) {
      return res.status(400).json({ error: '교회 ID가 필요합니다.' });
    }

    if (isMock(req)) {
      const user = getMockUser(req);
      if (!user) {
        return res.status(401).json({ error: '로그인이 필요합니다.' });
      }
      const church = memoryDB.churches.find(c => c.id === church_id);
      if (!church) {
        return res.status(404).json({ error: '존재하지 않는 교회입니다.' });
      }
      if (church.invite_code && church.invite_code !== invite_code) {
        return res.status(400).json({ error: '초대 코드가 일치하지 않습니다.' });
      }
      let member = memoryDB.members.find(m => m.user_id === user.id && m.church_id === church_id);
      if (!member) {
        member = {
          id: 'member-' + Math.random().toString(36).substr(2, 9),
          user_id: user.id,
          church_id: church_id,
          role: 'member',
          created_at: new Date().toISOString()
        };
        memoryDB.members.push(member);
      } else {
        member.role = 'member';
      }
      return res.json({ success: true, message: '교회 가입이 완료되었습니다.', member });
    }

    const supabase = getSupabaseClient(req.headers.authorization);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const { data: church, error: churchError } = await supabase
      .from('qt_churches')
      .select('invite_code')
      .eq('id', church_id)
      .single();

    if (churchError) throw churchError;

    if (church.invite_code && church.invite_code !== invite_code) {
      return res.status(400).json({ error: '초대 코드가 일치하지 않습니다.' });
    }

    const { data: member, error: memberError } = await supabase
      .from('qt_church_members')
      .upsert({
        user_id: user.id,
        church_id: church_id,
        role: 'member'
      })
      .select()
      .single();

    if (memberError) throw memberError;

    res.json({ success: true, message: '교회 가입이 완료되었습니다.', member });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. POST /api/churches/leave (탈퇴)
app.post('/api/churches/leave', async (req, res) => {
  try {
    if (isMock(req)) {
      const user = getMockUser(req);
      if (!user) {
        return res.status(401).json({ error: '로그인이 필요합니다.' });
      }
      memoryDB.members = memoryDB.members.filter(m => m.user_id !== user.id);
      return res.json({ success: true, message: '교회에서 정상적으로 탈퇴 처리되었습니다.' });
    }

    const supabase = getSupabaseClient(req.headers.authorization);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const { error: leaveError } = await supabase
      .from('qt_church_members')
      .delete()
      .eq('user_id', user.id);

    if (leaveError) throw leaveError;

    res.json({ success: true, message: '교회에서 정상적으로 탈퇴 처리되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4.5 GET /api/churches/mine (소속 교회 조회)
app.get('/api/churches/mine', async (req, res) => {
  try {
    if (isMock(req)) {
      const user = getMockUser(req);
      if (!user) {
        return res.json(null);
      }
      const member = memoryDB.members.find(m => m.user_id === user.id);
      if (!member) {
        return res.json(null);
      }
      const church = memoryDB.churches.find(c => c.id === member.church_id);
      if (!church) {
        return res.json(null);
      }
      return res.json({
        id: church.id,
        name: church.name,
        theme_color: church.theme_color,
        invite_code: church.invite_code,
        role: member.role
      });
    }

    const supabase = getSupabaseClient(req.headers.authorization);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.json(null);
    }

    const { data: memberData, error: memberError } = await supabase
      .from('qt_church_members')
      .select('role, church_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberError) throw memberError;
    if (!memberData) return res.json(null);

    const { data: churchData, error: churchError } = await supabase
      .from('qt_churches')
      .select('name, theme_color, invite_code')
      .eq('id', memberData.church_id)
      .single();

    if (churchError) throw churchError;

    res.json({
      id: memberData.church_id,
      name: churchData.name,
      theme_color: churchData.theme_color,
      invite_code: churchData.invite_code,
      role: memberData.role
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. GET /api/qt-schedule (조회)
app.get('/api/qt-schedule', async (req, res) => {
  try {
    const { church_id, start_date, end_date } = req.query;
    if (!church_id || !start_date || !end_date) {
      return res.status(400).json({ error: '필수 파라미터가 누락되었습니다.' });
    }

    if (isMock(req)) {
      const filtered = memoryDB.schedules
        .filter(s => s.church_id === church_id && s.date >= start_date && s.date <= end_date)
        .sort((a, b) => a.date.localeCompare(b.date));
      return res.json(filtered);
    }

    const supabase = getSupabaseClient(req.headers.authorization);
    const { data, error } = await supabase
      .from('qt_schedules')
      .select('*')
      .eq('church_id', church_id)
      .gte('date', start_date)
      .lte('date', end_date)
      .order('date', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. POST /api/qt-schedule/generate (자동생성)
app.post('/api/qt-schedule/generate', async (req, res) => {
  try {
    const {
      church_id,
      start_date,
      start_book,
      start_chap,
      end_book,
      end_chap,
      pages_per_day,
      exclude_days
    } = req.body;

    if (!church_id || !start_date || !start_book || !start_chap || !end_book || !end_chap) {
      return res.status(400).json({ error: '필수 파라미터가 누락되었습니다.' });
    }

    const startBookIdx = BIBLE_BOOKS.findIndex(b => b.name === start_book);
    const endBookIdx = BIBLE_BOOKS.findIndex(b => b.name === end_book);

    if (startBookIdx === -1 || endBookIdx === -1 || startBookIdx > endBookIdx) {
      return res.status(400).json({ error: '성경 범위 설정이 잘못되었습니다.' });
    }

    const chapters = [];
    for (let i = startBookIdx; i <= endBookIdx; i++) {
      const book = BIBLE_BOOKS[i];
      const sChap = (i === startBookIdx) ? parseInt(start_chap) : 1;
      const eChap = (i === endBookIdx) ? parseInt(end_chap) : book.chaps;

      for (let c = sChap; c <= eChap; c++) {
        chapters.push({ book: book.name, chap: c });
      }
    }

    const dailySchedules = [];
    const perDay = parseInt(pages_per_day) || 1;
    for (let i = 0; i < chapters.length; i += perDay) {
      const slice = chapters.slice(i, i + perDay);
      dailySchedules.push({
        reading_book: slice[0].book,
        reading_start_chap: slice[0].chap,
        reading_end_chap: slice[slice.length - 1].chap
      });
    }

    const records = [];
    let currentDate = new Date(start_date);
    const excluded = exclude_days || [];

    for (let i = 0; i < dailySchedules.length; ) {
      const dayOfWeek = currentDate.getDay();
      if (excluded.includes(dayOfWeek)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const sched = dailySchedules[i];
      const dateStr = currentDate.toISOString().split('T')[0];

      records.push({
        id: 'sched-' + Math.random().toString(36).substr(2, 9),
        church_id,
        date: dateStr,
        qt_book: sched.reading_book,
        qt_start_chap: sched.reading_start_chap,
        qt_start_verse: 1,
        qt_end_chap: sched.reading_start_chap,
        qt_end_verse: 30,
        qt_title: `${sched.reading_book} ${sched.reading_start_chap}장`,
        reading_book: sched.reading_book,
        reading_start_chap: sched.reading_start_chap,
        reading_end_chap: sched.reading_end_chap
      });

      currentDate.setDate(currentDate.getDate() + 1);
      i++;
    }

    if (isMock(req)) {
      for (const rec of records) {
        const idx = memoryDB.schedules.findIndex(s => s.church_id === rec.church_id && s.date === rec.date);
        if (idx > -1) {
          memoryDB.schedules[idx] = { ...memoryDB.schedules[idx], ...rec };
        } else {
          memoryDB.schedules.push(rec);
        }
      }
      return res.json({
        success: true,
        generated_count: records.length,
        message: `${records.length}일치 일정이 성공적으로 계산되어 업로드되었습니다.`
      });
    }

    const supabase = getSupabaseClient(req.headers.authorization);
    const { data, error } = await supabase
      .from('qt_schedules')
      .upsert(records.map(({id, ...r}) => r), { onConflict: 'church_id,date' });

    if (error) throw error;

    res.json({
      success: true,
      generated_count: records.length,
      message: `${records.length}일치 일정이 성공적으로 계산되어 업로드되었습니다.`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. POST /api/qt-schedule/update (수동수정)
app.post('/api/qt-schedule/update', async (req, res) => {
  try {
    const {
      id,
      church_id,
      date,
      qt_book,
      qt_start_chap,
      qt_start_verse,
      qt_end_chap,
      qt_end_verse,
      qt_title,
      reading_book,
      reading_start_chap,
      reading_end_chap
    } = req.body;

    if (!church_id || !date) {
      return res.status(400).json({ error: '교회 ID와 날짜는 필수입니다.' });
    }

    if (isMock(req)) {
      let idx = memoryDB.schedules.findIndex(s => s.church_id === church_id && s.date === date);
      const updatedItem = {
        id: id || (idx > -1 ? memoryDB.schedules[idx].id : 'sched-' + Math.random().toString(36).substr(2, 9)),
        church_id,
        date,
        qt_book,
        qt_start_chap: qt_start_chap ? parseInt(qt_start_chap) : null,
        qt_start_verse: qt_start_verse ? parseInt(qt_start_verse) : null,
        qt_end_chap: qt_end_chap ? parseInt(qt_end_chap) : null,
        qt_end_verse: qt_end_verse ? parseInt(qt_end_verse) : null,
        qt_title,
        reading_book,
        reading_start_chap: reading_start_chap ? parseInt(reading_start_chap) : null,
        reading_end_chap: reading_end_chap ? parseInt(reading_end_chap) : null,
        updated_at: new Date().toISOString()
      };
      if (idx > -1) {
        memoryDB.schedules[idx] = updatedItem;
      } else {
        memoryDB.schedules.push(updatedItem);
      }
      return res.json({
        success: true,
        message: '일정이 저장되었습니다.',
        schedule: updatedItem
      });
    }

    const supabase = getSupabaseClient(req.headers.authorization);

    const { data: schedule, error } = await supabase
      .from('qt_schedules')
      .upsert({
        id: id || undefined,
        church_id,
        date,
        qt_book,
        qt_start_chap: qt_start_chap ? parseInt(qt_start_chap) : null,
        qt_start_verse: qt_start_verse ? parseInt(qt_start_verse) : null,
        qt_end_chap: qt_end_chap ? parseInt(qt_end_chap) : null,
        qt_end_verse: qt_end_verse ? parseInt(qt_end_verse) : null,
        qt_title,
        reading_book,
        reading_start_chap: reading_start_chap ? parseInt(reading_start_chap) : null,
        reading_end_chap: reading_end_chap ? parseInt(reading_end_chap) : null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'church_id,date' })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: '일정이 저장되었습니다.',
      schedule
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SPA 대응 라우팅
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'test-app/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Express 백엔드 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
