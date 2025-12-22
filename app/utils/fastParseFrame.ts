import { ScanResult } from "@/constants/lotteryTicket";
import { parse, isValid, differenceInYears, differenceInDays } from 'date-fns';

const isValidLotteryDate = (dateString: string): boolean => {
  'worklet'; // Nếu dùng trong frame processor

  // 1. Chuyển đổi các dấu phân cách về chuẩn '/' để dễ parse
  const normalizedDate = dateString.replace(/[-.]/g, '/');
  const formats = ['dd/MM/yyyy', 'dd/M/yyyy'];
  let parsedDate: Date | null = null;

  for (const fmt of formats) {
    const temp = parse(normalizedDate, fmt, new Date());
    if (isValid(temp)) {
      parsedDate = temp;
      break;
    }
  }

  if (!parsedDate) return false;

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

export const fastParseFrame = (lines: string[]): ScanResult | null => {
  'worklet';

  let result: ScanResult = {};

  // Duyệt qua các dòng text (ML Kit trả về mảng các dòng là tốt nhất)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toUpperCase();

    // 1. Tìm CODE (Ưu tiên số 1 vì nó là linh hồn của vé số)
    if (!result.code && isLotteryCode(line)) {
      result.code = line.replace(/[^0-9]/g, '').slice(0, 6);
    }

    // 2. Tìm ĐÀI QUAY (Sử dụng mảng từ khóa thay vì Regex phức tạp)
    if (!result.station) {
      // Danh sách đài viết gọn để check .includes() cực nhanh
      const stations = ["TP.HCM", "LONG AN", "TIỀN GIANG", "KIÊN GIANG", "BÌNH DƯƠNG"];
      for (const s of stations) {
        if (line.includes(s)) {
          result.station = s;
          break;
        }
      }
    }

    // 3. Tìm NGÀY (Regex tối giản chỉ tìm định dạng dd-mm-yyyy)
    if (!result.date) {
      // Regex tìm định dạng dd/mm/yyyy hoặc dd-mm-yyyy
      const dateMatch = line.match(/\d{2}[/-]\d{1,2}[/-]\d{4}/);

      if (dateMatch) {
        const potentialDate = dateMatch[0];

        // CHỈ LẤY NẾU NGÀY HỢP LỆ
        if (isValidLotteryDate(potentialDate)) {
          result.date = potentialDate;
        }
      }
    }

    // Nếu đã đủ 3 thông tin chính thì thoát sớm để tiết kiệm CPU
    if (result.code && result.station && result.date) break;
  }

  return result.code ? result : null;
};