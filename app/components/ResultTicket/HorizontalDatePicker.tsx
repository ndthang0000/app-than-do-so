import React, { useState, useMemo, useRef } from "react"
import { View, TouchableOpacity, ViewStyle, TextStyle } from "react-native"
import PagerView from "react-native-pager-view"
import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay, isToday, startOfDay, isAfter } from "date-fns"
import { vi } from "date-fns/locale"
import IconCalendar from "@assets/svg/calendar.svg" // Thay bằng icon của bạn
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import { ThemedStyle } from "@/theme/types"
import DateTimePickerModal from "react-native-modal-datetime-picker" // Thư viện hiện đại cho Expo

interface Props {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export const HorizontalDatePicker = ({ selectedDate, onDateChange }: Props) => {
  const { themed, theme: { colors } } = useAppTheme()
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false)
  const pagerRef = useRef<PagerView>(null)

  const secondaryTitle = useMemo(() => {
    const today = new Date()
    const yesterday = addDays(today, -1)
    const yesterday2 = addDays(today, -2)

    if (isSameDay(selectedDate, today)) return "Hôm nay"
    if (isSameDay(selectedDate, yesterday)) return "Hôm qua"
    if (isSameDay(selectedDate, yesterday2)) return "Hôm kia"
    return ""
  }, [selectedDate])

  // Tạo dữ liệu cho 3 tuần (Tuần trước, tuần này, tuần sau) để tối ưu bộ nhớ
  const weeks = useMemo(() => {
    const startOfCurrentWeek = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const generateWeek = (start: Date) =>
      eachDayOfInterval({ start, end: addDays(start, 6) })

    return [
      generateWeek(addDays(startOfCurrentWeek, -7)),
      generateWeek(startOfCurrentWeek),
      generateWeek(addDays(startOfCurrentWeek, 7)),
    ]
  }, [selectedDate])

  const showDatePicker = () => setDatePickerVisibility(true)
  const hideDatePicker = () => setDatePickerVisibility(false)

  const handleConfirm = (date: Date) => {
    onDateChange(date)
    hideDatePicker()
  }

  const handleGoToday = () => onDateChange(new Date())

  return (
    <View style={themed($container)}>
      {/* Header Row: Hôm nay, Tháng/Năm, Icon Lịch */}
      <View style={themed($headerRow)}>
        <TouchableOpacity
          onPress={handleGoToday}
          disabled={isToday(selectedDate)}
          style={[themed($todayButton), isToday(selectedDate) && { opacity: 0.3 }]}
        >
          <Text text="↺ H.nay" style={themed($todayText)} weight="bold" />
        </TouchableOpacity>

        <Text
          text={' ' + format(selectedDate, "dd-MM-yyyy", { locale: vi }).toUpperCase() + (secondaryTitle ? ` (${secondaryTitle})` : '')}
          style={themed($monthYearText)}
          weight="bold"
        />

        <TouchableOpacity onPress={showDatePicker} style={themed($calendarIconWrapper)}>
          <IconCalendar width={20} height={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Date List: Sử dụng PagerView để swipe */}
      <PagerView
        ref={pagerRef}
        style={themed($pager)}
        initialPage={1}
        onPageSelected={(e) => {
          const position = e.nativeEvent.position
          if (position === 1) return

          // 1. Tính toán ngày mục tiêu dựa trên hướng vuốt
          const offset = position < 1 ? -7 : 7
          let targetDate = addDays(selectedDate, offset)

          // 2. KIỂM TRA: Nếu lướt sang phải (targetDate sau ngày hiện tại) thì chặn
          const today = startOfDay(new Date())
          if (isAfter(startOfDay(targetDate), today)) {
            // Đưa Pager về lại trang giữa mà không update date
            targetDate = today
          }

          // 3. Nếu hợp lệ thì mới update
          onDateChange(targetDate)

          // Đưa về trang giữa để có thể vuốt tiếp lần sau
          setTimeout(() => {
            pagerRef.current?.setPageWithoutAnimation(1)
          }, 100)
        }}
      >
        {weeks.map((week, index) => (
          <View key={index} style={themed($weekPage)}>
            {week.map((day) => {
              const active = isSameDay(day, selectedDate)
              return (
                <TouchableOpacity
                  key={day.toString()}
                  onPress={() => onDateChange(day)}
                  style={[themed($dateItem), active && themed($activeDateItem)]}
                >
                  <Text
                    text={format(day, "EEEEEE", { locale: vi }).toUpperCase()}
                    style={[themed($dayName), active && { color: colors.background }]}
                  />
                  <Text
                    text={format(day, "d")}
                    style={[themed($dateNumber), active && { color: colors.background }]}
                  />
                  {isToday(day) && !active && <View style={themed($todayDot)} />}
                </TouchableOpacity>
              )
            })}
          </View>
        ))}
      </PagerView>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        date={selectedDate}
        // --- Tùy chỉnh màu sắc ở đây ---
        accentColor={colors.primary} // Màu chủ đạo trên Android (vòng tròn chọn năm, các nút)
        buttonTextColorIOS={colors.primary} // Màu chữ nút "Confirm" và "Cancel" trên iOS
        textColor={colors.text} // Màu chữ của phần số/ngày (thường là đen hoặc trắng tùy theme)
        confirmTextIOS="Chọn" // Thay đổi text nút xác nhận
        cancelTextIOS="Hủy"
        locale="vi_VN" // Đảm bảo hiển thị tiếng Việt

      />
    </View>
  )
}


const $container: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingBottom: spacing.xxs,
  marginBottom: spacing.xs,
  backgroundColor: colors.surface,
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 3,
})

const $headerRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: spacing.md,
  marginBottom: 1, // Thu hẹp khoảng cách với hàng ngày
})

const $todayButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  paddingHorizontal: 4,
  paddingVertical: 2,
  borderRadius: spacing.xl,
})

const $todayText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.primary,
  fontSize: 11,
})

const $monthYearText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.text,
})

const $calendarIconWrapper: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: spacing.xs,
  backgroundColor: colors.surface,
  borderRadius: spacing.sm,
})

const $pager: ThemedStyle<ViewStyle> = () => ({
  height: 48, // Chiều dọc tối thiểu
})

const $weekPage: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "space-around",
})

const $dateItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  justifyContent: "center",
  width: 38,
  height: 48,
  borderRadius: 28,
})

const $activeDateItem: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.primary,
  // Đổ bóng cho ngày active như hình mẫu
  shadowColor: colors.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 5,
})

const $dayName: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 10,
  color: colors.textDim,
})

const $dateNumber: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.text,
  fontWeight: "bold",
})

const $todayDot: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 4,
  height: 4,
  borderRadius: 2,
  backgroundColor: colors.primary,
})