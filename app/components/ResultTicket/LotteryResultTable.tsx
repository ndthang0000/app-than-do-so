import { View, ViewStyle } from "react-native"
import { HeaderRow, PrizeKey, ProvinceResult } from "./HeaderRow"
import { ResultRow } from "./ResultRow"
import { ThemedStyle } from "@/theme/types"
import { useAppTheme } from "@/theme/context"
import { useSafeAreaInsetsStyle } from "@/utils/useSafeAreaInsetsStyle"
import { useEffect, useState } from "react"
import { LotoTable } from "./LotoTable"
import { Region } from "@/constants/lotteryTicket"
import { DisplayModeToggleV2 } from "./DisplayModeToggleV2"
import { useAppDispatch, useAppSelector } from "@/store"
import { fetchLotteryIfNeeded } from "@/store/slices/lotterySlice"
import { useIsFocused } from "@react-navigation/native"
import { HeaderRowNorth } from "./HeaderRowNorth"

export type DisplayMode = "full" | "last2" | "last3"

type Props = {
  region: Region
}

const PRIZES: PrizeKey[] = [
  "G8", "G7", "G6", "G5", "G4", "G3", "G2", "G1", "DB"
]

const PRIZES_NORTH: PrizeKey[] = [
  "DB", "G1", "G2", "G3", "G4", "G5", "G6", "G7"
]


export function LotteryResultTable({ region }: Props) {

  const $containerInsets = useSafeAreaInsetsStyle(["bottom"])
  const { themed, theme: { colors } } = useAppTheme();
  const [displayMode, setDisplayMode] = useState<DisplayMode>("full")
  const dispatch = useAppDispatch()
  const isFocused = useIsFocused()
  const dateSelected = useAppSelector((state) => state.lottery.dateSelected);
  const provinces = useAppSelector((state) => state.lottery.results[`${region}_${dateSelected}`]) || [];

  const handleChangeDisplayMode = (mode: DisplayMode) => {
    setDisplayMode(mode)
  }

  const calculateFlex = provinces.length == 3 ? 2 : (provinces.length == 1 ? 5 : 3);

  const choosePrizes = region === "north" ? PRIZES_NORTH : PRIZES;


  useEffect(() => {
    // Mỗi khi dateSelected hoặc region thay đổi, hàm này sẽ tự kiểm tra cache
    if (!isFocused) return;

    dispatch(fetchLotteryIfNeeded({
      date: dateSelected,
      region: region,
    }))
  }, [dateSelected, dispatch, isFocused])

  return (
    <View style={[themed($tableWrapper), $containerInsets]}>

      {region == "north" ? <HeaderRowNorth provinces={provinces} /> : <HeaderRow provinces={provinces} flex={calculateFlex} />}
      <View style={{ borderLeftWidth: 1, borderColor: colors.separator, borderBottomWidth: 1 }}>

        {
          choosePrizes.map((prize, index) => (
            <ResultRow prize={prize} provinces={provinces} key={index} index={index} flex={calculateFlex} region={region} displayMode={displayMode} />
          ))
        }
      </View>
      <DisplayModeToggleV2 value={displayMode} onChange={handleChangeDisplayMode} />
      <LotoTable provinces={provinces} region={region} />
    </View>
  )
}

const $tableWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  padding: spacing.sm,
})
