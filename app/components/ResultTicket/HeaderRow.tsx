import { useAppTheme } from "@/theme/context";
import { TextStyle, View, ViewStyle, TouchableOpacity } from "react-native";
import { Text } from "../Text";
import { ThemedStyle } from "@/theme/types";
import { LotteryResult } from "@/store/slices/lotterySlice";
import { PrizeKey, getLotteryTypography, FontSizeLevel, Region } from "@/constants/lotteryTicket";
import { useAppSelector } from "@/store";


export type ProvinceResult = {
  code: string
  name: string
  prizes: Record<PrizeKey, string[]>,
  loto?: Record<string, any>
}

type Props = {
  provinces: LotteryResult[],
  flex: number,
  region?: Region,
  onStationPress?: (station: string, region: Region) => void
}

export function HeaderRow({ provinces, flex, region, onStationPress }: Props) {
  const { themed, theme: { colors } } = useAppTheme();
  const userFontSize = useAppSelector(state => state.auth.user?.settingApp?.fontSize as FontSizeLevel) || 'MEDIUM';
  const typography = getLotteryTypography(userFontSize);

  const renderSpecialStation = (s: string) => {
    if (s == 'Hậu Giang') return 'H.Giang';
    if (s == 'Bình Phước') return 'B.Phước';
    if (s == 'Quảng Ngãi') return 'Q.Ngãi';
    return s
  }

  // Only make clickable for central and south regions
  const isClickable = region && (region === 'central' || region === 'south') && onStationPress;

  return (
    <View style={themed($wrapper)}>
      <View style={themed($cellPricingWrapper)}>
        <Text style={themed($textDai)} text="Đài" />
      </View>
      {provinces.map((p) => {
        const stationContent = (
          <Text style={{ color: colors.primary, fontWeight: "700", fontSize: typography.lotoHeader.fontSize, lineHeight: typography.lotoHeader.lineHeight }} text={renderSpecialStation(p.station)} />
        );

        return isClickable ? (
          <TouchableOpacity
            key={p._id}
            style={[themed($cellWrapper), { flex: flex }]}
            onPress={() => onStationPress(p.station, region)}
            activeOpacity={0.6}
          >
            {stationContent}
          </TouchableOpacity>
        ) : (
          <View key={p._id} style={[themed($cellWrapper), { flex: flex }]} >
            {stationContent}
            </View>
        );
      })}
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
  fontSize: 15,
  lineHeight: 20,
})

