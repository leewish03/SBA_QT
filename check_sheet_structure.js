const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
    keyFile: './cbf-praylist-11bbf27f1baa.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = '1wtUI5KvigQBFz8Z-QBs0nwG90B-wXYyX0luAHSan4SY';

async function checkSheets() {
    try {
        const metadata = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
        const sheetNames = metadata.data.sheets.map(s => s.properties.title);
        console.log("시트 목록:", sheetNames);

        for (const sheetName of sheetNames) {
            console.log(`\n--- ${sheetName} ---`);
            const res = await sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: `'${sheetName}'!A1:G3`
            });
            console.log(res.data.values);
        }
    } catch (e) {
        console.error("에러 발생:", e.message);
    }
}
checkSheets();
