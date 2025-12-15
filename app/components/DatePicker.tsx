import { Calendar } from "react-native-calendars"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { useAppTheme } from "@/theme/context"

type DatePickerProps = {
  onDateSelect: (dateString: string) => void;
  initialDate: string;
}

// const VIETNAMESE_DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const getMonthYearVietnamese = (dateString: string) => {
  // dateString là 'YYYY-MM-DD' hoặc định dạng ngày hợp lệ
  const date = new Date(dateString);
  // Lưu ý: format() của date-fns cần được cấu hình locale Việt Nam để có tên tháng chính xác,
  // hoặc bạn có thể tự hardcode tên tháng.

  // Tự tạo tên tháng tiếng Việt đơn giản (Cách 1: Hardcode)
  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

export function DatePicker({ onDateSelect, initialDate }: DatePickerProps) {

  const { theme: { colors } } = useAppTheme();

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F5", padding: 16 }}>

      <Calendar
        initialDate={initialDate}
        onDayPress={(day) => onDateSelect(day.dateString)}
        markedDates={{
          [initialDate]: {
            selected: true,
            selectedColor: colors.primary,

          },
        }}

        theme={{
          todayTextColor: colors.primary,
          arrowColor: colors.primary,
          textDayFontWeight: "600",
          textMonthFontWeight: "700",
          textDayHeaderFontWeight: "600",
        }}
        renderHeader={(date) => {
          // Lấy ngày đầu tiên của tháng đang hiển thị từ object 'date'
          const dateString = date.toString('yyyy-MM-dd');
          return (
            <Text style={{
              fontSize: 16,
              fontWeight: '700',
              color: colors.palette.neutral900 // Giả định màu chữ
            }}>
              {getMonthYearVietnamese(dateString)}
            </Text>

          );
        }}
        dayComponent={({ date, state }) => {
          // 1. Kiểm tra xem ngày hiện tại có phải là ngày được chọn không
          const isSelected = date?.dateString === initialDate;
          // 2. Kiểm tra ngày Chủ Nhật
          const isSunday = date?.dateString ? new Date(date.dateString).getDay() === 0 : false

          return (
            // Bọc bằng Pressable để ngày đó có thể được nhấn
            <TouchableOpacity
              onPress={() => date && onDateSelect(date.dateString)}
              style={{
                alignItems: "center",
                justifyContent: "center",
                width: 32, // Đảm bảo đủ không gian cho hình tròn
                height: 32,
                borderRadius: 16, // Tạo hình tròn
                // 3. Áp dụng style cho ngày được chọn
                backgroundColor: isSelected ? colors.primary : "transparent",
              }}
              activeOpacity={0.1}
            >
              <Text
                style={{
                  color:
                    state === "disabled"
                      ? "#CCC"
                      : isSelected // 4. Nếu là ngày được chọn, đổi màu chữ thành trắng
                        ? colors.palette.neutral100 // Giả định là màu trắng hoặc màu sáng
                        : isSunday
                          ? colors.primary
                          : colors.palette.neutral500,
                  fontWeight: isSelected ? "bold" : "600", // Thêm đậm nếu cần
                }}
              >
                {date?.day}
              </Text>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}


const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden"
  },
  // Style cho hàng tên ngày trong tuần tự tạo
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#F7F7F7', // Màu nền nhẹ cho hàng này
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    width: 32, // Đảm bảo căn chỉnh với kích thước của ngày trong lịch
    textAlign: 'center',
  },
});