import { Header } from "@/components/Header";
import { HomeTabScreenProps } from "@/navigators/navigationTypes";
import { useAppTheme } from "@/theme/context";
import { TouchableOpacity, View, ViewStyle } from "react-native";
import IconSetting from "@assets/svg/setting.svg";
import IconBack from "@assets/svg/arrow-left.svg";
import { ThemedStyle } from "@/theme/types";
import { ResultTicketTab } from "@/components/ResultTicket/ResultTicketTab";
import { useRef } from "react";
import { format, isAfter, isToday, parseISO, startOfDay } from "date-fns";
import Toast from "react-native-toast-message";
import { useAppDispatch, useAppSelector } from "@/store";
import { setDateSelected } from "@/store/slices/lotterySlice";
import BottomSheet from "@gorhom/bottom-sheet";
import { ResultSettingsSheet } from "@/components/ResultTicket/ResultSettingsSheet";
import { shallowEqual } from "react-redux"
import { HorizontalDatePicker } from "@/components/ResultTicket/HorizontalDatePicker";

export const ResultScreen: React.FC<HomeTabScreenProps<'Result'>> = function ResultScreen(_props) {
  // how to get params from _props.route.params
  const { themed, theme: { colors, spacing } } = useAppTheme();
  const { navigation } = _props;
  const dispatch = useAppDispatch()

  const dateSelected = useAppSelector((state) => state.lottery.dateSelected);
  const settingsSheetRef = useRef<BottomSheet>(null);

  // Kiểm tra xem ngày đang chọn có phải hôm nay không để chặn nút Next
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


  const SettingPressableIcon = () => {
    return (
      <TouchableOpacity onPress={openSettings} activeOpacity={0.5} style={{ padding: 8 }}>
        <IconSetting width={22} height={22} />
      </TouchableOpacity>
    )
  }

  const BackIcon = () => (
    <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.5} style={{ padding: 8 }}>
      <IconBack width={20} height={20} color={colors.text} />
    </TouchableOpacity>
  );

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
        />
      </View>
      <ResultTicketTab />
      <ResultSettingsSheet ref={settingsSheetRef} />
    </View>
  )
}


const $datePickerContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
})