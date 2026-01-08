import { LOTTERY_SCHEDULE } from "@/constants/lotterySchedule";
import { ScanResult, Region, CheckAndSavePayload } from "@/constants/lotteryTicket";

import { getDay, parse } from "date-fns";

export const prepareTicketPayload = (scanResult: ScanResult, duration: number): CheckAndSavePayload => {
  // 1. Xác định ngày trong tuần từ scanResult.date (định dạng dd-MM-yyyy)
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const parsedDate = parse(scanResult.date!, 'dd-MM-yyyy', new Date());
  const dayOfWeek = days[getDay(parsedDate)];

  let payload: CheckAndSavePayload = {
    date: scanResult.date!,
    station: scanResult.station || '',
    durationScan: Number(duration.toFixed(1)),
    code: scanResult.code!,
    region: 'south', // Sẽ được ghi đè bên dưới
  };

  // 2. Xử lý logic tìm Region và Station
  if (scanResult.station === 'Miền Bắc') {
    payload.region = 'north';
    // Nếu bạn muốn giữ nguyên 'Miền Bắc' cho station hoặc lấy tỉnh cụ thể theo schedule:
    const northEntry = LOTTERY_SCHEDULE.find(r => r.region === 'north');
    const specificStation = northEntry?.schedule.find(s => s.date === dayOfWeek)?.provinces[0];
    payload.station = specificStation || 'Miền Bắc';
  } else {
    // Duyệt qua từng vùng trong LOTTERY_SCHEDULE
    for (const entry of LOTTERY_SCHEDULE) {
      // Tìm trong mảng schedule của vùng đó xem có tỉnh nào khớp không
      const foundInRegion = entry.schedule.some(s =>
        s.provinces.includes(scanResult.station!)
      );

      if (foundInRegion) {
        payload.region = entry.region as Region;
        break;
      }
    }
  }

  return payload;
};