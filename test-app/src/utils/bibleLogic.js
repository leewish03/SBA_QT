export const FULL_TO_SHORT = {
    "창세기": "창", "출애굽기": "출", "레위기": "레", "민수기": "민", "신명기": "신", "여호수아": "수", "사사기": "삿", "룻기": "룻", "사무엘상": "삼상", "사무엘하": "삼하", "열왕기상": "왕상", "열왕기하": "왕하", "역대상": "대상", "역대하": "대하", "에스라": "스", "느헤미야": "느", "에스더": "에", "욥기": "욥", "시편": "시", "잠언": "잠", "전도서": "전", "아가": "아", "이사야": "사", "예레미야": "렘", "예레미야 애가": "애", "에스겔": "겔", "다니엘": "단", "호세아": "호", "요엘": "욜", "아모스": "암", "오바댜": "옵", "요나": "욘", "미가": "미", "나훔": "나", "하박국": "합", "스바냐": "습", "학개": "학", "스가랴": "슥", "말라기": "말", "마태복음": "마", "마가복음": "막", "누가복음": "눅", "요한복음": "요", "사도행전": "행", "로마서": "롬", "고린도전서": "고전", "고린도후서": "고후", "갈라디아서": "갈", "에베소서": "엡", "빌립보서": "빌", "골로새서": "골", "데살로니가전서": "살전", "데살로니가후서": "살후", "디모데전서": "딤전", "디모데후서": "딤후", "디도서": "딛", "빌레몬서": "몬", "히브리서": "히", "야고보서": "약", "베드로전서": "벧전", "베드로후서": "벧후", "요한일서": "요일", "요한이서": "요이", "요한삼서": "요삼", "유다서": "유", "요한계시록": "계"
};

export const KOR_TO_ENG = {
    "창": "GEN", "출": "EXO", "레": "LEV", "민": "NUM", "신": "DEU",
    "수": "JOS", "삿": "JDG", "룻": "RUT", "삼상": "1SA", "삼하": "2SA",
    "왕상": "1KI", "왕하": "2KI", "대상": "1CH", "대하": "2CH", "스": "EZR",
    "느": "NEH", "에": "EST", "욥": "JOB", "시": "PSA", "잠": "PRO",
    "전": "ECC", "아": "SNG", "사": "ISA", "렘": "JER", "애": "LAM",
    "겔": "EZK", "단": "DAN", "호": "HOS", "욜": "JOL", "암": "AMO",
    "옵": "OBA", "욘": "JON", "미": "MIC", "나": "NAM", "합": "HAB",
    "습": "ZEP", "학": "HAG", "슥": "ZEC", "말": "MAL", "마": "MAT",
    "막": "MRK", "눅": "LUK", "요": "JHN", "행": "ACT", "롬": "ROM",
    "고전": "1CO", "고후": "2CO", "갈": "GAL", "엡": "EPH", "빌": "PHP",
    "골": "COL", "살전": "1TH", "살후": "2TH", "딤전": "1TI", "딤후": "2TI",
    "딛": "TIT", "몬": "PHM", "히": "HEB", "약": "JAS", "벧전": "1PE",
    "벧후": "2PE", "요일": "1JN", "요이": "2JN", "요삼": "3JN", "유": "JUD",
    "계": "REV"
};

export const SHORT_TO_FULL = Object.fromEntries(
    Object.entries(FULL_TO_SHORT).map(([full, short]) => [short, full])
);

export const DAYS_ARR = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

export function getMidnightKST(dateObj) {
  let d = dateObj;
  
  // 1. 입력 인자 유효성 선검증
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    d = new Date(d);
  }
  if (isNaN(d.getTime())) {
    d = new Date(); // 변환에 완전히 실패할 경우 오늘 날짜로 폴백
  }
  
  try {
    // ko-KR 로케일과 Asia/Seoul 타임존 고정
    const formatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(d);
    
    let year, month, day;
    for (const part of parts) {
      if (part.type === 'year') year = parseInt(part.value, 10);
      if (part.type === 'month') month = parseInt(part.value, 10);
      if (part.type === 'day') day = parseInt(part.value, 10);
    }
    
    if (year && month && day) {
      // UTC 기준으로 연, 월(0~11), 일을 설정하여 시간 오프셋 혼선 차단
      return new Date(Date.UTC(year, month - 1, day));
    }
  } catch (e) {
    console.warn("Intl formatToParts 파싱 실패, 로컬 시간대 기준 폴백 작동:", e);
  }
  
  // 2. Fallback: Intl 미지원 혹은 예외 발생 시 로컬 연/월/일 추출 기반 안전 계산
  const localYear = d.getFullYear();
  const localMonth = d.getMonth();
  const localDate = d.getDate();
  return new Date(Date.UTC(localYear, localMonth, localDate));
}

export function safeToISODateString(dateObj) {
  let d = dateObj;
  
  // 입력 인자 유효성 및 포맷 검증
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    console.warn("safeToISODateString: Invalid date, fallback to today.");
    d = new Date();
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
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
