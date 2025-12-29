import { Region, Weekday } from "./lotteryTicket";

interface LotteryScheduleEntry {
  region: Region;
  regionName: string;
  time: string; // 0 (Sunday) to 6 (Saturday)
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
    schedule: [
      { date: "monday", provinces: ["TT.Huế", "Phú Yên"] },
      { date: "tuesday", provinces: ["Đắk Lắk", "Quảng Nam"] },
      { date: "wednesday", provinces: ["Đà Nẵng", "Khánh Hòa"] },
      { date: "thursday", provinces: ["Bình Định", "Quảng Trị", "Quảng Bình"] },
      { date: "friday", provinces: ["Gia Lai", "Ninh Thuận"] },
      { date: "saturday", provinces: ["Đà Nẵng", "Quảng Ngãi", "Đắk Nông"] },
      { date: "sunday", provinces: ["Khánh Hòa", "Kon Tum", "TT-Huế"] },
    ]
  },

  {
    region: "north",
    regionName: "Xổ Số Miền Bắc",
    time: "18:15",
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


// Chuyển sang mảng các chuỗi để tính khoảng cách Levenshtein
export const FUZZY_PROVINCE_KEYWORDS: Record<string, string[]> = {
  // MIỀN NAM
  "Bình Dương": ["BINH DUONG", "BINH DUONG", "SO Kien Thiet Binh Duong"],
  "TP.HCM": ["TP HCM", "HO CHI MINH", "SAI GON", "HCMC"],
  "Đồng Tháp": ["DONG THAP", "D THAP"],
  "Cà Mau": ["CA MAU", "C MAU"],
  "Bến Tre": ["BEN TRE", "B TRE"],
  "Vũng Tàu": ["VUNG TAU", "BA RIA VUNG TAU", "BRVT"],
  "An Giang": ["AN GIANG", "A GIANG"],
  "Tiền Giang": ["TIEN GIANG", "T GIANG"],
  "Kiên Giang": ["KIEN GIANG", "K GIANG"],
  "Tây Ninh": ["TAY NINH", "T NINH"],
  "Đà Lạt": ["DA LAT", "LAM DONG"],
  "Sóc Trăng": ["SOC TRANG", "S TRANG"],
  "Cần Thơ": ["CAN THO", "C THO"],
  "Đồng Nai": ["DONG NAI", "D NAI"],
  "Long An": ["LONG AN", "L AN"],
  "Trà Vinh": ["TRA VINH", "T VINH"],
  "Vĩnh Long": ["VINH LONG", "V LONG"],
  "Hậu Giang": ["HAU GIANG", "H GIANG"],
  "Bình Phước": ["BINH PHUOC", "B PHUOC"],
  "Bình Thuận": ["BINH THUAN", "B THUAN"],
  "Bạc Liêu": ["BAC LIEU", "B LIEU"],

  // MIỀN TRUNG
  "TT.Huế": ["THUA THIEN HUE", "TT HUE", "HUE"],
  "Phú Yên": ["PHU YEN", "P YEN"],
  "Khánh Hòa": ["KHANH HOA"],
  "Đà Nẵng": ["DA NANG"],
  "Đắk Lắk": ["DAK LAK", "DAC LAC",],
  "Quảng Nam": ["QUANG NAM",],
  "Quảng Ngãi": ["QUANG NGAI"],
  "Bình Định": ["BINH DINH"],
  "Gia Lai": ["GIA LAI"],
  "Kon Tum": ["KON TUM"],
  "Ninh Thuận": ["NINH THUAN"],
  "Quảng Bình": ["QUANG BINH"],
  "Quảng Trị": ["QUANG TRI"],
  "Đắk Nông": ["DAK NONG"],

  // MIỀN BẮC
  "Miền Bắc": ["MIEN BAC", "HA NOI", "QUANG NINH", "BAC NINH", "HAI PHONG", "NAM DINH", "THAI BINH"],
};