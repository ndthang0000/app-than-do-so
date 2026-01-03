import { View, ViewStyle } from "react-native"
import IconLoto from "@assets/svg/loto.svg";
import { Text } from "../Text";
import LinearGradient from "react-native-linear-gradient"
import { ThemedStyle } from "@/theme/types";
import { useAppTheme } from "@/theme/context";
import { ProvinceResult } from "./HeaderRow";
import { Region } from "@/constants/lotteryTicket";
import { LotteryResult } from "@/store/slices/lotterySlice";

type LotoTableProp = {
  provinces: LotteryResult[],
  region?: Region,
}

const head = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export const LotoTable = ({ provinces, region }: LotoTableProp) => {
  const { themed, theme: { colors } } = useAppTheme();

  // FIX 1: Loại bỏ tính toán flex phức tạp, sử dụng cơ chế cân bằng cố định
  // Khi có 4 đài, chúng ta cần font chữ nhỏ hơn một chút để không bị nhảy dòng quá nhiều
  const fontSizeTail = provinces.length > 3 ? 13 : 15;
  const letterSpacing = provinces.length > 3 ? 1 : 2;

  return (
    <View style={themed($container)}>
      <LinearGradient
        colors={["#faeaeaff", "#faf5f5ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={themed($headerWrapper)}
      >
        <IconLoto width={24} height={24} color={colors.tint} />
        <Text text="BẢNG LOTO ĐẦU ĐUÔI" style={{ fontSize: 18, fontWeight: "700", color: colors.tint }} />
      </LinearGradient>

      <View style={themed($tableWrapper)}>
        {provinces.map((p) => (
          <View key={p._id} style={themed($subTableWrapper)}>
            <View style={themed($tableHeader)}>
              {/* FIX 2: numberOfLines={1} để tên đài dài không làm vỡ header */}
              <Text
                text={p.station}
                numberOfLines={1}
                style={{ fontSize: provinces.length > 3 ? 13 : 15, fontWeight: "700", color: colors.primary }}
              />
            </View>
            <View style={themed($rowWrapper)}>
              {head.map((num) => (
                <View key={num} style={themed($rowItemWrapper)}>
                  <View style={themed($headNumberWrapper)}>
                    <Text text={num} style={{ fontSize: 14, fontWeight: "900", color: colors.palette.neutral500 }} />
                  </View>

                  {/* FIX 3: Quan trọng nhất - Sử dụng alignItem center và padding hợp lý */}
                  <View style={themed($tailNumberWrapper)}>
                    <Text
                      // FIX 4: Thay dấu "," bằng ", " (có dấu cách) để React Native có thể tự xuống dòng đúng chỗ
                      text={p.loto?.[num]?.join(", ") || "-"}
                      style={{
                        fontSize: fontSizeTail,
                        fontWeight: "700",
                        color: colors.text,
                        letterSpacing: letterSpacing,
                        textAlign: "center" // Canh giữa số đuôi cho cân đối
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  )
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
  width: "100%", // Đảm bảo chiếm hết chiều ngang
})

const $subTableWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flex: 1, // Chia đều diện tích cho số lượng đài (2, 3 hay 4 đều tự chia)
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
  minHeight: 45, // FIX 5: Đặt minHeight để dù xuống dòng thì các ô vẫn đều nhau
  alignItems: "stretch", // Đảm bảo các cột con cao bằng cha
})

const $headNumberWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  justifyContent: "center",
  alignItems: "center",
  width: 25, // FIX 6: Cố định độ rộng cột "Đầu" để dành chỗ cho cột "Đuôi"
  padding: spacing.xs,
  borderRightWidth: 1,
  borderColor: colors.separator,
  backgroundColor: colors.palette.neutral100,
})

const $tailNumberWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  justifyContent: "center", // Canh giữa theo chiều dọc
  alignItems: "center",     // Canh giữa theo chiều ngang
  flex: 1,
  paddingVertical: spacing.xs,
  paddingHorizontal: 2, // Giảm padding để tối đa diện tích hiện số
})