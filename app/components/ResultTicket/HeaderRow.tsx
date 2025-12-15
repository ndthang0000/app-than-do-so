import { useAppTheme } from "@/theme/context";
import { TextStyle, View, ViewStyle } from "react-native";
import { Text } from "../Text";
import { ThemedStyle } from "@/theme/types";

export type PrizeKey =
  | "G8" | "G7" | "G6" | "G5"
  | "G4" | "G3" | "G2" | "G1" | "DB"


export type ProvinceResult = {
  code: string
  name: string
  prizes: Record<PrizeKey, string[]>,
  loto?: Record<string, any>
}

type Props = {
  provinces: ProvinceResult[],
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
        <View key={p.code} style={[themed($cellWrapper), { flex: flex }]} >
          <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 18 }} text={p.name} />
        </View>
      ))}
    </View>
  )
}

const $cellPricingWrapper: ThemedStyle<ViewStyle> = ({ colors }) => ({
  // borderRightWidth: 1,
  // borderColor: colors.separator,
  justifyContent: "center",
  alignItems: "center",
  flex: 1,
  paddingVertical: 6,
  borderRightWidth: 1,
  borderColor: colors.separator,
  borderStyle: "dashed",
})

const $cellWrapper: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  // borderRightWidth: 1,
  // borderColor: colors.separator,
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: spacing.md,

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

