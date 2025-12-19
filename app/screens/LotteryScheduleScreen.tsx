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
import { LOTTERY_SCHEDULE } from '@/constants/lotterySchedule';
import { WEEKDAY_LABEL_MAP } from '@/constants/lotteryTicket';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

export const LotteryScheduleScreen: React.FC<AppStackScreenProps<'Schedule'>> = function LotteryScheduleScreen(_props) {
  const { themed, theme: { colors, spacing } } = useAppTheme();
  const { navigation } = _props;
  const fullDayName = format(new Date(), 'EEEE', { locale: enUS }).toLowerCase();

  // Giả định hôm nay là Thứ 4 để giống design (hoặc dùng new Date().getDay() thực tế)

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
    const isToday = item.date === fullDayName;
    const isWeekend = item.date === 'sunday' || item.date === 'saturday';

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
            text={WEEKDAY_LABEL_MAP[item.date as keyof typeof WEEKDAY_LABEL_MAP]}
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

        {LOTTERY_SCHEDULE.map((regionData, index) => (
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
  paddingVertical: spacing.xs,
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