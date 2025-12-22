import React from 'react';
import { View, ViewStyle, TextStyle } from 'react-native';
import Skeleton from 'react-native-reanimated-skeleton';
import { useAppTheme } from '@/theme/context';
import { Text } from "@/components/Text";

// Icons
import IconLocation from "@assets/svg/location.svg";
import IconCalendar from "@assets/svg/calendar.svg";
import IconTicket from "@assets/svg/my-ticket.svg";
import IconButtonStart from "@assets/svg/btn-start.svg";
import { ThemedStyle } from '@/theme/types';
import { ScanResult } from '@/constants/lotteryTicket';

interface ScanInfoOverlayProps {
  isVisible: boolean;
  data: ScanResult;
}

export const ScanInfoOverlay: React.FC<ScanInfoOverlayProps> = ({ isVisible, data }) => {
  const { themed, theme: { colors } } = useAppTheme();

  if (!isVisible) return null;

  return (
    <View style={themed($absoluteWrapper)}>
      <View style={themed($container)}>
        {/* Header Section */}
        <View style={themed($headerRow)}>
          <View>
            <IconButtonStart width={24} height={24} color={colors.palette.accent400} />
          </View>
          <Text text="ĐANG TRÍCH XUẤT..." size="xs" weight="bold" style={themed($headerText)} />
        </View>
        <View style={themed($divider)} />

        {/* Main Content */}
        <View style={{ width: '100%' }}>

          {/* Đài quay */}
          <View style={themed($stationRow)}>
            <View style={themed($iconCircle)}>
              <IconLocation width={20} height={20} color={colors.palette.accent400} />
            </View>
            <View style={themed($stationRight)}>
              <Text text="ĐÀI QUAY" size="xxs" style={{ color: colors.palette.accent400 }} />
              {data.station
                ?
                <Text text={data.station || ""} size="md" weight="bold" style={{ color: colors.palette.neutral100 }} />
                :
                <Skeleton isLoading={true} layout={[{ width: 150, height: 24 }]} duration={500} />

              }
            </View>
          </View>

          {/* Ngày & Mã vé */}
          <View style={themed($detailsRow)}>
            <View style={[themed($infoBox), { borderColor: colors.palette.secondary400 }]}>
              <IconCalendar width={18} height={18} color={colors.palette.secondary400} style={{ marginRight: 8 }} />
              <View>
                <Text text="NGÀY" size="xxs" style={{ color: colors.palette.secondary400 }} />
                {
                  data.date
                    ?
                    <Text text={data.date || "---"} size="sm" weight="bold" style={{ color: colors.palette.neutral100 }} />
                    :
                    <Skeleton isLoading={true} layout={[{ width: 80, height: 20 }]} duration={500} />
                }
              </View>
            </View>

            <View style={[themed($infoBox), { borderColor: colors.tint }]}>
              <IconTicket width={18} height={18} color={colors.palette.primary300} style={{ marginRight: 8 }} />
              <View>
                <Text text="MÃ VÉ" size="xxs" style={{ color: colors.palette.primary300 }} />
                {
                  data.code
                    ?
                    <Text text={data.code || "---"} size="sm" weight="bold" style={{ color: colors.palette.neutral100 }} />
                    :
                    <Skeleton isLoading={true} layout={[{ width: 80, height: 20 }]} duration={500} />
                }
              </View>
            </View>
          </View>

        </View>
      </View>
    </View>
  );
};

// Styles giữ nguyên style "Dark Mode" sang trọng của bạn
const $absoluteWrapper: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: 'absolute',
  top: '12%',
  left: '5%',
  right: '5%',
  zIndex: 100,
  opacity: 0.8
});

const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: 'rgba(20, 20, 20, 0.7)',
  borderRadius: 24,
  padding: 16,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.1)',
});

const $headerRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: spacing.xs,
  gap: spacing.sm,
});


const $headerText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.palette.accent400,
  letterSpacing: 0.5,
});

const $divider: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  height: 1,
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  marginBottom: spacing.md,
});

const $stationRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: spacing.md,
  gap: spacing.sm,
});

const $stationRight: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  justifyContent: 'center',
});

const $iconCircle: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  justifyContent: 'center',
  alignItems: 'center',
});

const $detailsRow: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 16,
});

const $infoBox: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  borderRadius: 16,
  paddingHorizontal: 12,
  paddingVertical: 8,
  width: '48%',
  borderWidth: 1,
  borderColor: 'transparent',
  gap: 6,
});