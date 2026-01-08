import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, ViewStyle, TextStyle, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { AppStackScreenProps } from '@/navigators/navigationTypes';
import { Screen } from '@/components/Screen';
import { Text } from "@/components/Text";
import { Header } from '@/components/Header';
import IconBell from "@assets/svg/bell-active.svg";
import IconCheckCircle from "@assets/svg/check-circle.svg";
import { api } from '@/services/api';
import { useAppSelector } from '@/store';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { LOTTERY_SCHEDULE } from '@/constants/lotterySchedule';
import { parse, differenceInSeconds, startOfDay, add } from 'date-fns';

export const TicketDetailScreen: React.FC<AppStackScreenProps<'TicketDetail'>> = function TicketDetailScreen(_props) {
  const { navigation, route } = _props;
  const { ticketId, source } = route.params;
  const { themed, theme: { colors, spacing } } = useAppTheme();

  // Bottom Sheet Ref
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['40%'], []);

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });

  const ticketFromStore = useAppSelector((state) =>
    state.ticket.tickets.find((t) => t._id === ticketId)
  );

  useEffect(() => {
    if (ticketFromStore) {
      setTicket(ticketFromStore);
    } else {
      loadTicketFromServer();
    }
  }, [ticketId, ticketFromStore]);

  // Logic Countdown
  useEffect(() => {
    if (ticket?.winStatus !== "PENDING") return;

    const timer = setInterval(() => {
      // Tìm lịch mở thưởng của đài này
      const regionData = LOTTERY_SCHEDULE.find(r => r.region === ticket.region);
      const drawTimeStr = regionData?.time || "16:15"; // Mặc định 16:15 nếu ko tìm thấy

      const today = startOfDay(new Date());
      const [hours, minutes] = drawTimeStr.split(':').map(Number);
      const drawDate = add(today, { hours, minutes });

      const diff = differenceInSeconds(drawDate, new Date());

      if (diff <= 0) {
        setTimeLeft({ hours: '00', minutes: '00', seconds: '00' });
        clearInterval(timer);
      } else {
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        setTimeLeft({
          hours: h.toString().padStart(2, '0'),
          minutes: m.toString().padStart(2, '0'),
          seconds: s.toString().padStart(2, '0')
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [ticket]);

  const loadTicketFromServer = async () => {
    setLoading(true);
    try {
      const response = await api.getTicketById(ticketId);
      if (response.kind === "ok") setTicket(response.data.data);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNoti = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  useEffect(() => {
    // after 500ms open the bottom sheet
    const timer = setTimeout(() => {
      bottomSheetRef.current?.expand();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading || !ticket) {
    return (
      <View style={themed($loadingContainer)}>
        <ActivityIndicator size="large" color={colors.palette.primary500} />
      </View>
    );
  }

  const isPending = ticket.winStatus === "PENDING";
  const isWin = ticket.winStatus === "WIN";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header
        title={source === 'scan' ? "Dò số" : "Chi tiết vé"}
        leftIcon="back"
        onLeftPress={() => navigation.goBack()}
        backgroundColor="transparent"
        titleStyle={themed($headerTitle)}
      />
      <Screen preset="scroll" style={themed($container)}>
        <View style={themed($mainContent)}>
          <View style={themed($ticketCard)}>
            <View style={themed($ticketBody)}>
              <Text text={ticket.station} style={themed($stationText)} size='xxl' />
              <Text text={ticket.date} weight="bold" style={themed($whiteText)} size='lg' />
              <Text text={ticket.code} style={themed($codeText)} size='xxl' />
            </View>
          </View>

          {/* HIỂN THỊ KẾ T QUẢ KHI ĐÃ CÓ (WIN/LOSE) */}
          {!isPending && (
            <View style={themed($resultStatusWrapper)}>
              <View style={[themed($statusBadge), { backgroundColor: isWin ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)' }]}>
                <Text
                  text={isWin ? "TRÚNG THƯỞNG" : "KHÔNG TRÚNG"}
                  weight="bold"
                  style={{ color: isWin ? '#22C55E' : '#EF4444' }}
                />
              </View>
              {isWin && (
                <Text text={`Giải: ${ticket.prizeName || 'Đặc Biệt'}`} style={themed($whiteText)} />
              )}
            </View>
          )}

          {isPending && (
            <View style={themed($countDownSection)}>
              <Text text="THỜI GIAN MỞ THƯỞNG CÒN" size="xs" weight="bold" style={themed($dimText)} />
              <View style={themed($timerRow)}>
                <TimerBox value={timeLeft.hours} label="Giờ" />
                <Text text=":" style={themed($separator)} />
                <TimerBox value={timeLeft.minutes} label="Phút" />
                <Text text=":" style={themed($separator)} />
                <TimerBox value={timeLeft.seconds} label="Giây" />
              </View>
            </View>
          )}

          <TouchableOpacity style={themed($buttonAction)} activeOpacity={0.8} onPress={handleOpenNoti}>
            <Text text="Nhận thông báo kết quả" weight="bold" style={themed($buttonText)} />
          </TouchableOpacity>
        </View>
      </Screen>

      {/* BOTTOM SHEET CHO THÔNG BÁO */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: '#2D2D1C', borderRadius: 40 }}
        handleIndicatorStyle={{ backgroundColor: colors.palette.neutral400 }}
      >
        <BottomSheetView style={themed($bottomSheetContent)}>
          <View style={themed($notiIconWrapperLarge)}>
            <IconBell width={40} height={40} color={colors.palette.primary400} />
          </View>
          <Text text="Bật thông báo kết quả?" weight="bold" size="lg" style={themed($whiteText)} />
          <Text
            text="Chúng tôi sẽ gửi thông báo ngay khi có kết quả xổ số để bạn không bỏ lỡ vận may."
            style={[themed($dimText), { textAlign: 'center', marginTop: spacing.sm }]}
          />
          <TouchableOpacity style={[themed($buttonAction), { width: '100%', marginTop: spacing.lg }]}>
            <IconCheckCircle width={20} height={20} color={colors.text} style={{ marginRight: 8 }} />
            <Text text="Nhận thông báo" weight="bold" style={themed($buttonText)} />
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};

const TimerBox = ({ value, label }: { value: string, label: string }) => {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={$timerBoxStyle}>
        <Text text={value} size="xl" weight="bold" style={{ color: '#FFF' }} />
      </View>
      <Text text={label} size="xxs" style={{ color: '#9CA3AF', marginTop: 8 }} />
    </View>
  )
}

/** Styles bổ sung */
const $resultStatusWrapper: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: 'center',
  marginTop: spacing.lg,
  gap: spacing.xs
})

const $statusBadge: ViewStyle = {
  paddingHorizontal: 20,
  paddingVertical: 8,
  borderRadius: 20,
}

const $bottomSheetContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
  alignItems: 'center',
})

const $notiIconWrapperLarge: ViewStyle = {
  width: 80,
  height: 80,
  borderRadius: 40,
  backgroundColor: 'rgba(251, 191, 36, 0.1)',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 16
};

// Giữ các styles cũ của bạn...
const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background,
});
const $headerTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 18,
});
const $mainContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
});
const $ticketCard: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  backgroundColor: '#2D2D1C',
  borderRadius: 24,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.lg,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
});
const $ticketBody: ThemedStyle<ViewStyle> = () => ({
  alignItems: 'center',
});
const $codeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontWeight: 'bold',
  color: colors.palette.accent500,
  fontSize: 48, // Tăng size cho nổi bật
});
const $stationText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontWeight: 'bold',
  color: '#FFF',
});
const $whiteText: TextStyle = { color: '#FFF' };
const $dimText: TextStyle = { color: '#9CA3AF' };
const $countDownSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: 'center',
  marginTop: 40,
});
const $timerRow: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 20,
  gap: 12,
};
const $timerBoxStyle: ViewStyle = {
  backgroundColor: '#2D2D1C',
  width: 70,
  height: 70,
  borderRadius: 16,
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.05)'
}
const $separator: TextStyle = { color: '#374151', fontSize: 24, marginBottom: 25 };

const $buttonAction: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  backgroundColor: '#FBBF24',
  height: 56,
  borderRadius: 28,
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: 24,
  paddingHorizontal: spacing.lg,
  flexDirection: 'row',
  marginBottom: 'auto'
});
const $buttonText: TextStyle = { color: '#1A1A10', fontSize: 16 };
const $loadingContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#1A1A10",
})