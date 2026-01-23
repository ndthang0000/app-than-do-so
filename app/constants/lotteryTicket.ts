import { getDay, parse } from "date-fns";
import { LOTTERY_SCHEDULE } from "./lotterySchedule";

export type PrizeKey =
  | "G8" | "G7" | "G6" | "G5"
  | "G4" | "G3" | "G2" | "G1" | "DB"
export type Region = "north" | "central" | "south"
export type Weekday =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"

export const WEEKDAY_LABEL_MAP: Record<Weekday, string> = {
  sunday: "CN",
  monday: "T2",
  tuesday: "T3",
  wednesday: "T4",
  thursday: "T5",
  friday: "T6",
  saturday: "T7",
}

export interface ScanResult {
  code?: string;
  date?: string;
  region?: Region;
  station?: string;
}

export interface CheckAndSavePayload {
  region: Region;
  date: string;
  station: string;
  code: string;
  specialCode?: string; // Ký hiệu (thường dành cho miền Bắc)
  durationScan: number;
}

// Font size config cho 3 cấp độ: SMALL, MEDIUM, LARGE
export type FontSizeLevel = 'SMALL' | 'MEDIUM' | 'LARGE';

export const LOTTERY_FONT_SIZE_CONFIG = {
  SMALL: {
    db: {
      fontSize: 18,
      fontWeight: "900" as const,
      lineHeight: 20,
    },
    standard: {
      fontSize: 16,
      fontWeight: "800" as const,
      lineHeight: 16,
    },
    prizeLabel: {
      fontSize: 13,
      fontWeight: "700" as const,
      lineHeight: 16,
    },
    prizeLabelDB: {
      fontSize: 16,
      fontWeight: "800" as const,
      lineHeight: 18,
    },
    lotoHeader: {
      fontSize: 17,
      fontWeight: "800" as const,
      lineHeight: 19,
    },
    lotoNumber: {
      fontSize: 12,
      fontWeight: "normal" as const,
      lineHeight: 16,
    },
    lotoStation: {
      fontSize: 14,
      fontWeight: "bold" as const,
      lineHeight: 16,
    },
    ballText: {
      fontSize: 15,
      fontWeight: "bold" as const,
      lineHeight: 18,
    }
  },
  MEDIUM: {
    db: {
      fontSize: 20,
      fontWeight: "900" as const,
      lineHeight: 26,
    },
    standard: {
      fontSize: 20,
      fontWeight: "800" as const,
      lineHeight: 19,
    },
    prizeLabel: {
      fontSize: 15,
      fontWeight: "700" as const,
      lineHeight: 18,
    },
    prizeLabelDB: {
      fontSize: 15,
      fontWeight: "800" as const,
      lineHeight: 20,
    },
    lotoHeader: {
      fontSize: 18,
      fontWeight: "800" as const,
      lineHeight: 24,
    },
    lotoNumber: {
      fontSize: 16,
      fontWeight: "normal" as const,
      lineHeight: 18,
    },
    lotoStation: {
      fontSize: 12,
      fontWeight: "bold" as const,
      lineHeight: 16,
    },
    ballText: {
      fontSize: 15,
      fontWeight: "bold" as const,
      lineHeight: 20,
    }
  },
  LARGE: {
    db: {
      fontSize: 20,
      fontWeight: "900" as const,
      lineHeight: 30,
    },
    standard: {
      fontSize: 22,
      fontWeight: "800" as const,
      lineHeight: 22,
    },
    prizeLabel: {
      fontSize: 15,
      fontWeight: "700" as const,
      lineHeight: 20,
    },
    prizeLabelDB: {
      fontSize: 17,
      fontWeight: "800" as const,
      lineHeight: 24,
    },
    lotoHeader: {
      fontSize: 19,
      fontWeight: "800" as const,
      lineHeight: 24,
    },
    lotoNumber: {
      fontSize: 16,
      fontWeight: "normal" as const,
      lineHeight: 18,
    },
    lotoStation: {
      fontSize: 16,
      fontWeight: "bold" as const,
      lineHeight: 18,
    },
    ballText: {
      fontSize: 17,
      fontWeight: "bold" as const,
      lineHeight: 22,
    }
  }
} as const;

// Helper function để lấy typography config theo fontSize level
export const getLotteryTypography = (fontSize: FontSizeLevel = 'MEDIUM') => {
  return LOTTERY_FONT_SIZE_CONFIG[fontSize];
};

// Legacy support - default MEDIUM
export const LOTTERY_TYPOGRAPHY = LOTTERY_FONT_SIZE_CONFIG.MEDIUM;

export const LOTTERY_NUMBER_LENGTH: Record<Region, Partial<Record<PrizeKey, number>>> = {
  north: {
    DB: 5,
    G1: 5,
    G2: 5,
    G3: 5,
    G4: 4,
    G5: 4,
    G6: 3,
    G7: 2,
  },
  central: {
    DB: 6,
    G1: 5,
    G2: 5,
    G3: 5,
    G4: 5,
    G5: 4,
    G6: 4,
    G7: 3,
    G8: 2,
  },
  south: {
    DB: 6,
    G1: 5,
    G2: 5,
    G3: 5,
    G4: 5,
    G5: 4,
    G6: 4,
    G7: 3,
    G8: 2,
  }
}

export const BALL_COLORS = [
  "#FF3B30", // Đỏ
  "#FF9500", // Cam
  "#FFCC00", // Vàng hổ phách
  "#4CD964", // Xanh lá
  "#5AC8FA", // Xanh da trời
  "#007AFF", // Xanh dương
  "#5856D6", // Tím
  "#FF2D55", // Hồng rực
  "#AF52DE", // Tím đậm
  "#00CCCC", // Xanh Teal
];

const defaultLotteryData =
{
  _id: '1',
  date: '',
  region: '',
  station: '',
  prizes: {
    specialCode: '',
    DB: [''],
    G1: [''],
    G2: [''],
    G3: ['', ''],
    G4: [
      '', '',
      '', '',
      '', '',
      ''
    ],
    G5: [''],
    G6: ['', '', ''],
    G7: [''],
    G8: ['']
  },
}

export const createDefaultLotteryData = (region: Region, date: string) => {
  // tìm thứ 
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayOfWeek = days[getDay(parse(date, 'yyyy-MM-dd', new Date()))];
  const station = LOTTERY_SCHEDULE.find(r => r.region === region)?.schedule.find(s => s.date === dayOfWeek) || { provinces: [] };
  const defaultData = [];

  for (let i = 0; i < station.provinces.length; i++) {
    defaultData.push({
      ...defaultLotteryData,
      _id: `${i + 1}`,
      date,
      region,
      station: station.provinces[i],
    });
  }
  return defaultData;
}