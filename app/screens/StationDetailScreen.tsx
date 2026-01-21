import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, TouchableOpacity, ViewStyle, TextStyle, Modal, FlatList, Dimensions } from "react-native";
import { Header } from "@/components/Header";
import { Text } from "@/components/Text";
import { Screen } from "@/components/Screen";
import { AppStackScreenProps } from "@/navigators/navigationTypes";
import { useAppTheme } from "@/theme/context";
import { ThemedStyle } from "@/theme/types";
import IconBack from "@assets/svg/arrow-left.svg";
import IconCalendar from "@assets/svg/calendar.svg";
import IconChevronDown from "@assets/svg/arrow-drop-down.svg";
import PagerView from "react-native-pager-view";
import { format, subDays, addDays, isAfter, startOfDay, parseISO, getDay } from "date-fns";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Toast from "react-native-toast-message";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchLotteryIfNeeded, setDateSelected } from "@/store/slices/lotterySlice";
import { LotteryResultTable } from "@/components/ResultTicket/LotteryResultTable";
import { LOTTERY_SCHEDULE } from "@/constants/lotterySchedule";
import { Region, Weekday } from "@/constants/lotteryTicket";
import { shallowEqual } from "react-redux";
import { CountDownDraw } from "@/components/ResultTicket/CountDownDraw";
import { isToday } from "date-fns";

interface StationInfo {
  name: string;
  region: Region;
}

// Map day of week to Weekday type
const getDayOfWeekAsWeekday = (date: Date): Weekday => {
  const dayIndex = getDay(date); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const weekdays: Weekday[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return weekdays[dayIndex];
};

// Check if a station has lottery on a specific date
const isStationActiveOnDate = (station: string, region: Region, date: Date): boolean => {
  const schedule = LOTTERY_SCHEDULE.find(s => s.region === region);
  if (!schedule) return false;

  const weekday = getDayOfWeekAsWeekday(date);
  const daySchedule = schedule.schedule.find(s => s.date === weekday);

  return daySchedule?.provinces.includes(station) || false;
};

// Find next valid date when station has lottery
const findNextValidDate = (station: string, region: Region, fromDate: Date): Date | null => {
  let date = addDays(fromDate, 1);
  let attempts = 0;

  while (attempts < 14) { // Search up to 2 weeks
    if (isStationActiveOnDate(station, region, date)) {
      return date;
    }
    date = addDays(date, 1);
    attempts++;
  }

  return null;
};

// Find previous valid date when station has lottery
const findPreviousValidDate = (station: string, region: Region, fromDate: Date): Date | null => {
  let date = subDays(fromDate, 1);
  let attempts = 0;

  while (attempts < 14) { // Search up to 2 weeks back
    if (isStationActiveOnDate(station, region, date)) {
      return date;
    }
    date = subDays(date, 1);
    attempts++;
  }

  return null;
};

// Get all stations grouped by region
const getStationsByRegion = (region: Region): string[] => {
  const schedule = LOTTERY_SCHEDULE.find(s => s.region === region);
  if (!schedule) return [];

  const stations = new Set<string>();
  schedule.schedule.forEach(day => {
    day.provinces.forEach(province => stations.add(province));
  });

  return Array.from(stations).sort();
};

export const StationDetailScreen: React.FC<AppStackScreenProps<'StationDetail'>> = function StationDetailScreen(_props) {
  const { navigation, route } = _props;
  const { station: initialStation, region: initialRegion, date: initialDate } = route.params;

  const { themed, theme: { colors, spacing } } = useAppTheme();
  const dispatch = useAppDispatch();

  const [selectedStation, setSelectedStation] = useState(initialStation);
  const [selectedRegion, setSelectedRegion] = useState<Region>(initialRegion as Region);
  const [currentDate, setCurrentDate] = useState(initialDate || format(new Date(), "yyyy-MM-dd"));
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isStationDropdownVisible, setStationDropdownVisible] = useState(false);

  const pagerRef = useRef<PagerView>(null);

  // Get stations for current region
  const availableStations = useMemo(() => getStationsByRegion(selectedRegion), [selectedRegion]);

  // Calculate previous and next valid dates
  const previousValidDate = useMemo(() => {
    const currentParsed = parseISO(currentDate);
    const prevDate = findPreviousValidDate(selectedStation, selectedRegion, currentParsed);
    return prevDate ? format(prevDate, "yyyy-MM-dd") : null;
  }, [currentDate, selectedStation, selectedRegion]);

  const nextValidDate = useMemo(() => {
    const currentParsed = parseISO(currentDate);
    const nextDate = findNextValidDate(selectedStation, selectedRegion, currentParsed);
    // Don't allow future dates
    if (nextDate && isAfter(startOfDay(nextDate), startOfDay(new Date()))) {
      return null;
    }
    return nextDate ? format(nextDate, "yyyy-MM-dd") : null;
  }, [currentDate, selectedStation, selectedRegion]);

  // Get draw status for the selected region
  const { type: drawStatus } = useAppSelector(
    (state) => ({ type: state.timeDraw.regions[selectedRegion].type }),
    shallowEqual
  );

  const isSelectedToday = isToday(parseISO(currentDate));
  const isUpcoming = drawStatus === "UPCOMING" && isSelectedToday;
  const isLive = drawStatus === "LIVE" && isSelectedToday;

  // Handle page change
  const handlePageSelected = useCallback((e: any) => {
    const newIndex = e.nativeEvent.position;

    if (newIndex === 0 && previousValidDate) {
      // Swiped to previous
      setCurrentDate(previousValidDate);
      dispatch(setDateSelected(previousValidDate));
      // Reset to middle page
      setTimeout(() => {
        pagerRef.current?.setPageWithoutAnimation(1);
      }, 50);
    } else if (newIndex === 2 && nextValidDate) {
      // Swiped to next
      setCurrentDate(nextValidDate);
      dispatch(setDateSelected(nextValidDate));
      // Reset to middle page
      setTimeout(() => {
        pagerRef.current?.setPageWithoutAnimation(1);
      }, 50);
    }
  }, [previousValidDate, nextValidDate, dispatch]);

  // Handle date picker
  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleConfirmDate = (date: Date) => {
    hideDatePicker();

    if (isAfter(startOfDay(date), startOfDay(new Date()))) {
      Toast.show({
        type: 'error',
        text1: `Ngày không được vượt quá hôm nay!`,
        position: 'bottom',
      });
      return;
    }

    // Check if station has lottery on this date
    if (!isStationActiveOnDate(selectedStation, selectedRegion, date)) {
      Toast.show({
        type: 'error',
        text1: `${selectedStation} không xổ vào ngày này!`,
        position: 'bottom',
      });
      return;
    }

    const dateString = format(date, "yyyy-MM-dd");
    setCurrentDate(dateString);
    dispatch(setDateSelected(dateString));

    // Reset to middle page with new date
    setTimeout(() => {
      pagerRef.current?.setPageWithoutAnimation(1);
    }, 100);
  };

  // Handle station selection
  const handleStationSelect = (station: string) => {
    setSelectedStation(station);
    setStationDropdownVisible(false);

    // Find first valid date for this station (today or before)
    let validDate = new Date();
    let attempts = 0;
    while (!isStationActiveOnDate(station, selectedRegion, validDate) && attempts < 30) {
      validDate = subDays(validDate, 1);
      attempts++;
    }

    if (isStationActiveOnDate(station, selectedRegion, validDate)) {
      const dateString = format(validDate, "yyyy-MM-dd");
      setCurrentDate(dateString);
      dispatch(setDateSelected(dateString));
      setTimeout(() => {
        pagerRef.current?.setPageWithoutAnimation(1);
      }, 100);
    }
  };

  // Fetch lottery data when date or station changes
  useEffect(() => {
    // Only fetch if station is active on current date
    const parsedDate = parseISO(currentDate);
    if (!isStationActiveOnDate(selectedStation, selectedRegion, parsedDate)) {
      return;
    }

    // Fetch current date
    dispatch(fetchLotteryIfNeeded({
      date: currentDate,
      region: selectedRegion,
      noCache: isLive,
    }));

    // Prefetch previous date if exists
    if (previousValidDate) {
      dispatch(fetchLotteryIfNeeded({
        date: previousValidDate,
        region: selectedRegion,
        noCache: false,
      }));
    }

    // Prefetch next date if exists
    if (nextValidDate) {
      dispatch(fetchLotteryIfNeeded({
        date: nextValidDate,
        region: selectedRegion,
        noCache: false,
      }));
    }
  }, [currentDate, selectedRegion, selectedStation, dispatch, isLive, previousValidDate, nextValidDate]);

  const BackIcon = () => (
    <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.5} style={{ padding: 8 }}>
      <IconBack width={20} height={20} color={colors.text} />
    </TouchableOpacity>
  );

  const CalendarIcon = () => (
    <TouchableOpacity onPress={showDatePicker} activeOpacity={0.5} style={{ padding: 8 }}>
      <IconCalendar width={22} height={22} color={colors.text} />
    </TouchableOpacity>
  );

  const regionName = selectedRegion === "central" ? "Miền Trung" : selectedRegion === "south" ? "Miền Nam" : "Miền Bắc";

  return (
    <View style={{ flex: 1 }}>
      <Header
        title={`${selectedStation} ☘️ ${format(parseISO(currentDate), "dd-MM-yyyy")}`}
        safeAreaEdges={["top"]}
        LeftActionComponent={<BackIcon />}
        RightActionComponent={<CalendarIcon />}
        backgroundColor={colors.background}
        containerStyle={{ paddingHorizontal: spacing.md, backgroundColor: colors.surface }}
        titleStyle={{ color: colors.text, fontWeight: "bold", fontSize: 16 }}
        style={{ height: 42 }}
      />

      {/* Station Dropdown - Full Width */}
      <View style={themed($dropdownSelectorContainer)}>
        <TouchableOpacity
          style={themed($stationDropdownFull)}
          onPress={() => setStationDropdownVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={themed($stationDropdownTextFull)} numberOfLines={1}>
            {selectedStation}
          </Text>
          <IconChevronDown width={20} height={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* PagerView for swiping between dates */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={1}
        onPageSelected={handlePageSelected}
      >
        {/* Previous page */}
        <View key={previousValidDate} style={{ flex: 1 }}>
          {previousValidDate ? (
            <Screen
              preset="scroll"
              safeAreaEdges={["bottom"]}
            >
              <View style={themed($tableContainer)}>
                <LotteryResultTable
                  region={selectedRegion}
                  isLive={false}
                  station={selectedStation}
                  date={previousValidDate}
                />
              </View>
            </Screen>
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ opacity: 0.5 }}>Không có dữ liệu</Text>
            </View>
          )}
        </View>

        {/* Current page */}
        <View key={currentDate} style={{ flex: 1 }}>
          <Screen
            preset="scroll"
            safeAreaEdges={["bottom"]}
            style={{ ...(isUpcoming ? { backgroundColor: "#C00000" } : {}) }}
          >
            {isUpcoming ? (
              <CountDownDraw
                regionName={`XỔ SỐ ${regionName.toUpperCase()}`}
                region={selectedRegion}
              />
            ) : (
              <View style={themed($tableContainer)}>
                <LotteryResultTable
                  region={selectedRegion}
                  isLive={isLive}
                  station={selectedStation}
                  date={currentDate}
                />
              </View>
            )}
          </Screen>
        </View>

        {/* Next page */}
        <View key={nextValidDate} style={{ flex: 1 }}>
          {nextValidDate ? (
            <Screen
              preset="scroll"
              safeAreaEdges={["bottom"]}
            >
              <View style={themed($tableContainer)}>
                <LotteryResultTable
                  region={selectedRegion}
                  isLive={false}
                  station={selectedStation}
                  date={nextValidDate}
                />
              </View>
            </Screen>
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ opacity: 0.5 }}>Không có dữ liệu</Text>
            </View>
          )}
        </View>
      </PagerView>

      {/* Date Picker Modal 
          Note: react-native-modal-datetime-picker doesn't support disabling specific dates.
          Validation is done in handleConfirmDate to check if station has lottery on selected date.
      */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={hideDatePicker}
        date={parseISO(currentDate)}
        maximumDate={new Date()}
      />

      {/* Station Dropdown Modal */}
      <Modal
        visible={isStationDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setStationDropdownVisible(false)}
      >
        <TouchableOpacity
          style={themed($modalOverlay)}
          activeOpacity={1}
          onPress={() => setStationDropdownVisible(false)}
        >
          <View style={themed($dropdownContainer)}>
            <View style={themed($dropdownHeader)}>
              <Text style={themed($dropdownTitle)}>Chọn đài</Text>
            </View>
            <FlatList
              data={availableStations}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={themed($dropdownItem)}
                  onPress={() => handleStationSelect(item)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      themed($dropdownItemText),
                      item === selectedStation && themed($dropdownItemTextSelected)
                    ]}
                  >
                    {item}
                  </Text>
                  {item === selectedStation && (
                    <Text style={themed($dropdownItemCheck)}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const $dropdownSelectorContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  backgroundColor: colors.surface,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
});

const $stationDropdownFull: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: colors.background,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.separator,
});

const $stationDropdownTextFull: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.text,
  flex: 1,
});

const $controlsContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  backgroundColor: colors.surface,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
});

const $dateDisplay: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xs,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.separator,
});

const $dateText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 15,
  fontWeight: "600",
  color: colors.text,
});

const $stationDropdown: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.background,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xs,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.separator,
  maxWidth: 180,
  gap: spacing.xs,
});

const $stationDropdownText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 15,
  fontWeight: "600",
  color: colors.text,
  flex: 1,
});

const $tableContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  // paddingHorizontal: spacing.md,
  // paddingTop: spacing.sm,
});

const $modalOverlay: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
});

const $dropdownContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.surface,
  borderRadius: 12,
  width: "80%",
  maxHeight: "60%",
  overflow: "hidden",
});

const $dropdownHeader: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
});

const $dropdownTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 18,
  fontWeight: "bold",
  color: colors.text,
  textAlign: "center",
});

const $dropdownItem: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
});

const $dropdownItemText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.text,
});

const $dropdownItemTextSelected: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontWeight: "bold",
  color: colors.primary,
});

const $dropdownItemCheck: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 18,
  fontWeight: "bold",
  color: colors.primary,
});
