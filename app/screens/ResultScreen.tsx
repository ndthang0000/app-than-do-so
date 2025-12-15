import { Header } from "@/components/Header";
import { HomeTabScreenProps } from "@/navigators/navigationTypes";
import { useAppTheme } from "@/theme/context";
import { Modal, Pressable, TouchableOpacity, View, ViewStyle } from "react-native";
import IconSetting from "@assets/svg/setting.svg";
import IconArrowLeft from "@assets/svg/arrow-left.svg";
import IconArrowRight from "@assets/svg/arrow-right.svg";
import IconCalendar from "@assets/svg/calendar.svg";
import { ThemedStyle } from "@/theme/types";
import { Text } from "@/components/Text";
import { ResultTicketTab } from "@/components/ResultTicket/ResultTicketTab";
import { useState } from "react";
import { DatePicker } from "@/components/DatePicker";

export const ResultScreen: React.FC<HomeTabScreenProps<'Result'>> = function ResultScreen(_props) {
  const { themed, theme: { colors, spacing } } = useAppTheme();

  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [currentSelectedDate, setCurrentSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const handleDateSelect = (dateString: string) => {
    setCurrentSelectedDate(dateString);
    setIsCalendarVisible(false); // Đóng Modal sau khi chọn
  };

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    // Tên thứ trong tiếng Việt (Cần điều chỉnh nếu bạn muốn locale hoàn chỉnh)
    const days = ["CN", "THỨ 2", "THỨ 3", "THỨ 4", "THỨ 5", "THỨ 6", "THỨ 7"];
    const dayName = days[date.getDay()];
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;

    // check the dateString is today or yesterday
    let secondaryTitle = '';
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) {
      secondaryTitle = 'HÔM NAY';
    }
    else if (date.toDateString() === yesterday.toDateString()) {
      secondaryTitle = 'HÔM QUA';
    }

    return {
      dayTitle: `${dayName}${secondaryTitle ? ' ∘ ' + secondaryTitle : ''}`,
      formattedDate
    };
  };

  const SettingPressableIcon = () => {
    return (
      <TouchableOpacity onPress={() => console.log('navigate to settings')} activeOpacity={0.5}>
        <IconSetting width={24} height={24} />
      </TouchableOpacity>
    )
  }

  return (
    <>
      <Header
        title="Kết quả xổ số"
        safeAreaEdges={["top"]}
        RightActionComponent={<SettingPressableIcon />}
        backgroundColor={colors.background}
        containerStyle={{ paddingHorizontal: spacing.md, backgroundColor: colors.surface }}
        titleStyle={{ color: colors.text, fontWeight: "bold", fontSize: 20 }}
      />
      <View style={themed($dateWrapper)}>
        <TouchableOpacity style={themed($arrowWrapper)} activeOpacity={0.5}>
          <IconArrowLeft width={16} height={16} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={themed($dateSelectWrapper)} activeOpacity={0.7} onPress={() => setIsCalendarVisible(true)}>
          <View style={themed($calendarWrapper)}>
            <IconCalendar width={24} height={24} color={colors.background} />
          </View>
          <View>
            <Text text={formatDateDisplay(currentSelectedDate).dayTitle} style={{ color: colors.textDim }} weight="semiBold" />
            <Text text={formatDateDisplay(currentSelectedDate).formattedDate} style={{ color: colors.text }} weight="bold" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={themed($arrowWrapper)} activeOpacity={0.5}>
          <IconArrowRight width={16} height={16} color={colors.primary} />
        </TouchableOpacity>

        <Modal
          animationType="fade" // Hiệu ứng chuyển cảnh
          transparent={true} // Rất quan trọng để nhìn thấy nền mờ
          visible={isCalendarVisible}
          onRequestClose={() => setIsCalendarVisible(false)} // Hỗ trợ Android back button
        >
          <Pressable
            style={themed($modalOverlay)}
            onPress={() => setIsCalendarVisible(false)} // Bấm ngoài Modal để đóng
          >
            <View style={themed($modalContent)}>
              {/* Truyền hàm handleDateSelect vào DatePicker
                            để nó có thể cập nhật và đóng Modal 
                        */}
              <DatePicker
                onDateSelect={handleDateSelect}
                initialDate={currentSelectedDate}
              />
              {/* Thêm nút Đóng/Xác nhận nếu cần */}
            </View>
          </Pressable>
        </Modal>
      </View>
      <ResultTicketTab />
    </>
  )
}

const $dateWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  padding: spacing.xs,
  backgroundColor: colors.surface,
  borderWidth: 0.5,
  marginHorizontal: spacing.md,
  marginVertical: spacing.sm,
  borderColor: colors.border,
  borderRadius: spacing.xl,
})

const $dateSelectWrapper: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.xs,

})
const $arrowWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  padding: spacing.sm,
  borderRadius: 22,
  backgroundColor: colors.background,
  height: 44,
  width: 44,
  alignItems: "center",
  justifyContent: "center",
})


const $calendarWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  padding: spacing.sm,
  borderRadius: 22,
  backgroundColor: colors.primary,
  height: 44,
  width: 44,
  alignItems: "center",
  justifyContent: "center",
  //box shadow
  shadowColor: colors.primary,
  shadowOffset: { width: 1, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,

})

const $modalOverlay: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)', // Màu nền mờ
})

const $modalContent: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  width: '90%',
  backgroundColor: colors.background,
  borderRadius: spacing.lg,
  padding: spacing.md,
  height: 400,
  // Thêm các style khác nếu cần
})