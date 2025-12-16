// Update MyTicketScreen.tsx
import React, { useState } from 'react';
import { View, ViewStyle, TouchableOpacity, ScrollView, TextStyle } from 'react-native';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { HomeTabScreenProps } from '@/navigators/navigationTypes';
import { Screen } from '@/components/Screen';
import { Text } from "@/components/Text"
import { Header } from '@/components/Header';

// Import Icons
import IconBack from "@assets/svg/arrow-left.svg";
import IconTicket from "@assets/svg/my-ticket.svg"; // Icon vé chung
import IconSort from "@assets/svg/sort.svg"; // Giả định icon sắp xếp
import IconSad from "@assets/svg/sad-face.svg"; // Icon mặt buồn
import IconTrophy from "@assets/svg/trophy.svg"; // Icon cúp (cho thẻ vàng)
import LoadingIcon from '@/components/LoadingIcon';

// Dữ liệu mẫu khớp với hình ảnh mới
const statusFilters = ['Tất cả', 'Chưa quay', 'Đã quay', 'Trúng thưởng'];
const regionFilters = ['Tất cả', 'Miền Bắc', 'Miền Trung', 'Miền Nam'];

const ticketHistoryData = [
  {
    id: 1,
    region: 'Miền Nam',
    city: 'TP. Hồ Chí Minh',
    status: 'TRÚNG THƯỞNG',
    code: '928374',
    date: '24/10/2023',
    time: '18:30',
    prizeName: 'Giải Đặc Biệt',
    type: 'win'
  },
  {
    id: 2,
    region: 'Miền Trung',
    city: 'Đà Nẵng',
    status: 'CHƯA QUAY',
    code: '112233',
    time: '17:15',
    tag: 'Hôm nay',
    type: 'pending',
    date: '22/10/2023',
  },
  {
    id: 3,
    region: 'Miền Bắc',
    city: 'Hà Nội',
    status: 'KHÔNG TRÚNG',
    code: '654321',
    date: '22/10/2023',
    type: 'lost',
    tag: 'Hôm qua',
  },
  {
    id: 4,
    region: 'Miền Trung',
    city: 'Đà Nẵng',
    status: 'KHÔNG TRÚNG',
    code: '987654',
    date: '21/10/2023',
    type: 'lost'
  },
];

export const MyTicketScreen: React.FC<HomeTabScreenProps<'MyTicket'>> = function MyTicketScreen(_props) {
  const { themed, theme: { colors, spacing } } = useAppTheme();
  const [activeStatus, setActiveStatus] = useState('Tất cả');
  const [activeRegion, setActiveRegion] = useState('Tất cả');

  // --- Components con ---


  const SortButton = () => (
    <TouchableOpacity style={themed($sortButton)} activeOpacity={0.7}>
      <IconSort width={16} height={16} color={colors.text} />
      <Text text="Sắp xếp" weight="bold" size="xs" style={{ marginLeft: spacing.xs }} />
    </TouchableOpacity>
  );

  // --- Render Card ---
  const renderTicketCard = (item: any) => {
    // Xác định Style dựa trên loại vé
    const isWin = item.type === 'win';
    const isPending = item.type === 'pending';
    const isLost = item.type === 'lost';

    // Wrapper Style
    const cardWrapperStyle = themed([
      $cardBase,
      isWin && $cardWin, // Nền vàng
      (isPending || isLost) && $cardNormal, // Nền trắng
      { marginBottom: spacing.md }
    ]);

    // Header Colors & Icons
    let IconComponent = isWin ? IconTrophy : (isPending ? IconTicket : IconTicket); // Có thể thay icon ticket xám cho lost
    let iconColor = isWin ? '#D97706' : (isPending ? '#3B82F6' : '#9CA3AF'); // Vàng đậm / Xanh / Xám
    let statusColor = isWin ? '#DC2626' : (isPending ? '#2563EB' : '#9CA3AF'); // Đỏ / Xanh / Xám
    let statusBg = isWin ? 'transparent' : (isPending ? '#EFF6FF' : '#F3F4F6'); // Badge bg

    // Status Icon Right
    const StatusRight = () => {
      if (isWin) return <Text text="🏆 TRÚNG THƯỞNG" weight="bold" size="xs" style={{ color: '#DC2626' }} />;
      if (isPending) return (
        <View style={themed([$badgeStatusRight, { backgroundColor: '#EFF6FF' }])}>
          <LoadingIcon />
          <Text text="CHƯA QUAY" weight="bold" size="xs" style={{ color: '#2563EB' }} />
        </View>
      );
      if (isLost) return (
        <View style={themed([$badgeStatusRight, { backgroundColor: colors.palette.neutral200 }])}>
          <IconSad width={14} height={14} color="#9CA3AF" style={{ marginRight: 4 }} />
          <Text text="KHÔNG TRÚNG" weight="bold" size="xs" style={{ color: '#9CA3AF' }} />
        </View>
      );
      return null;
    };

    return (
      <View key={item.id} style={cardWrapperStyle}>

        {/* 1. Card Header */}
        <View style={themed([$cardHeader, isWin && { borderBottomColor: 'rgba(255,255,255,0.3)' }])}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={[themed($iconBox), { backgroundColor: isWin ? 'rgba(255,255,255,0.3)' : statusBg }]}>
              <IconComponent width={20} height={20} color={isWin ? '#B45309' : iconColor} />
            </View>
            <View style={{ marginLeft: spacing.sm }}>
              <Text text={item.region.toUpperCase()} size="xxs" weight="medium" style={{ color: isWin ? '#B45309' : colors.palette.neutral500 }} />
              <Text text={item.city} weight="bold" size="sm" style={{ color: isWin ? '#78350F' : colors.text }} />
            </View>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            {isWin && <View style={themed($dateBadgeWin)}><Text text={item.date} size="xxs" weight="bold" style={{ color: '#78350F' }} /></View>}
            {(isPending || isLost) && <View style={themed($tagToday)}><Text text={item.date} size="xxs" weight="medium" /></View>}
            {/* Trạng thái hiển thị ở dòng dưới header */}
            {!isWin && <View style={{ marginTop: 4 }}><StatusRight /></View>}
            {isWin && <View style={{ marginTop: 4 }}><StatusRight /></View>}
          </View>
        </View>

        {/* 2. Body: Mã số */}
        <View style={themed($cardBody)}>
          <Text text="MÃ DỰ THƯỞNG" size="xxs" weight="medium" style={{ color: isWin ? '#B45309' : colors.palette.neutral500, letterSpacing: 1 }} />
          <Text
            text={item.code} 
            size="xxl"
            weight="bold"
            style={[
              { marginTop: spacing.xs, letterSpacing: 2 },
              isWin && { color: '#DC2626' }, // Màu đỏ cho vé trúng
              isPending && { color: colors.text },
              isLost && { color: colors.palette.neutral400, textDecorationLine: 'line-through' } // Gạch ngang cho vé thua
            ]}
          />
          {/* Background trang trí chữ X mờ cho vé thua nếu cần */}
          {isLost && <Text text="X" style={themed($watermarkLost)} />}
        </View>

        {/* 3. Footer */}
        <View style={themed($cardFooter)}>
          {isWin && (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text text="🕒" style={{ fontSize: 10, marginRight: 4 }} />
                <Text text={`Dò lúc: ${item.time}`} size="xs" style={{ color: '#92400E' }} />
              </View>
              <Text text={item.prizeName} weight="bold" size="sm" style={{ color: '#DC2626' }} />
            </>
          )}
            {isPending && (
            <>
              <Text text={`🕒 Giờ quay: `} size="xs" style={{ color: colors.palette.neutral500 }}>
                <Text text={item.time} weight="bold" style={{ color: '#2563EB' }} />
              </Text>
              <Text text="Đang chờ..." size="xs" style={{ color: colors.palette.neutral400, fontStyle: 'italic' }} />
            </>
            )}
          {isLost && (
            <Text text="Chúc bạn may mắn lần sau!" size="xs" style={{ color: colors.palette.neutral400, fontStyle: 'italic', width: '100%' }} />
            )}
        </View>

      </View>
    );
  };

  return (
    <>
      <Header
        title="LỊCH SỬ DÒ SỐ"
        LeftActionComponent={<TouchableOpacity onPress={() => _props.navigation.goBack()}><IconBack width={24} height={24} color={colors.text} /></TouchableOpacity>}
        safeAreaEdges={["top"]}
        backgroundColor={colors.background}
        containerStyle={{ paddingHorizontal: spacing.md, backgroundColor: colors.surface }}
        titleStyle={{ color: colors.text, fontWeight: "bold", fontSize: 18 }}
      />

      <Screen preset="scroll" contentContainerStyle={themed($screenContainer)}>

        {/* Row 1: Status Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={themed($filterScroll)}>
          {statusFilters.map(status => (
            <TouchableOpacity
              key={status}
              style={themed([$statusTab, activeStatus === status && $statusTabActive])}
              onPress={() => setActiveStatus(status)}
              >
              <Text text={status} weight={activeStatus === status ? "bold" : "medium"} size="xs" style={{ color: activeStatus === status ? colors.surface : colors.text }} />
              </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Row 2: Sort Button (Right Aligned) */}
        <View style={themed($sortRow)}>
          <SortButton />
        </View>

        {/* Row 3: Region Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={themed($filterScroll)}>
          {regionFilters.map(region => (
                <TouchableOpacity
              key={region}
              style={themed([$regionTab, activeRegion === region && $regionTabActive])}
              onPress={() => setActiveRegion(region)}
                >
              <Text text={region} weight="medium" size="xs" style={{ color: activeRegion === region ? colors.surface : colors.palette.neutral600 }} />
                </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Ticket List */}
        <View style={{ marginTop: spacing.md }}>
          {ticketHistoryData.map(renderTicketCard)}
        </View>

      </Screen>
    </>
  );
}


// ==========================================================
// STYLES
// ==========================================================

const $screenContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
  paddingTop: spacing.md,
  paddingBottom: spacing.xxl,
});

// --- Filters ---
const $filterScroll: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
  paddingRight: spacing.md,
});

const $statusTab: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.lg,
  borderRadius: spacing.xxl,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
});

const $statusTabActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: '#DC2626', // Màu đỏ đậm như design
  borderColor: '#DC2626',
});

const $sortRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  justifyContent: 'flex-end',
  marginVertical: spacing.sm,
});

const $sortButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: spacing.xs,
  paddingHorizontal: spacing.sm,
  backgroundColor: colors.surface,
  borderRadius: spacing.md,
  // Shadow nhẹ
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
});

const $regionTab: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingVertical: spacing.xxs + 2,
  paddingHorizontal: spacing.md,
  borderRadius: spacing.lg,
  backgroundColor: colors.palette.neutral200,
});

const $regionTabActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: '#DC2626', // Màu đỏ đồng bộ
});

// --- Cards ---
const $cardBase: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  borderRadius: spacing.lg,
  padding: spacing.md,
  shadowColor: colors.palette.neutral400,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 6,
  elevation: 4,
  overflow: 'hidden',
});

const $cardNormal: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
});

const $cardWin: ThemedStyle<ViewStyle> = ({ }) => ({
  backgroundColor: '#FFD700', // Vàng đậm (Gold)
  // Nếu có LinearGradient thì dùng: ['#FFF59D', '#FBC02D']
  borderWidth: 1,
  borderColor: '#F59E0B',
});

const $cardHeader: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  borderBottomWidth: 1,
  borderBottomColor: colors.palette.neutral100,
  paddingBottom: spacing.sm,
  marginBottom: spacing.sm,
});

const $iconBox: ThemedStyle<ViewStyle> = ({ }) => ({
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: 'center',
  justifyContent: 'center',
});

const $tagToday: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral200,
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 10,
  marginBottom: 4,
});

const $dateBadgeWin: ThemedStyle<ViewStyle> = ({ }) => ({
  backgroundColor: 'rgba(255,255,255,0.5)',
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 10,
  marginBottom: 4,
});

const $cardBody: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: 'center',
  paddingVertical: spacing.sm,
  position: 'relative',
});

const $watermarkLost: ThemedStyle<TextStyle> = ({ colors }) => ({
  position: 'absolute',
  fontSize: 100,
  fontWeight: '900',
  color: colors.palette.neutral200,
  opacity: 0.3,
  right: -20,
  top: -20,
  transform: [{ rotate: '-15deg' }]
});

const $cardFooter: ThemedStyle<ViewStyle> = ({ }) => ({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const $badgeStatusRight: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 16
})