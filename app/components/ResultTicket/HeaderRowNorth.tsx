import { useAppTheme } from "@/theme/context";
import { ThemedStyle } from "@/theme/types";
import { View, ViewStyle } from "react-native";
import { Text } from "../Text";
import { LotteryResult } from "@/store/slices/lotterySlice";
import { getLotteryTypography, FontSizeLevel } from "@/constants/lotteryTicket";
import { useAppSelector } from "@/store";

type Props = {
  provinces: LotteryResult[],
}

export function HeaderRowNorth({ provinces }: Props) {
  const { themed, theme: { colors } } = useAppTheme();
  const userFontSize = useAppSelector(state => state.auth.user?.settingApp?.fontSize as FontSizeLevel) || 'MEDIUM';
  const typography = getLotteryTypography(userFontSize);

  const headerText = `${provinces[0]?.station || 'Miền Bắc'}: ${provinces[0]?.prizes?.specialCode || ''}`;

  return (
    <View style={themed($wrapper)}>
      <Text
        text={headerText}
        style={{ color: colors.palette.secondary600, fontWeight: "700", fontSize: typography.lotoHeader.fontSize, lineHeight: typography.lotoHeader.lineHeight }}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
      />
    </View>
  )
}

const $wrapper: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  backgroundColor: colors.surface,
  borderTopLeftRadius: spacing.md,
  borderTopRightRadius: spacing.md,
  paddingVertical: spacing.md,
  justifyContent: "center",
  alignItems: "center",
  borderWidth: 0.5,
  borderColor: colors.separator,
})