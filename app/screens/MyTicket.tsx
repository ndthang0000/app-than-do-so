// Create HistoryScreen.tsx
import React, { useState } from 'react';
import { View, ViewStyle, TouchableOpacity, ScrollView } from 'react-native';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { HomeTabScreenProps } from '@/navigators/navigationTypes'; // Giả định
import { Screen } from '@/components/Screen';
import { Text } from "@/components/Text"
import { Header } from '@/components/Header';
import IconBellNoti from "@assets/svg/bell-noti.svg"; // Icon chuông
import IconBack from "@assets/svg/arrow-left.svg"; // Icon Back (Giả định)
import IconDownArrow from "@assets/svg/arrow-left.svg"; // Icon mũi tên xuống (Giả định)
import IconCalendar from "@assets/svg/calendar.svg"; // Icon lịch

// Dữ liệu mẫu
const tabData = ['Tất cả', 'Trúng thưởng', 'Chưa quay', 'Đã dò'];
const regionFilterData = ['Tất cả', 'Miền Bắc', 'Miền Trung', 'Miền Nam'];

// Dữ liệu giả cho các vé dò
const ticketHistoryData = [
  {
    id: 1,
    region: 'Miền Nam',
    city: 'TP. Hồ Chí Minh',
    status: 'Trúng Lớn',
    code: '928374',
    date: '24-10-2023',
    time: '18:30',
    key: '#1024',
  },
  {
    id: 2,
    region: 'Miền Trung',
    city: 'Đà Nẵng',
    status: 'Chưa quay',
    code: '112233',
    date: '24-10-2023',
    time: '17:15 - Hôm nay',
  },
  {
    id: 3,
    region: 'Miền Bắc',
    city: 'Hà Nội',
    status: 'Không Trúng',
    code: '654321',
    date: '22/10/2023',
    message: 'Chúc bạn may mắn lần sau!',
  },
  {
    id: 4,
    region: 'Miền Trung',
    city: 'Đà Nẵng',
    status: 'Không Trúng',
    code: '987654',
    date: '21/10/2023',
    message: 'Đừng nản lòng, thần tài đang tới!',
  },
];

export const MyTicketScreen: React.FC<HomeTabScreenProps<'MyTicket'>> = function HistoryScreen(_props) {
  const { themed, theme: { colors, spacing } } = useAppTheme();
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [activeRegion, setActiveRegion] = useState('Tất cả');

  const BellIcon = () => {
    return (
      <TouchableOpacity onPress={() => console.log('navigate to notifications')} activeOpacity={0.5}>
        <IconBellNoti width={24} height={24} color={colors.text} />
      </TouchableOpacity>
    )
  }

  // Hàm render từng Card kết quả dò số
  const renderTicketCard = (item: any) => {
    const isWin = item.status === 'Trúng Lớn';
    const isPending = item.status === 'Chưa quay';
    const isLost = item.status === 'Không Trúng';

    const cardStyle = themed([
      $ticketCardWrapper,
      isWin && $winCard,
      { marginBottom: spacing.md }
    ]);

    return (
      <View key={item.id} style={cardStyle}>

        {/* 1. Header Card (Miền, Thành phố, Trạng thái) */}
        <View style={themed($cardHeader)}>
          {/* Miền & Thành phố */}
          <View style={themed($cardRegionInfo)}>
            {/* Icon Location (Giả định) */}
            <Text style={{ marginRight: 5 }}>📍</Text>
            <Text text={item.region} weight='semiBold' size="sm" />
            <Text text={` | ${item.city}`} weight='normal' size="sm" style={{ color: colors.palette.neutral600 }} />
          </View>

          {/* Badge Trạng thái */}
          <View style={themed([
            $statusBadge,
            isWin && $winBadge,
            isPending && $pendingBadge,
            isLost && $lostBadge,
          ])}>
            <Text
              text={item.status.toUpperCase()}
              weight='bold'
              size="xxs"
              style={{ color: isWin ? colors.primary : colors.text }}
            />
          </View>
        </View>

        {/* 2. Mã Dò Thưởng (Mã số) */}
        <View style={themed($codeWrapper)}>
          <Text
            text={item.code}
            weight='bold'
            size={isWin ? "xxl" : "lg"} // Font lớn hơn cho Trúng Lớn
            style={{ color: isWin ? colors.primary : colors.text }}
          />
        </View>

        {/* 3. Footer Card (Ngày/Giờ quay) */}
        <View style={themed($cardFooter)}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isWin && <Text text={`Ngày quay: ${item.date}`} weight='light' size="xs" style={{ marginRight: spacing.sm }} />}
            {isWin && <Text text={`Kỳ: ${item.key}`} weight='light' size="xs" />}
            {isPending && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Icon đồng hồ (Giả định) */}
                <Text style={{ marginRight: 5 }}>⌚</Text>
                <Text text={`Giờ quay thưởng:`} weight='light' size="sm" style={{ color: colors.palette.neutral600 }} />
                <Text text={` ${item.time}`} weight='bold' size="sm" style={{ color: colors.primary }} />
              </View>
            )}
            {isLost && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Icon Lô tô (Giả định) */}
                <Text style={{ marginRight: 5 }}>📰</Text>
                <Text text={`Mã số`} weight='light' size="sm" style={{ marginRight: spacing.sm }} />
              </View>
            )}
          </View>

          {/* Thông báo Không Trúng */}
          {isLost && (
            <Text text={item.message} weight='light' size="sm" style={{ color: colors.palette.neutral500 }} />
          )}
        </View>
      </View>
    )
  }

  return (
    <>
      <Header
        title="LỊCH SỬ DÒ SỐ"
        LeftActionComponent={<TouchableOpacity onPress={() => _props.navigation.goBack()} activeOpacity={0.5}><IconBack width={20} height={20} color={colors.text} /></TouchableOpacity>}
        safeAreaEdges={["top"]}
        backgroundColor={colors.background}
        containerStyle={{ paddingHorizontal: spacing.md, backgroundColor: colors.surface }}
        titleStyle={{ color: colors.text, fontWeight: "bold", fontSize: 18 }}
      />

      <Screen preset="scroll" contentContainerStyle={themed($screenContentContainer)}>

        {/* 1. Thanh Tab Lớn (Trạng thái) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={themed($largeTabRow)}
        >
          {tabData.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={themed([$largeTabButton, isActive && $activeLargeTabButton])}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text
                  text={tab}
                  weight='semiBold'
                  size="sm"
                  style={{ color: isActive ? colors.surface : colors.text }}
                />
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* 2. Hàng Filter (Thời gian và Miền) */}
        <View style={themed($filterRow)}>
          <TouchableOpacity style={themed($dropdownButton)} activeOpacity={0.7}>
            <IconCalendar width={16} height={16} color={colors.text} style={{ marginRight: spacing.xs }} />
            <Text text='Tháng 10, 2023' weight='semiBold' size="sm" />
            <IconDownArrow width={10} height={10} color={colors.text} style={{ marginLeft: spacing.xs }} />
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={themed($regionFilterRow)}
          >
            {regionFilterData.map((region) => {
              const isActive = activeRegion === region;
              return (
                <TouchableOpacity
                  key={region}
                  style={themed([$regionButton, isActive && $activeRegionButton])}
                  onPress={() => setActiveRegion(region)}
                  activeOpacity={0.7}
                >
                  <Text
                    text={region}
                    weight='medium'
                    size="xs"
                    style={{ color: isActive ? colors.surface : colors.text }}
                  />
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {/* 3. Danh sách Lịch Sử Dò Số */}
        <View style={{ paddingVertical: spacing.sm }}>
          {ticketHistoryData.map(renderTicketCard)}
        </View>

      </Screen>
    </>

  );
}


// ==========================================================
// STYLES
// ==========================================================

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
});

// --- Large Tabs (Tất cả, Trúng thưởng,...) ---
const $largeTabRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: spacing.md,
});

const $largeTabButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.lg,
  borderRadius: spacing.xxl, // Bo góc tròn
  marginRight: spacing.sm,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
});

const $activeLargeTabButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.primary,
  borderColor: colors.primary,
});

// --- Filter Row (Tháng, Miền) ---
const $filterRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: spacing.md,
});

const $dropdownButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  padding: spacing.xs,
  borderRadius: spacing.md,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
  marginRight: spacing.md,
});

const $regionFilterRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
});

const $regionButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingVertical: spacing.xxs,
  paddingHorizontal: spacing.sm,
  borderRadius: spacing.md,
  backgroundColor: colors.palette.neutral200,
});

const $activeRegionButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.primary,
});

// --- Ticket Cards (Mỗi lịch sử dò số) ---
const $ticketCardWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.surface,
  borderRadius: spacing.lg,
  padding: spacing.md,
  flexDirection: 'column',

  // Shadow style tương tự HomeScreen
  shadowColor: colors.palette.neutral400,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
});

const $winCard: ThemedStyle<ViewStyle> = ({ colors }) => ({
  // Màu border nhẹ hoặc background đặc trưng cho Trúng Lớn nếu cần
  borderWidth: 1,
  borderColor: colors.primary,
});

const $cardHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: spacing.xs,
});

const $cardRegionInfo: ThemedStyle<ViewStyle> = ({ }) => ({
  flexDirection: 'row',
  alignItems: 'center',
});

const $statusBadge: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderRadius: spacing.md,
  alignItems: 'center',
  justifyContent: 'center',
});

const $winBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.accent300, // Màu vàng nhạt
});

const $pendingBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.secondary300, // Màu xanh nhạt (Chưa quay)
});

const $lostBadge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral300, // Màu xám nhạt (Không trúng)
});

const $codeWrapper: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: 'center',
  paddingVertical: spacing.xs,
});

const $cardFooter: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  marginTop: spacing.sm,
});