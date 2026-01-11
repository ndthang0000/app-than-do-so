import { addMinutes, differenceInMinutes, differenceInSeconds, isAfter, isBefore, parse, startOfDay } from "date-fns";
import { Region, Weekday } from "./lotteryTicket";

interface LotteryScheduleEntry {
  region: Region;
  regionName: string;
  time: string; // 0 (Sunday) to 6 (Saturday)
  end?: string;
  schedule: {
    date: Weekday,
    provinces: string[],
  }[]; // e.g., ['18:00', '17:00']
}
export const LOTTERY_SCHEDULE: LotteryScheduleEntry[] = [
  {
    region: "south",
    regionName: "Xổ Số Miền Nam",
    time: "16:15",
    end: '16h35',
    schedule: [
      { date: "monday", provinces: ["TP.HCM", "Đồng Tháp", "Cà Mau"] },
      { date: "tuesday", provinces: ["Bến Tre", "Vũng Tàu", "Bạc Liêu"] },
      { date: "wednesday", provinces: ["Đồng Nai", "Cần Thơ", "Sóc Trăng"] },
      { date: "thursday", provinces: ["Tây Ninh", "An Giang", "Bình Thuận"] },
      { date: "friday", provinces: ["Vĩnh Long", "Bình Dương", "Trà Vinh"] },
      { date: "saturday", provinces: ["TP.HCM", "Long An", "Bình Phước", "Hậu Giang"] },
      { date: "sunday", provinces: ["Tiền Giang", "Kiên Giang", "Đà Lạt"] },
    ]
  },
  {
    region: "central",
    regionName: "Xổ Số Miền Trung",
    time: "17:15",
    end: '17h35',
    schedule: [
      { date: "monday", provinces: ["Huế", "Phú Yên"] },
      { date: "tuesday", provinces: ["Đắk Lắk", "Quảng Nam"] },
      { date: "wednesday", provinces: ["Đà Nẵng", "Khánh Hòa"] },
      { date: "thursday", provinces: ["Bình Định", "Quảng Trị", "Quảng Bình"] },
      { date: "friday", provinces: ["Gia Lai", "Ninh Thuận"] },
      { date: "saturday", provinces: ["Đà Nẵng", "Quảng Ngãi", "Đắk Nông"] },
      { date: "sunday", provinces: ["Khánh Hòa", "Kon Tum", "Huế"] },
    ]
  },

  {
    region: "north",
    regionName: "Xổ Số Miền Bắc",
    time: "18:15",
    end: '18h35',
    schedule: [
      { date: "monday", provinces: ["Hà Nội"] },
      { date: "tuesday", provinces: ["Quảng Ninh"] },
      { date: "wednesday", provinces: ["Bắc Ninh"] },
      { date: "thursday", provinces: ["Hà Nội"] },
      { date: "friday", provinces: ["Hải Phòng"] },
      { date: "saturday", provinces: ["Nam Định"] },
      { date: "sunday", provinces: ["Thái Bình"] },
    ]
  },
]

export type DrawStatus = {
  type: 'UPCOMING' | 'LIVE' | 'FINISHED';
  targetTime: string;
  countdownMinutes?: number;
  countdownSeconds?: number;
}

export const getRegionStatus = (region: string): DrawStatus => {
  const now = new Date();
  const today = startOfDay(now);

  const regionTime = LOTTERY_SCHEDULE.find(r => r.region === region)?.time || "18:15";
  // Convert "16:15" thành đối tượng Date của ngày hôm nay
  const startTime = parse(regionTime, "HH:mm", today);
  const endTime = addMinutes(startTime, 25); // Giả định xổ trong 25p
  const liveThreshold = addMinutes(startTime, -5); // Trước 5p


  if (isBefore(now, liveThreshold)) {
    return {
      type: 'UPCOMING',
      countdownMinutes: differenceInMinutes(startTime, now),
      countdownSeconds: differenceInSeconds(startTime, now),
      targetTime: regionTime,
    };
  }

  if (isAfter(now, liveThreshold) && isBefore(now, endTime)) {
    return { type: 'LIVE', targetTime: regionTime };
  }

  return { type: 'FINISHED', targetTime: regionTime };
};

// Chuyển sang mảng các chuỗi để tính khoảng cách Levenshtein
export const FUZZY_PROVINCE_KEYWORDS: Record<string, string[]> = {
  // MIỀN NAM
  "Bình Dương": ["BINH DUONG", "XO SO KIEN THIET BINH DUONG"],
  "TP.HCM": ["HO CHI MINH", "SAI GON", "HO CHI MIN"],
  "Đồng Tháp": ["DONG THAP", "ONGTHAP", "XO SO KIEN THIET DONG THAP"],
  "Cà Mau": ["CA MAU", "XO SO KIEN THIET CA MAU"],
  "Bến Tre": ["BEN TRE", "XO SO BEN TRE"],
  "Vũng Tàu": ["VUNG TAU", "BA RIA VUNG TAU", "XO SO KIEN THIET BA RIA VUNG TAU"],
  "An Giang": ["AN GIANG"],
  "Tiền Giang": ["TIEN GIANG", "TEN GIANG"],
  "Kiên Giang": ["KIEN GIANG", "XO SO KIEN THIET KIEN GIANG"],
  "Tây Ninh": ["TAY NINH", "T NINH"],
  "Đà Lạt": ["DA LAT", "LAM DONG"],
  "Sóc Trăng": ["SOC TRANG", "SOG TRANG", "XO SO KIEN THIET SOC TRANG", "XO SO  KIEN THIET SOG TRANG"],
  "Cần Thơ": ["TP CAN THO", "XO SO KIEN THIET TP CAN THO", 'CAN THO'],
  "Đồng Nai": ["DONG NAI", "DON NAI", "D0NG NAI"],
  "Long An": ["LONG AN", "XO SO KIEN THIET LONG AN"],
  "Trà Vinh": ["TRA VINH", "XO SO KIEN THIET TRA VINH"],
  "Vĩnh Long": ["VINH LONG", "XO SO KIEN THIET VINH LONG"],
  "Hậu Giang": ["HAU GIANG", "XO SO KIEN THIET HAU GIANG"],
  "Bình Phước": ["BINH PHUOC"],
  "Bình Thuận": ["BINH THUAN", "B THUAN"],
  "Bạc Liêu": ["BAC LIEU", "B LIEU"],

  // MIỀN TRUNG
  "Huế": ["HUE", "THUA THIEN HUE", "TT HUE", "XO SO KIEN THIET HUE"],
  "Phú Yên": ["PHU YEN", "XO SO KIEN THIET PHU YEN"],
  "Khánh Hòa": ["KHANH HOA", "XO SO KIEN THIET KHANH HOA"],
  "Đà Nẵng": ["DA NANG", "XO SO KIEN THIET DA NANG"],
  "Đắk Lắk": ["DAK LAK", "DAC LAC", "AKLAK"],
  "Quảng Nam": ["QUANG NAM", "XO SO KIEN THIET QUANG NAM"],
  "Quảng Ngãi": ["QUANG NGAI", "UANGNGA", "XO SO KIEN THIET QUANG NGAI"],
  "Bình Định": ["BINH DINH"],
  "Gia Lai": ["GIA LAI", "XO SO KIEN THIET GIA LAI"],
  "Kon Tum": ["KON TUM", "KOM TUM", "KON TUN", "KON TUN", "XO SO KIEN THIET KON TUM"],
  "Ninh Thuận": ["NINH THUAN", "XO SO KIEN THIET NINH THUAN"],
  "Quảng Bình": ["QUANG BINH", "XO SO KIEN THIET QUANG BINH"],
  "Quảng Trị": ["QUANG TRI", "XO SO KIEN THIET QUANG TRI"],
  "Đắk Nông": ["DAK NONG", "XO SO KIEN THIET DAK NONG"],

  // MIỀN BẮC
  "Miền Bắc": ["MIEN BAC", "HA NOI"],
};