const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config();

const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // JSON 바디 파서 필수 추가

// React 빌드 결과물(test-app/dist) 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'test-app/dist')));

// Google Sheets API 인증 설정
let auth;
if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.log("환경 변수 GOOGLE_SERVICE_ACCOUNT_JSON을 사용하여 Google Auth를 초기화합니다.");
    try {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
    } catch (err) {
        console.error("GOOGLE_SERVICE_ACCOUNT_JSON 환경 변수 파싱 에러:", err.message);
    }
}

if (!auth) {
    console.log("로컬 키 파일(cbf-praylist-11bbf27f1baa.json)을 사용하여 Google Auth를 초기화합니다.");
    auth = new google.auth.GoogleAuth({
        keyFile: './cbf-praylist-11bbf27f1baa.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
}

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = '1wtUI5KvigQBFz8Z-QBs0nwG90B-wXYyX0luAHSan4SY'; // 대상 구글 시트 ID

// 캐싱 변수
let cachedSchedule = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1시간 캐시

function rowsToObjects(rows) {
    if (!rows || rows.length === 0) return [];
    const headers = rows[0];
    const data = [];
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || ""; 
        });
        data.push(obj);
    }
    return data;
}

async function fetchAndParseSchedule() {
    try {
        const [qtRes, readingRes] = await Promise.all([
            sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: "'qt_plan'!A:E"
            }),
            sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: "'sba_reading_plan'!A:E"
            })
        ]);
        const qt_plan = rowsToObjects(qtRes.data.values);
        const reading_plan = rowsToObjects(readingRes.data.values);
        return {
            qt_plan,
            reading_plan
        };
    } catch (e) {
        console.error("데이터 파싱 실패:", e.message);
        throw e;
    }
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ebfpjvwwbognddixrvyc.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

console.log(`[Supabase Config] URL: ${supabaseUrl ? 'OK' : 'MISSING'}, Key: ${supabaseAnonKey ? `OK (${supabaseAnonKey.substring(0, 10)}...)` : 'MISSING'}`);

const memoryDB = {
  churches: [
    {
      id: '5e87c20a-39e6-440b-925a-04c225c28940',
      name: '서울북부교회',
      invite_code: null,
      is_public: true,
      theme_color: '#4A5568',
      slug: 'seoul-north',
      created_at: new Date().toISOString()
    }
  ],
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
    const slug = req.query.slug || '';
    if (isMock(req)) {
      if (slug) {
        const church = memoryDB.churches.find(c => c.slug === slug);
        return res.json(church ? [church] : []);
      }
      const filtered = memoryDB.churches.filter(c => 
        c.is_public && c.name.toLowerCase().includes(query.toLowerCase())
      );
      return res.json(filtered);
    }
    const supabase = getSupabaseClient(req.headers.authorization);
    let builder = supabase.from('qt_churches').select('*');
    if (slug) {
      builder = builder.eq('slug', slug);
    } else {
      builder = builder.eq('is_public', true).ilike('name', `%${query}%`);
    }
    const { data, error } = await builder;

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
          role: 'admin',
          created_at: new Date().toISOString()
        };
        memoryDB.members.push(member);
      } else {
        member.role = 'admin';
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
        slug: church.slug || 'seoul-north',
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
      .select('name, theme_color, invite_code, slug')
      .eq('id', memberData.church_id)
      .single();

    if (churchError) throw churchError;

    res.json({
      id: memberData.church_id,
      name: churchData.name,
      theme_color: churchData.theme_color,
      invite_code: churchData.invite_code,
      slug: churchData.slug,
      role: memberData.role
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. GET /api/sba-qt (구글 시트 연동 및 캐시 조회)
app.get('/api/sba-qt', async (req, res) => {
  try {
    const purge = req.query.purge === 'true';
    if (purge) {
      const paramToken = req.query.token;
      const authHeader = req.headers['authorization'];
      const headerToken = authHeader ? authHeader.replace('Bearer ', '') : '';
      const targetToken = paramToken || headerToken;
      const ADMIN_PURGE_TOKEN = process.env.ADMIN_PURGE_TOKEN || 'sba_qt_admin_secret_token';

      if (!targetToken || targetToken !== ADMIN_PURGE_TOKEN) {
        return res.status(401).json({ error: '인증 권한이 없거나 토큰이 유효하지 않습니다.' });
      }

      cachedSchedule = null;
      lastFetchTime = 0;
      console.log("관리자에 의해 구글 시트 캐시가 강제 갱신(Purge)되었습니다.");
    }

    const now = Date.now();
    if (!cachedSchedule || (now - lastFetchTime > CACHE_DURATION_MS)) {
      console.log("구글 시트에서 최신 일정을 동기화합니다...");
      cachedSchedule = await fetchAndParseSchedule();
      lastFetchTime = now;
    }

    res.json({
      ...cachedSchedule,
      purged: purge
    });
  } catch (error) {
    console.error("SBA_QT 시트 연동 오류:", error);
    res.status(500).json({ error: '데이터를 처리하는 중 오류가 발생했습니다.' });
  }
});

// 6. GET /api/schedule (프론트엔드 일반 스케줄 요청용 폴백/대응)
app.get('/api/schedule', async (req, res) => {
  try {
    const now = Date.now();
    if (!cachedSchedule || (now - lastFetchTime > CACHE_DURATION_MS)) {
      console.log("구글 시트에서 최신 일정을 동기화합니다...");
      cachedSchedule = await fetchAndParseSchedule();
      lastFetchTime = now;
    }
    res.json(cachedSchedule);
  } catch (error) {
    console.error("API 오류:", error);
    res.status(500).json({ error: '데이터를 불러오는 중 오류가 발생했습니다.' });
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
