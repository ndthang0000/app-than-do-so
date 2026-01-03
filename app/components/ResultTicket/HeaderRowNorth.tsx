import { useAppTheme } from "@/theme/context";
import { ThemedStyle } from "@/theme/types";
import { TextStyle, View, ViewStyle } from "react-native";
import { Text } from "../Text";
import { LotteryResult } from "@/store/slices/lotterySlice";

type Props = {
  provinces: LotteryResult[],
}

export function HeaderRowNorth({ provinces }: Props) {
  const { themed, theme: { colors } } = useAppTheme();

  const headerText = `${provinces[0]?.station || 'Miền Bắc'}: ${provinces[0]?.prizes?.specialCode || ''}`;

  return (
    <View style={themed($wrapper)}>
      <Text text={headerText} style={themed($headerText)} />
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

const $headerText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.secondary600,
  fontWeight: "700",
  fontSize: 18,

})