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
    fontSize: 22,      // To hơn để dễ đọc
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
    fontSize: 16,
    fontWeight: "700",
  },
  prizeLabelDB: {
    fontSize: 22,
    fontWeight: "800",
  }
} as const;