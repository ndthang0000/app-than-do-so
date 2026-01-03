import React, { useEffect } from 'react';
import { View, ViewStyle, TextStyle, TouchableOpacity, Image, ImageStyle, ViewProps } from 'react-native';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { AppStackScreenProps } from '@/navigators/navigationTypes';
import { Screen } from '@/components/Screen';
import { $styles } from '@/theme/styles';
import { Text } from "@/components/Text";
import { useAppDispatch } from '@/store';
import { useSafeAreaInsetsStyle } from "@/utils/useSafeAreaInsetsStyle"

import IconScanRed from "@assets/svg/scan.svg";
import IconChartRed from "@assets/svg/statistic.svg";
import IconLiveTV from "@assets/svg/live-tv.svg";
import IconBell from "@assets/svg/bell-active.svg";
import IconDraw from "@assets/svg/draw-lottery.svg";
import IconTicket from "@assets/svg/my-ticket.svg";
import IconCozy from "@assets/svg/cozy.svg";
import IconWandStar from "@assets/svg/wand-stars.svg";
import { loginByDevice } from '@/store/slices/authSlice';

export const WelcomeScreen: React.FC<AppStackScreenProps<'Welcome'>> = function WelcomeScreen(_props) {
  const { themed, theme: { colors, spacing } } = useAppTheme();
  const dispatch = useAppDispatch();
  const { navigation } = _props;

  const $containerInsets = useSafeAreaInsetsStyle(["top", "bottom"])

  const handleStart = async () => {
    try {
      // Gọi action login tự động đã thảo luận
      await dispatch(loginByDevice()).unwrap();
      // Sau khi có deviceId user, nhảy vào Main
      navigation.replace("Main", { screen: 'Home' });
    } catch (error) {
      console.log("Auto login failed", error);
    }
  };

  return (
    <View style={[$styles.container, $containerInsets, { flex: 1 }]}>

      {/* TOP #1 Badge */}
      <View style={themed($badgeWrapper)}>
        <View style={themed($topBadge)}>
          <Text text="🛡️ TOP ỨNG DỤNG XỔ SỐ" style={themed($badgeText)} size="xxs" weight="bold" />
        </View>
      </View>

      {/* Main Title */}
      <View style={themed($titleSection)}>
        <Text text="Thần Dò Số " size="xxl" weight="bold" style={themed($textRed)} />
        {/* <Text text="Vận May Trong Tay" size="xxl" weight="bold" style={themed($textRed)} /> */}
        <Text
          text="Ứng dụng AI hỗ trợ dò vé số, thống kê và dự đoán vận may chuẩn xác nhất."
          style={themed($subTitle)}
        />
      </View>

      {/* Hero Image Card */}
      <View style={themed($heroCard)}>
        <Image 
          source={require("@assets/images/welcome-bg.png")}
          style={themed($heroImage)}
          resizeMode="cover"
        />
        <View style={themed($jackpotTag)}>
          <Text text="Xổ Số Kiến Thiết, ₿Jackpot" size="xs" weight="bold" style={{ color: colors.palette.neutral900 }} />
        </View>
      </View>



      {/* Feature List Section */}
      <View style={{ marginTop: spacing.xl }}>
        <View style={themed($sectionHeader)}>
          <View style={themed($redBar)} />
          <Text text="Các tính năng chính" weight="bold" size="md" />
        </View>

        {/* Action Tabs Row */}
        <View style={themed($tabRow)}>
          <WelcomeTab Icon={IconScanRed} label="Scan AI" color="#28d25bff" />
          <WelcomeTab Icon={IconLiveTV} label="Trực Tiếp" color="#FF0000" />
          <WelcomeTab Icon={IconWandStar} label="Giải mã Giấc mơ" color="#FF0000" />
          <WelcomeTab Icon={IconChartRed} label="Thống Kê" color="#a855f7" />
          <WelcomeTab Icon={IconTicket} label="Quản lý vé" color="#0d9488" />
          <WelcomeTab Icon={IconBell} label="Thông báo" color="#f97316" />
          <WelcomeTab Icon={IconDraw} label="Quay thử" color="#f43f5e" />
          <WelcomeTab Icon={IconCozy} label="Công cụ nâng cao" color="#FF0000" />
        </View>
      </View>

      {/* Premium Card */}
      <TouchableOpacity style={themed($premiumCard)} activeOpacity={0.8} disabled={true}>
        <View style={themed($premiumLeft)}>
          <View style={themed($starCircle)}>
            <Text text="⭐" size="xxs" />
          </View>
          <View style={{ marginLeft: spacing.sm }}>
            <Text text="PREMIUM" size="xxs" weight="bold" style={{ color: colors.palette.primary300 }} />
            <Text text="Nhận số may mắn mỗi ngày" size="xs" style={{ color: colors.palette.neutral100 }} />
          </View>
        </View>
      </TouchableOpacity>

      {/* Fixed Bottom Button */}
      <View style={themed($bottomWrapper)}>
        <TouchableOpacity
          style={themed($btnStart)}
          onPress={handleStart}
          activeOpacity={0.9}
        >
          <Text text="Khám Phá Ngay 🚀" weight="bold" style={{ color: colors.palette.neutral100 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Sub Components ---

const WelcomeTab = ({ Icon, label, color }: { Icon: any, label: string, color: string }) => {
  const { themed } = useAppTheme();
  return (
    <View style={themed($tabItem)}>
      <Icon width={20} height={20} color={color} />
      <Text text={label} size="xs" weight="bold" />
    </View>
  );
};

const FeatureItem = ({ title, desc }: { title: string, desc: string }) => {
  const { themed } = useAppTheme();
  return (
    <View style={themed($featureCard)}>
      <View style={themed($featureIconBg)} />
      <Text text={title} weight="bold" size="sm" style={{ marginTop: 8 }} />
      <Text text={desc} size="xxs" style={{ opacity: 0.6, marginTop: 4 }} />
    </View>
  );
};

// --- Styles ---

const $contentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
  paddingBottom: 120, // Chừa chỗ cho nút fix bottom
});

const $badgeWrapper: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: 'center',
  marginTop: spacing.md,
});

const $topBadge: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary100,
  paddingHorizontal: spacing.sm,
  paddingVertical: 4,
  borderRadius: spacing.md,
});

const $badgeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary500,
});

const $titleSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  alignItems: 'center',
});

const $textRed: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary500,
  textAlign: 'center',
});


const $subTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  textAlign: 'center',
  opacity: 0.5,
  fontSize: 13,
  marginTop: spacing.xs,
  paddingHorizontal: spacing.lg,
});

const $heroCard: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  height: 220,
  borderRadius: spacing.lg,
  backgroundColor: colors.palette.primary500,
  marginTop: spacing.lg,
  overflow: 'hidden',
  elevation: 5,
  shadowColor: colors.palette.neutral900,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
});

const $heroImage: ThemedStyle<ImageStyle> = () => ({
  width: '100%',
  height: '100%',
});

const $jackpotTag: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: 'absolute',
  bottom: 12,
  left: 12,
  backgroundColor: '#FFFFFFEE',
  paddingHorizontal: spacing.sm,
  paddingVertical: 6,
  borderRadius: spacing.sm,
});

const $tabRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',       // Sắp xếp theo hàng ngang
  flexWrap: 'wrap',           // Tự động xuống dòng khi hết chiều rộng
  alignItems: 'center',
  marginTop: spacing.sm,
  gap: 10,                     // Khoảng cách giữa các phần tử (cả ngang và dọc) là 6px
});

const $tabItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  backgroundColor: colors.surface,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderRadius: 100,
  elevation: 3,
});

const $sectionHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
});

const $redBar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 4,
  height: 18,
  backgroundColor: colors.palette.primary500,
  borderRadius: 2,
});

const $featureRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  gap: spacing.md,
  marginTop: spacing.sm,
});

const $featureCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: colors.surface,
  borderRadius: spacing.md,
  padding: spacing.md,
  elevation: 3,
});

const $featureIconBg: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 32,
  height: 32,
  borderRadius: 8,
  backgroundColor: colors.palette.primary100, // Placeholder cho icon đỏ mờ
});

const $premiumCard: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginTop: spacing.xl,
  backgroundColor: colors.palette.neutral800,
  borderRadius: spacing.md,
  padding: spacing.md,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const $premiumLeft: ThemedStyle<ViewStyle> = () => ({
  flexDirection: 'row',
  alignItems: 'center',
});

const $starCircle: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 30,
  height: 30,
  borderRadius: 15,
  backgroundColor: colors.palette.neutral700,
  alignItems: 'center',
  justifyContent: 'center',
});

const $arrowCircle: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: colors.palette.neutral700,
  alignItems: 'center',
  justifyContent: 'center',
});

const $bottomWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  position: 'absolute',
  bottom: 10,
  left: 0,
  right: 0,
  padding: spacing.md,
  backgroundColor: colors.background,
});

const $btnStart: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary500,
  height: 56,
  borderRadius: spacing.md,
  alignItems: 'center',
  justifyContent: 'center',
});