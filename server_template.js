const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

const path = require('path');

// CORS 설정 (프론트엔드 도메인이 확정되면 해당 도메인만 허용하도록 변경 가능)
app.use(cors());

// React 빌드 결과물(test-app/dist) 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'test-app/dist')));

// Google Sheets API 인증 설정 (Render 배포 환경에서는 환경 변수를, 로컬에서는 JSON 파일을 사용)
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
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1시간 캐시 (API 호출 제한 방어)

// 2D 배열(구글 API 응답)을 Object 배열(JSON)로 변환하는 헬퍼 함수
function rowsToObjects(rows) {
    if (!rows || rows.length === 0) return [];
    
    const headers = rows[0]; // 첫 번째 줄은 컬럼명
    const data = [];
    
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const obj = {};
        headers.forEach((header, index) => {
            // 값이 없으면 빈 문자열 또는 undefined
            obj[header] = row[index] || ""; 
        });
        data.push(obj);
    }
    return data;
}

// 핵심 로직: 구글 시트 2개 탭에서 데이터를 취합하여 JSON 형태로 묶음
async function fetchAndParseSchedule() {
    try {
        // 병렬로 2개 탭 정보 동시 요청
        const [qtRes, readingRes] = await Promise.all([
            sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: "'qt_plan'!A:E" // QT 일정 시트
            }),
            sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: "'sba_reading_plan'!A:E" // 성경 통독 일정 시트
            })
        ]);

        // 객체 배열로 데이터 가공
        const qt_plan = rowsToObjects(qtRes.data.values);
        const reading_plan = rowsToObjects(readingRes.data.values);

        // 프론트엔드가 정확히 기대하는 JSON 구조 포맷! 
        // (프론트에서 이 raw data를 받아서 날짜 계산 및 매핑을 스스로 다 처리함)
        return {
            qt_plan: qt_plan,
            reading_plan: reading_plan
        };
    } catch (e) {
        console.error("데이터 파싱 실패:", e.message);
        throw e;
    }
}

// 프론트엔드에서 찌를 접속 API 엔드포인트
app.get('/api/schedule', async (req, res) => {
    try {
        const now = Date.now();
        // 캐시 만료 시에만 구글 API 긁어오기 (성도들이 1만번 접속해도 구글 API는 1시간에 1번만 호출됨)
        if (!cachedSchedule || (now - lastFetchTime > CACHE_DURATION_MS)) {
            console.log("구글 시트에서 최신 일정을 동기화합니다...");
            cachedSchedule = await fetchAndParseSchedule();
            lastFetchTime = now;
        }

        // 묶은 JSON을 프론트엔드로 응답
        res.json(cachedSchedule);
    } catch (error) {
        console.error("API 요류:", error);
        res.status(500).json({ error: '데이터를 불러오는 중 오류가 발생했습니다.' });
    }
});

// SPA 대응 라우팅 (API가 아닌 모든 GET 요청은 index.html 서빙)
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, 'test-app/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`백엔드 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    console.log(`GET http://localhost:${PORT}/api/schedule 로 접속 테스트 가능!`);
});
