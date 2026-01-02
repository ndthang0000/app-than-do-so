import React, { useEffect } from "react"
import { TextStyle, View, ViewStyle, TouchableOpacity, ScrollView } from "react-native"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import { ThemedStyle } from "@/theme/types"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import IconBell from "@assets/svg/bell-active.svg"
import IconLocation from "@assets/svg/location.svg"
import IconCalendar from "@assets/svg/calendar.svg"
import { useAppSelector } from "@/store" // Hook store của bạn
import { Region } from "@/constants/lotteryTicket"

interface CountDownDrawProps {
  region: Region// Dùng key để lấy dữ liệu từ Redux
  regionName: string
  drawDate?: Date
}

export const CountDownDraw = ({ region, regionName, drawDate = new Date() }: CountDownDrawProps) => {
  const { themed, theme: { colors } } = useAppTheme()

  // 1. Lấy dữ liệu từ Redux
  const status = useAppSelector((state) => state.timeDraw.regions[region])
  const targetTime = status.targetTime

  // 2. Hàm tính toán hiển thị trực tiếp (không cần useState/useEffect cho diff nữa)
  const getDisplayTime = () => {
    const totalSeconds = status.countdownSeconds || 0

    if (totalSeconds <= 0) return { h: "00", m: "00", s: "00" }

    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0")
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0")
    const s = (totalSeconds % 60).toString().padStart(2, "0")

    return { h, m, s }
  }

  const diff = getDisplayTime()

  const TimeBlock = ({ value, label }: { value: string; label: string }) => (
    <View style={themed($timeBlockContainer)}>
      <View style={themed($timeBox)}>
        <Text text={value} style={themed($timeValue)} weight="bold" />
      </View>
      <Text text={label} style={themed($timeLabel)} size="xxs" weight="semiBold" />
    </View>
  )

  return (
    <ScrollView
      style={themed($mainWrapper)}
      contentContainerStyle={themed($contentContainer)}
      showsVerticalScrollIndicator={false}
    >
      <View style={themed($regionBadge)}>
        <IconLocation width={12} height={12} color="#EAB308" />
        <Text text={regionName.toUpperCase()} style={themed($regionText)} weight="bold" />
      </View>

      <Text text="Sắp tới giờ mở thưởng" style={themed($title)} size="xl" weight="bold" />
      <Text text={`Kết quả sẽ được cập nhật tự động lúc ${targetTime}`} style={themed($subTitle)} size="xxs" />

      <View style={themed($timerContainer)}>
        <TimeBlock value={diff.h} label="GIỜ" />
        <Text text=":" style={themed($separator)} weight="bold" />
        <TimeBlock value={diff.m} label="PHÚT" />
        <Text text=":" style={themed($separator)} weight="bold" />
        <TimeBlock value={diff.s} label="GIÂY" />
      </View>

      <View style={themed($drawInfoCard)}>
        <View style={themed($drawDateLeft)}>
          <View style={themed($calendarIconBg)}>
            <IconCalendar width={20} height={20} color={'#7f1d1d'} />
          </View>
          <View>
            <Text text="KỲ QUAY THƯỞNG" style={themed($drawLabel)} size="xxs" weight="bold" />
            <Text text={format(drawDate, "dd/MM/yyyy")} style={themed($drawDateText)} weight="bold" />
          </View>
        </View>
        <View style={themed($divider)} />
        <View style={themed($drawDateRight)}>
          <Text text={format(drawDate, "EEEE", { locale: vi }).toUpperCase()} style={themed($drawDay)} size="xxs" weight="bold" />
          <Text text="Hôm nay" style={themed($drawStatus)} size="xxs" />
        </View>
      </View>

      <TouchableOpacity style={themed($notifyButton)} activeOpacity={0.8}>
        <Text text="NHẬN THÔNG BÁO KHI CÓ KẾT QUẢ" style={themed($notifyText)} weight="bold" size="xs" />
        <IconBell width={20} height={20} color="#C00000" />
      </TouchableOpacity>

      <Text
        text="Bạn sẽ nhận được thông báo ngay khi giải Đặc biệt được công bố. Chúc bạn may mắn!"
        style={themed($footerNote)}
      />
    </ScrollView>
  )
}


const $mainWrapper: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  backgroundColor: "#C00000", // Đỏ phủ toàn màn hình
  minHeight: "100%",
})

const $contentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
  alignItems: "center",
  paddingTop: 60, // Đẩy nội dung xuống một chút cho đẹp
})

const $regionBadge: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  backgroundColor: "rgba(0,0,0,0.3)",
  paddingHorizontal: spacing.md,
  paddingVertical: 6,
  borderRadius: 20,
  alignItems: "center",
  gap: 4,
  marginBottom: spacing.md,
})

const $regionText: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
  fontSize: 12,
})

const $title: ThemedStyle<TextStyle> = () => ({
  color: "#FACC15",
  textAlign: "center",
  marginBottom: 8,
})

const $subTitle: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
  opacity: 0.8,
  marginBottom: 40,
})

const $timerContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "flex-start",
  gap: spacing.sm,
  marginBottom: 40,
})

const $timeBox: ThemedStyle<ViewStyle> = () => ({
  width: 76,
  height: 76,
  backgroundColor: "rgba(255,255,255,0.15)",
  borderRadius: 38,
  justifyContent: "center",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.3)",
  // Hiệu ứng Glow trắng
  // shadowColor: "#FFFFFF",
  // shadowOffset: { width: 0, height: 0 },
  // shadowOpacity: 0.6,
  // shadowRadius: 12,
  // elevation: 4,
})

const $timeValue: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
  fontSize: 34,
  textAlign: "center",
  // Thêm textShadow cho chữ bên trong để tạo cảm giác chữ cũng đang phát sáng
  textShadowColor: "rgba(255, 255, 255, 0.75)",
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 10,
})

// Khối thông tin kỳ quay mới
const $drawInfoCard: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  backgroundColor: "rgba(0,0,0,0.2)",
  borderRadius: spacing.md,
  padding: spacing.md,
  width: "100%",
  alignItems: "center",
  marginBottom: 40,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.1)",
})

const $drawDateLeft: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  flex: 1,
  alignItems: "center",
  gap: 12,
})

const $calendarIconBg: ThemedStyle<ViewStyle> = () => ({
  width: 36,
  height: 36,
  backgroundColor: "#EAB308",
  borderRadius: 8,
  justifyContent: "center",
  alignItems: "center",
})

const $drawLabel: ThemedStyle<TextStyle> = () => ({
  color: "#FACC15",
  fontSize: 10,
})

const $drawDateText: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
  fontSize: 16,
})

const $divider: ThemedStyle<ViewStyle> = () => ({
  width: 1,
  height: "80%",
  backgroundColor: "rgba(255,255,255,0.2)",
  marginHorizontal: 16,
})

const $drawDateRight: ThemedStyle<ViewStyle> = () => ({
  alignItems: "flex-end",
})

const $drawDay: ThemedStyle<TextStyle> = () => ({
  color: "rgba(255,255,255,0.6)",
})

const $drawStatus: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
  fontSize: 14,
  fontWeight: "600",
})

const $notifyButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  backgroundColor: "#FFFFFF",
  paddingVertical: spacing.md,
  borderRadius: 40,
  alignItems: "center",
  gap: spacing.sm,
  width: "100%",
  justifyContent: "center",
  marginBottom: spacing.md,
  // Đổ bóng cho nút trắng
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 5,
  elevation: 10,
})

const $notifyText: ThemedStyle<TextStyle> = () => ({
  color: "#C00000",
})

const $footerNote: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
  fontSize: 11,
  textAlign: "center",
  opacity: 0.6,
  lineHeight: 16,
  paddingHorizontal: 20,
})
const $timeBlockContainer: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
  gap: 8,
})
const $timeLabel: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
  opacity: 0.8,
})
const $separator: ThemedStyle<TextStyle> = () => ({
  color: "#FFFFFF",
  fontSize: 24,
  marginTop: 20,
})