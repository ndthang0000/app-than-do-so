// Create LotteryScheduleScreen.tsx
import React from 'react';
import { View, ViewStyle, TouchableOpacity, ScrollView, TextStyle } from 'react-native';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { AppStackScreenProps, HomeTabScreenProps } from '@/navigators/navigationTypes';
import { Screen } from '@/components/Screen';
import { Text } from "@/components/Text"
import { Header } from '@/components/Header';
import IconBack from "@assets/svg/arrow-left.svg";
import IconDrawLottery from "@assets/svg/draw-lotery.svg"; // Icon lịch trên header

// --- DỮ LIỆU LỊCH QUAY SỐ ---
const SCHEDULE_DATA = [
  {
    regionName: 'Xổ Số Miền Nam',
    time: '16:15',
    schedule: [
      { day: 'T2', provinces: ['TP.HCM', 'Đồng Tháp', 'Cà Mau'] },
      { day: 'T3', provinces: ['Bến Tre', 'Vũng Tàu', 'Bạc Liêu'] },
      { day: 'T4', provinces: ['Đồng Nai', 'Cần Thơ', 'Sóc Trăng'] },
      { day: 'T5', provinces: ['Tây Ninh', 'An Giang', 'Bình Thuận'] },
      { day: 'T6', provinces: ['Vĩnh Long', 'Bình Dương', 'Trà Vinh'] },
      { day: 'T7', provinces: ['TP.HCM', 'Bình Phước', 'Hậu Giang'] },
      { day: 'CN', provinces: ['Tiền Giang', 'Kiên Giang', 'Đà Lạt'] },
    ]
  },
  {
    regionName: 'Xổ Số Miền Trung',
    time: '17:15',
    schedule: [
      { day: 'T2', provinces: ['TT.Huế', 'Phú Yên'] },
      { day: 'T3', provinces: ['Đắk Lắk', 'Quảng Nam'] },
      { day: 'T4', provinces: ['Đà Nẵng', 'Khánh Hòa'] },
      { day: 'T5', provinces: ['Bình Định', 'Quảng Trị', 'Quảng Bình'] },
      { day: 'T6', provinces: ['Gia Lai', 'Ninh Thuận'] },
      { day: 'T7', provinces: ['Đà Nẵng', 'Quảng Ngãi', 'Đắk Nông'] },
      { day: 'CN', provinces: ['Khánh Hòa', 'Kon Tum', 'TT-Huế'] },
    ]
  },
  {
    regionName: 'Xổ Số Miền Bắc',
    time: '18:15',
    schedule: [
      { day: 'T2', provinces: ['Hà Nội'] },
      { day: 'T3', provinces: ['Quảng Ninh'] },
      { day: 'T4', provinces: ['Bắc Ninh'] },
      { day: 'T5', provinces: ['Hà Nội'] },
      { day: 'T6', provinces: ['Hải Phòng'] },
      { day: 'T7', provinces: ['Nam Định'] },
      { day: 'CN', provinces: ['Thái Bình'] },
    ]
  }
];

export const LotteryScheduleScreen: React.FC<AppStackScreenProps<'Schedule'>> = function LotteryScheduleScreen(_props) {
  const { themed, theme: { colors, spacing } } = useAppTheme();
  const { navigation } = _props;

  // Giả định hôm nay là Thứ 4 để giống design (hoặc dùng new Date().getDay() thực tế)
  const currentDay = 'T4';

  const BackIcon = () => (
    <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.5}>
      <IconBack width={24} height={24} color={colors.text} />
    </TouchableOpacity>
  );

  const DrawLotteryIcon = () => (
    <TouchableOpacity onPress={() => { navigation.navigate('Main', { screen: 'Result', params: {} }) }} activeOpacity={0.5}>
      {/* Giả định icon calendar nhỏ trên header bên phải */}
      <IconDrawLottery width={28} height={28} color={colors.text} />
    </TouchableOpacity>
  );

  const renderScheduleRow = (item: any, index: number) => {
    const isToday = item.day === currentDay;
    const isWeekend = item.day === 'T7' || item.day === 'CN';

    // Style cho hàng (Row)
    const rowStyle = themed([
      $rowWrapper,
      isToday && $rowWrapperActive
    ]);

    // Style cho text Thứ (Day Text)
    // Màu đỏ nếu là Hôm nay HOẶC Cuối tuần
    const dayTextColor = (isToday || isWeekend) ? colors.primary : colors.palette.neutral600;

    return (
      <View key={index} style={rowStyle}>
        {/* Cột Thứ */}
        <View style={themed($dayColumn)}>
          <Text
            text={item.day}
            weight={isToday || isWeekend ? 'bold' : 'medium'}
            size="md"
            style={{ color: dayTextColor }}
          />
        </View>

        {/* Cột Danh sách Tỉnh */}
        <View style={themed($provinceListWrapper)}>
          {item.provinces.map((prov: string, idx: number) => (
            <View key={idx} style={themed($provinceChip)}>
              <Text text={prov} size="xs" weight='medium' style={{ color: colors.text }} />
            </View>
          ))}
        </View>
      </View>
    )
  };

  return (
    <>
      <Header
        title="Lịch Quay Số"
        LeftActionComponent={<BackIcon />}
        RightActionComponent={<DrawLotteryIcon />}
        safeAreaEdges={["top"]}
        backgroundColor={colors.background}
        containerStyle={{ paddingHorizontal: spacing.md, backgroundColor: colors.surface }}
        titleStyle={{ color: colors.text, fontWeight: "bold", fontSize: 18 }}
      />

      <Screen preset="scroll" contentContainerStyle={themed($screenContentContainer)}>

        {SCHEDULE_DATA.map((regionData, index) => (
          <View key={index} style={{ marginBottom: spacing.lg }}>
            {/* Header Tên Miền + Giờ */}
            <View style={themed($regionHeader)}>
              <Text text={regionData.regionName} weight='bold' size="lg" />
              <View style={themed($timeBadge)}>
                <Text text={regionData.time} weight='bold' size="xs" style={{ color: colors.error }} />
              </View>
            </View>

            {/* Card Chứa Lịch */}
            <View style={themed($scheduleCard)}>
              {regionData.schedule.map((dayItem, idx) => renderScheduleRow(dayItem, idx))}
            </View>
          </View>
        ))}

      </Screen>
    </>
  );
}

// ==========================================================
// STYLES
// ==========================================================

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
  paddingTop: spacing.md,
  paddingBottom: spacing.xxl,
});

const $regionHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: spacing.sm,
  gap: spacing.sm,
});

const $timeBadge: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.palette.primary100, // Màu nền đỏ nhạt cho badge giờ
  paddingHorizontal: spacing.xs,
  paddingVertical: 2,
  borderRadius: spacing.xs,
});

const $scheduleCard: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.surface,
  borderRadius: spacing.md,
  overflow: 'hidden', // Để background row active không bị tràn ra ngoài border radius
  // Shadow
  shadowColor: colors.palette.neutral400,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
});

const $rowWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: 'row',
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.palette.neutral200, // Line ngăn cách mờ
});

const $rowWrapperActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary100, // Nền hồng nhạt cho ngày hiện tại (như T4 trong ảnh)
  borderBottomColor: 'transparent', // Ẩn line nếu muốn clean hơn
});

const $dayColumn: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: 40,
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  paddingTop: spacing.xxs, // Căn chỉnh text thứ lên trên một chút cho cân với chip
});

const $provinceListWrapper: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: spacing.xs,
});

const $provinceChip: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
  borderRadius: spacing.xs,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  backgroundColor: colors.surface,
});