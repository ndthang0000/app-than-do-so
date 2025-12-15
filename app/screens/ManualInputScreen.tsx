// Create ManualInputScreen.tsx
import React, { useState } from 'react';
import { View, ViewStyle, TouchableOpacity, ScrollView, TextInput, TextStyle } from 'react-native';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { AppStackScreenProps } from '@/navigators/navigationTypes'; // Giả định
import { Screen } from '@/components/Screen';
import { Text } from "@/components/Text"
import { Header } from '@/components/Header';
import IconBack from "@assets/svg/arrow-left.svg";
import IconDownArrow from "@assets/svg/arrow-left.svg"; // Giữ lại tên biến của bạn
import IconTicket from "@assets/svg/my-ticket.svg"; // Giả định icon vé
import IconClear from "@assets/svg/find.svg"; // Icon Xóa (Giả định)
import IconSearch from "@assets/svg/find.svg"; // Icon Dò ngay (Giả định)

// Dữ liệu mẫu
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
  { code: 'HCM', name: 'TP. Hồ Chí Minh', day: 'THỨ 7', isSelected: true },
  { code: 'LA', name: 'Long An' },
  { code: 'BP', name: 'Bình Phước' },
  { code: 'HG', name: 'Hậu Giang' },
  { code: 'VT', name: 'Vũng Tàu' },
];

export const ManualInputScreen: React.FC<AppStackScreenProps<'ManualInput'>> = function ManualInputScreen(_props) {
  const { themed, theme: { colors, spacing } } = useAppTheme();
  const [ticketCode, setTicketCode] = useState<string[]>(['', '', '', '', '', '']); // 6 ô nhập
  const { navigation } = _props;

  const BackIcon = () => (
    <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.5}>
      <IconBack width={24} height={24} color={colors.text} />
    </TouchableOpacity>
  );

  // Hàm render 6 ô nhập mã
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

              // Auto focus next input (Logic đơn giản)
              if (text && index < 5) {
                // Logic focus vào ô tiếp theo cần sử dụng useRef
              }
            }}
            value={value}
          />
        ))}
        <TouchableOpacity onPress={() => setTicketCode(['', '', '', '', '', ''])} activeOpacity={0.7}>
          <IconClear width={20} height={20} color={colors.palette.neutral500} style={{ marginLeft: spacing.sm }} />
        </TouchableOpacity>
      </View>
    );
  };

  // Hàm render các đài quay
  const renderCityChips = () => (
    <View style={themed($cityChipRow)}>
      {cityData.map(city => {
        const isSelected = city.isSelected;
        return (
          <TouchableOpacity
            key={city.code}
            style={themed([$cityChip, isSelected && $activeCityChip])}
            activeOpacity={0.7}
          >
            <View style={themed([$cityChipCode, { backgroundColor: isSelected ? colors.surface : colors.palette.neutral300 }])}>
              <Text text={city.code} weight='bold' size="sm" style={{ color: isSelected ? colors.primary : colors.text }} />
            </View>
            <View style={themed($cityChipTextWrapper)}>
              <Text text={city.name} weight='semiBold' size="sm" />
              {isSelected && <Text text={city.day} weight='light' size="xs" style={{ color: colors.palette.neutral600 }} />}
            </View>
            {isSelected && <Text style={{ marginLeft: spacing.xxs }}>✅</Text>}
          </TouchableOpacity>
        );
      })}
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

        {/* 1. Ngày mở thưởng */}
        <View style={themed($sectionHeader)}>
          <Text text='Ngày mở thưởng' weight='semiBold' size="md" />
          <TouchableOpacity style={themed($monthDropdown)} activeOpacity={0.7}>
            <Text text='Tháng 7, 2024' weight='semiBold' size="sm" style={{ color: colors.primary }} />
            <IconDownArrow width={10} height={10} color={colors.primary} style={{ marginLeft: spacing.xs, transform: [{ rotate: '-90deg' }] }} />
          </TouchableOpacity>
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
                style={{ color: dayItem.isSelected ? colors.surface : dayItem.isHoliday ? colors.primary : colors.text }}
              />
              {dayItem.isHoliday && dayItem.isSelected && <View style={themed($dateDot)} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 2. Đài quay thưởng */}
        <View style={themed($sectionHeader)}>
          <Text text='Đài quay thưởng' weight='semiBold' size="md" />
          <Text text='Miền Nam' weight='semiBold' size="sm" style={{ color: colors.palette.neutral500 }} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.md }}
        >
          {renderCityChips()}
        </ScrollView>

        {/* 3. Mã dự thưởng */}
        <View style={themed($sectionHeader)}>
          <Text text='Mã dự thưởng' weight='semiBold' size="md" />
        </View>

        <View style={themed($codeCardWrapper)}>
          {renderCodeInput()}
          <Text text='Nhập đủ 6 số trên vé' weight='light' size="xs" style={{ color: colors.palette.neutral500, alignSelf: 'flex-start', marginLeft: spacing.md }} />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.xs }}>
            <TouchableOpacity activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text text='May mắn' weight='semiBold' size="sm" style={{ color: colors.primary, marginRight: spacing.xxs }} />
              <IconBack width={12} height={12} color={colors.primary} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
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
  paddingBottom: spacing.xxxl * 2, // Để chừa chỗ cho floating button
});

const $sectionHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: spacing.md,
  marginBottom: spacing.sm,
});

const $monthDropdown: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  alignItems: 'center',
});

// --- Date Selector ---
const $dateRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  gap: spacing.xs,
  paddingBottom: spacing.md,
});

const $dateItem: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  width: 50,
  height: 75,
  borderRadius: spacing.md,
  backgroundColor: colors.surface,
  justifyContent: 'center',
  alignItems: 'center',
  gap: spacing.xxs,
  // Box shadow tương tự HomeScreen
  shadowColor: colors.palette.neutral400,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 2,
  elevation: 3,
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

// --- City Chip Selector ---
const $cityChipRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  flexWrap: 'wrap', // Cho phép xuống dòng nếu cần
  gap: spacing.sm,
});

const $cityChip: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  paddingRight: spacing.sm,
  borderRadius: spacing.xxl,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
});

const $activeCityChip: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.primary,
});

const $cityChipCode: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.xxs,
  paddingHorizontal: spacing.sm,
  borderRadius: spacing.xxl,
  marginRight: spacing.xs,
});

const $cityChipTextWrapper: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'column',
  alignItems: 'flex-start',
  paddingVertical: spacing.xs,
});


// --- Code Input ---
const $codeCardWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.surface,
  borderRadius: spacing.lg,
  padding: spacing.md,
  flexDirection: 'column',
  // Shadow style tương tự HomeScreen
  shadowColor: colors.palette.neutral400,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
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

// --- Footer Button ---
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
  // Shadow cho Floating button
  shadowColor: colors.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 4.65,
  elevation: 8,
});