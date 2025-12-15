import { View, ViewStyle } from "react-native"
import { HeaderRow, PrizeKey, ProvinceResult } from "./HeaderRow"
import { ResultRow } from "./ResultRow"
import { ThemedStyle } from "@/theme/types"
import { useAppTheme } from "@/theme/context"
import { useSafeAreaInsetsStyle } from "@/utils/useSafeAreaInsetsStyle"
import { useState } from "react"
import { DisplayModeToggle } from "./DisplayModeToggle"
import { LotoTable } from "./LotoTable"

export type Region = "north" | "central" | "south"
export type DisplayMode = "full" | "last2" | "last3"

type Props = {
  provinces: ProvinceResult[]
  region?: Region
}

const PRIZES: PrizeKey[] = [
  "G8", "G7", "G6", "G5", "G4", "G3", "G2", "G1", "DB"
]

const PRIZES_NORTH: PrizeKey[] = [
  "DB", "G1", "G2", "G3", "G4", "G5", "G6", "G7"
]


export function LotteryResultTable({ provinces, region }: Props) {

  const $containerInsets = useSafeAreaInsetsStyle(["bottom"])
  const { themed, theme: { colors } } = useAppTheme();
  const [displayMode, setDisplayMode] = useState<DisplayMode>("full")

  const handleChangeDisplayMode = (mode: DisplayMode) => {
    setDisplayMode(mode)
  }

  const calculateFlex = provinces.length == 3 ? 2 : (provinces.length == 1 ? 5 : 3);

  const choosePrizes = region === "north" ? PRIZES_NORTH : PRIZES;

  //calculate loto data
  provinces.forEach((p) => {
    const lotoSet = new Set<string>();
    Object.values(p.prizes).forEach((nums) => {
      nums.forEach((num) => {
        // get last 2 digits
        if (num.length >= 2) {
          lotoSet.add(num.slice(-2));
        }
      });
    });
    p.loto = {}
    lotoSet.forEach((num) => {
      const head = num.charAt(0);
      if (!p.loto![head]) {
        p.loto![head] = [];
      }
      p.loto![head].push(num.charAt(1));
    });
    /*
    p.loto={
      "0": [1,2,3],
      "1": [4,5,6],
      ...
      "9": [7,8,9]
    }
     */

  })

  return (
    <View style={[themed($tableWrapper), $containerInsets]}>

      {region !== "north" && <HeaderRow provinces={provinces} flex={calculateFlex} />}
      <View style={{ borderLeftWidth: 1, borderColor: colors.separator, borderBottomWidth: 1 }}>

        {
          choosePrizes.map((prize, index) => (
            <ResultRow prize={prize} provinces={provinces} key={index} index={index} flex={calculateFlex} region={region} displayMode={displayMode} />
          ))
        }
      </View>
      <DisplayModeToggle value={displayMode} onChange={handleChangeDisplayMode} />
      <LotoTable provinces={provinces} region={region} />
    </View>
  )
}

const $tableWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  padding: spacing.sm,
})
