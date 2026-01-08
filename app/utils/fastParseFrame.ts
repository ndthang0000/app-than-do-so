import { FUZZY_PROVINCE_KEYWORDS, LOTTERY_SCHEDULE } from "@/constants/lotterySchedule";
import { ScanResult } from "@/constants/lotteryTicket";
import { parse, isValid, differenceInYears, differenceInDays, getDay } from 'date-fns';
import { distance } from 'fastest-levenshtein';

const cleanForFuzzy = (text: string) => {
  'worklet';
  return text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
    .replace(/[^A-Z]/g, ''); // Chỉ giữ lại chữ cái
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
    const daily = region.schedule.find(s => s.date === dayOfWeek);
    return daily ? [...acc, ...daily.provinces] : acc;
  }, [] as string[]);
  candidateProvinces.push("Miền Bắc"); // Các đài phổ biến/đặc thù
  // 2. Duyệt qua từng dòng text để tìm kết quả tốt nhất
  let bestMatch = { province: '', score: 0 };
  const SIMILARITY_THRESHOLD = 0.65; // Độ chính xác trên 65% thì mới chấp nhận

  for (const line of lines) {
    const cleanedLine = cleanForFuzzy(line);
    if (cleanedLine.length < 4) continue; // Bỏ qua rác quá ngắn

    for (const province of candidateProvinces) {
      // Tên tỉnh mục tiêu đã dọn dẹp (ví dụ: "BINHDUONG")
      const target = cleanForFuzzy(province);

      // Cách 1: Thử khớp bằng Regex (Nhanh và chính xác cho text sạch)
      const keywords = FUZZY_PROVINCE_KEYWORDS[province];
      if (keywords && keywords.some(keyword => cleanedLine.includes(cleanForFuzzy(keyword)))) {
        return province;
      }

      // Cách 2: Nếu Regex trượt, dùng Levenshtein cho text "rác"
      // Chúng ta trích xuất một đoạn con trong cleanedLine có độ dài tương đương target để so sánh
      // hoặc so sánh trực tiếp nếu cleanedLine chứa các ký tự của target
      const score = getSimilarity(cleanedLine, target);
      if (score > bestMatch.score) {
        bestMatch = { province, score };
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

export const fastParseFrame = (lines: string[], currentDate: string | undefined, isImage: boolean = false): ScanResult | null => {
  'worklet';
  let result: ScanResult = {};

  // Duyệt qua các dòng text (ML Kit trả về mảng các dòng là tốt nhất)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toUpperCase();

    // 1. Tìm CODE (Ưu tiên số 1 vì nó là linh hồn của vé số)
    if (!result.code && isLotteryCode(line)) {
      result.code = line.replace(/[^0-9]/g, '').slice(0, 6);
    }


    // 2. Tìm NGÀY (Regex tối giản chỉ tìm định dạng dd-mm-yyyy)
    if (!result.date) {

      const dateMatch = line.match(/\d{2}[-./]\d{1,2}[-./]\d{4}/);

      if (dateMatch) {
        const potentialDate = dateMatch[0];

        // CHỈ LẤY NẾU NGÀY HỢP LỆ
        if (isValidLotteryDate(potentialDate)) {

          // result.date = potentialDate. Conver to dd-mm-yyyy
          const [d, m, y] = potentialDate.split(/[-./]/).map(Number);
          const day = d.toString().padStart(2, '0');
          const month = m.toString().padStart(2, '0');
          result.date = `${day}-${month}-${y}`;
        }
      }
      else {
        // 1. Làm sạch dòng: Loại bỏ khoảng trắng hoàn toàn
        // Ví dụ: "09 - 01 2026" -> "09-012026"

        const cleanedLine = line.replace(/\s+/g, '');

        // 2. Regex linh hoạt hơn: 
        // Tìm: 2 số (ngày) + 1 ký tự ngăn cách (tùy chọn) + 2 số (tháng) + 1 ký tự ngăn cách (tùy chọn) + 4 số (năm)
        // Đặc biệt: Nhắm vào năm 202X (thời điểm hiện tại)
        const flexibleDateMatch = cleanedLine.match(/(\d{2})[-./]?(\d{2})[-./]?(202[4-6])/);

        if (flexibleDateMatch) {
          const [_, dayStr, monthStr, yearStr] = flexibleDateMatch;

          // Tạo format chuẩn để check hợp lệ
          const potentialDate = `${dayStr}-${monthStr}-${yearStr}`;

          if (isValidLotteryDate(potentialDate)) {
            result.date = potentialDate;
          }
        }
        // 3. Fallback: Nếu OCR bị mất ký tự ngăn cách hoàn toàn (ví dụ: 09012026)
        else {
          const strictDigitMatch = cleanedLine.match(/(\d{2})(\d{2})(202[4-6])/);
          if (strictDigitMatch) {
            const [__, d, m, y] = strictDigitMatch;
            const potentialDate = `${d}-${m}-${y}`;
            if (isValidLotteryDate(potentialDate)) {
              result.date = potentialDate;
            }
          }
        }
      }

    }
    if (isImage) {
      result.station = findStationWithLevenshtein(lines, result.date || currentDate);
    }
    // Nếu đã đủ 3 thông tin chính thì thoát sớm để tiết kiệm CPU
  }

  return result
};