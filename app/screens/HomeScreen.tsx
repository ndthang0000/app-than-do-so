// Create HomeScreen.tsx
import React, { useState } from 'react';
import { View, ViewStyle, TextStyle, TouchableOpacity, Image, ImageStyle } from 'react-native';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { HomeTabScreenProps } from '@/navigators/navigationTypes';
import { Screen } from '@/components/Screen';
import { $styles } from '@/theme/styles';
import { Text } from "@/components/Text"
import { Header } from '@/components/Header';
import IconBellNoti from "@assets/svg/bell-noti.svg";
import IconMammon from "@assets/svg/mammon.svg";
import IconScan from "@assets/svg/scan.svg";
import IconArrowRight from "@assets/svg/arrow-right.svg";
import IconStatistic from "@assets/svg/statistic.svg";
import IconFind from "@assets/svg/find.svg";
import { formatDate, getDayOfWeek } from '@/utils/formatDate';
import { dataSubMenu, getStatusTag, REGION_DATA } from '@/constants/homeConstants';
import { Region } from '@/constants/lotteryTicket';



export const HomeScreen: React.FC<HomeTabScreenProps<'Home'>> = function HomeScreen(_props) {
  const { themed, theme: { colors, spacing } } = useAppTheme();
  const { navigation } = _props

  const [lotteryResults, setLotteryResults] = useState({
    MB: { db: '87244', comment: 'Lô 48 lại về lần thứ 3 liên tiếp' },
    MT: { db: '567834', comment: 'Hôm nay lô về nhiều đầu chẵn' },
    MN: { db: '769534', comment: 'Kết quả mới cập nhật' },
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
        LeftActionComponent={<IconMammon width={50} height={50} />}
        safeAreaEdges={["top"]}
        backgroundColor={colors.background}
        RightActionComponent={<BellPressableIcon />}
        containerStyle={{ paddingHorizontal: spacing.md, backgroundColor: colors.surface }}
        titleStyle={{ color: colors.text, fontWeight: "semibold", fontSize: 20 }}
      />
      <Screen preset="scroll" contentContainerStyle={$styles.container}>
        <TouchableOpacity style={themed($scanWrapper)} activeOpacity={0.7} onPress={() => navigation.navigate('Scan')}>
          <IconScan width={80} height={80} />
          <Text text='Scan ảnh vé số' weight='bold' size="lg" />
          <Text text='Bạn sẽ nhận thông báo ngay khi có kết quả' preset='default' weight='light' style={{ textAlign: 'center' }} />
        </TouchableOpacity>
        <View style={themed($subMenuWrapper)}>
          {dataSubMenu.map(({ icon: Icon, label, navigate }) => (
            <TouchableOpacity key={label} style={themed($subMenuItemWrapper)} activeOpacity={0.7} onPress={() => navigation.navigate(navigate as any, {})}>
              <View style={themed($iconWrapper)}>
                <Icon width={20} height={20} color={colors.primary} />
              </View>
              <Text text={label} weight='bold' size="sm" />
            </TouchableOpacity>
          ))}

        </View>

        {/* Kết quả hôm nay */}
        <View style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>
          <Text
            text={`Kết quả hôm nay: ${getDayOfWeek(new Date())}, ${formatDate(new Date())}`}
            size='lg'
            weight='bold'
            numberOfLines={1}
            adjustsFontSizeToFit={true}
          />
        </View>

        {/* 3 Miền Bắc Trung Nam */}
        <View style={{ flexDirection: 'column', gap: spacing.md, marginBottom: spacing.md }}>
          {REGION_DATA.map((region) => {
            const result = lotteryResults[region.regionCode as keyof typeof lotteryResults] // Lấy data tương ứng từ state
            const statusTag = getStatusTag(region.id as Region);
            return (
              <TouchableOpacity
                key={region.id}
                style={themed($resultItemWrapper)}
                onPress={() => navigation.navigate("Result", {})}
              >
                {/* Khối hình ảnh và tên miền */}
                <View>
                  <Image
                    source={region.image}
                    resizeMode="contain"
                    style={themed($imageRegion)}
                  />
                  <Text
                    text={region.name}
                    style={themed([$textRegion, { color: region.color, textAlign: 'center' }])}
                  />
                </View>


                <View style={{ flex: 1, justifyContent: 'space-between', paddingLeft: spacing.sm }}>
                  <View>

                    <Text text='Giải ĐB:' weight='light' style={themed($textDB)}>
                      <Text
                        text={' ' + (result?.db || '------')}
                        weight='bold'
                        style={themed($textRedDB)}
                      />
                    </Text>
                  </View>
                  <View>
                    <Text
                      text={result?.comment || 'Đang cập nhật...'}
                      weight='light'
                      style={themed($textComment)}
                      numberOfLines={1}
                    />
                  </View>
                </View>
                <View style={themed([$tagWrapper, { backgroundColor: statusTag.bgColor, borderColor: statusTag.borderColor, }])}>
                  <Text text={statusTag.label} style={{ color: statusTag.color, fontSize: 10, fontWeight: 'bold' }} />
                </View>
                <View>
                  <IconArrowRight width={16} height={16} />
                </View>

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
  paddingVertical: spacing.md,
  justifyContent: 'center',
  gap: spacing.xxxs,
  //box shadow
  shadowColor: colors.palette.neutral600,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
})

const $subMenuWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  marginTop: spacing.md,
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
  gap: spacing.xxxs,
  paddingVertical: spacing.md,
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
  paddingVertical: spacing.md,
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


const $textRegion: ThemedStyle<TextStyle> = ({ }) => ({
  fontWeight: "700",
  fontSize: 16,
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