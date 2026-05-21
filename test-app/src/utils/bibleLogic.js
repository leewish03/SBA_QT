export const FULL_TO_SHORT = {
    "창세기": "창", "출애굽기": "출", "레위기": "레", "민수기": "민", "신명기": "신", "여호수아": "수", "사사기": "삿", "룻기": "룻", "사무엘상": "삼상", "사무엘하": "삼하", "열왕기상": "왕상", "열왕기하": "왕하", "역대상": "대상", "역대하": "대하", "에스라": "스", "느헤미야": "느", "에스더": "에", "욥기": "욥", "시편": "시", "잠언": "잠", "전도서": "전", "아가": "아", "이사야": "사", "예레미야": "렘", "예레미야 애가": "애", "에스겔": "겔", "다니엘": "단", "호세아": "호", "요엘": "욜", "아모스": "암", "오바댜": "옵", "요나": "욘", "미가": "미", "나훔": "나", "하박국": "합", "스바냐": "습", "학개": "학", "스가랴": "슥", "말라기": "말", "마태복음": "마", "마가복음": "막", "누가복음": "눅", "요한복음": "요", "사도행전": "행", "로마서": "롬", "고린도전서": "고전", "고린도후서": "고후", "갈라디아서": "갈", "에베소서": "엡", "빌립보서": "빌", "골로새서": "골", "데살로니가전서": "살전", "데살로니가후서": "살후", "디모데전서": "딤전", "디모데후서": "딤후", "디도서": "딛", "빌레몬서": "몬", "히브리서": "히", "야고보서": "약", "베드로전서": "벧전", "베드로후서": "벧후", "요한일서": "요일", "요한이서": "요이", "요한삼서": "요삼", "유다서": "유", "요한계시록": "계"
};

export const SHORT_TO_FULL = Object.fromEntries(
    Object.entries(FULL_TO_SHORT).map(([full, short]) => [short, full])
);

export const DAYS_ARR = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

export function getMidnightKST(dateObj) {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
    const [year, month, day] = formatter.format(dateObj).split('-');
    return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
}

export function getEffectiveDate() {
    const formatter = new Intl.DateTimeFormat('en-US', { 
        timeZone: 'Asia/Seoul', 
        year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', hour12: false
    });
    
    const parts = formatter.formatToParts(new Date());
    let y, m, d, h;
    for (let p of parts) {
        if (p.type === 'year') y = parseInt(p.value);
        if (p.type === 'month') m = parseInt(p.value);
        if (p.type === 'day') d = parseInt(p.value);
        if (p.type === 'hour') h = parseInt(p.value);
    }
    
    // 사용자의 로컬 환경 객체로 만듦 
    // (getMonth() 등의 일관성을 위해 Date.UTC가 아니라 로컬 Date 객체 이용)
    let kstDate = new Date(y, m - 1, d);
    
    // 아침 5시 이전이면, 큐티 달력상 '어제'로 간주
    if (h < 5) {
        kstDate.setDate(kstDate.getDate() - 1);
    }
    return kstDate;
}

export function calcQtDays(startKST, targetKST) {
    if (targetKST < startKST) return 0;
    let days = 0;
    let current = new Date(startKST.getTime());
    while (current <= targetKST) {
        if (current.getUTCDay() !== 0) days++; // 일요일(0) 제외
        current.setUTCDate(current.getUTCDate() + 1);
    }
    return days;
}

export function parseRange(rangeStr) {
    if (!rangeStr || rangeStr === "없음") return [];
    if (rangeStr === "전체") return ["전체"];
    const parts = String(rangeStr).split("-");
    if (parts.length === 2) {
        const res = [];
        for (let i = parseInt(parts[0]); i <= parseInt(parts[1]); i++) res.push(i);
        return res;
    }
    return [parseInt(parts[0])];
}
