// Update ManualInputScreen.tsx
import React, { useState } from 'react';
import { View, ViewStyle, TouchableOpacity, ScrollView, TextInput, TextStyle } from 'react-native';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { AppStackScreenProps } from '@/navigators/navigationTypes'; // Giả định
import { Screen } from '@/components/Screen';
import { Text } from "@/components/Text"
import { Header } from '@/components/Header';
import IconBack from "@assets/svg/arrow-left.svg";
import IconLeftArrow from "@assets/svg/arrow-left.svg";
import IconRightArrow from "@assets/svg/arrow-right.svg";
import IconTicket from "@assets/svg/my-ticket.svg"; // Giả định icon vé
import IconClear from "@assets/svg/backspace.svg"; // Icon Xóa
import IconSearch from "@assets/svg/search.svg"; // Icon Dò ngay
import IconCheckCircle from "@assets/svg/check-circle.svg"; // Icon Dò ngay
import IconCalendar from "@assets/svg/calendar.svg"; // Icon Lịch
import IconLuckyStar from "@assets/svg/lucky-star.svg"; // Icon Lịch

// Dữ liệu mẫu (Cập nhật để hiển thị theo miền)
const dateData = [
  { day: 'T2', date: 22 },
  { day: 'T3', date: 23 },
  { day: 'T4', date: 24 },
  { day: 'T5', date: 25 },
  { day: 'T6', date: 26 },
  { day: 'T7', date: 27, isSelected: true, isHoliday: true },
  { day: 'CN', date: 28 },
];

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

export const ManualInputScreen: React.FC<AppStackScreenProps<'ManualInput'>> = function ManualInputScreen(_props) {
  const { themed, theme: { colors, spacing } } = useAppTheme();
  const [ticketCode, setTicketCode] = useState<string[]>(['', '', '', '', '', '']); // 6 ô nhập
  const [selectedCities, setSelectedCities] = useState<string>(cityData[0].data[0].name); // State for selected lottery stations
  const { navigation } = _props;

  const BackIcon = () => (
    <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.5}>
      <IconBack width={24} height={24} color={colors.text} />
    </TouchableOpacity>
  );

  // Hàm render 6 ô nhập mã (Giữ nguyên)
  const renderCodeInput = () => {
    return (
      <View style={themed($codeInputWrapper)}>
        <IconTicket width={24} height={24} color={colors.palette.neutral500} style={{ marginRight: spacing.sm }} />
        {ticketCode.map((value, index) => (
          <TextInput
            key={index}
            style={themed($codeBox)}
            maxLength={1}
            keyboardType='numeric'
            onChangeText={(text) => {
              const newCode = [...ticketCode];
              newCode[index] = text;
              setTicketCode(newCode);
            }}
            value={value}
          />
        ))}
        <TouchableOpacity onPress={() => setTicketCode(['', '', '', '', '', ''])} activeOpacity={0.7} style={themed($clearButton)}>
          <IconClear width={20} height={20} color={colors.palette.neutral500} />
        </TouchableOpacity>
      </View>
    );
  };

  // Toggle city selection
  const toggleCitySelection = (station: string) => {
    setSelectedCities(station);
  };

  // Hàm render các đài quay theo miền
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
              <Text text='Thứ Bảy, 27 tháng 7, 2024' weight='bold' size="md" style={{ color: colors.primary }} />
            </View>
            <View style={themed($dateNavRow)}>
              <TouchableOpacity style={themed($backPrevious)}>
                <IconLeftArrow width={14} height={14} color={colors.palette.neutral700} />
              </TouchableOpacity>
              <TouchableOpacity style={themed($backNext)}>
                <IconRightArrow width={14} height={14} color={colors.palette.neutral700} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Scroll Row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={themed($dateRow)}
          >
            {dateData.map((dayItem, index) => (
              <TouchableOpacity
                key={index}
                style={themed([$dateItem, dayItem.isSelected && $activeDateItem])}
                activeOpacity={0.7}
              >
                <Text
                  text={dayItem.day}
                  weight='bold'
                  size="sm"
                  style={{ color: dayItem.isSelected ? colors.surface : colors.text }}
                />
                <Text
                  text={dayItem.date.toString()}
                  weight='bold'
                  size="lg" 
                  style={{ color: dayItem.isSelected ? colors.surface : colors.text }}
                />
                {dayItem.isHoliday && dayItem.isSelected && <View style={themed($dateDot)} />}
              </TouchableOpacity>
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


// ==========================================================
// STYLES
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

// --- Date Picker Card ---
const $datePickerCard: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.surface,
  borderRadius: spacing.lg,
  padding: spacing.md,
  // Shadow style tương tự các card khác
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
  paddingHorizontal: spacing.sm,
});

const $dateNavRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
});

// Date Scroll Row (Giữ nguyên)
const $dateRow: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: 'row',
  gap: spacing.xs,
  paddingBottom: spacing.xs
});

const $dateItem: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  width: 50,
  height: 75,
  borderRadius: spacing.md,
  backgroundColor: colors.surface, // Background trắng trong card
  justifyContent: 'center',
  alignItems: 'center',
  gap: spacing.xxs,
  // Bỏ shadow cho item trong card
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

// --- Region/City Selector ---
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


// --- Code Input (Giữ nguyên) ---
const $codeCardWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.surface,
  borderRadius: spacing.lg,
  padding: spacing.md,
  flexDirection: 'column',
  //box shadow
  shadowColor: colors.palette.primary500,
  shadowOffset: { width: 5, height: 30 },
  shadowOpacity: 0.8,
  shadowRadius: 3.84,
  elevation: 5,
});

const $codeInputWrapper: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  paddingVertical: spacing.sm,
});

const $codeBox: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  width: 40,
  height: 50,
  borderWidth: 1,
  borderColor: colors.palette.neutral400,
  borderRadius: spacing.sm,
  textAlign: 'center',
  fontSize: 24,
  fontWeight: 'bold',
  marginHorizontal: spacing.xxs,
  color: colors.text,
});

// --- Footer Button (Giữ nguyên) ---
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

const $checkBadge: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  position: 'absolute',
  top: -6,
  right: 4,
  marginLeft: spacing.xs,
  backgroundColor: colors.surface,
  borderRadius: 8,
  padding: 2,
});