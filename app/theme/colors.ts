const palette = {
  // Neutral (giữ nguyên)
  neutral100: "#FFFFFF",
  neutral200: "#F5F5F5",
  neutral300: "#E0E0E0",
  neutral400: "#BDBDBD",
  neutral500: "#9E9E9E",
  neutral600: "#757575",
  neutral700: "#424242",
  neutral800: "#212121",
  neutral900: "#000000",

  // 🔴 Lucky Red – Primary
  primary100: "#FDEAEA",
  primary200: "#F9C5C5",
  primary300: "#F28B8B",
  primary400: "#E85C5C",
  primary500: "#EA2831", // MAIN RED
  primary600: "#B71C1C",

  // 🟡 Gold Accent
  accent100: "#FFF8E1",
  accent200: "#FFECB3",
  accent300: "#FFE082",
  accent400: "#FFD54F",
  accent500: "#FFB300", // GOLD MAIN

  // Secondary (ít dùng – có thể dùng cho info)
  secondary100: "#E3F2FD",
  secondary200: "#BBDEFB",
  secondary300: "#90CAF9",
  secondary400: "#64B5F6",
  secondary500: "#1976D2",
  secondary600: "#1565C0",

  // Error
  angry100: "#FDECEA",
  angry500: "#D32F2F",

  // Overlay
  overlay20: "rgba(0, 0, 0, 0.2)",
  overlay50: "rgba(0, 0, 0, 0.5)",

  // custom background
  background: "#F8F6F6"
} as const

export const colors = {
  palette,

  transparent: "rgba(0, 0, 0, 0)",

  // Text
  text: palette.neutral800,
  textDim: palette.neutral600,
  textInverse: palette.neutral100,

  // Background
  background: palette.background,
  surface: palette.neutral100,
  card: palette.neutral100,

  // Border & Separator
  border: palette.neutral300,
  separator: palette.neutral300,

  // 🔴 Primary (Lucky Red)
  primary: palette.primary500,
  primaryPressed: palette.primary600,
  primarySubtle: palette.primary300,

  // 🟡 Gold Accent
  gold: palette.accent500,
  goldSubtle: palette.accent200,

  // Tint (navigation / active)
  tint: palette.primary500,
  tintInactive: palette.neutral400,

  // Error
  error: palette.angry500,
  errorBackground: palette.angry100,
} as const
