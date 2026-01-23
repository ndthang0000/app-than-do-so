import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { View, ViewStyle, ScrollView } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';
import { LOTTERY_SCHEDULE } from '@/constants/lotterySchedule';
import { LotteryScheduleCard } from '@/components/ResultTicket/LotteryScheduleCard';

interface LotteryScheduleBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onStationPress?: (station: string, region: string) => void;
}

export const LotteryScheduleBottomSheet: React.FC<LotteryScheduleBottomSheetProps> = ({
  visible,
  onClose,
  onStationPress,
}) => {
  const { themed, theme: { colors, spacing } } = useAppTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ['80%'], []);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const handleStationPress = useCallback((station: string, region: string) => {
    onStationPress?.(station, region);
    bottomSheetRef.current?.close();
  }, [onStationPress]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      backgroundStyle={themed($bottomSheetBackground)}
      handleIndicatorStyle={themed($handleIndicator)}
    >
      <BottomSheetView style={themed($container)}>
        {/* Header */}
        <View style={themed($header)}>
          <Text text="Lịch Quay Số" weight="bold" size="xl" />
        </View>

        {/* Schedule Content */}
        <ScrollView
          style={themed($scrollView)}
          showsVerticalScrollIndicator={false}
        >
          <View style={themed($contentContainer)}>
            {LOTTERY_SCHEDULE.map((regionData, index) => (
              <LotteryScheduleCard
                key={index}
                regionData={regionData}
                onStationPress={handleStationPress}
              />
            ))}
          </View>
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
};

// ==========================================================
// STYLES
// ==========================================================

const $bottomSheetBackground: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
});

const $handleIndicator: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral300,
});

const $container: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
});

const $header: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
});

const $scrollView: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
});

const $contentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
  paddingTop: spacing.sm,
  paddingBottom: spacing.xxl,
});
