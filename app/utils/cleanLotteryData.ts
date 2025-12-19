import { LOTTERY_SCHEDULE, PROVINCE_REGEX_MAP } from "@/constants/lotterySchedule";


export const cleanAndParseLotteryData = (rawText: string) => {
  // Chuẩn hóa văn bản: Viết hoa, thay ký tự gây nhầm lẫn
  let cleanText = rawText.toUpperCase();


  // Chia text thành mảng các dòng
  const lines = cleanText.split('\n').map(line => line.trim());
  // --- BƯỚC 1: TRÍCH XUẤT NGÀY ---
  let ticketDate: string | null = null;
  let ticketStation: string | null = null;
  let dayOfWeek: number | null = null;
  let detectedRegion: string | null = null;

  // --- BƯỚC 1: TÌM NGÀY (DATE) THEO DÒNG ---
  for (const line of lines) {
    // Loại bỏ mọi khoảng trắng trong dòng để xử lý "01 - 02 - 2025" thành "01022025"
    const denseLine = line.replace(/\s+/g, '');

    // Regex tìm: dd-mm-yyyy, ddmmyyyy, dd.mm.yyyy với năm là 2025 hoặc 2026
    // Pattern: 2 số đầu - 2 số giữa - 4 số năm (2025/2026)
    const dateMatch = denseLine.match(/(\d{1,2})[-/.]?(\d{1,2})[-/.]?(20\d{2})/);

    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      const year = dateMatch[3];
      ticketDate = `${day}-${month}-${year}`;
      break; // Tìm thấy ngày rồi thì dừng
    }
  }

  // --- BƯỚC 2: XÁC ĐỊNH ĐÀI ---
  if (ticketDate) {
    const [d, m, y] = ticketDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    dayOfWeek = dateObj.getDay();
    const weekdayName = days[dateObj.getDay()];

    // Duyệt qua từng Miền trong Schedule của bạn
    for (const regionEntry of LOTTERY_SCHEDULE) {
      const daySchedule = regionEntry.schedule.find(s => s.date === weekdayName);

      if (daySchedule) {
        for (const provinceName of daySchedule.provinces) {
          // Lấy danh sách Regex cho tỉnh hiện tại từ Map
          const regexList = PROVINCE_REGEX_MAP[provinceName] || [];

          // Kiểm tra xem có bất kỳ regex nào khớp với dòng nào trong text không
          const isMatch = lines.some(line =>
            regexList.some(regex => regex.test(line))
          );

          if (isMatch) {
            ticketStation = provinceName;
            detectedRegion = regionEntry.regionName;
          }
        }
      }
    }
  }

  // --- BƯỚC 3: TRÍCH XUẤT CODE (PIPELINE) ---
  const extractCode = (lines: string[]): string | null => {


    const currentYears = ["2024", "2025", "2026"];

    // Helper 1: Kiểm tra 6 số và không chứa năm
    const is6Digits = (text: string) => /^\d{6}$/.test(text);
    const isNotYear = (text: string) => !currentYears.some(year => text.includes(year));

    const isValidCode = (code: string) => {
      return /^\d{6}$/.test(code) && !currentYears.some(year => code.includes(year));
    };
    // Helper 2: Đếm tần suất xuất hiện
    const getMostFrequent = (arr: string[]) => {
      if (arr.length === 0) return null;
      const counts = arr.reduce((a: any, b) => { a[b] = (a[b] || 0) + 1; return a; }, {});
      return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    };

    // --- Pipeline 1: Dòng CHỈ có đúng 6 số (Exact Match 6 chars) ---
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.length === 6 && is6Digits(line)) return line;
    }

    // --- Pipeline 2: Dòng chứa cụm 6 số (Có thể lẫn text xung quanh) ---
    for (let i = lines.length - 1; i >= 0; i--) {
      const matches = lines[i].match(/\d{6}/g);
      if (matches) {
        // Lấy số cuối cùng trong dòng (thường số trúng nằm bên phải hoặc dưới)
        const valid = matches.filter(isNotYear);
        if (valid.length > 0) return valid[valid.length - 1];
      }
    }

    // --- Pipeline 3: Clean " " và "." -> Tìm dòng có đúng 6 số ---
    for (let i = lines.length - 1; i >= 0; i--) {
      const cleaned = lines[i].replace(/[.\s]+/g, '');
      if (cleaned.length === 6 && is6Digits(cleaned)) return cleaned;
    }

    for (let i = lines.length - 1; i >= 0; i--) {
      const onlyNumbers = lines[i].replace(/[^\d]/g, '');
      if (isValidCode(onlyNumbers)) return onlyNumbers;

      // Nếu dòng chứa nhiều cụm số mà ghép lại có 6 số ở đầu
      const match = onlyNumbers.match(/^\d{6}/);
      if (match && isNotYear(match[0])) return match[0];
    }
    // --- Pipeline 5: Clean sạch ký tự đặc biệt -> Tìm tất cả 6 số & Lấy số phổ biến nhất ---
    let candidatesP4: string[] = [];
    for (const line of lines) {
      const onlyNumbers = line.replace(/[^\d]/g, '');
      const matches = onlyNumbers.match(/\d{6}/g);
      if (matches) {
        candidatesP4.push(...matches.filter(isNotYear));
      }
    }
    const resultP4 = getMostFrequent(candidatesP4);
    if (resultP4) return resultP4;

    for (let i = 0; i < lines.length - 1; i++) {
      const combined = (lines[i] + lines[i + 1]).replace(/[^\d]/g, '');
      const match = combined.match(/\d{6}/);
      if (match && isNotYear(match[0])) return match[0];
    }
    // --- Pipeline 7: Convert ký tự gây hiểu lầm (O, I, S, B) ---
    let candidatesP5: string[] = [];
    const mapChars: Record<string, string> = { 'O': '0', 'I': '1', 'S': '5', 'B': '8' };

    for (const line of lines) {
      let substituted = line.toUpperCase().replace(/[OISB]/g, (char) => mapChars[char]);
      const onlyNumbers = substituted.replace(/[^\d]/g, '');
      const matches = onlyNumbers.match(/\d{6}/g);
      if (matches) {
        candidatesP5.push(...matches.filter(isNotYear));
      }
    }
    return getMostFrequent(candidatesP5);
  };

  const ticketCode = extractCode(lines);

  return {
    code: ticketCode,
    date: ticketDate,
    station: ticketStation,
    dayOfWeek: dayOfWeek, // Trả về để debug nếu cần
    detectedRegion: detectedRegion,
  };
};

// const textSample = `KI
// EN
// BÌNH
// T
// PHU
// Nhận KOXS Binh Phước
// soạn: XSBP gửi 8177- 997
// 11K2-N24 Thứ Bảy
// 09-11-2024
// e In tei XN In Tài chính TP.HCM
// GIÂI ĐẶC BIỆT 2 TỶ ĐÔNG (10.000a)
// 576934
// 11K2-N24
// 09-11-2024
// Năm Bảy Sau Chin Ba Bốn
// EN934"
// EN`;

// console.log("đây rồi okla: ", cleanAndParseLotteryData(textSample));