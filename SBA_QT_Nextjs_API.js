// ==========================================
// Next.js (App Router) 엔드포인트 코드 조각
// 위치 예시: app/api/sba-qt/route.js
// 필요 패키지: npm install googleapis
// ==========================================
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

let cachedSchedule = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1시간 캐싱

// 관리자 캐시 퍼지 토큰 (실배포 환경에서는 process.env.ADMIN_PURGE_TOKEN 등으로 관리)
const ADMIN_PURGE_TOKEN = process.env.ADMIN_PURGE_TOKEN || 'sba_qt_admin_secret_token';

// 2D 배열을 Object 배열로 변환하는 함수
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

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const purge = searchParams.get('purge') === 'true';

        // 캐시 퍼지 요청이 들어온 경우
        if (purge) {
            const authHeader = request.headers.get('authorization');
            const token = authHeader ? authHeader.replace('Bearer ', '') : '';

            // 쿼리 파라미터로도 토큰을 전달할 수 있도록 지원 (?token=xxx)
            const paramToken = searchParams.get('token');
            const targetToken = token || paramToken;

            if (!targetToken || targetToken !== ADMIN_PURGE_TOKEN) {
                return NextResponse.json({ error: '인증 권한이 없거나 토큰이 유효하지 않습니다.' }, { status: 401 });
            }

            // 캐시 초기화
            cachedSchedule = null;
            lastFetchTime = 0;
            console.log("관리자에 의해 구글 시트 캐시가 강제 갱신(Purge)되었습니다.");
        }

        const now = Date.now();
        
        // 1. 캐시 확인
        if (cachedSchedule && (now - lastFetchTime < CACHE_DURATION_MS)) {
            return NextResponse.json(cachedSchedule);
        }

        // 2. Google 권한 인증 설정 
        // (주의: 인증키 json 파일은 서버루트에 두거나, Vercel 환경변수(Base64)로 처리하는 것이 좋습니다)
        const auth = new google.auth.GoogleAuth({
            keyFile: './cbf-praylist-11bbf27f1baa.json', // 실제 위치에 맞게 경로 수정
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        const sheets = google.sheets({ version: 'v4', auth });
        const SPREADSHEET_ID = '1wtUI5KvigQBFz8Z-QBs0nwG90B-wXYyX0luAHSan4SY';

        // 3. 구글 시트 데이터 병렬 패치
        const [qtRes, readingRes] = await Promise.all([
            sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: "'qt_plan'!A:E" }),
            sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: "'sba_reading_plan'!A:E" })
        ]);

        // 4. JSON 변환 및 캐싱
        cachedSchedule = {
            qt_plan: rowsToObjects(qtRes.data.values),
            reading_plan: rowsToObjects(readingRes.data.values)
        };
        lastFetchTime = now;

        return NextResponse.json({
            ...cachedSchedule,
            purged: purge
        });

    } catch (error) {
        console.error("SBA_QT 시트 연동 오류:", error);
        return NextResponse.json({ error: 'Failed to fetch schedule data.' }, { status: 500 });
    }
}
