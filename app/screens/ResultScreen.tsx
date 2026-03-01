import { Header } from "@/components/Header";
import { HomeTabScreenProps } from "@/navigators/navigationTypes";
import { useAppTheme } from "@/theme/context";
import { Dimensions, TouchableOpacity, View, ViewStyle } from "react-native";
import IconSetting from "@assets/svg/setting.svg";
import IconBack from "@assets/svg/arrow-left.svg";
import { ThemedStyle } from "@/theme/types";
import { ResultTicketTab } from "@/components/ResultTicket/ResultTicketTab";
import { useCallback, useRef, useState } from "react";
import { format, isAfter, isToday, parseISO, startOfDay } from "date-fns";
import Toast from "react-native-toast-message";
import { useAppDispatch, useAppSelector } from "@/store";
import { setDateSelected } from "@/store/slices/lotterySlice";
import BottomSheet from "@gorhom/bottom-sheet";
import { ResultSettingsSheet } from "@/components/ResultTicket/ResultSettingsSheet";
import { shallowEqual } from "react-redux"
import { HorizontalDatePicker } from "@/components/ResultTicket/HorizontalDatePicker";
import { HeaderImageDownload } from "@/components/ResultTicket/HeaderImageDownload";
import { LotteryResultTable } from "@/components/ResultTicket/LotteryResultTable";

const SCREEN_WIDTH = Dimensions.get("window").width;

export const ResultScreen: React.FC<HomeTabScreenProps<'Result'>> = function ResultScreen(_props) {
  const { themed, theme: { colors, spacing } } = useAppTheme();
  const { navigation } = _props;
  const dispatch = useAppDispatch()

  const dateSelected = useAppSelector((state) => state.lottery.dateSelected);
  const settingsSheetRef = useRef<BottomSheet>(null);

  // The off-screen view that will be captured — always rendered but positioned off-screen
  const offscreenCaptureRef = useRef<View>(null);
  const captureResolveRef = useRef<(() => void) | null>(null);

  const [isCapturing, setIsCapturing] = useState(false);
  const [activeRegion, setActiveRegion] = useState<"south" | "central" | "north">("south");

  const isSelectedToday = isToday(parseISO(dateSelected));

  let regionDrawNorthStatus = useAppSelector((state) => state.timeDraw.regions.north.type, shallowEqual);
  let regionDrawSouthStatus = useAppSelector((state) => state.timeDraw.regions.south.type, shallowEqual);
  let regionDrawCentralStatus = useAppSelector((state) => state.timeDraw.regions.central.type, shallowEqual);

  let tittleHeader = "Kết quả xổ số";
  if (regionDrawSouthStatus === 'LIVE' && isSelectedToday) {
    tittleHeader = "🔴 LIVE xổ số - MN";
  }
  else if (regionDrawCentralStatus === 'LIVE' && isSelectedToday) {
    tittleHeader = "🔴 LIVE xổ số - MT";
  }
  else if (regionDrawNorthStatus === 'LIVE' && isSelectedToday) {
    tittleHeader = "🔴 LIVE xổ số - MB";
  }

  const openSettings = () => {
    settingsSheetRef.current?.expand();
  };

  const handleDateChange = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    if (isAfter(startOfDay(date), startOfDay(new Date()))) {
      Toast.show({
        type: 'error',
        text1: `Ngày không được vượt quá hôm nay!`,
        position: 'bottom',
      });
      return;
    }
    dispatch(setDateSelected(dateString));
  };

  // Before capture: mount the off-screen view and wait until it has fully laid out
  const handleBeforeCapture = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      captureResolveRef.current = resolve;
      setIsCapturing(true);
      // Safety fallback: resolve after 1200ms even if onLayout never fires
      setTimeout(() => {
        if (captureResolveRef.current === resolve) {
          captureResolveRef.current = null;
          resolve();
        }
      }, 1200);
    });
  }, []);

  // Called by onLayout on the off-screen view — content is laid out, add a small
  // paint delay so sub-items finish drawing before we capture
  const handleOffscreenLayout = useCallback(() => {
    const resolve = captureResolveRef.current;
    if (!resolve) return;
    captureResolveRef.current = null;
    setTimeout(resolve, 400); // 400ms for all rows to finish painting
  }, []);

  // After capture: hide off-screen view again
  const handleAfterCapture = useCallback(() => {
    setIsCapturing(false);
  }, []);

  const SettingPressableIcon = () => (
    <TouchableOpacity onPress={openSettings} activeOpacity={0.5} style={{ padding: 8 }}>
      <IconSetting width={22} height={22} />
    </TouchableOpacity>
  )

  const BackIcon = () => (
    <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.5} style={{ padding: 8 }}>
      <IconBack width={20} height={20} color={colors.text} />
    </TouchableOpacity>
  );

  // Derive isLive for the active region
  const isLive =
    (activeRegion === "south" && regionDrawSouthStatus === 'LIVE' && isSelectedToday) ||
    (activeRegion === "central" && regionDrawCentralStatus === 'LIVE' && isSelectedToday) ||
    (activeRegion === "north" && regionDrawNorthStatus === 'LIVE' && isSelectedToday);

  return (
    <View style={{ flex: 1 }}>

      <Header
        title={tittleHeader}
        safeAreaEdges={["top"]}
        RightActionComponent={<SettingPressableIcon />}
        LeftActionComponent={<BackIcon />}
        backgroundColor={colors.background}
        containerStyle={{ paddingHorizontal: spacing.md, backgroundColor: colors.surface }}
        titleStyle={{ color: colors.text, fontWeight: "bold", fontSize: 20 }}
        style={{ height: 42 }}
      />
      <View style={themed($datePickerContainer)}>
        <HorizontalDatePicker
          selectedDate={parseISO(dateSelected)}
          onDateChange={handleDateChange}
          disableFuture={true}
        />
      </View>

      {/* Normal visible tab view */}
      <View collapsable={false} style={{ flex: 1 }}>
        <ResultTicketTab
          onActiveRegionChange={setActiveRegion}
        />
      </View>

      {/* Off-screen full-height capture view — only laid out during isCapturing */}
      {isCapturing && (
        <View
          ref={offscreenCaptureRef}
          collapsable={false}
          onLayout={handleOffscreenLayout}
          style={{
            position: 'absolute',
            left: -SCREEN_WIDTH * 2, // pushed far off screen
            top: 0,
            width: SCREEN_WIDTH,
            backgroundColor: colors.background,
          }}
        >
          <HeaderImageDownload activeRegion={activeRegion} />
          <LotteryResultTable
            region={activeRegion}
            isLive={isLive}
            isCaptureMode={true}
          />
        </View>
      )}

      <ResultSettingsSheet
        ref={settingsSheetRef}
        captureRef={offscreenCaptureRef}
        onBeforeCapture={handleBeforeCapture}
        onAfterCapture={handleAfterCapture}
      />
    </View>
  )
}


const $datePickerContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
})


