// Update ManualInputScreen.tsx (Tối ưu hóa Re-render xuống 2 lần)
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, ViewStyle, TouchableOpacity, TextInput, TextStyle, ScrollView } from 'react-native';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { AppStackScreenProps } from '@/navigators/navigationTypes';
import { Screen } from '@/components/Screen';
import { Text } from "@/components/Text"
import { Header } from '@/components/Header';
import IconBack from "@assets/svg/arrow-left.svg";
import IconTicket from "@assets/svg/my-ticket.svg";
import IconClear from "@assets/svg/backspace.svg";
import IconSearch from "@assets/svg/search.svg";
import IconCheckCircle from "@assets/svg/check-circle.svg";
import LinearGradient from "react-native-linear-gradient"
import { HorizontalDatePicker } from '@/components/ResultTicket/HorizontalDatePicker';
import { LOTTERY_SCHEDULE } from '@/constants/lotterySchedule';
import { api } from '@/services/api';
import { format } from 'date-fns';
import Toast from 'react-native-toast-message';


const getDayKey = (date: Date): string => {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return days[date.getDay()];
};



export const ManualInputScreen: React.FC<AppStackScreenProps<'ManualInput'>> = function ManualInputScreen(_props) {
  const { themed, theme: { colors, spacing } } = useAppTheme();
  const [ticketCode, setTicketCode] = useState<string>('');

  const inputRef = useRef<TextInput>(null);
  const { navigation } = _props;

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCities, setSelectedCities] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTextChange = (text: string) => {
    const numbersOnly = text.replace(/[^0-9]/g, '');
    setTicketCode(numbersOnly);
    if (numbersOnly.length === 6) {
      inputRef.current?.blur();
    }
  };

  const handleCheckTicket = async () => {
    if (ticketCode.length !== 6) return;

    setLoading(true);
    try {
      // Tìm regionKey dựa trên đài đang chọn
      const selectedRegion = currentCityData.find(r =>
        r.data.some((p: any) => p.name === selectedCities)
      );

      const payload = {
        region: selectedRegion?.regionKey || "south",
        date: format(selectedDate, "dd-MM-yyyy"),
        station: selectedCities,
        code: ticketCode,
        specialCode: "", // Ví dụ lấy 2 số đầu làm mã đặc biệt
        durationScan: 0
      };

      const response = await api.checkAndSave(payload);

      if (response.kind === "ok") {
        if (response.data.data.ticket._id) {
          navigation.navigate("TicketDetail", { ticketId: response.data.data.ticket._id });
        }
        else {
          Toast.show({
            type: 'error',
            text1: 'Lỗi kiểm tra vé',
            text2: 'Vui lòng thử lại sau'
          });
        }
      } else {
        throw new Error("Không tìm thấy kết quả");
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi kiểm tra vé',
        text2: error.message || 'Vui lòng thử lại sau'
      });
    } finally {
      setLoading(false);
    }
  };

  // Memoized Data
  const currentCityData = useMemo(() => {
    const dayKey = getDayKey(selectedDate);
    return LOTTERY_SCHEDULE.map(item => {
      const dailySchedule = item.schedule.find(s => s.date === dayKey);
      let regionColor: string = colors.palette.primary500;
      let regionDisplayName = 'Miền Nam';
      let regionKey = 'south';

      if (item.region === 'central') {
        regionColor = '#F59E0B';
        regionDisplayName = 'Miền Trung';
        regionKey = 'central';
      } else if (item.region === 'north') {
        regionColor = '#10B981';
        regionDisplayName = 'Miền Bắc';
        regionKey = 'north';
      }

      return {
        region: regionDisplayName,
        regionKey,
        color: regionColor,
        data: dailySchedule ? dailySchedule.provinces.map(p => ({ code: p, name: p })) : []
      };
    }).filter(region => region.data.length > 0);
  }, [selectedDate, colors]);

  // Effects
  useEffect(() => {
    if (currentCityData.length > 0 && currentCityData[0].data.length > 0) {
      setSelectedCities(currentCityData[0].data[0].name);
    }
  }, [currentCityData]);

  const toggleCitySelection = (station: string) => {
    setSelectedCities(station);
  };

  const handleClearInput = () => {
    setTicketCode('');
  };

  useEffect(() => {
    if (currentCityData.length > 0 && currentCityData[0].data.length > 0) {
      setSelectedCities(currentCityData[0].data[0].name);
    }
  }, [currentCityData]);

  const renderCityChips = (regionData: any) => (
    <View key={regionData.region} style={themed($regionContainer)}>
      {/* Header Miền: Thu nhỏ lại để tiết kiệm height */}
      <View style={themed($regionHeaderCompact)}>
        <View style={[themed($regionIndicatorSmall), { backgroundColor: regionData.color }]} />
        <Text text={regionData.region} weight='bold' size="xs" style={{ color: colors.textDim }} />
        <View style={themed($lineSeparator)} />
      </View>

      {/* Danh sách đài: Cuộn ngang */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={themed($scrollCityContent)}
      >
        {regionData.data.map((city: any) => {
          const isSelected = selectedCities === city.name;
          return (
            <TouchableOpacity
              key={city.code}
              style={themed([$cityChipHorizontal, isSelected && $activeCityChip])}
              activeOpacity={0.7}
              onPress={() => toggleCitySelection(city.name)}
            >
              <Text
                text={city.name}
                weight='semiBold'
                size="sm"
                style={{ color: isSelected ? colors.primary : colors.text }}
              />
              {isSelected && (
                <View style={themed($checkBadgeSmall)}>
                  <IconCheckCircle width={12} height={12} color={colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const validInput = ticketCode.length === 6;

  return (
    <>
      <Header
        title="Dò vé thủ công"
        LeftActionComponent={<TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}><IconBack width={20} height={20} color={colors.text} /></TouchableOpacity>}
        safeAreaEdges={["top"]}
        backgroundColor={colors.background}
        containerStyle={{ paddingHorizontal: spacing.md, backgroundColor: colors.surface }}
        titleStyle={{ color: colors.text, fontWeight: "bold", fontSize: 18 }}
        style={{ height: 46 }}
      />

      <Screen preset="scroll" contentContainerStyle={themed($screenContentContainer)}>

        <View style={themed($sectionHeader)}>
          <Text text='Chọn ngày xổ' weight='bold' size="md" />
        </View>

        <View style={themed($datePickerWrapperCard)}>
          <HorizontalDatePicker
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            disableFuture={false}
            containerStyle={{ paddingVertical: 15 }}
          />
        </View>

        <View style={themed($sectionHeader)}>
          <Text text='Đài quay thưởng' weight='bold' size="md" />
        </View>
        <View>{currentCityData.map(renderCityChips)}</View>

        <View style={themed($sectionHeader)}>
          <Text text='Mã dự thưởng (6 số)' weight='bold' size="md" />
        </View>
        <TouchableOpacity activeOpacity={0.9} onPress={() => inputRef.current?.focus()}>
          <LinearGradient style={themed($codeCardCompact)} colors={[colors.palette.primary200, colors.palette.accent300]}>
            <View style={themed($inputRow)}>
              <IconTicket width={20} height={20} color={colors.primary} />
              <TextInput
                ref={inputRef}
                style={themed($textInputCompact)}
                value={ticketCode}
                onChangeText={handleTextChange}
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
              />
              {ticketCode.length > 0 && (
                <TouchableOpacity onPress={handleClearInput}>
                  <IconClear width={22} height={22} color={colors.palette.neutral500} />
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {ticketCode.length > 0 && ticketCode.length < 6 && (
          <Text text='Vui lòng nhập đủ 6 chữ số để dò kết quả.' weight='medium' size="sm" style={{ color: colors.error, marginTop: spacing.xs }} />
        )}
      </Screen>

      {validInput && (
        <TouchableOpacity style={themed([$footerButton, { backgroundColor: colors.primary }])} activeOpacity={0.8} onPress={handleCheckTicket} disabled={loading}>
          <IconSearch width={20} height={20} color={colors.surface} />
          <Text text='Dò ngay' weight='bold' size="lg" style={{ color: colors.surface, marginLeft: spacing.xs }} />
        </TouchableOpacity>
      )}
    </>
  );
}



const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
  paddingBottom: spacing.xxxl * 2,
});

const $sectionHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: spacing.md,
  marginBottom: spacing.xs,
});

const $activeCityChip: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.primary,
});

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
  shadowColor: colors.primary,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4.65,
  elevation: 8,
});






const $datePickerWrapperCard: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.surface,
  borderRadius: spacing.lg,
  // Shadow tương đương style cũ của bạn
  shadowColor: colors.palette.primary300,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 3.84,
  elevation: 5,
  overflow: 'hidden', // Đảm bảo pager không tràn ra ngoài border radius
});

const $codeCardCompact: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  borderRadius: spacing.md,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.lg,
});

const $inputRow: ThemedStyle<ViewStyle> = () => ({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const $textInputCompact: ThemedStyle<TextStyle> = ({ colors }) => ({
  flex: 1,
  fontSize: 28,
  fontWeight: 'bold',
  color: colors.text,
  textAlign: 'center',
  letterSpacing: 4,
  padding: 0,
});


const $regionContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs, // Giảm khoảng cách giữa các miền
});

const $regionHeaderCompact: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 4, // Khoảng cách cực nhỏ với hàng đài
});

const $regionIndicatorSmall: ThemedStyle<ViewStyle> = () => ({
  width: 3,
  height: 12,
  borderRadius: 2,
  marginRight: 6,
});

const $lineSeparator: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral200,
  height: 1,
  marginLeft: spacing.sm,
});

const $scrollCityContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingRight: spacing.md, // Đệm cuối để không bị sát mép khi cuộn hết
  gap: spacing.xs,          // Khoảng cách giữa các chip
  paddingVertical: 4,       // Tránh bị cắt shadow nếu có
});

const $cityChipHorizontal: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingHorizontal: spacing.md,
  paddingVertical: 6,       // Thu hẹp chiều dọc chip
  borderRadius: spacing.lg,
  backgroundColor: colors.palette.neutral100,
  borderWidth: 1,
  borderColor: colors.border,
  minWidth: 80,             // Đảm bảo chip không quá bé
  alignItems: 'center',
  justifyContent: 'center',

});

const $checkBadgeSmall: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: 'absolute',
  top: -2,
  right: -2,
  backgroundColor: colors.surface,
  borderRadius: 10,
  padding: 1,
});