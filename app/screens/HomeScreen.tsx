// Create HomeScreen.tsx
import React from 'react';
import { View, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
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
import IconManualInput from "@assets/svg/input-manual.svg";
import IconMyTicket from "@assets/svg/my-ticket.svg";
import IconCalendar from "@assets/svg/calendar.svg";
import IconArrowRight from "@assets/svg/arrow-right.svg";
import IconStatistic from "@assets/svg/statistic.svg";
import IconFind from "@assets/svg/find.svg";
import { formatDate } from '@/utils/formatDate';

const dataSubMenu = [
  {
    icon: IconManualInput,
    label: 'Nhập vé',
    navigate: 'Scan',
  },
  {
    icon: IconMyTicket,
    label: 'Vé của tôi',
    navigate: 'MyTicket',
  },
  {
    icon: IconCalendar,
    label: 'Lịch xổ số',
    navigate: 'Result',
  },
]


export const HomeScreen: React.FC<HomeTabScreenProps<'Home'>> = function HomeScreen(_props) {
  const { themed, theme: { colors, spacing } } = useAppTheme();
  const { navigation } = _props

  const BellPressableIcon = () => {
    return (
      <TouchableOpacity onPress={() => console.log('navigate to notifications')} activeOpacity={0.5}>
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
        <View style={themed($scanWrapper)}>
          <IconScan width={80} height={80} />
          <Text text='Scan ảnh vé số' weight='bold' size="lg" />
          <Text text='Bạn sẽ nhận thông báo ngay khi có kết quả' preset='default' weight='light' style={{ textAlign: 'center' }} />
        </View>
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
          <Text text={`Kết quả hôm nay: ${formatDate(`2025-05-05`)}`} size='lg' weight='bold' />
        </View>

        {/* 3 Miền Bắc Trung Nam */}
        <View style={{ flexDirection: 'column', gap: spacing.md, marginBottom: spacing.md }}>
          <View style={themed($resultItemWrapper)}>
            <View style={themed([$nameRegionWrapper, { backgroundColor: "#ededb6ff" }])}>
              <Text text='Bắc' style={themed([$textRegion, { color: "#e1ab07ff" }])} />
            </View>
            <View style={{ flex: 1, justifyContent: 'space-between' }}>
              <View>
                <Text text='Giải Đặc biệt:' weight='light' style={themed($textDB)}>
                  <Text text={' ' + `897244`} weight='bold' style={themed($textRedDB)} />
                </Text>
              </View>
              <View>
                <Text text='Lô 48 lại về lần thứ 3 liên tiếp' weight='light' style={themed($textComment)} />
              </View>
            </View>
            <View>
              <IconArrowRight width={16} height={16} />
            </View>
          </View>
          <View style={themed($resultItemWrapper)}>
            <View style={themed([$nameRegionWrapper, { backgroundColor: "#DBEAFE" }])}>
              <Text text='Trung' style={themed([$textRegion, { color: "#2563EB" }])} />
            </View>
            <View style={{ flex: 1, justifyContent: 'space-between' }}>
              <View>
                <Text text='Giải Đặc biệt:' weight='light' style={themed($textDB)}>
                  <Text text={' ' + `897244`} weight='bold' style={themed($textRedDB)} />
                </Text>
              </View>
              <View>
                <Text text='Hôm nay lô về nhiều đầu chẵn' weight='light' style={themed($textComment)} />
              </View>
            </View>
            <View>
              <IconArrowRight width={16} height={16} />
            </View>
          </View>
          <View style={themed($resultItemWrapper)}>
            <View style={themed([$nameRegionWrapper, { backgroundColor: "#DCFCE7" }])}>
              <Text text='Nam' style={themed([$textRegion, { color: "#16A34A" }])} />
            </View>
            <View style={{ flex: 1, justifyContent: 'space-between' }}>
              <View>
                <Text text='Giải Đặc biệt:' weight='light' style={themed($textDB)}>
                  <Text text={' ' + `897244`} weight='bold' style={themed($textRedDB)} />
                </Text>
              </View>
              <View>
                <Text text='Lô 48 lại về lần thứ 3 liên tiếp' weight='light' style={themed($textComment)} />
              </View>
            </View>
            <View>
              <IconArrowRight width={16} height={16} />
            </View>
          </View>
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
  //box shadow
  shadowColor: colors.palette.neutral400,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
})

const $nameRegionWrapper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: spacing.lg,
  height: 70,
  width: 70,
})

const $textRegion: ThemedStyle<TextStyle> = ({ }) => ({
  fontWeight: "700",
  fontSize: 20,
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