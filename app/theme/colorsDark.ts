const palette = {
  // 🖤 Neutral – Dark background
  neutral100: "#000000",
  neutral200: "#121212",
  neutral300: "#1E1E1E",
  neutral400: "#2C2C2C",
  neutral500: "#3A3A3A",
  neutral600: "#6F6F6F",
  neutral700: "#9E9E9E",
  neutral800: "#E0E0E0",
  neutral900: "#FFFFFF",

  // 🔴 Lucky Red – Dark optimized
  primary100: "#B71C1C",
  primary200: "#C62828",
  primary300: "#D32F2F",
  primary400: "#E53935",
  primary500: "#F44336", // MAIN RED (dark)
  primary600: "#FFCDD2",

  // 🟡 Gold Accent – Dark mode
  accent100: "#FFB300",
  accent200: "#FFD54F",
  accent300: "#FFE082",
  accent400: "#FFECB3",
  accent500: "#FFF8E1",

  // 🔵 Secondary (info / link)
  secondary100: "#0D47A1",
  secondary200: "#1565C0",
  secondary300: "#1976D2",
  secondary400: "#42A5F5",
  secondary500: "#90CAF9",
  secondary600: "#1565C0",

  // ❌ Error
  angry100: "#D32F2F",
  angry500: "#EF5350",

  // Overlay
  overlay20: "rgba(0, 0, 0, 0.2)",
  overlay50: "rgba(0, 0, 0, 0.5)",
} as const


export const colors = {
  palette,

  transparent: "rgba(0, 0, 0, 0)",

  // 📝 Text
  text: palette.neutral800,
  textDim: palette.neutral600,
  textInverse: palette.neutral100,

  // 🖤 Background
  background: palette.neutral200,
  surface: palette.neutral300,
  card: palette.neutral300,

  // Border & Separator
  border: palette.neutral400,
  separator: palette.neutral400,

  // 🔴 Primary – Lucky Red
  primary: palette.primary400,
  primaryPressed: palette.primary400,
  primarySubtle: palette.primary100,

  // 🟡 Gold Accent
  gold: palette.accent100,
  goldSubtle: palette.accent200,

  // Tint (navigation / active)
  tint: palette.primary500,
  tintInactive: palette.neutral500,

  // ❌ Error
  error: palette.angry500,
  errorBackground: palette.angry100,
} as const

