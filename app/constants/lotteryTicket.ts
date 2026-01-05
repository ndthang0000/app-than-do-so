import { PrizeKey } from "@/components/ResultTicket/HeaderRow";

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

export const LOTTERY_TYPOGRAPHY = {
  db: {
    fontSize: 21,      // To hơn để dễ đọc
    fontWeight: "900", // Cực đậm
    lineHeight: 32,
  },
  standard: {
    fontSize: 20,      // Tăng từ 16 lên 18
    fontWeight: "800",
  },
  highlight: {
    fontSize: 20,
    fontWeight: "800",
  },
  prizeLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  prizeLabelDB: {
    fontSize: 18,
    fontWeight: "800",
  }
} as const;

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