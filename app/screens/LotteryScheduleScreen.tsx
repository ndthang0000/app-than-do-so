// Create LotteryScheduleScreen.tsx
import React from 'react';
import { ViewStyle, TouchableOpacity } from 'react-native';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { AppStackScreenProps } from '@/navigators/navigationTypes';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import IconBack from "@assets/svg/arrow-left.svg";
import IconDrawLottery from "@assets/svg/draw-lottery.svg";
import { LOTTERY_SCHEDULE } from '@/constants/lotterySchedule';
import { LotteryScheduleCard } from '@/components/ResultTicket/LotteryScheduleCard';

export const LotteryScheduleScreen: React.FC<AppStackScreenProps<'Schedule'>> = function LotteryScheduleScreen(_props) {
  const { themed, theme: { colors, spacing } } = useAppTheme();
  const { navigation } = _props;

  const BackIcon = () => (
    <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.5} style={{ padding: 8 }}>
      <IconBack width={22} height={22} color={colors.text} />
    </TouchableOpacity>
  );

  const DrawLotteryIcon = () => (
    <TouchableOpacity onPress={() => { navigation.navigate('Main', { screen: 'Result', params: {} }) }} activeOpacity={0.5}>
      <IconDrawLottery width={28} height={28} color={colors.text} />
    </TouchableOpacity>
  );

  const handleStationPress = (station: string, region: string) => {
    navigation.navigate('StationDetail', { station, region });
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
        style={{ height: 46 }}
      />

      <Screen preset="scroll" contentContainerStyle={themed($screenContentContainer)}>
        {LOTTERY_SCHEDULE.map((regionData, index) => (
          <LotteryScheduleCard
            key={index}
            regionData={regionData}
            onStationPress={handleStationPress}
          />
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
