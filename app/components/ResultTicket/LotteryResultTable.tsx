import { AppState, TouchableOpacity, View, ViewStyle } from "react-native"
import { HeaderRow } from "./HeaderRow"
import { ResultRow } from "./ResultRow"
import { ThemedStyle } from "@/theme/types"
import { useAppTheme } from "@/theme/context"
import { useSafeAreaInsetsStyle } from "@/utils/useSafeAreaInsetsStyle"
import { memo, useEffect, useMemo, useRef, useState } from "react"
import { LotoTable } from "./LotoTable"
import { createDefaultLotteryData, PrizeKey, Region } from "@/constants/lotteryTicket"
import { DisplayModeToggleV2 } from "./DisplayModeToggleV2"
import { useAppDispatch, useAppSelector } from "@/store"
import { clearNewStatus, fetchLotteryIfNeeded, LotteryResult, updateLotteryFromSocket } from "@/store/slices/lotterySlice"
import { useIsFocused, useNavigation } from "@react-navigation/native"
import { HeaderRowNorth } from "./HeaderRowNorth"
import { socket } from "@/services/socket/socket"
import Sound from 'react-native-sound';
import { Text } from "../Text"
import { speakLotteryResult } from "@/utils/speech"
Sound.setCategory('Playback');

export type DisplayMode = "full" | "last2" | "last3"

type Props = {
  region: Region,
  isLive: boolean,
  station?: string // Optional: if provided, only show this station
  date?: string // Optional: if provided, use this date instead of dateSelected from Redux
  provinces?: LotteryResult[] // Optional: if provided, use this data instead of fetching from Redux
  winDetails?: PrizeKey[] // Optional: array of winning prizes to highlight
  isShowHeader?: boolean // Optional: whether to show header row
}


const PRIZES: PrizeKey[] = [
  "G8", "G7", "G6", "G5", "G4", "G3", "G2", "G1", "DB"
]

const PRIZES_NORTH: PrizeKey[] = [
  "DB", "G1", "G2", "G3", "G4", "G5", "G6", "G7"
]


export const LotteryResultTable = memo(({ region, isLive, station, date, provinces: provincesProp, winDetails, isShowHeader = true }: Props) => {

  const $containerInsets = useSafeAreaInsetsStyle(["bottom"])
  const { themed, theme: { colors } } = useAppTheme();
  const [displayMode, setDisplayMode] = useState<DisplayMode>("full")
  const dispatch = useAppDispatch()
  const isFocused = useIsFocused()
  const navigation = useNavigation<any>()
  const dateSelectedFromRedux = useAppSelector((state) => state.lottery.dateSelected);
  const dateSelected = date || dateSelectedFromRedux; // Use prop date if provided, otherwise use Redux state
  const appSettings = useAppSelector((state) => state.auth.user?.settingApp);
  const allProvinces = provincesProp || useAppSelector((state) => state.lottery.results[`${region}_${dateSelected}`]) || createDefaultLotteryData(region, dateSelected);

  // Filter provinces if station is specified
  const provinces = useMemo(() => {
    if (station) {
      return allProvinces.filter(p => p.station === station);
    }
    return allProvinces;
  }, [allProvinces, station]);

  const rollingSoundRef = useRef<Sound | null>(null);
  const newSoundRef = useRef<Sound | null>(null);
  const [isSoundReady, setIsSoundReady] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [isReady, setIsReady] = useState(false);
  const [highlightDigit, setHighlightDigit] = useState<number | null>(null);

  const handleToggleHighlight = (num: number) => {
    setHighlightDigit(prev => (prev === num ? null : num));
  };
  const handleChangeDisplayMode = (mode: DisplayMode) => {
    setDisplayMode(mode)
  }
  const isFinished = provinces.every(province => province.isFinished);

  // Định nghĩa trạng thái LIVE thực sự: isLive = true VÀ chưa kết thúc
  const isLiveActive = isLive && !isFinished;

  const calculateFlex = useMemo(() =>
    provinces.length === 3 ? 2 : (provinces.length === 1 ? 5 : 3),
    [provinces.length]);

  const choosePrizes = useMemo(() =>
    region === "north" ? PRIZES_NORTH : PRIZES,
    [region]);

  // Navigation handler for station press (only for multi-station view)
  const handleStationPress = station ? undefined : (stationName: string, stationRegion: Region) => {
    navigation.navigate('StationDetail', {
      station: stationName,
      region: stationRegion,
      date: dateSelected
    });
  };

  // Hàm trả lại âm lượng cũ
  const restoreVolume = () => {
    rollingSoundRef.current?.setVolume(0.5); // Trả về mức default 0.5
  };

  const playNewSoundWithDucking = (station: string, rank: string, value: string) => {
    // Kiểm tra setting isVoiceEnabled và app phải ở foreground
    if (!appSettings?.isVoiceEnabled || appState !== 'active') return;

    // 1. Giảm âm lượng nhạc nền xuống mức nhỏ để nghe tiếng chuông rõ hơn
    rollingSoundRef.current?.setVolume(0.1);

    if (newSoundRef.current) {
      newSoundRef.current.play((success) => {
        // 2. Sau khi tiếng chuông dứt, bắt đầu gọi TTS
        speakLotteryResult(station, rank, value, restoreVolume);
      });
    } else {
      // Nếu không có file chuông, vẫn gọi TTS
      speakLotteryResult(station, rank, value, restoreVolume);
    }
  };

  useEffect(() => {
    // Mỗi khi dateSelected hoặc region thay đổi, hàm này sẽ tự kiểm tra cache
    if (!isFocused) return;

    if (appState !== "active") return;

    dispatch(fetchLotteryIfNeeded({
      date: dateSelected,
      region: region,
      noCache: isLive && isFocused, // Nếu đang ở chế độ
    }))

  }, [dateSelected, dispatch, isFocused, appState])

  useEffect(() => {
    if (appState !== "active" || !isLiveActive) {
    // Ứng dụng chuyển sang nền hoặc đã kết thúc, tạm dừng nhạc
      rollingSoundRef.current?.pause();
    } else {
      // Ứng dụng trở lại foreground, nếu isLiveActive và isMusicEnabled thì tiếp tục phát nhạc
      if (isLiveActive && appSettings?.isMusicEnabled) {
        rollingSoundRef.current?.play();
      }
    }
  }, [appState, isLiveActive, appSettings?.isMusicEnabled]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextAppState => {
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    // 1. Kết nối - chỉ khi đang LIVE và chưa kết thúc
    if (!isLiveActive) return;
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
          const newNumbers = payload.changes.filter((c: any) => c.value !== '*' && c.value !== '-');

          if (newNumbers.length > 0) {
            // Chỉ lấy số đầu tiên về để đọc (tránh đọc dồn dập khi về nhiều số cùng lúc)
            newNumbers.forEach((num: any) => {
              playNewSoundWithDucking(payload.station, num.rank, num.value);
            })
          }
          const idsToRemove = payload.changes.map((c: any) => `${payload.station}-${c.rank}-${c.index}`)

          setTimeout(() => {
            dispatch(clearNewStatus(idsToRemove))
          }, 10000) // 15 giây "Wow" cho người dùng
        }
      }
    })

    socket.on('disconnect', () => {
      console.log('Disconnected');
    });

    // Cleanup khi component unmount
    return () => {
      if (!isLiveActive) return;
      socket.off('connect');
      socket.off('onLotteryChange');
      socket.disconnect();
    };
  }, [isLiveActive, region]);


  useEffect(() => {
    let timer: NodeJS.Timeout;

    const startSound = () => {
      if (isLiveActive && isSoundReady && rollingSoundRef.current && isFocused && appState === 'active' && appSettings?.isMusicEnabled) {
        // Đảm bảo volume mức cao
        rollingSoundRef.current.setVolume(0.5);

        rollingSoundRef.current.play((success) => {
          if (!success) {
            // Nếu fail, thử lại 1 lần nữa sau 2 giây
            timer = setTimeout(() => rollingSoundRef.current?.play(), 2000);
          }
        });
      } else {
        rollingSoundRef.current?.pause();
      }
    };

    // Delay 500ms để tránh xung đột lúc vừa mount màn hình
    timer = setTimeout(startSound, 500);

    return () => {
      clearTimeout(timer);
      rollingSoundRef.current?.pause();
    };
  }, [isLiveActive, isSoundReady, isFocused, appState, appSettings?.isMusicEnabled]);

  useEffect(() => {
    // KHỞI TẠO - Chỉ load nhạc khi đang ở trạng thái LIVE
    if (!isLiveActive) {
      setIsSoundReady(false);
      return;
    }

    const sound = new Sound('longcau.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Lỗi load nhạc:', error);
      } else {
        sound.setNumberOfLoops(-1); // Lặp vô hạn
        sound.setVolume(0.5);
        rollingSoundRef.current = sound;
        setIsSoundReady(true); // Đánh dấu đã sẵn sàng
      }
    });

    const newSound = new Sound('bell_sound.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('Lỗi load nhạc: bell_sound.mp3', error);
      }
      else {
        newSoundRef.current = newSound;
      }
    })
    // CLEANUP: Giải phóng khi thoát màn hình hoặc unmount
    return () => {
      if (rollingSoundRef.current) {
        rollingSoundRef.current.stop();
        rollingSoundRef.current.release();
        rollingSoundRef.current = null;
      }
      if (newSoundRef.current) {
        newSoundRef.current.release();
        newSoundRef.current = null;
      }
      setIsSoundReady(false);
    };
  }, [isLiveActive]); // Chỉ load khi isLiveActive thay đổi

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 150); // Delay nhẹ để UI Date mượt hơn
    return () => clearTimeout(timer);
  }, [dateSelected]);

  if (!isReady) return <View style={{ flex: 1 }} />;

  return (
    <View style={[themed($tableWrapper), $containerInsets]}>

      {isShowHeader && (region == "north" ? <HeaderRowNorth provinces={provinces} /> : (isShowHeader && <HeaderRow provinces={provinces} flex={calculateFlex} region={region} onStationPress={handleStationPress} />))}
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
              highlightDigit={highlightDigit}
              winDetails={winDetails}
            />
          ))
        }
      </View>
      <DisplayModeToggleV2 value={displayMode} onChange={handleChangeDisplayMode} />
      <View style={themed($highlightBar)}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <TouchableOpacity
            key={num}
            onPress={() => handleToggleHighlight(num)}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: highlightDigit === num ? colors.primary : colors.palette.neutral200,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              text={num.toString()}
              style={{ color: highlightDigit === num ? colors.background : colors.text, fontWeight: 'bold' }}
            />
          </TouchableOpacity>
        ))}
      </View>
      {appSettings?.showLotoTable && <LotoTable provinces={provinces} region={region} />}
    </View>
  )
})

const $tableWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  // padding: spacing.sm,
})

const $highlightBar: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: 'row',
  justifyContent: 'space-around',
  paddingVertical: 10,
  backgroundColor: colors.surface,
  borderBottomWidth: 1,
  borderColor: colors.separator,
  paddingHorizontal: spacing.sm,
});
