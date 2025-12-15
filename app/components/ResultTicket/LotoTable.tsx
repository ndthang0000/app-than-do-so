import { View, ViewStyle } from "react-native"
import IconLoto from "@assets/svg/loto.svg";
import { Text } from "../Text";
import LinearGradient from "react-native-linear-gradient"
import { ThemedStyle } from "@/theme/types";
import { useAppTheme } from "@/theme/context";
import { ProvinceResult } from "./HeaderRow";
import { Region } from "./LotteryResultTable";

type LotoTableProp = {
  provinces: ProvinceResult[],
  region?: Region,
}

const head = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const LotoTable = ({ provinces, region }: LotoTableProp) => {

  const { themed, theme: { colors } } = useAppTheme();

  let calculateFlex = provinces.length == 3 ? 5 : (provinces.length == 2 ? 6 : 8);

  return <>
    <View style={themed($container)}>
      <LinearGradient colors={["#faeaeaff", "#faf5f5ff"]} start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }} style={themed($headerWrapper)}>
        <IconLoto width={24} height={24} color={colors.tint} />
        <Text text="BẢNG LOTO ĐẦU ĐUÔI" style={{ fontSize: 20, fontWeight: "700", color: colors.tint }} />
      </LinearGradient>
      <View style={themed($tableWrapper)}>
        {
          provinces.map((p) =>
            <View key={p.code} style={themed($subTableWrapper)}>
              <View style={themed($tableHeader)}>
                <Text text={p.name} style={{ fontSize: 18, fontWeight: "700", color: colors.primary }} />
              </View>
              <View style={themed($rowWrapper)}>
                {head.map((num) => (
                  <View key={num} style={themed($rowItemWrapper)}>
                    <View style={themed($headNumberWrapper)}>
                      <Text text={num} style={{ fontSize: 16, fontWeight: "900", color: colors.palette.neutral500 }} />
                    </View>
                    <View style={themed([$tailNumberWrapper, { flex: calculateFlex }])}>
                      <Text text={p.loto?.[num]?.join(",") || "-"} style={{ fontSize: 16, fontWeight: "900", color: colors.text, letterSpacing: 3 }} />
                    </View>
                  </View>
                ))}
              </View>
            </View>)

        }

      </View>
    </View>
  </>
}

const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginVertical: spacing.lg,
  //box shadow
  shadowColor: colors.palette.neutral600,
  shadowOffset: { width: 2, height: 2 },
  shadowOpacity: 0.75,
  shadowRadius: 3.84,
  elevation: 5,
  backgroundColor: colors.surface,
  borderTopLeftRadius: spacing.xl,
  borderTopRightRadius: spacing.xl,
})

const $headerWrapper: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  borderBottomWidth: 1,
  borderColor: colors.palette.primary200,
  alignItems: "center",
  borderTopLeftRadius: spacing.xl,
  borderTopRightRadius: spacing.xl,
  gap: spacing.md,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.md,
})

const $tableWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",

})

const $subTableWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flex: 1,
  flexDirection: "column",
  borderRightWidth: 1,
  borderColor: colors.separator,
})

const $tableHeader: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  alignItems: "center", paddingVertical: spacing.sm,
  borderBottomWidth: 1,
  borderColor: colors.separator,
})

const $rowWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  borderBottomWidth: 1,
  borderColor: colors.separator,
})

const $rowItemWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  borderBottomWidth: 1,
  borderColor: colors.separator,
})

const $headNumberWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  justifyContent: "center",
  alignItems: "center",
  flex: 1,
  padding: spacing.sm,
  borderRightWidth: 1,
  borderColor: colors.separator,
  backgroundColor: colors.background,
})

const $tailNumberWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  justifyContent: "flex-start",
  flex: 3,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.sm,
})
