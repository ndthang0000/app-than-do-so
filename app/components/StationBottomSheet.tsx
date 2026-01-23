import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Text } from '@/components/Text';
import { useAppTheme } from '@/theme/context';
import { ThemedStyle } from '@/theme/types';
import { LotteryScheduleCard } from './ResultTicket/LotteryScheduleCard';
import { LOTTERY_SCHEDULE } from '@/constants/lotterySchedule';

interface StationBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  stations: string[];
  selectedStation: string;
  onSelectStation: (station: string) => void;
}

export const StationBottomSheet: React.FC<StationBottomSheetProps> = ({
  visible,
  onClose,
  stations,
  selectedStation,
  onSelectStation,
}) => {
  const { themed, theme: { } } = useAppTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => [600], []);

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

  const handleStationPress = useCallback((station: string) => {
    onSelectStation(station);
    bottomSheetRef.current?.close();
  }, [onSelectStation]);

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
      {/* Header */}
      <View style={themed($header)}>
        <Text text="Chọn đài" weight="bold" size="xl" />
      </View>

      {/* Content */}
      <BottomSheetScrollView
        style={themed($scrollView)}
        contentContainerStyle={themed($contentContainer)}
        showsVerticalScrollIndicator={false}
      >
        {LOTTERY_SCHEDULE.map((regionData, index) => (
          <LotteryScheduleCard
            key={index}
            regionData={regionData}
            onStationPress={handleStationPress}
          />
        ))}
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const $bottomSheetBackground: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
});

const $handleIndicator: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral300,
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