import { FUZZY_PROVINCE_KEYWORDS, LOTTERY_SCHEDULE } from "@/constants/lotterySchedule";
import { ScanResult } from "@/constants/lotteryTicket";
import { parse, isValid, differenceInYears, differenceInDays, getDay } from 'date-fns';
import { distance } from 'fastest-levenshtein';

const cleanForFuzzy = (text: string) => {
  'worklet';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]|[^A-Z0-9]/g, ''); // Xóa dấu và ký tự đặc biệt cùng lúc
};
// Hàm tính độ tương đồng (0 đến 1)
const getSimilarity = (str1: string, str2: string) => {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;
  return (maxLength - distance(str1, str2)) / maxLength;
};


export const findStationWithLevenshtein = (lines: string[], dateStr?: string): string | undefined => {
  'worklet';
  if (!dateStr) return undefined;

  // 1. Parse ngày để lấy danh sách đài mở thưởng hôm đó (Giữ nguyên logic cũ của bạn)
  let parsedDate: Date | null = parse(dateStr, 'dd-MM-yyyy', new Date());

  if (!parsedDate) return undefined;

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayOfWeek = days[getDay(parsedDate)];

  let candidateProvinces = LOTTERY_SCHEDULE.reduce((acc, region) => {
    if (region.region === "north") return acc; // Bỏ qua miền Bắc vì quá nhiều đài
    const daily = region.schedule.find(s => s.date === dayOfWeek);

    return daily ? [...acc, ...daily.provinces] : acc;
  }, [] as string[]);
  candidateProvinces.push("Miền Bắc"); // Các đài phổ biến/đặc thù
  // 2. Duyệt qua từng dòng text để tìm kết quả tốt nhất
  let bestMatch = { province: '', score: 0 };
  const SIMILARITY_THRESHOLD = 0.65; // Độ chính xác trên 65% thì mới chấp nhận

  const cleanedLines = lines.map(l => cleanForFuzzy(l)).filter(l => l.length >= 3);
  for (const province of candidateProvinces) {
    const target = cleanForFuzzy(province);
    const keywords = (FUZZY_PROVINCE_KEYWORDS[province] || [province]).map(k => cleanForFuzzy(k));

    for (const line of cleanedLines) {
      // Cách 1: Keyword match (Cực nhanh)
      if (keywords.some(kw => line.includes(kw))) return province;

      // Cách 2: Levenshtein (Dành cho chữ bị bể nét)
      const score = getSimilarity(line, target);
      if (score > bestMatch.score) {
        bestMatch = { province, score };
        if (score > 0.9) return province; // Tìm thấy đài quá giống -> Thoát luôn
      }
    }
  }

  // Trả về kết quả có điểm cao nhất nếu vượt ngưỡng
  return bestMatch.score >= SIMILARITY_THRESHOLD ? bestMatch.province : undefined;
};

const isValidLotteryDate = (dateString: string): boolean => {
  'worklet'; // Nếu dùng trong frame processor

  let parsedDate: Date | null = parse(dateString, 'dd-MM-yyyy', new Date());

  // Kiểm tra xem format có đúng là ngày thật không (loại bỏ 31/02/2024...)
  if (!isValid(parsedDate)) return false;

  const now = new Date();

  // 3. Quy tắc: Không nhỏ hơn tối đa 5 năm
  const yearDiff = differenceInYears(now, parsedDate);
  if (yearDiff > 5 || yearDiff < 0) {
    // Nếu yearDiff < 0 nghĩa là ngày trong tương lai, sẽ check ở bước 4
    if (yearDiff > 5) return false;
  }

  // 4. Quy tắc: Không lớn hơn 30 ngày so với hiện tại
  const dayDiff = differenceInDays(parsedDate, now);
  if (dayDiff > 30) return false;

  // 5. Chặn các năm "vô lý" quá xa (ví dụ OCR đọc nhầm 2024 thành 2084)
  if (parsedDate.getFullYear() > now.getFullYear() + 1) return false;

  return true;
};

export const getMostFrequent = (stats: Record<string, number>) => {
  'worklet';
  let maxFreq = 0;
  let mostFrequentValue = "";

  for (const [value, freq] of Object.entries(stats)) {
    if (freq > maxFreq) {
      maxFreq = freq;
      mostFrequentValue = value;
    }
  }
  return { value: mostFrequentValue, freq: maxFreq };
};

// Helper: Chạy cực nhanh để kiểm tra xem một chuỗi có phải là 6 số vé số không
const isLotteryCode = (text: string) => {
  'worklet';
  const clean = text.replace(/[^0-9]/g, '');
  if (clean.length !== 6) return false;
  if (clean.slice(0, 5) === "10000") return false;
  return true;
};

const findStationWithSchedule = (lines: string[], dateStr?: string): string | undefined => {
  'worklet';
  if (!dateStr) return undefined;

  // --- GIỮ NGUYÊN LOGIC PARSE NGÀY ---
  let parsedDate: Date | null = parse(dateStr, 'dd-MM-yyyy', new Date());

  if (!parsedDate) return undefined;

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayOfWeek = days[getDay(parsedDate)];

  // 1. Lấy danh sách các tỉnh mở thưởng trong ngày
  let candidateProvinces = LOTTERY_SCHEDULE.reduce((acc, region) => {
    const daily = region.schedule.find(s => s.date === dayOfWeek);
    return daily ? [...acc, ...daily.provinces] : acc;
  }, [] as string[]);

  candidateProvinces.push("Miền Bắc");

  // --- THAY ĐỔI LOGIC SO KHỚP TẠI ĐÂY ---
  let bestGlobalMatch = { province: '', score: 0 };
  const MIN_SIMILARITY = 0.65; // Ngưỡng chấp nhận (65% giống trở lên)

  for (const line of lines) {
    // Làm sạch dòng text quét được để so sánh chính xác hơn
    const cleanLine = line.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanLine.length < 3) continue;

    for (const province of candidateProvinces) {
      const keywords = FUZZY_PROVINCE_KEYWORDS[province] || [province];

      for (const keyword of keywords) {
        // Làm sạch từ khóa mục tiêu
        const cleanKeyword = keyword.toUpperCase().replace(/[^A-Z0-9]/g, '');

        // Tính toán độ tương đồng Levenshtein
        const maxLength = Math.max(cleanLine.length, cleanKeyword.length);
        const diff = distance(cleanLine, cleanKeyword);
        const similarity = (maxLength - diff) / maxLength;

        // Nếu điểm cao hơn kỷ lục hiện tại, ghi nhận lại
        if (similarity > bestGlobalMatch.score) {
          bestGlobalMatch = { province, score: similarity };
        }

        // Nếu giống tuyệt đối (>90%), trả về luôn để tiết kiệm CPU
        if (similarity > 0.9) return province;
      }
    }
  }

  // Cuối cùng, nếu điểm cao nhất tìm được vượt ngưỡng thì mới trả về
  return bestGlobalMatch.score >= MIN_SIMILARITY ? bestGlobalMatch.province : undefined;
};

export const getCodePenaltyFactor = (code: string, dateStr?: string) => {
  if (!code) return 1;

  // 1. Tạo các mốc ngày tháng để so sánh (Hôm nay, Hôm qua, Ngày mai)
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  const formatDate = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    const yy = yyyy.slice(-2);
    return { ddmmyy: `${dd}${mm}${yy}`, mmyyyy: `${mm}${yyyy}`, ddmmyyyy: `${dd}${mm}${yyyy}` };
  };

  const datesToCheck = [formatDate(today), formatDate(yesterday), formatDate(tomorrow)];

  // KIỂM TRA CÁC QUY TẮC PHẠT

  // Quy tắc 1: Code giống ddmmyy hoặc mmyyyy của các ngày lân cận (Phạt nặng 0.3)
  const isLikelyDate = datesToCheck.some(d => d.ddmmyy === code || d.mmyyyy === code);
  if (isLikelyDate) return 0.3;

  // Quy tắc 2: Code chứa năm hiện tại (Ví dụ 2026) (Phạt 0.6)
  if (code.includes(new Date().getFullYear().toString())) return 0.6;

  // Quy tắc 3: Code chứa quá nhiều số 0 (Dấu hiệu của lỗi OCR hoặc vùng trống)
  if (code.includes("00000")) return 0.4;
  if (code.includes("0000")) return 0.7;

  // Quy tắc 4: Chống nhầm lẫn với chuỗi date đang hiển thị
  if (dateStr) {
    const cleanDate = dateStr.replace(/[^0-9]/g, '');
    if (cleanDate.includes(code)) return 0.3;
  }

  return 1; // Không vi phạm -> Giữ nguyên điểm
};

export const fastParseFrame = (lines: string[], currentDate: string | undefined, isImage: boolean = false): ScanResult | null => {
  'worklet';
  let result: ScanResult = {};
  let bestCode = { value: '', score: 0 }
  // Duyệt qua các dòng text (ML Kit trả về mảng các dòng là tốt nhất)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]; // ĐÃ UPPERCASE TẠI CALLER


    // 2. Tìm NGÀY (Regex tối giản chỉ tìm định dạng dd-mm-yyyy)
    if (!result.date) {
      // 1. Chuẩn hóa dòng: Thay thế mọi ký tự phân cách (space, dot, slash) thành dấu gạch ngang
      // Ví dụ: "02 - 1 / 2026" -> "02---1-/-2026"
      // Sau đó xóa bỏ khoảng trắng thừa
      const normalized = line.replace(/\s+/g, '').replace(/[./]/g, '-');

      // 2. Regex siêu linh hoạt
      // Nhóm 1 (\d{1,2}): Ngày (1 hoặc 2 số)
      // Ký tự phân cách [-]* : Cho phép nhiều dấu gạch ngang liên tiếp (do kết quả replace ở trên)
      // Nhóm 2 (\d{1,2}): Tháng (1 hoặc 2 số)
      // Nhóm 3 (202[4-6]): Năm
      const flexibleMatch = normalized.match(/(\d{1,2})-*(\d{1,2})-*(202[4-6])/);

      if (flexibleMatch) {
        const [_, dStr, mStr, yStr] = flexibleMatch;

        // 3. Chuẩn hóa về định dạng dd-mm-yyyy (Thêm số 0 nếu thiếu)
        const day = dStr.padStart(2, '0');
        const month = mStr.padStart(2, '0');
        const potentialDate = `${day}-${month}-${yStr}`;

        if (isValidLotteryDate(potentialDate)) {
          result.date = potentialDate;
        }
      }
    }
    if (isImage) {
      result.station = findStationWithLevenshtein(lines, result.date || currentDate);
    }

    if (!result.code && isLotteryCode(line) && bestCode.score < 1) {
      result.code = line.replace(/[^0-9]/g, '').slice(-6); // Lấy đúng 6 chữ số cuối
      const score = getCodePenaltyFactor(result.code, result.date || currentDate);
      if (score > bestCode.score) {
        bestCode = { value: result.code, score };
      }
    }
    // Nếu đã đủ 3 thông tin chính thì thoát sớm để tiết kiệm CPU
  }

  return result
};
