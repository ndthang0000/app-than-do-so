import React from "react"
import { View, ViewStyle } from "react-native"
import LinearGradient from "react-native-linear-gradient"
import { useAppTheme } from "@/theme/context"
import { Text } from "../Text"
import { LiveNumber } from "./LiveNumber"
import { ThemedStyle } from "@/theme/types"
import { DisplayMode } from "./LotteryResultTable"
import { LOTTERY_TYPOGRAPHY, PrizeKey, Region } from "@/constants/lotteryTicket"
import { LotteryResult } from "@/store/slices/lotterySlice"
import { useAppSelector } from "@/store"

// --- Component PrizeNumbers hỗ trợ Live ---
function PrizeNumbers({
  numbers,
  isTwoRow,
  textStyle,
  getLiveState,
  region,
  prizeKey,
  displayMode,
  highlightDigit
}: {
  numbers: string[]
  isTwoRow: boolean
  textStyle: any
  region: Region
  prizeKey: PrizeKey
  getLiveState: (num: string, idx: number) => 'DONE' | 'ROLLING' | 'PENDING' | 'NEW',
    displayMode: DisplayMode,
    highlightDigit?: number | null
}) {
  const renderLiveNumber = (num: string, idx: number) => (
    <View key={`${idx}`} style={{ justifyContent: "center", alignItems: "center", marginVertical: 2 }}>
      <LiveNumber
        value={num}
        state={getLiveState(num, idx)}
        textStyle={textStyle}
        prizeKey={prizeKey}
        region={region}
        displayMode={displayMode}
        highlightDigit={highlightDigit}
      />
    </View>
  )

  if (!isTwoRow) {
    return <>{numbers.map((num, idx) => renderLiveNumber(num, idx))}</>
  }

  const firstRow = numbers.slice(0, 3)
  const secondRow = numbers.slice(3, 6)

  return (
    <View style={{ flexDirection: "column", flex: 1, paddingVertical: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-evenly" }}>
        {firstRow.map((num, idx) => renderLiveNumber(num, idx))}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-evenly" }}>
        {secondRow.map((num, idx) => renderLiveNumber(num, idx + 3))}
      </View>
    </View>
  )
}

// --- Component chính ResultRow ---
export function ResultRow({ prize, provinces, index, flex, region, displayMode, isLive, highlightDigit }: {
  provinces: LotteryResult[],
  region?: Region,
  prize: PrizeKey,
  index: number,
  flex: number,
  isLive: boolean,
  displayMode: DisplayMode,
  highlightDigit: number | null
}) {
  const { themed, theme: { colors } } = useAppTheme()

  const recentlyAdded = useAppSelector(state => state.lottery.recentlyAdded)
  const isNorth = region === "north"
  const isDB = prize === "DB"
  const displayPrize = isDB ? "ĐB" : (prize.startsWith("G") ? `${prize[0]}.${prize[1]}` : prize)
  const isHighlighted = (isNorth && prize === 'G7') || (!isNorth && prize === 'G8')

  // Xác định thứ tự xổ thực tế
  const prizeOrder: PrizeKey[] = isNorth
    ? ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "DB"]
    : ["G8", "G7", "G6", "G5", "G4", "G3", "G2", "G1", "DB"]

  const getBgColor = () => {
    if (isDB) return "#FCFBD9"
    return index % 2 === 0 ? colors.surface : colors.palette.neutral200
  }

  const renderNumbers = (p: LotteryResult) => {
    // 1. Lấy mảng số gốc
    const rawNumbers: string[] = p.prizes[prize] || []

    // 2. Tìm vị trí đang quay (Rolling) duy nhất của đài này
    let rollingInfo = { prizeKey: "", index: -1 }
    if (isLive) {
      for (const pk of prizeOrder) {
        const nums = p.prizes[pk] || []
        // Nếu mảng rỗng hoặc chứa "*", đây chính là vùng PENDING/ROLLING
        const starIdx = nums.length === 0 ? 0 : nums.findIndex((n: string) => n === "*")

        if (starIdx !== -1 || nums.length === 0) {
          rollingInfo = {
            prizeKey: pk,
            index: starIdx === -1 ? 0 : starIdx
          }
          break
        }
      }
    }

    // 3. Hàm xác định trạng thái
    const getLiveState = (num: string, idx: number): any => {
      if (!isLive) return 'DONE'

      // Nếu có số thực sự (ví dụ: "123")
      if (num && num !== "*" && num !== "-" && num !== "") {
        // TẠO ID: Phải khớp 100% với: `${provinceId}-${prizeKey}-${index}`
        const uniqueId = `${p.station}-${prize}-${idx}`

        // Kiểm tra xem ID này có nằm trong danh sách "vừa mới về" không
        if (recentlyAdded.includes(uniqueId)) {
          return "NEW" // Sẽ kích hoạt hiệu ứng nhấp nháy trong LiveNumber
        }
        return "DONE" // Sau này bạn mở comment recentlyAdded thì check NEW ở đây
      }

      // Nếu là ô trống hoặc dấu *
      if (prize === rollingInfo.prizeKey && idx === rollingInfo.index) {
        return "ROLLING"
      }

      return "PENDING"
    }

    const displayNumbers = rawNumbers.map(n => {
      if (n === "*" || n === "" || n === "-") return "*"
      if (displayMode === "last2") return n.slice(-2)
      if (displayMode === "last3") return n.slice(-3)
      return n
    })

    const textStyle = {
      color: isDB || isHighlighted ? colors.primary : colors.text,
      ...(isDB ? LOTTERY_TYPOGRAPHY.db : LOTTERY_TYPOGRAPHY.standard),
    }

    if (isNorth && ["G3", "G5"].includes(prize)) {
      return (
        <PrizeNumbers
          numbers={displayNumbers}
          isTwoRow={true}
          textStyle={textStyle}
          getLiveState={getLiveState}
          region='north'
          prizeKey={prize}
          displayMode={displayMode}
          highlightDigit={highlightDigit}
        />
      )
    }

    return (
      <View style={isNorth ? themed($northNumbersContainer) : null}>
        {displayNumbers.map((num, idx) => (
          <View key={`${idx}`} style={themed($cellNumberWrapper)}>
            <LiveNumber
              value={num}
              state={getLiveState(num, idx)}
              textStyle={textStyle}
              prizeKey={prize}
              region={region!}
              displayMode={displayMode}
              highlightDigit={highlightDigit}
            />
          </View>
        ))}
      </View>
    )
  } // end renderNumbers

  return (
    <View style={themed([$wrapper, { backgroundColor: getBgColor() }])}>
      {/* Cột Tên Giải */}
      <View style={themed([$cellPricingWrapper, { paddingVertical: isDB ? 12 : 6 }])}>
        <Text
          text={displayPrize}
          style={{
            color: isDB ? '#854D0E' : colors.textDim,
            ...(isDB ? LOTTERY_TYPOGRAPHY.prizeLabelDB : LOTTERY_TYPOGRAPHY.prizeLabel)
          }}
        />
      </View>

      {/* Cột Số các đài */}
      {provinces.map((p) => {
        const content = renderNumbers(p)
        const wrapperStyle = isNorth ? $cellProvinceNorthWrapper : $cellProvinceWrapper

        return isDB ? (
          <LinearGradient
            key={p._id}
            colors={["#f4f2a4ff", "#ffffff", "#f5f4c6ff"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={themed([$cellProvinceWrapper, { flex: flex }])}
          >
            {content}
          </LinearGradient>
        ) : (
          <View key={p._id} style={themed([wrapperStyle, { flex: flex }])}>
            {content}
          </View>
        )
      })}
    </View>
  )
}

// --- Styles (Giữ nguyên các định nghĩa $ cũ của bạn) ---
const $wrapper: ThemedStyle<ViewStyle> = ({ colors }) => ({
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
})
const $cellNumberWrapper: ThemedStyle<ViewStyle> = () => ({
  justifyContent: "center",
  alignItems: "center",
  minWidth: 35,
  paddingVertical: 1,
})
const $cellProvinceWrapper: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 2,
  justifyContent: "center",
  borderRightWidth: 1,
  borderColor: colors.separator,
  paddingVertical: 6,
})
const $cellProvinceNorthWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  gap: spacing.md,
  justifyContent: "space-evenly",
  borderRightWidth: 1,
  borderColor: colors.separator,
  paddingVertical: 10,
})
const $northNumbersContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-evenly",
  width: "100%",
  gap: spacing.xs,
})