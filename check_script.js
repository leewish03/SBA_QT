const fs = require('fs');

console.log("=== Checking bible_data.json ===");
try {
    const bible = JSON.parse(fs.readFileSync('./test-app/public/bible_data.json', 'utf8'));
    console.log("옵 (오바댜):", bible['옵'] ? (bible['옵']['1'] ? `1장에 ${Object.keys(bible['옵']['1']).length}절 존재` : `1장 없음!`) : "옵 책 없음!");
    console.log("요삼 (요한삼서):", bible['요삼'] ? (bible['요삼']['1'] ? `1장에 ${Object.keys(bible['요삼']['1']).length}절 존재` : `1장 없음!`) : "요삼 책 없음!");
} catch (err) {
    console.error("bible_data.json 확인 실패:", err.message);
}

console.log("\n=== Checking Google Sheets ===");
try {
    const { google } = require('googleapis');
    const auth = new google.auth.GoogleAuth({
        keyFile: './cbf-praylist-11bbf27f1baa.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    async function checkSheets() {
        try {
            const res = await sheets.spreadsheets.values.get({
                spreadsheetId: '1wtUI5KvigQBFz8Z-QBs0nwG90B-wXYyX0luAHSan4SY',
                range: 'A:G'
            });
            console.log("시트 읽기 성공! 데이터 샘플 1~5번째 줄:");
            console.log(res.data.values.slice(0, 5));
        } catch (e) {
            console.error("구글 시트 읽기 실패:", e.message);
        }
    }
    checkSheets();
} catch (err) {
    console.error("구글 시트 검사 준비 실패:", err.message);
}
