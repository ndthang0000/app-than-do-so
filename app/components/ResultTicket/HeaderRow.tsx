import { useAppTheme } from "@/theme/context";
import { TextStyle, View, ViewStyle } from "react-native";
import { Text } from "../Text";
import { ThemedStyle } from "@/theme/types";
import { LotteryResult } from "@/store/slices/lotterySlice";
import { PrizeKey } from "@/constants/lotteryTicket";


export type ProvinceResult = {
  code: string
  name: string
  prizes: Record<PrizeKey, string[]>,
  loto?: Record<string, any>
}

type Props = {
  provinces: LotteryResult[],
  flex: number
}

export function HeaderRow({ provinces, flex }: Props) {
  const { themed, theme: { colors } } = useAppTheme();

  return (
    <View style={themed($wrapper)}>
      <View style={themed($cellPricingWrapper)}>
        <Text style={themed($textDai)} text="Đài" />
      </View>
      {provinces.map((p) => (
        <View key={p._id} style={[themed($cellWrapper), { flex: flex }]} >
          <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 18 }} text={p.station} />
        </View>
      ))}
    </View>
  )
}

const paddingVerticalHeader = 10

const $cellPricingWrapper: ThemedStyle<ViewStyle> = ({ colors }) => ({
  // borderRightWidth: 1,
  // borderColor: colors.separator,
  justifyContent: "center",
  alignItems: "center",
  flex: 1,
  paddingVertical: paddingVerticalHeader,
  borderRightWidth: 1,
  borderColor: colors.separator,
  borderStyle: "dashed",
})

const $cellWrapper: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  // borderRightWidth: 1,
  // borderColor: colors.separator,
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: paddingVerticalHeader,

})

const $wrapper: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  backgroundColor: colors.surface,
  borderTopLeftRadius: spacing.md,
  borderTopRightRadius: spacing.md,
})

const $textDai: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontWeight: "600",
  fontSize: 16,
})

