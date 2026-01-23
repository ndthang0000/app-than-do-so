import React from 'react';
import { View, ViewStyle, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { Text } from "@/components/Text"
import { WEEKDAY_LABEL_MAP } from '@/constants/lotteryTicket';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

interface LotteryScheduleCardProps {
  regionData: {
    region: string;
    regionName: string;
    time: string;
    schedule: Array<{
      date: string;
      provinces: string[];
    }>;
  };
  onStationPress?: (station: string, region: string) => void;
}

export const LotteryScheduleCard: React.FC<LotteryScheduleCardProps> = ({ regionData, onStationPress }) => {
  const { themed, theme: { colors, spacing } } = useAppTheme();
  const fullDayName = format(new Date(), 'EEEE', { locale: enUS }).toLowerCase();

  const renderScheduleRow = (item: any, index: string) => {
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
            <TouchableOpacity
              key={idx}
              style={themed($provinceChip)}
              activeOpacity={0.7}
              onPress={() => onStationPress?.(prov, regionData.region)}
            >
              <Text text={prov} size="xs" weight='medium' style={{ color: colors.text }} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )
  };

  return (
    <View style={{ marginBottom: spacing.sm }}>
      {/* Header Tên Miền + Giờ */}
      <View style={themed($regionHeader)}>
        <Text text={regionData.regionName} weight='bold' size="lg" />
        <View style={themed($timeBadge)}>
          <Text text={regionData.time} weight='bold' size="xs" style={{ color: colors.error }} />
        </View>
      </View>

      {/* Card Chứa Lịch */}
      <View style={themed($scheduleCard)}>
        {regionData.schedule.map((dayItem, idx) => renderScheduleRow(dayItem, `${regionData.region}-${dayItem.date}-${idx}`))}
      </View>
    </View>
  );
};

// ==========================================================
// STYLES
// ==========================================================

const $regionHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.sm,
});

const $timeBadge: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.palette.primary100,
  paddingHorizontal: spacing.xs,
  paddingVertical: 2,
  borderRadius: spacing.xs,
});

const $scheduleCard: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.surface,
  borderRadius: spacing.md,
  overflow: 'hidden',
  shadowColor: colors.palette.neutral400,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
});

const $rowWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: 'row',
  paddingVertical: 5,
  paddingHorizontal: spacing.xs,
  borderBottomWidth: 1,
  borderBottomColor: colors.palette.neutral200,
});

const $rowWrapperActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary100,
  borderBottomColor: 'transparent',
});

const $dayColumn: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: 40,
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  paddingTop: spacing.xxs,
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
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
  backgroundColor: colors.surface,
});
