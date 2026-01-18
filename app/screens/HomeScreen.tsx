// Create HomeScreen.tsx
import React, { useRef, useState, useEffect } from 'react';
import { View, ViewStyle, TextStyle, TouchableOpacity, Image, ImageStyle } from 'react-native';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { HomeTabScreenProps } from '@/navigators/navigationTypes';
import { Screen } from '@/components/Screen';
import { $styles } from '@/theme/styles';
import { Text } from "@/components/Text"
import { Header } from '@/components/Header';
import IconBellNoti from "@assets/svg/bell-noti.svg";
import IconScan from "@assets/svg/scan.svg";
import IconArrowRight from "@assets/svg/arrow-right.svg";
import IconStatistic from "@assets/svg/statistic.svg";
import IconFind from "@assets/svg/find.svg";
import { formatDate, getDayOfWeek } from '@/utils/formatDate';
import { dataSubMenu, getStatusTag, REGION_DATA } from '@/constants/homeConstants';
import { Region } from '@/constants/lotteryTicket';
import { Animated, Easing } from 'react-native';



export const HomeScreen: React.FC<HomeTabScreenProps<'Home'>> = function HomeScreen(_props) {
  const { themed, theme: { colors, spacing } } = useAppTheme();
  const { navigation } = _props

  const scanAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        // Chạy từ vị trí 1/4 xuống 3/4 của icon (tổng cộng 1/2 chiều cao)
        Animated.timing(scanAnim, {
          toValue: 1, // Chúng ta dùng giá trị từ 0 đến 1 để nội suy (interpolate) cho dễ
          duration: 3000, // 3 giây để chạy xuống -> rất chậm và chuyên nghiệp
          easing: Easing.inOut(Easing.sin), // Chạy mượt ở hai đầu
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 3000, // 3 giây để chạy lên
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const [lotteryResults] = useState({
    MB: [{ province: 'Hà Nội', db: '87244' }],
    MT: [
      { province: 'Đà Nẵng', db: '567834' },
      { province: 'Khánh Hòa', db: '112233' }
    ],
    MN: [
      { province: 'TP.HCM', db: '769534' },
      { province: 'Long An', db: '445566' },
      { province: 'Tiền Giang', db: '998877' }
    ],
  });

  // Nội suy vị trí di chuyển
  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 60], // Chỉ chạy trong khoảng giữa từ 20px đến 60px
  });

  // Nội suy độ mờ (tùy chọn: nhạt dần khi ở hai đầu và đậm ở giữa)
  const opacity = scanAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });


  const BellPressableIcon = () => {
    return (
      <TouchableOpacity onPress={() => navigation.navigate('Notification')} activeOpacity={0.5}>
        <IconBellNoti width={60} height={60} />
      </TouchableOpacity>
    )
  }

  return (
    <>
      <Header
        title="Thần dò số"
        LeftActionComponent={<Image source={require('@assets/images/app-icon-android-adaptive-foreground.png')} style={{ width: 55, height: 55 }} />}
        safeAreaEdges={["top"]}
        backgroundColor={colors.background}
        RightActionComponent={<BellPressableIcon />}
        containerStyle={{ paddingHorizontal: spacing.md, backgroundColor: colors.surface }}
        titleStyle={{ color: colors.text, fontWeight: "semibold", fontSize: 20 }}
      />
      <Screen preset="scroll" contentContainerStyle={$styles.container}>
        <TouchableOpacity style={themed($scanWrapper)} activeOpacity={0.7} onPress={() => navigation.navigate('Scan')}>
          <View style={themed($iconScanContainer)}>
            <IconScan width={80} height={80} />

            <Animated.View
              style={[
                themed($scanLine),
                {
                  transform: [{ translateY }],
                  opacity, // Thêm hiệu ứng mờ ảo
                  backgroundColor: colors.primary
                }
              ]}
            />
          </View>
          <Text text='Scan ảnh vé số' weight='bold' size="lg" />
          <Text text='Bạn sẽ nhận kết quả ngay lập tức' preset='default' weight='light' style={{ textAlign: 'center' }} />
        </TouchableOpacity>
        <View style={themed($subMenuWrapper)}>
          {dataSubMenu.map(({ icon: Icon, label, navigate }) => (
            <TouchableOpacity key={label} style={themed($subMenuItemWrapper)} activeOpacity={0.7} onPress={() => navigation.navigate(navigate as any, {})}>
              <View style={themed($iconWrapper)}>
                <Icon width={20} height={20} color={colors.primary} />
                {label === 'Lịch xổ số' && (
                  <View style={themed($badge)}>
                    <Text text="3" style={themed($badgeText)} />
                  </View>
                )}
              </View>
              <Text text={label} weight='bold' size="sm" />
            </TouchableOpacity>
          ))}

        </View>

        <View style={{ marginTop: spacing.sm, marginBottom: spacing.xxs }}>
          <Text
            text={`Kết quả hôm nay: ${getDayOfWeek(new Date())}, ${formatDate(new Date())}`}
            size='lg'
            weight='bold'
            numberOfLines={1}
            adjustsFontSizeToFit={true}
          />
        </View>

        <View style={{ flexDirection: 'column', gap: spacing.xs, marginBottom: spacing.sm }}>
          {REGION_DATA.map((region) => {
            const provinces = lotteryResults[region.regionCode as keyof typeof lotteryResults];
            const statusTag = getStatusTag(region.id as Region);

            return (
              <TouchableOpacity key={region.id} style={themed($resultItemWrapper)} onPress={() => navigation.navigate("Result", {})}>
                <View style={{ alignItems: 'center' }}>
                  <Image source={region.image} resizeMode="contain" style={themed($imageRegion)} />
                  <Text text={region.name} style={themed([$textRegion, { color: region.color }])} />
                </View>

                <View style={{ flex: 1, paddingLeft: spacing.xs }}>
                  {provinces.map((item, idx) => (
                    <View key={idx} style={themed($provinceRow)}>
                      <Text text={item.province} size="xs" weight="medium" style={{ color: colors.textDim, width: 65 }} numberOfLines={1} />
                      <Text text={item.db} weight="bold" style={themed($textRedDBSmall)} />
                    </View>
                  ))}
                </View>

                <View style={themed([$tagWrapper, { backgroundColor: statusTag.bgColor, borderColor: statusTag.borderColor }])}>
                  <Text text={statusTag.label} style={{ color: statusTag.color, fontSize: 9, fontWeight: 'bold' }} />
                </View>
                <IconArrowRight width={14} height={14} />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>
          <Text text={`Công cụ hỗ trợ`} size='lg' weight='bold' />
        </View>
        <TouchableOpacity style={themed($toolItemWrapper)} activeOpacity={0.5}>
          <View style={themed($toolItemTopWrapper)}>
            <IconStatistic width={25} height={25} />
            <Text text='Thống kê nâng cao' weight='bold' size="md" />
          </View>
          <Text text='Xem thống kê, phân tích tần suất lô chi tiết' />
        </TouchableOpacity>
        <TouchableOpacity style={themed($toolItemWrapper)} activeOpacity={0.5}>
          <View style={themed($toolItemTopWrapper)}>
            <IconFind width={25} height={25} />
            <Text text='Tra cứu bộ lô tô' weight='bold' size="md" />
          </View>
          <Text text='Tra cứu nhanh bộ số lô tô trong phạm vi thời gian dài' />
        </TouchableOpacity>
      </Screen>
    </>

  );
}

const $scanWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  borderRadius: spacing.lg,
  backgroundColor: colors.surface,
  flexDirection: 'column',
  alignItems: 'center',
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  justifyContent: 'center',
  //box shadow
  shadowColor: colors.palette.neutral600,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
})

const $subMenuWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  marginTop: spacing.sm,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing.sm,

})

const $subMenuItemWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.surface,
  borderRadius: spacing.md,
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingVertical: spacing.sm,
  //box shadow
  shadowColor: colors.palette.neutral400,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
})

const $iconWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  height: 50,
  width: 50,
  borderRadius: 25,
  backgroundColor: colors.palette.primary100,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: spacing.xs,
})



// ============ For result Bắc, Trung, Nam ============

const $resultItemWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.surface,
  borderRadius: spacing.md,
  flexDirection: 'row',
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.sm,
  alignItems: 'center',
  gap: spacing.sm,
  position: 'relative',
  //box shadow
  shadowColor: colors.palette.neutral400,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
})


const $textDB: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontWeight: "600",
  fontSize: 18,
})
const $textRedDB: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontWeight: "700",
  fontSize: 24,
  color: colors.palette.primary400,
})

const $textComment: ThemedStyle<TextStyle> = ({ }) => ({
  fontWeight: "400",
  fontSize: 14,
})

// ============ ToolItem Wrapper ============
const $toolItemWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.surface,
  borderRadius: spacing.lg,
  flexDirection: 'column',
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.md,
  gap: spacing.xs,
  //box shadow
  shadowColor: colors.palette.neutral500,
  shadowOffset: { width: 1, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
  marginBottom: spacing.md,
})

const $toolItemTopWrapper: ThemedStyle<TextStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  gap: spacing.sm
})

const $imageRegion: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  height: 50,
  width: 60,
  borderRadius: spacing.md,
})

const $tagWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  position: 'absolute',
  top: 6,
  right: 6,
  backgroundColor: colors.palette.neutral200,
  paddingHorizontal: spacing.sm,
  paddingVertical: 1,
  borderRadius: spacing.md,
  borderColor: colors.palette.neutral300,
  borderWidth: 1,
})

const $badge: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: 'absolute',
  top: -2,
  right: -2,
  backgroundColor: colors.palette.primary500,
  borderRadius: 10,
  width: 20,
  height: 20,
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 1.5,
  borderColor: colors.surface,
})

const $badgeText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.accent400,
  fontSize: 11,
  fontWeight: 'bold',
  lineHeight: 11,
})

const $iconScanContainer: ThemedStyle<ViewStyle> = () => ({
  width: 80,
  height: 80,
  position: 'relative',
  overflow: 'hidden', // Quan trọng nhất: Cắt bỏ phần line thừa khi nó chạy ra ngoài 80px
  marginBottom: 8,
  borderRadius: 40,
})

const $scanLine: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 3, // Độ dày thanh quét
  zIndex: 10,
  // Hiệu ứng phát sáng
  shadowColor: colors.primary,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 1,
  shadowRadius: 10,
  elevation: 8,
})

const $provinceRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 2,
  gap: spacing.xxs,
})

const $textRedDBSmall: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16, // Nhỏ hơn giải ĐB cũ để xếp được nhiều đài
  color: colors.palette.primary400,
})

const $textRegion: ThemedStyle<TextStyle> = () => ({
  fontWeight: "700",
  fontSize: 14, // Giảm nhẹ size để cân đối với list đài
  textAlign: 'center'
})