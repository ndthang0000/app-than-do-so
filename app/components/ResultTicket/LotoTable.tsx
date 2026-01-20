import { View, ViewStyle } from "react-native"
import IconLoto from "@assets/svg/loto.svg";
import { Text } from "../Text";
import LinearGradient from "react-native-linear-gradient"
import { ThemedStyle } from "@/theme/types";
import { useAppTheme } from "@/theme/context";
import { Region, getLotteryTypography, FontSizeLevel } from "@/constants/lotteryTicket";
import { LotteryResult } from "@/store/slices/lotterySlice";
import { useAppSelector } from "@/store";

type LotoTableProp = {
  provinces: LotteryResult[],
  region?: Region,
}

const head = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const LotoTable = ({ provinces, region }: LotoTableProp) => {
  const { themed, theme: { colors } } = useAppTheme();
  const userFontSize = useAppSelector(state => state.auth.user?.settingApp?.fontSize as FontSizeLevel) || 'MEDIUM';
  const typography = getLotteryTypography(userFontSize);

  // Font chữ nhỏ hơn khi nhiều đài để tránh tràn dòng
  const fontSizeTail = provinces.length > 3 ? typography.lotoNumber.fontSize - 2 : typography.lotoNumber.fontSize;

  return (
    <View style={themed($container)}>
      <LinearGradient
        colors={["#faeaeaff", "#faf5f5ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={themed($headerWrapper)}
      >
        <IconLoto width={24} height={24} color={colors.tint} />
        <Text text="BẢNG LOTO ĐẦU ĐUÔI" style={{ fontSize: typography.lotoHeader.fontSize, fontWeight: typography.lotoHeader.fontWeight, color: colors.tint, lineHeight: typography.lotoHeader.lineHeight }} />
      </LinearGradient>

      <View style={themed($tableContent)}>
        {/* HÀNG HEADER: Chứa cột "Đầu" trống và tên các đài */}
        <View style={themed($rowItemWrapper)}>
          <View style={themed($headNumberWrapper)}>
            <Text text="Đầu" style={{ fontSize: typography.lotoStation.fontSize, color: colors.primary, lineHeight: typography.lotoStation.lineHeight }} weight="bold" />
          </View>
          {provinces.map((p) => (
            <View key={`header-${p._id}`} style={themed($tailNumberWrapper)}>
              <Text
                text={p.station}
                numberOfLines={1}
                style={{ fontSize: typography.lotoStation.fontSize, color: colors.primary, textAlign: "center", lineHeight: typography.lotoStation.lineHeight }}
                weight="bold"
              />
            </View>
          ))}
        </View>

        {/* CÁC HÀNG DỮ LIỆU: Lặp từ 0 -> 9 */}
        {head.map((num) => (
          <View key={`row-${num}`} style={themed($rowItemWrapper)}>
            {/* Cột số Đầu cố định */}
            <View style={themed($headNumberWrapper)}>
              <Text text={num} style={{ fontSize: typography.lotoNumber.fontSize + 1, color: colors.palette.neutral700, lineHeight: typography.lotoNumber.lineHeight }} weight="semiBold" />
            </View>

            {/* Các cột số Đuôi của từng đài */}
            {provinces.map((p) => (
              <View key={`tail-${p._id}-${num}`} style={themed($tailNumberWrapper)}>
                <Text
                  text={p.loto?.[num]?.join(", ") || "-"}
                  style={{
                    fontSize: fontSizeTail,
                    color: colors.text,
                    textAlign: "center",
                    lineHeight: typography.lotoNumber.lineHeight
                  }}
                  weight="normal"
                />
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginVertical: spacing.lg,
  shadowColor: colors.palette.neutral600,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 3.84,
  elevation: 5,
  backgroundColor: colors.surface,
  borderRadius: spacing.sm,
  borderWidth: 1,
  borderColor: colors.separator,
  overflow: "hidden"
})

const $headerWrapper: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  borderBottomWidth: 1,
  borderColor: colors.palette.primary200,
  alignItems: "center",
  gap: spacing.md,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.md,
})

const $tableContent: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexDirection: "column",
  backgroundColor: colors.surface,
})

const $rowItemWrapper: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexDirection: "row",
  borderBottomWidth: 1,
  borderColor: colors.separator,
  minHeight: 40,
  alignItems: "stretch",
})

const $headNumberWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  justifyContent: "center",
  alignItems: "center",
  width: 40, // Độ rộng cột "Đầu" cố định
  backgroundColor: colors.palette.neutral100,
  borderRightWidth: 1,
  borderColor: colors.separator,
})

const $tailNumberWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  justifyContent: "center",
  alignItems: "center",
  flex: 1, // Tự động chia đều không gian cho các đài
  paddingVertical: spacing.xs,
  paddingHorizontal: 2,
  borderRightWidth: 1,
  borderColor: colors.separator,
})