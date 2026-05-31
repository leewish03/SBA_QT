import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

function getSupabaseClient(authHeader) {
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

export async function GET(request) {
  const { pathname, searchParams } = new URL(request.url);
  const authHeader = request.headers.get('authorization');
  const supabase = getSupabaseClient(authHeader);

  try {
    // 1. GET /api/churches
    if (pathname.endsWith('/churches')) {
      const query = searchParams.get('query') || '';
      const slug = searchParams.get('slug') || '';
      
      let builder = supabase.from('qt_churches').select('*');
      if (slug) {
        builder = builder.eq('slug', slug);
      } else {
        builder = builder.eq('is_public', true).ilike('name', `%${query}%`);
      }
      
      const { data, error } = await builder;

      if (error) throw error;
      return NextResponse.json(data);
    }

    // 2. GET /api/qt-schedule
    if (pathname.endsWith('/qt-schedule')) {
      const churchId = searchParams.get('church_id');
      const startDate = searchParams.get('start_date');
      const endDate = searchParams.get('end_date');

      if (!churchId || !startDate || !endDate) {
        return NextResponse.json({ error: '필수 파라미터가 누락되었습니다.' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('qt_schedules')
        .select('*')
        .eq('church_id', churchId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: '존재하지 않는 엔드포인트입니다.' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { pathname } = new URL(request.url);
  const authHeader = request.headers.get('authorization');
  const supabase = getSupabaseClient(authHeader);

  try {
    const body = await request.json();

    // 1. POST /api/churches (생성)
    if (pathname.endsWith('/churches')) {
      const { name, invite_code, is_public, theme_color } = body;
      if (!name) {
        return NextResponse.json({ error: '교회 이름은 필수입니다.' }, { status: 400 });
      }

      // 유저 정보 가져오기
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
      }

      // 교회 생성
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

      // 멤버십에 admin으로 등록
      const { error: memberError } = await supabase
        .from('qt_church_members')
        .upsert({
          user_id: user.id,
          church_id: church.id,
          role: 'admin'
        });

      if (memberError) throw memberError;

      return NextResponse.json({ success: true, church }, { status: 201 });
    }

    // 2. POST /api/churches/join
    if (pathname.endsWith('/churches/join')) {
      const { church_id, invite_code } = body;
      if (!church_id) {
        return NextResponse.json({ error: '교회 ID가 필요합니다.' }, { status: 400 });
      }

      // 유저 정보 가져오기
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
      }

      // 가입하려는 교회의 초대코드 검증
      const { data: church, error: churchError } = await supabase
        .from('qt_churches')
        .select('invite_code')
        .eq('id', church_id)
        .single();

      if (churchError) throw churchError;

      if (church.invite_code && church.invite_code !== invite_code) {
        return NextResponse.json({ error: '초대 코드가 일치하지 않습니다.' }, { status: 400 });
      }

      // 멤버십 가입
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

      return NextResponse.json({ success: true, message: '교회 가입이 완료되었습니다.', member });
    }

    // 3. POST /api/churches/leave
    if (pathname.endsWith('/churches/leave')) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
      }

      const { error: leaveError } = await supabase
        .from('qt_church_members')
        .delete()
        .eq('user_id', user.id);

      if (leaveError) throw leaveError;

      return NextResponse.json({ success: true, message: '교회에서 정상적으로 탈퇴 처리되었습니다.' });
    }

    // 4. POST /api/qt-schedule/generate
    if (pathname.endsWith('/qt-schedule/generate')) {
      const {
        church_id,
        start_date,
        start_book,
        start_chap,
        end_book,
        end_chap,
        pages_per_day,
        exclude_days
      } = body;

      if (!church_id || !start_date || !start_book || !start_chap || !end_book || !end_chap) {
        return NextResponse.json({ error: '필수 파라미터가 누락되었습니다.' }, { status: 400 });
      }

      // 성경 챕터 리스트 빌드
      const startBookIdx = BIBLE_BOOKS.findIndex(b => b.name === start_book);
      const endBookIdx = BIBLE_BOOKS.findIndex(b => b.name === end_book);

      if (startBookIdx === -1 || endBookIdx === -1 || startBookIdx > endBookIdx) {
        return NextResponse.json({ error: '성경 범위 설정이 잘못되었습니다.' }, { status: 400 });
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

      // 하루에 pages_per_day 만큼 챕터를 나눕니다.
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

      // 날짜 계산 및 할당
      const records = [];
      let currentDate = new Date(start_date);
      const excluded = exclude_days || []; // 예: [0] (일요일)

      for (let i = 0; i < dailySchedules.length; ) {
        const dayOfWeek = currentDate.getDay();
        if (excluded.includes(dayOfWeek)) {
          // 건너뛰는 날짜의 경우 빈 일정을 넣어주거나, 아예 건너뜁니다.
          // 여기서는 일정을 건너뛰고 날짜만 증가시킵니다.
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        const sched = dailySchedules[i];
        const dateStr = currentDate.toISOString().split('T')[0];

        // 큐티용 정보는 통독 정보와 동일하게 혹은 임의로 세팅
        records.push({
          church_id,
          date: dateStr,
          qt_book: sched.reading_book,
          qt_start_chap: sched.reading_start_chap,
          qt_start_verse: 1,
          qt_end_chap: sched.reading_start_chap,
          qt_end_verse: 30, // 기본값
          qt_title: `${sched.reading_book} ${sched.reading_start_chap}장`,
          reading_book: sched.reading_book,
          reading_start_chap: sched.reading_start_chap,
          reading_end_chap: sched.reading_end_chap
        });

        currentDate.setDate(currentDate.getDate() + 1);
        i++;
      }

      // Supabase 벌크 업서트
      const { data, error } = await supabase
        .from('qt_schedules')
        .upsert(records, { onConflict: 'church_id,date' });

      if (error) throw error;

      return NextResponse.json({
        success: true,
        generated_count: records.length,
        message: `${records.length}일치 일정이 성공적으로 계산되어 업로드되었습니다.`
      });
    }

    // 5. POST /api/qt-schedule/update
    if (pathname.endsWith('/qt-schedule/update')) {
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
      } = body;

      if (!church_id || !date) {
        return NextResponse.json({ error: '교회 ID와 날짜는 필수입니다.' }, { status: 400 });
      }

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

      return NextResponse.json({
        success: true,
        message: '일정이 저장되었습니다.',
        schedule
      });
    }

    return NextResponse.json({ error: '존재하지 않는 엔드포인트입니다.' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
