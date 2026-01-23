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
import IconPayment from "@assets/svg/payment.svg";
import { api } from '@/services/api';
import { useAppSelector, useAppDispatch } from '@/store'; // Thêm dispatch để sync thông báo
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { LOTTERY_SCHEDULE } from '@/constants/lotterySchedule';
import { differenceInSeconds, startOfDay, add, parse } from 'date-fns';
import { Ticket } from '@/store/slices/ticketSlice';
import { formatVietnameseMoney } from '@/utils/formatMoney';
import ConfettiCannon from 'react-native-confetti-cannon';
import { syncNotificationSettings } from '@/services/notificationService';
import { LotteryResultTable } from '@/components/ResultTicket/LotteryResultTable';
import { LotteryResult, processSingleProvinceLoto } from '@/store/slices/lotterySlice';

export const TicketDetailScreen: React.FC<AppStackScreenProps<'TicketDetail'>> = function TicketDetailScreen(_props) {
  const { navigation, route } = _props;
  const { ticketId, source } = route.params;
  const { themed, theme: { colors, spacing } } = useAppTheme();
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const isSubscribed = user?.settingNotifications?.ticketResult;

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['40%'], []);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });

  const ticketFromStore = useAppSelector((state) =>
    state.ticket.tickets.find((t) => t._id === ticketId)
  );

  const provinces: LotteryResult = useMemo(() => {
    const data = {
      station: ticket?.station || '',
      prizes: ticket?.prizes || {},
      region: ticket?.region || 'north',
      _id: ticket?._id || '',
      date: ticket?.date || '',
      isFinished: true,
      type: '',
      updatedAt: ticket?.updatedAt || '',
    }
    return processSingleProvinceLoto(data);
  }, [ticket]);

  const handleConfirmSubscription = async () => {
    // Hiển thị loading nếu muốn (tùy chọn)

    const result = await syncNotificationSettings(dispatch, user?.settingNotifications, {
      ticketResult: true // Bật trạng thái nhận thông báo vé
    });

    if (result.success) {
      bottomSheetRef.current?.close();
      // Toast thông báo thành công
    } else {
      // Xử lý lỗi (ví dụ: người dùng từ chối quyền)
      alert("Không thể bật thông báo. Vui lòng kiểm tra cài đặt thiết bị.");
    }
  };

  useEffect(() => {
    if (ticketFromStore) {
      setTicket(ticketFromStore);
    } else {
      loadTicketFromServer();
    }
  }, [ticketId, ticketFromStore]);

  // Logic Countdown Chính Xác
  useEffect(() => {
    if (ticket?.winStatus !== "PENDING" || !ticket?.date) return;

    const timer = setInterval(() => {
      const regionData = LOTTERY_SCHEDULE.find(r => r.region === ticket.region);
      const drawTimeStr = regionData?.time || "16:15";

      // Parse ngày từ ticket.date (dd-MM-yyyy)
      const ticketDateStart = startOfDay(parse(ticket.date, 'dd-MM-yyyy', new Date()));
      const [hours, minutes] = drawTimeStr.split(':').map(Number);

      // Ngày mở thưởng = Ngày trên vé + Giờ mở thưởng của đài
      const drawDate = add(ticketDateStart, { hours, minutes });

      const now = new Date();
      const diff = differenceInSeconds(drawDate, now);

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
    if (isSubscribed) return; // Nếu đã đăng ký rồi thì không mở sheet nữa
    bottomSheetRef.current?.expand();
  }, [isSubscribed]);





  const isPending = ticket?.winStatus === "PENDING";
  const isWin = ticket?.winStatus === "WIN";

  useEffect(() => {
    // Tự động mở sheet nếu chưa đăng ký nhận tin
    if (!isSubscribed && ticket && isPending) {
      const timer = setTimeout(() => {
        bottomSheetRef.current?.expand();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isSubscribed, ticket, isPending]);

  if (loading || !ticket) {
    return (
      <View style={themed($loadingContainer)}>
        <ActivityIndicator size="large" color={colors.palette.primary500} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {isWin && (
        <ConfettiCannon
          count={300}           // Số lượng mảnh pháo
          origin={{ x: -10, y: 0 }} // Vị trí bắt đầu (thường là đỉnh màn hình)
          autoStart={true}
          fadeOut={true}        // Tự động mờ dần
          fallSpeed={1000}      // Tốc độ rơi
          colors={['#FBBF24', '#22C55E', '#FFFFFF', '#FF0000']} // Màu sắc pháo hoa
        />
      )}
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

          {/* KHU VỰC HIỂN THỊ TRẠNG THÁI ĐỒNG BỘ */}
          <View style={themed($resultStatusWrapper)}>
            {isPending ? (
              <View style={[themed($statusBadge), { backgroundColor: 'rgba(251, 191, 36, 0.1)', borderColor: '#FBBF24', borderWidth: 1 }]}>
                <Text text="ĐANG CHỜ QUAY" weight="bold" style={{ color: '#FBBF24' }} />
              </View>
            ) : (
              <>
                <View style={[themed($statusBadge), { backgroundColor: isWin ? 'rgba(34, 197, 94, 0.2)' : 'rgba(223, 106, 106, 0.2)' }]}>
                  <Text
                    text={isWin ? `🏆 TRÚNG THƯỞNG: ${ticket.winDetails.join(',')}` : "😔KHÔNG TRÚNG"}
                    weight="bold"
                    style={{ color: isWin ? '#22C55E' : colors.palette.neutral500 }}
                  />
                </View>
                  {isWin && (
                    <View style={themed($moneyWrapper)}>
                      <View style={themed($moneyIconWrapper)}>
                        <IconPayment width={30} height={30} color={'#eab307'} />
                      </View>
                      <View>
                        <Text
                          text="Giá trị giải thưởng"
                          style={{ color: colors.textDim, marginTop: 4 }}
                        />
                        <Text
                          text={`${formatVietnameseMoney(ticket.prizeMoney) || 'Đặc Biệt'}`}
                          style={{ color: colors.text }}
                          size='xl'
                          weight='bold'
                        />
                      </View>
                    </View>
                )}
              </>
            )}
          </View>

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

          {/* NÚT BẤM THAY ĐỔI THEO STATE USER */}
          {
            isPending && (
              <TouchableOpacity
                style={[themed($buttonAction), isSubscribed && { backgroundColor: '#2D2D1C', borderWidth: 1, borderColor: colors.palette.neutral600 }]}
                activeOpacity={0.8}
                onPress={handleOpenNoti}
              >
                {(isSubscribed ? (
                  <>
                    <IconCheckCircle width={20} height={20} color={colors.palette.primary400} style={{ marginRight: 8 }} />
                    <Text text="Đã đăng ký nhận kết quả" weight="bold" style={[themed($buttonText), { color: colors.palette.primary400 }]} />
                  </>
                ) : (
                  <>
                    <IconBell width={20} height={20} color={colors.palette.neutral900} style={{ marginRight: 8 }} />
                    <Text text="Nhận thông báo kết quả" weight="bold" style={themed($buttonText)} />
                  </>
                ))}
              </TouchableOpacity>
            )
          }
          <View style={{ marginTop: spacing.md }}>
            <LotteryResultTable
              region={ticket.region}
              isLive={false}
              station={ticket.station}
              date={ticket.date}
              provinces={[provinces]}
              winDetails={ticket.winDetails as any}
            />
          </View>
        </View>
      </Screen>

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
          <TouchableOpacity
            style={[themed($buttonAction), { width: '100%', marginTop: spacing.lg }]}
            onPress={handleConfirmSubscription}
          >
            <Text text="Xác nhận nhận tin" weight="bold" style={themed($buttonText)} />
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
      {isWin && (
        <>
          <ConfettiCannon count={100} origin={{ x: 0, y: 600 }} explosionSpeed={350} />
          <ConfettiCannon count={100} origin={{ x: 400, y: 600 }} explosionSpeed={350} />
        </>
      )}
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
  marginTop: spacing.md,
  gap: spacing.xs,
})

const $statusBadge: ViewStyle = {
  paddingHorizontal: 20,
  paddingVertical: 8,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
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
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
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
  flexDirection: 'row', // Quan trọng để icon và text nằm ngang
});
const $buttonText: TextStyle = { color: '#1A1A10', fontSize: 16 };
const $loadingContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#1A1A10",
})

const $moneyWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: spacing.xs,
  gap: spacing.md,
  width: '100%',
  backgroundColor: colors.surface,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  borderRadius: 20,
  //boxShadow
  shadowColor: "#afa1a1ff",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
});

const $moneyIconWrapper: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  justifyContent: 'center',
  alignItems: 'center',
  padding: spacing.md,
  backgroundColor: '#fdf7e6',
  borderRadius: 16,
});
