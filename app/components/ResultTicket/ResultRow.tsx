import { useAppTheme } from "@/theme/context";
import { View, ViewStyle } from "react-native"
import { PrizeKey, ProvinceResult } from "./HeaderRow";
import { Text } from "../Text";
import { ThemedStyle } from "@/theme/types";
import LinearGradient from "react-native-linear-gradient"
import { DisplayMode } from "./LotteryResultTable";
import { Region } from "@/constants/lotteryTicket";

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
  provinces: ProvinceResult[],
  region?: Region,
  prize: PrizeKey
  index: number,
  flex: number,
  displayMode: DisplayMode
}) {
  const isDB = prize === "DB"
  // convert G3 ->G.3 for display purpose
  const displayPrize = prize.startsWith("G") && prize.length === 2 ? `${prize[0]}.${prize[1]}` : "ĐB";

  const { themed, theme: { colors } } = useAppTheme();

  let bgColor: any = colors.palette.neutral200;
  if (index % 2 === 0) {
    bgColor = colors.surface;
  }
  if (isDB) {
    bgColor = "#FCFBD9";
  }

  const needGridLayout = region === "north" ? ["G3", "G5"] : [];

  let isHighlighted = false;
  if (region === "north" && prize === 'G7') {
    isHighlighted = true;
  }
  else {
    if (prize === 'G8') {
      isHighlighted = true;
    }
  }
  return (
    <View
      style={themed([$wrapper, { backgroundColor: bgColor }])}
    >
      {/* G.8 -> ĐB*: first cell*/}
      <View style={themed([$cellPricingWrapper, { paddingVertical: isDB ? 16 : 6 }])}>
        <Text
          text={displayPrize}
          style={{
            color: isDB ? '#854D0E' : colors.textDim,
            fontWeight: isDB ? "800" : "700",
            fontSize: isDB ? 20 : 16,
          }}
        />
      </View>

      {provinces.map((p) => {
        const numbers = p.prizes[prize]
        // Điều chỉnh hiển thị theo chế độ
        let displayNumbers = numbers;
        if (displayMode === "last2") {
          displayNumbers = numbers.map(num => num.slice(-2));
        }
        else if (displayMode === "last3") {
          displayNumbers = numbers.map(num => num.slice(-3));
        }
        if (!isDB) {
          return (
            <View key={p.code} style={themed([...(region === "north" ? [$cellProvinceNorthWrapper] : [$cellProvinceWrapper]), { flex: flex }])} >
              {needGridLayout.length > 0 ? (
                <PrizeNumbers
                  numbers={displayNumbers}
                  isTwoRow={needGridLayout.includes(prize)}
                  textStyle={{
                    color: isHighlighted ? colors.primary : colors.text,
                    fontWeight: "700",
                    fontSize: 16,
                  }}
                />
              ) : (
                displayNumbers.map((num) => (
                  <View key={num} style={themed($cellNumberWrapper)}>
                    <Text
                      text={num}
                      style={{
                        color: isHighlighted ? colors.primary : colors.text,
                        fontWeight: "700",
                        fontSize: 16,
                      }}
                    />
                  </View>
                ))
              )}
            </View>
          )
        }
        return (
          <LinearGradient
            key={p.code}
            colors={["#f4f2a4ff", "#ffffff", "#f5f4c6ff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={themed([$cellProvinceWrapper, { flex: flex }])}
          >
            {displayNumbers.map((num) => {
              return (
                <View key={num} style={themed($cellNumberWrapper)} >
                  <Text
                    text={num}
                    style={{
                      color: colors.primary,
                      fontWeight: "900",
                      fontSize: 20,
                    }}
                  />
                </View>
              )
            })}
          </LinearGradient>
        )
      })}
    </View>
  )
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
