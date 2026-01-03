import { useAppTheme } from "@/theme/context";
import { View, ViewStyle } from "react-native"
import { PrizeKey, ProvinceResult } from "./HeaderRow";
import { Text } from "../Text";
import { ThemedStyle } from "@/theme/types";
import LinearGradient from "react-native-linear-gradient"
import { DisplayMode } from "./LotteryResultTable";
import { LOTTERY_TYPOGRAPHY, Region } from "@/constants/lotteryTicket";
import { LotteryResult } from "@/store/slices/lotterySlice";

function PrizeNumbers({
  numbers,
  isTwoRow,
  textStyle,
}: {
  numbers: string[]
  isTwoRow: boolean
  textStyle: any
}) {
  // Chỉ G3, G6 mới chia dòng
  if (!isTwoRow) {
    return (
      <>
        {numbers.map((num) => (
          <View key={num} style={{ justifyContent: "center", alignItems: "center", marginVertical: 2 }}>
            <Text text={num} style={textStyle} />
          </View>
        ))}
      </>
    )
  }

  // G3, G6 → 2 dòng, mỗi dòng 3 số
  const firstRow = numbers.slice(0, 3)
  const secondRow = numbers.slice(3, 6)

  return (
    <View style={{ flexDirection: "column", flex: 1, paddingVertical: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-evenly" }}>
        {firstRow.map((num) => (
          <View key={num} >
            <Text text={num} style={textStyle} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-evenly" }}>
        {secondRow.map((num) => (
          <View key={num} >
            <Text text={num} style={textStyle} />
          </View>
        ))}
      </View>
    </View>
  )
}

export function ResultRow({ prize, provinces, index, flex, region, displayMode }: {
  provinces: LotteryResult[],
  region?: Region,
  prize: PrizeKey,
  index: number,
  flex: number,
  displayMode: DisplayMode
}) {
  const { themed, theme: { colors } } = useAppTheme();

  // 1. Logic chuẩn bị dữ liệu & trạng thái
  const isDB = prize === "DB";
  const isNorth = region === "north";
  const displayPrize = isDB ? "ĐB" : (prize.startsWith("G") ? `${prize[0]}.${prize[1]}` : prize);

  const isHighlighted = (isNorth && prize === 'G7') || (!isNorth && prize === 'G8');
  const needGridLayout = isNorth && ["G3", "G5"].includes(prize);

  // 2. Xác định màu nền
  const getBgColor = () => {
    if (isDB) return "#FCFBD9";
    return index % 2 === 0 ? colors.surface : colors.palette.neutral200;
  };

  // 3. Hàm render số chung để tái sử dụng
  const renderNumbers = (numbers: string[]) => {
    let displayNumbers = numbers;
    if (displayMode === "last2") displayNumbers = numbers.map(n => n.slice(-2));
    else if (displayMode === "last3") displayNumbers = numbers.map(n => n.slice(-3));

    const textStyle = {
      color: isDB || isHighlighted ? colors.primary : colors.text,
      ...(isDB ? LOTTERY_TYPOGRAPHY.db : LOTTERY_TYPOGRAPHY.standard),
    };

    if (needGridLayout) {
      return (
        <PrizeNumbers
          numbers={displayNumbers}
          isTwoRow={true}
          textStyle={textStyle}
        />
      );
    }

    return (
      <View style={isNorth ? themed($northNumbersContainer) : null}>
        {displayNumbers.map((num, idx) => (
          <View key={`${num}-${idx}`} style={themed($cellNumberWrapper)}>
            <Text text={num} style={textStyle} />
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={themed([$wrapper, { backgroundColor: getBgColor() }])}>
      {/* CỘT GIẢI (Bên trái) */}
      <View style={themed([$cellPricingWrapper, { paddingVertical: isDB ? 12 : 8 }])}>
        <Text
          text={displayPrize}
          style={{
            color: isDB ? '#854D0E' : colors.textDim,
            ...(isDB ? LOTTERY_TYPOGRAPHY.prizeLabelDB : LOTTERY_TYPOGRAPHY.prizeLabel)
          }}
        />
      </View>

      {/* CỘT SỐ (Bên phải - các tỉnh) */}
      {provinces.map((p) => {
        const content = renderNumbers(p.prizes[prize]);

        if (isDB) {
          return (
            <LinearGradient
              key={p._id}
              colors={["#f4f2a4ff", "#ffffff", "#f5f4c6ff"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={themed([$cellProvinceWrapper, { flex: flex }])}
            >
              {content}
            </LinearGradient>
          );
        }

        return (
          <View
            key={p._id}
            style={themed([isNorth ? $cellProvinceNorthWrapper : $cellProvinceWrapper, { flex: flex }])}
          >
            {content}
          </View>
        );
      })}
    </View>
  );
}

const $wrapper: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  borderTopWidth: 1,
  borderColor: colors.separator,
})

const $cellPricingWrapper: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderRightWidth: 1,
  borderColor: colors.separator,
  justifyContent: "center",
  alignItems: "center",
  borderStyle: "dashed",
  flex: 1,
  paddingVertical: 10,

})

const $cellNumberWrapper: ThemedStyle<ViewStyle> = ({ }) => ({
  justifyContent: "center",
  alignItems: "center",
  minWidth: 30, // Đảm bảo các số không bị dính vào nhau
  paddingVertical: 1,
})

const $cellProvinceWrapper: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 2,
  justifyContent: "center",
  borderRightWidth: 1,
  borderColor: colors.separator,
  paddingVertical: 6
})

const $cellProvinceNorthWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  gap: spacing.md,
  justifyContent: "space-evenly",
  borderRightWidth: 1,
  borderColor: colors.separator,
  paddingVertical: 10
})

const $northNumbersContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-evenly",
  width: "100%",
  gap: spacing.xs,
})

