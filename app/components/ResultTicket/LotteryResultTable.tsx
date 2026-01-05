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
import { clearNewStatus, fetchLotteryIfNeeded, updateLotteryFromSocket } from "@/store/slices/lotterySlice"
import { useIsFocused } from "@react-navigation/native"
import { HeaderRowNorth } from "./HeaderRowNorth"
import { socket } from "@/services/socket/socket"

export type DisplayMode = "full" | "last2" | "last3"

type Props = {
  region: Region,
  isLive: boolean
}

const PRIZES: PrizeKey[] = [
  "G8", "G7", "G6", "G5", "G4", "G3", "G2", "G1", "DB"
]

const PRIZES_NORTH: PrizeKey[] = [
  "DB", "G1", "G2", "G3", "G4", "G5", "G6", "G7"
]


export function LotteryResultTable({ region, isLive }: Props) {

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
      noCache: isLive && isFocused, // Nếu đang ở chế độ
    }))

  }, [dateSelected, dispatch, isFocused])

  useEffect(() => {
    // 1. Kết nối
    if (!isLive) return;
    socket.connect();

    socket.on('connect', () => {
      console.log('Connected to Socket Server');
      // 2. Tham gia vào room của miền tương ứng
      socket.emit('joinRegion', region);
    });

    // 3. Lắng nghe dữ liệu cập nhật
    socket.on('onLotteryChange', (payload) => {
      // Giả sử payload server trả về có: fullData (mảng result), changes (mảng các ô vừa nhảy số)
      if (payload) {
        dispatch(updateLotteryFromSocket(payload))

        // Xử lý xóa highlight sau 15 giây cho chính các giải vừa nhảy
        if (payload.changes && payload.changes.length > 0) {
          const idsToRemove = payload.changes.map((c: any) => `${payload.station}-${c.rank}-${c.index}`)
          console.log(idsToRemove)
          setTimeout(() => {
            dispatch(clearNewStatus(idsToRemove))
          }, 5000) // 15 giây "Wow" cho người dùng
        }
      }
    })

    socket.on('disconnect', () => {
      console.log('Disconnected');
    });

    // Cleanup khi component unmount
    return () => {
      if (!isLive) return;
      socket.off('connect');
      socket.off('onLotteryChange');
      socket.disconnect();
    };
  }, [isLive]);


  return (
    <View style={[themed($tableWrapper), $containerInsets]}>

      {region == "north" ? <HeaderRowNorth provinces={provinces} /> : <HeaderRow provinces={provinces} flex={calculateFlex} />}
      <View style={{ borderLeftWidth: 1, borderColor: colors.separator, borderBottomWidth: 1 }}>

        {
          choosePrizes.map((prize, index) => (
            <ResultRow
              prize={prize}
              provinces={provinces}
              key={index}
              index={index}
              flex={calculateFlex}
              region={region}
              displayMode={displayMode}
              isLive={isLive}
            />
          ))
        }
      </View>
      <DisplayModeToggleV2 value={displayMode} onChange={handleChangeDisplayMode} />
      <LotoTable provinces={provinces} region={region} />
    </View>
  )
}

const $tableWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  // padding: spacing.sm,
})
