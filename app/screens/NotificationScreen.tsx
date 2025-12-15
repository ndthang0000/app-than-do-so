// Create NotificationScreen.tsx
import React, { useState } from 'react';
import { View, ViewStyle, TouchableOpacity, ScrollView, TextStyle } from 'react-native';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { AppStackScreenProps } from '@/navigators/navigationTypes';
import { Screen } from '@/components/Screen';
import { Text } from "@/components/Text"
import { Header } from '@/components/Header';

// Import Icons
import IconBack from "@assets/svg/arrow-left.svg";
import IconParty from "@assets/svg/arrow-left.svg"; // Giả định icon Pháo giấy
import IconBill from "@assets/svg/arrow-left.svg";     // Giả định icon Kết quả
import IconBulb from "@assets/svg/arrow-left.svg";    // Giả định icon Bóng đèn
import IconStar from "@assets/svg/arrow-left.svg";   // Giả định icon Sao
import IconDownload from "@assets/svg/arrow-left.svg";  // Giả định icon Update

// --- DỮ LIỆU MẪU ---
const FILTER_TABS = ['Tất cả', 'Kết quả xổ số', 'Tin tức', 'Khuyến mãi'];

// Định nghĩa Type cho thông báo
type NotificationType = 'win' | 'result' | 'tip' | 'lucky' | 'system';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  section: 'HÔM NAY' | 'HÔM QUA' | 'CŨ HƠN';
}

const NOTIFICATION_DATA: NotificationItem[] = [
  {
    id: '1',
    type: 'win',
    title: 'Chúc mừng bạn trúng giải!',
    description: 'Vé số đài TP.HCM của bạn có dãy số 83921 đã trúng Giải Tám. Quét lại ngay...',
    time: '10:30',
    isRead: false,
    section: 'HÔM NAY',
  },
  {
    id: '2',
    type: 'result',
    title: 'Kết quả Xổ số Miền Bắc',
    description: 'Đã có kết quả XSMB ngày hôm nay. Giải đặc biệt: 55892.',
    time: '18:30',
    isRead: false,
    section: 'HÔM NAY',
  },
  {
    id: '3',
    type: 'tip',
    title: 'Thống kê lô gan cực hot',
    description: 'Cập nhật danh sách lô gan miền Nam chưa về trong 30 ngày qua. Xem ngay đ...',
    time: 'Hôm qua',
    isRead: true,
    section: 'HÔM QUA',
  },
  {
    id: '4',
    type: 'lucky',
    title: 'Thần Tài mách nước',
    description: 'Số may mắn dành cho tuổi Thìn hôm nay: 28 - 68 - 04.',
    time: 'Hôm qua',
    isRead: true,
    section: 'HÔM QUA',
  },
  {
    id: '5',
    type: 'system',
    title: 'Cập nhật ứng dụng v2.1',
    description: 'Phiên bản mới cải thiện tốc độ quét vé và sửa lỗi hiển thị trên iOS 17.',
    time: '05/10',
    isRead: true,
    section: 'CŨ HƠN',
  },
];

export const NotificationScreen: React.FC<AppStackScreenProps<'Notification'>> = function NotificationScreen(_props) {
  const { themed, theme: { colors, spacing } } = useAppTheme();
  const { navigation } = _props;
  const [activeTab, setActiveTab] = useState('Tất cả');

  // Helper: Get Icon & Color based on type
  const getIconConfig = (type: NotificationType) => {
    switch (type) {
      case 'win': return { icon: IconParty, bg: colors.palette.primary100, color: colors.primary }; // Đỏ nhạt
      case 'result': return { icon: IconBill, bg: '#DBEAFE', color: '#2563EB' }; // Xanh dương nhạt
      case 'tip': return { icon: IconBulb, bg: '#DCFCE7', color: '#16A34A' }; // Xanh lá nhạt
      case 'lucky': return { icon: IconStar, bg: '#FEF9C3', color: '#CA8A04' }; // Vàng nhạt
      case 'system': return { icon: IconDownload, bg: colors.palette.neutral200, color: colors.palette.neutral600 };
      default: return { icon: IconBill, bg: colors.palette.neutral100, color: colors.text };
    }
  };

  // Helper: Group data by section (để render tuần tự)
  const groupedData = ['HÔM NAY', 'HÔM QUA', 'CŨ HƠN'].map(section => ({
    title: section,
    data: NOTIFICATION_DATA.filter(item => item.section === section)
  })).filter(group => group.data.length > 0);


  const renderNotificationItem = (item: NotificationItem) => {
    const { icon: Icon, bg, color } = getIconConfig(item.type);

    // Style động cho item chưa đọc
    const wrapperStyle = themed([
      $itemWrapper,
      !item.isRead && $itemWrapperUnread
    ]);

    return (
      <TouchableOpacity key={item.id} style={wrapperStyle} activeOpacity={0.7}>
        {/* Chỉ thị chưa đọc (Red vertical line) */}
        {!item.isRead && <View style={themed($unreadIndicator)} />}

        {/* Icon Circle */}
        <View style={[themed($iconCircle), { backgroundColor: bg }]}>
          <Icon width={24} height={24} color={color} />
        </View>

        {/* Content */}
        <View style={themed($contentContainer)}>
          <View style={themed($contentHeader)}>
            <Text
              text={item.title}
              weight={!item.isRead ? 'bold' : 'semiBold'}
              size="md"
              numberOfLines={1}
              style={{ flex: 1, marginRight: spacing.xs }}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Badge nhỏ đỏ nếu chưa đọc */}
              {!item.isRead && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginRight: 4 }} />}
              <Text
                text={item.time}
                size="xs"
                weight={!item.isRead ? 'bold' : 'medium'}
                style={{ color: !item.isRead ? colors.primary : colors.palette.neutral500 }}
              />
            </View>
          </View>

          <Text
            text={item.description}
            size="xs"
            weight='medium'
            style={{ color: colors.palette.neutral600, marginTop: 2 }}
            numberOfLines={2}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Header
        title="Thông báo"
        LeftActionComponent={
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.5}>
            <IconBack width={24} height={24} color={colors.text} />
          </TouchableOpacity>
        }
        RightActionComponent={
          <TouchableOpacity onPress={() => { }} activeOpacity={0.5}>
            <Text text="Đọc tất cả" weight="bold" size="sm" style={{ color: colors.primary }} />
          </TouchableOpacity>
        }
        safeAreaEdges={["top"]}
        backgroundColor={colors.background}
        containerStyle={{ paddingHorizontal: spacing.md, backgroundColor: colors.surface }}
        titleStyle={{ color: colors.text, fontWeight: "bold", fontSize: 18 }}
      />

      <Screen preset="scroll" contentContainerStyle={themed($screenContainer)}>

        {/* Filter Tabs */}
        <View style={{ marginBottom: spacing.md }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: 2 }}>
            {FILTER_TABS.map(tab => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={themed([$tabButton, isActive && $tabButtonActive])}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text
                    text={tab}
                    weight={isActive ? 'bold' : 'medium'}
                    size="xs"
                    style={{ color: isActive ? colors.surface : colors.text }}
                  />
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {/* Notification Lists by Section */}
        {groupedData.map((group, index) => (
          <View key={index} style={{ marginBottom: spacing.lg }}>
            <Text text={group.title} weight="medium" size="xs" style={themed($sectionHeader)} />
            <View style={{ gap: spacing.sm }}>
              {group.data.map(renderNotificationItem)}
            </View>
          </View>
        ))}

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

// --- Tabs ---
const $tabButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingVertical: spacing.xs + 2,
  paddingHorizontal: spacing.md,
  borderRadius: spacing.lg,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
});

const $tabButtonActive: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.primary,
  borderColor: colors.primary,
});

// --- Section ---
const $sectionHeader: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  color: colors.palette.neutral500,
  marginBottom: spacing.sm,
  textTransform: 'uppercase',
});

// --- Item Card ---
const $itemWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: 'row',
  backgroundColor: colors.surface,
  borderRadius: spacing.md,
  padding: spacing.md,
  alignItems: 'center',
  // Shadow
  shadowColor: colors.palette.neutral300,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 3,
  elevation: 2,
  overflow: 'hidden', // Để bo góc cho indicator
  position: 'relative',
});

const $itemWrapperUnread: ThemedStyle<ViewStyle> = ({ colors }) => ({
  // Có thể thêm style đặc biệt nếu muốn card chưa đọc nổi bật hơn
  backgroundColor: colors.surface,
});

const $unreadIndicator: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: 4,
  backgroundColor: colors.primary, // Vạch đỏ bên trái
});

const $iconCircle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: 48,
  height: 48,
  borderRadius: 24,
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: spacing.sm,
  marginLeft: spacing.xs, // Padding nhẹ để tách khỏi vạch đỏ
});

const $contentContainer: ThemedStyle<ViewStyle> = ({ }) => ({
  flex: 1,
  justifyContent: 'center',
});

const $contentHeader: ThemedStyle<ViewStyle> = ({ }) => ({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 2,
});