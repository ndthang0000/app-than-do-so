// Update ManualInputScreen.tsx (Tối ưu hóa Re-render xuống 2 lần)
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, ViewStyle, TouchableOpacity, ScrollView, TextInput, TextStyle, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { AppStackScreenProps } from '@/navigators/navigationTypes';
import { Screen } from '@/components/Screen';
import { Text } from "@/components/Text"
import { Header } from '@/components/Header';
import IconBack from "@assets/svg/arrow-left.svg";
import IconLeftArrow from "@assets/svg/arrow-left.svg";
import IconRightArrow from "@assets/svg/arrow-right.svg";
import IconTicket from "@assets/svg/my-ticket.svg";
import IconClear from "@assets/svg/backspace.svg";
import IconSearch from "@assets/svg/search.svg";
import IconCheckCircle from "@assets/svg/check-circle.svg";
import IconCalendar from "@assets/svg/calendar.svg";
import IconLuckyStar from "@assets/svg/lucky-star.svg";

// Lấy chiều rộng màn hình và tính toán vị trí cuộn
const SCREEN_WIDTH = Dimensions.get('window').width;
const CONTAINER_PADDING = 32; // Tương đương spacing.md * 2 (16*2)
const WEEK_WIDTH = SCREEN_WIDTH - CONTAINER_PADDING;
const MIDDLE_SCROLL_POS = WEEK_WIDTH; // Vị trí cuộn tuần hiện tại (index 1)

// Dữ liệu mẫu (Giữ nguyên)
const cityData = [
  {
    region: 'Miền Nam', color: '#DC2626', data: [
      { code: 'HCM', name: 'TP. HCM' },
      { code: 'LA', name: 'Long An' },
      { code: 'BP', name: 'Bình Phước' },
    ]
  },
  {
    region: 'Miền Trung', color: '#F59E0B', data: [
      { code: 'DN', name: 'Đà Nẵng' },
      { code: 'QNG', name: 'Quảng Ngãi' },
      { code: 'ĐNÔ', name: 'Đắk Nông' },
    ]
  },
  {
    region: 'Miền Bắc', color: '#10B981', data: [
      { code: 'HN', name: 'Hà Nội' },
    ]
  },
];

// --- LOGIC XỬ LÝ NGÀY THÁNG ---
interface WeekDateItem {
  date: Date;
  dayName: string;
  isHoliday: boolean;
}

const getMonday = (d: Date): Date => {
  d = new Date(d);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const generateWeekDates = (startDate: Date): WeekDateItem[] => {
  const monday = getMonday(startDate);
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const week: WeekDateItem[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);

    const dayOfWeekIndex = date.getDay();

    week.push({
      date,
      dayName: dayNames[(dayOfWeekIndex === 0 ? 6 : dayOfWeekIndex - 1)],
      isHoliday: dayOfWeekIndex === 0 || dayOfWeekIndex === 6,
    });
  }
  return week;
};

// Hàm tính toán và trả về 3 tuần (Tuần trước, Hiện tại, Tuần sau)
const getThreeWeeks = (centerDate: Date): WeekDateItem[][] => {
  const currentMonday = getMonday(centerDate);

  // Tuần trước
  const prevDate = new Date(currentMonday);
  prevDate.setDate(currentMonday.getDate() - 7);
  const prevWeek = generateWeekDates(prevDate);

  // Tuần hiện tại
  const currentWeek = generateWeekDates(centerDate);

  // Tuần sau
  const nextDate = new Date(currentMonday);
  nextDate.setDate(currentMonday.getDate() + 7);
  const nextWeek = generateWeekDates(nextDate);

  return [prevWeek, currentWeek, nextWeek];
}

export const ManualInputScreen: React.FC<AppStackScreenProps<'ManualInput'>> = function ManualInputScreen(_props) {
  const { themed, theme: { colors, spacing } } = useAppTheme();
  const [ticketCode, setTicketCode] = useState<string>(''); // Đổi thành string thay vì array
  const [selectedCities, setSelectedCities] = useState<string>(cityData[0].data[0].name);
  console.log("re-render")
  // State chính: Chỉ quản lý ngày được chọn.
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null); // Ref cho TextInput ẩn
  const { navigation } = _props;

  // UseMemo để tính toán 3 tuần chỉ khi selectedDate thay đổi.
  // **Đây là bước quan trọng để giảm Re-render.**
  const visibleWeeks = useMemo(() => getThreeWeeks(selectedDate), [selectedDate]);

  // Cuộn về vị trí giữa sau khi selectedDate thay đổi
  useEffect(() => {
    // Chỉ cuộn khi component đã được mount và có data
    if (scrollViewRef.current && visibleWeeks.length === 3) {
      // Sử dụng setTimeout(0) để đảm bảo việc cuộn diễn ra sau khi
      // Re-render (lần 2) hoàn tất và ScrollView đã được bố cục lại
      // với 3 tuần mới.
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: MIDDLE_SCROLL_POS, animated: false });
      }, 0);
    }
  }, [selectedDate, visibleWeeks]); // Phụ thuộc vào selectedDate

  // ------------------------------------------
  // HÀM CHUYỂN TUẦN (SỬ DỤNG useCallback)
  // ------------------------------------------

  const changeWeek = useCallback((direction: 'PREV' | 'NEXT') => {
    // Console.log ra sẽ chỉ thấy 1 lần gọi hàm này (Re-render 1)

    const newDate = new Date(selectedDate);
    if (direction === 'PREV') {
      newDate.setDate(selectedDate.getDate() - 7);
    } else {
      newDate.setDate(selectedDate.getDate() + 7);
    }

    // Cập nhật state. Re-render lần 1.
    setSelectedDate(newDate);
  }, [selectedDate]);

  const handlePreviousWeek = useCallback(() => changeWeek('PREV'), [changeWeek]);
  const handleNextWeek = useCallback(() => changeWeek('NEXT'), [changeWeek]);

  // ------------------------------------------
  // XỬ LÝ VUỐT (SWIPE)
  // ------------------------------------------

  const handleScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x;

    // Vuốt sang trái (Chuyển Next Week)
    if (offset > MIDDLE_SCROLL_POS + WEEK_WIDTH / 2) {
      handleNextWeek();
    }
    // Vuốt sang phải (Chuyển Previous Week)
    else if (offset < WEEK_WIDTH / 2) {
      handlePreviousWeek();
    }
    // Cuộn về vị trí giữa (Tuần hiện tại) nếu không đủ lực vuốt
    else {
      scrollViewRef.current?.scrollTo({ x: MIDDLE_SCROLL_POS, animated: true });
    }
  }, [handleNextWeek, handlePreviousWeek]);

  // ------------------------------------------
  // CÁC HÀM RENDER KHÁC
  // ------------------------------------------

  // ... (Giữ nguyên các hàm BackIcon, renderCodeInput, toggleCitySelection, renderCityChips)

  const BackIcon = () => (
    <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.5}>
      <IconBack width={24} height={24} color={colors.text} />
    </TouchableOpacity>
  );

  const renderCodeInput = () => {
    const codeArray = ticketCode.split('');
    while (codeArray.length < 6) {
      codeArray.push('');
    }

    return (
      <TouchableOpacity
        style={themed($codeInputWrapper)}
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()} // Khi chạm vào bất kỳ đâu trong wrapper, gọi focus
      >
        <IconTicket width={24} height={24} color={colors.palette.neutral500} style={{ marginRight: spacing.sm }} />

        {/* FIX: Đổi style TextInput ẩn.
                    Đặt nó ra khỏi vùng hiển thị nhưng vẫn giữ trong luồng (Không dùng position: absolute và opacity: 0)
                    Nếu cần đảm bảo nó không gây ảnh hưởng đến layout: 
                    Dùng height/width rất nhỏ, overflow: 'hidden'
                */}
        <TextInput
          ref={inputRef}
          style={themed($hiddenInput)} // Sử dụng style mới để ẩn
          maxLength={6}
          keyboardType='number-pad'
          value={ticketCode}
          onChangeText={(text) => {
            const numbersOnly = text.replace(/[^0-9]/g, '');
            setTicketCode(numbersOnly);
          }}
          autoFocus={false}
        />

        {/* Hiển thị 6 ô số */}
        {codeArray.map((value, index) => (
          <View
            key={index}
            style={themed($codeBox)}
          >
            <Text
              text={value}
              weight='bold'
              size='xxl'
              style={{ color: colors.text }}
            />
          </View>
        ))}

        <TouchableOpacity
          onPress={() => {
            setTicketCode('');
            inputRef.current?.focus(); // Đảm bảo focus sau khi xóa
          }}
          activeOpacity={0.7}
          style={themed($clearButton)}
        >
          <IconClear width={20} height={20} color={colors.palette.neutral500} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const toggleCitySelection = (station: string) => {
    setSelectedCities(station);
  };

  const renderCityChips = (regionData: typeof cityData[0]) => (
    <View key={regionData.region}>
      {/* Header Miền */}
      <View style={themed($regionHeader)}>
        <View style={[themed($regionIndicator), { backgroundColor: regionData.color }]} />
        <Text text={regionData.region} weight='semiBold' size="md" />
        <View style={{ flex: 3, backgroundColor: colors.palette.neutral300, height: 0.5, marginLeft: spacing.lg }}></View>
      </View>

      {/* Danh sách đài quay */}
      <View style={themed($cityChipRow)}>
        {regionData.data.map(city => {
          const isSelected = selectedCities == city.name;
          return (
            <TouchableOpacity
              key={city.code}
              style={themed([$cityChip, isSelected && $activeCityChip])}
              activeOpacity={0.7}
              onPress={() => toggleCitySelection(city.name)}
            >
              <Text text={city.name} weight='semiBold' size="sm" />
              {isSelected && (
                <View style={themed($checkBadge)}>
                  <IconCheckCircle width={16} height={16} color={colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // --- JSX RENDER CHÍNH ---

  return (
    <>
      <Header
        title="Nhập vé thủ công"
        LeftActionComponent={<BackIcon />}
        safeAreaEdges={["top"]}
        backgroundColor={colors.background}
        containerStyle={{ paddingHorizontal: spacing.md, backgroundColor: colors.surface }}
        titleStyle={{ color: colors.text, fontWeight: "bold", fontSize: 18 }}
      />

      <Screen preset="scroll" contentContainerStyle={themed($screenContentContainer)}>

        {/* 1. Ngày mở thưởng (Date Picker Card) */}
        <View style={themed($sectionHeader)}>
          <Text text='Chọn ngày xổ' weight='bold' size="md" />
        </View>
        <View style={themed($datePickerCard)}>
          <View style={themed($datePickerHeader)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <IconCalendar width={20} height={20} color={colors.primary} />
              <Text
                text={selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                weight='bold'
                size="md"
                style={{ color: colors.primary }}
              />
            </View>
            <View style={themed($dateNavRow)}>
              <TouchableOpacity style={themed($backPrevious)} onPress={handlePreviousWeek}>
                <IconLeftArrow width={14} height={14} color={colors.palette.neutral700} />
              </TouchableOpacity>
              <TouchableOpacity style={themed($backNext)} onPress={handleNextWeek}>
                <IconRightArrow width={14} height={14} color={colors.palette.neutral700} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Scroll Row - Sử dụng ScrollView cho tính năng Swipe */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled={true}
            decelerationRate="fast"
            onMomentumScrollEnd={handleScrollEnd}
            scrollEventThrottle={16}
            contentContainerStyle={{ width: SCREEN_WIDTH * 3 - CONTAINER_PADDING * 3, paddingHorizontal: 0 }}
          >
            {visibleWeeks.map((week, weekIndex) => (
              <View
                key={weekIndex}
                style={themed($dateRowScrollPage)}
              >
                {week.map((dayItem, dayIndex) => {
                  const isSelected = dayItem.date.toDateString() === selectedDate.toDateString();
                  return (
                    <TouchableOpacity
                      key={dayIndex}
                      style={themed([$dateItemFixed, isSelected && $activeDateItem])}
                      activeOpacity={0.7}
                      onPress={() => setSelectedDate(dayItem.date)}
                    >
                      <Text
                        text={dayItem.dayName}
                        weight='bold'
                        size="sm"
                        style={{ color: isSelected ? colors.surface : colors.text }}
                      />
                      <Text
                        text={dayItem.date.getDate().toString()}
                        weight='bold'
                        size="lg"
                        style={{ color: isSelected ? colors.surface : colors.text }}
                      />
                      {dayItem.isHoliday && isSelected && <View style={themed($dateDot)} />}
                    </TouchableOpacity>
                  )
                })}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 2. Đài quay thưởng */}
        <View style={themed($sectionHeader)}>
          <Text text='Đài quay thưởng' weight='bold' size="md" />
          <Text text={`${cityData.length} đài mở thưởng`} weight='semiBold' size="sm" style={{ color: colors.palette.neutral500 }} />
        </View>

        <View>
          {cityData.map(renderCityChips)}
        </View>

        {/* 3. Mã dự thưởng */}
        <View style={themed($sectionHeader)}>
          <Text text='Mã dự thưởng' weight='bold' size="md" />
        </View>

        <View style={themed($codeCardWrapper)}>
          {renderCodeInput()}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.xs }}>
            <Text text='Nhập đủ 6 số trên vé' weight='light' size="xs" style={{ color: colors.palette.neutral500, alignSelf: 'flex-start', marginLeft: spacing.md }} />
            <IconLuckyStar width={16} height={16} color={colors.gold} />
          </View>
        </View>

      </Screen>

      {/* Floating Dò Ngay Button */}
      <TouchableOpacity style={themed($footerButton)} activeOpacity={0.8}>
        <IconSearch width={20} height={20} color={colors.surface} />
        <Text text='Dò ngay' weight='bold' size="lg" style={{ color: colors.surface, marginLeft: spacing.xs }} />
      </TouchableOpacity>
    </>
  );
}

// ... (Giữ nguyên phần STYLES)

// ==========================================================
// STYLES (Đã chỉnh sửa cho Swipe)
// ==========================================================

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
  paddingBottom: spacing.xxxl * 2,
});

const $sectionHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: spacing.md,
  marginBottom: spacing.xs,
});

const $datePickerCard: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.surface,
  borderRadius: spacing.lg,
  paddingVertical: spacing.md,
  shadowColor: colors.palette.primary300,
  shadowOffset: { width: 2, height: 5 },
  shadowOpacity: 0.2,
  shadowRadius: 2,
  elevation: 3,
});

const $datePickerHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: spacing.md,
  paddingHorizontal: spacing.sm + 4,
});


const $dateNavRow: ThemedStyle<ViewStyle> = ({ }) => ({
  flexDirection: 'row',
});


const $backPrevious: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  borderTopLeftRadius: 20,
  borderBottomLeftRadius: 20,
  backgroundColor: colors.palette.neutral200,
  justifyContent: 'center',
  alignItems: 'center',
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.sm,
  paddingRight: spacing.md,
});

const $backNext: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  borderTopRightRadius: 20,
  borderBottomRightRadius: 20,
  backgroundColor: colors.palette.neutral200,
  justifyContent: 'center',
  alignItems: 'center',
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.sm,
  paddingLeft: spacing.md,
});

const $dateRowScrollPage: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: SCREEN_WIDTH - spacing.md * 2,
  flexDirection: 'row',
  justifyContent: 'space-between',
  paddingHorizontal: spacing.sm,
});

const $dateItemFixed: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  width: '13%',
  height: 75,
  borderRadius: spacing.md,
  backgroundColor: colors.surface,
  justifyContent: 'center',
  alignItems: 'center',
  gap: spacing.xxs,
});

const $activeDateItem: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.primary,
});

const $dateDot: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: colors.surface,
  position: 'absolute',
  bottom: 5,
});


const $regionHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: spacing.xs,
  marginTop: spacing.xs,
});

const $regionIndicator: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: 4,
  height: 18,
  borderRadius: 2,
  marginRight: spacing.xs,
});

const $cityChipRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: spacing.sm,
  marginBottom: spacing.xs,
});

const $cityChip: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xs,
  borderRadius: spacing.xxl,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
});

const $activeCityChip: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.primary,
});


const $footerButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  position: 'absolute',
  bottom: spacing.md,
  left: spacing.md,
  right: spacing.md,
  height: 55,
  backgroundColor: colors.primary,
  borderRadius: spacing.lg,
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: colors.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 4.65,
  elevation: 8,
});
const $clearButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  borderRadius: 20,
  backgroundColor: colors.palette.neutral200,
  justifyContent: 'center',
  alignItems: 'center',
  height: 40,
  width: 40,
  marginLeft: spacing.sm,
});


const $checkBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: 'absolute',
  top: -6,
  right: 4,
  backgroundColor: colors.surface,
  borderRadius: 8,
  padding: 2,
});



const $codeCardWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  // ... (Giữ nguyên)
});

// FIX: Bọc $codeInputWrapper bằng TouchableOpacity và đảm bảo nó focus input
const $codeInputWrapper: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  paddingVertical: spacing.sm,
});

const $codeBox: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  // ... (Giữ nguyên)
  width: 40,
  height: 50,
  borderWidth: 1,
  borderColor: colors.palette.neutral400,
  borderRadius: spacing.sm,
  justifyContent: 'center',
  alignItems: 'center',
  marginHorizontal: spacing.xxs,
  backgroundColor: colors.surface,
});

// FIX: Style mới cho TextInput ẩn để đảm bảo nó không chặn tương tác
const $hiddenInput: ThemedStyle<TextStyle> = () => ({
  position: 'absolute',
  width: 1,
  height: 1,
  left: 0,
  top: 0,
  color: 'transparent', // Màu chữ trong suốt
  backgroundColor: 'transparent',
});