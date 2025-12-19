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


export const PROVINCE_REGEX_MAP: Record<string, RegExp[]> = {
  // MIỀN NAM
  "TP.HCM": [/TP[.\s]*HCM/i, /HO[.\s]*CHI[.\s]*MINH/i, /HCMC/i, /SAI[.\s]*GON/i],
  "Đồng Tháp": [/DONG[.\s]*THAP/i, /D[.\s]*THAP/i],
  "Cà Mau": [/CA[.\s]*MAU/i, /C[.\s]*MAU/i],
  "Bến Tre": [/BEN[.\s]*TRE/i, /B[.\s]*TRE/i],
  "Vũng Tàu": [/VUNG[.\s]*TAU/i, /V[.\s]*TAU/i, /BR[.\s]*VT/i, /BA[.\s]*RIA/i],
  "Bạc Liêu": [/BAC[.\s]*LIEU/i, /B[.\s]*LIEU/i],
  "Đồng Nai": [/DONG[.\s]*NAI/i, /D[.\s]*NAI/i],
  "Cần Thơ": [/CAN[.\s]*THO/i, /C[.\s]*THO/i],
  "Sóc Trăng": [/SOC[.\s]*TRANG/i, /S[.\s]*TRANG/i],
  "Tây Ninh": [/TAY[.\s]*NINH/i, /T[.\s]*NINH/i],
  "An Giang": [/AN[.\s]*GIANG/i, /A[.\s]*GIANG/i],
  "Bình Thuận": [/BINH[.\s]*THUAN/i, /B[.\s]*THUAN/i],
  "Vĩnh Long": [/VINH[.\s]*LONG/i, /V[.\s]*LONG/i],
  "Bình Dương": [/BINH[.\s]*DUONG/i, /B[.\s]*DUONG/i],
  "Trà Vinh": [/TRA[.\s]*VINH/i, /T[.\s]*VINH/i],
  "Long An": [/LONG[.\s]*AN/i, /L[.\s]*AN/i],
  "Bình Phước": [/BINH[.\s]*PHUOC/i, /B[.\s]*PHUOC/i],
  "Hậu Giang": [/HAU[.\s]*GIANG/i, /H[.\s]*GIANG/i],
  "Tiền Giang": [/TIEN[.\s]*GIANG/i, /T[.\s]*GIANG/i],
  "Kiên Giang": [/KIEN[.\s]*GIANG/i, /K[.\s]*GIANG/i],
  "Đà Lạt": [/DA[.\s]*LAT/i, /LAM[.\s]*DONG/i, /D[.\s]*LAT/i, /L[.\s]*DONG/i],

  // MIỀN TRUNG
  "TT.Huế": [/TT[.\s]*HUE/i, /THUA[.\s]*THIEN[.\s]*HUE/i, /T[.\s]*T[.\s]*HUE/i],
  "Phú Yên": [/PHU[.\s]*YEN/i, /P[.\s]*YEN/i],
  "Đắk Lắk": [/DAK[.\s]*LAK/i, /DAC[.\s]*LAC/i, /DLK/i],
  "Quảng Nam": [/QUANG[.\s]*NAM/i, /Q[.\s]*NAM/i],
  "Đà Nẵng": [/DA[.\s]*NANG/i, /D[.\s]*NANG/i],
  "Khánh Hòa": [/KHANH[.\s]*HOA/i, /K[.\s]*HOA/i],
  "Bình Định": [/BINH[.\s]*DINH/i, /B[.\s]*DINH/i],
  "Quảng Trị": [/QUANG[.\s]*TRI/i, /Q[.\s]*TRI/i],
  "Quảng Bình": [/QUANG[.\s]*BINH/i, /Q[.\s]*BINH/i],
  "Gia Lai": [/GIA[.\s]*LAI/i, /G[.\s]*LAI/i],
  "Ninh Thuận": [/NINH[.\s]*THUAN/i, /N[.\s]*THUAN/i],
  "Quảng Ngãi": [/QUANG[.\s]*NGAI/i, /Q[.\s]*NGAI/i],
  "Đắk Nông": [/DAK[.\s]*NONG/i, /DAC[.\s]*NONG/i, /DNG/i],
  "Kon Tum": [/KON[.\s]*TUM/i, /K[.\s]*TUM/i],

  // MIỀN BẮC (Thường chỉ cần bắt tên tỉnh)
  "Hà Nội": [/HA[.\s]*NOI/i, /HN/i],
  "Quảng Ninh": [/QUANG[.\s]*NINH/i, /Q[.\s]*NINH/i],
  "Bắc Ninh": [/BAC[.\s]*NINH/i, /B[.\s]*NINH/i],
  "Hải Phòng": [/HAI[.\s]*PHONG/i, /H[.\s]*PHONG/i],
  "Nam Định": [/NAM[.\s]*DINH/i, /N[.\s]*DINH/i],
  "Thái Bình": [/THAI[.\s]*BINH/i, /T[.\s]*BINH/i],
};