import { ThemedStyle } from "@/theme/types";
import { ScrollView, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";
import { Text } from "../Text";
import { Switch } from "../Toggle/Switch";
import { useAppTheme } from "@/theme/context";
import { useAppDispatch, useAppSelector } from "@/store";
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import IconBell from "@assets/svg/bell-active.svg";
import IconClose from "@assets/svg/close.svg";
import IconVoice from "@assets/svg/voice-on.svg";
import IconTable from "@assets/svg/table.svg";
import IconHead from "@assets/svg/palette.svg"; // Giả định icon đầu
import IconTail from "@assets/svg/palette.svg"; // Giả định icon đuôi
import IconMusic from "@assets/svg/music.svg";
import IconDownload from "@assets/svg/download.svg";
import IconShare from "@assets/svg/share.svg";
import { forwardRef, useCallback, useMemo } from "react";
import { optimisticUpdateAppSetting, optimisticUpdateNotiSetting, updateUserProfile } from '@/store/slices/authSlice';
import Toast from "react-native-toast-message";
import { syncNotificationSettings } from "@/services/notificationService";

// --- SUB-COMPONENTS (Tách ra để code chính gọn hơn) ---

const fontSizes = [
  { label: 'Nhỏ', value: 'SMALL', size: 'xs' },
  { label: 'Vừa', value: 'MEDIUM', size: 'md' },
  { label: 'Lớn', value: 'LARGE', size: 'xl' },
]

const SettingRow = ({ icon: Icon, label, value, onToggle, themed, colors, disabled }: any) => (
  <View style={themed($settingRow)}>
    <View style={$rowLeft}>
      <View style={themed($iconWrapper)}>
        {Icon && <Icon width={22} height={22} color="#D90404" />}
      </View>
      <Text text={label} size="md" weight="medium" style={{ color: colors.text }} />
    </View>
    <Switch
      value={!!value}
      disabled={disabled}
      onValueChange={onToggle}
    />
  </View>
);

const NumberSelector = ({ label, icon: Icon, selectedNumbers, onSelect, themed, disabled }: any) => (
  <View style={themed($selectorWrapper)}>
    <View style={$selectorHeader}>
      <View style={themed($iconWrapperSmall)}>
        {Icon && <Icon width={24} height={24} color="#D90404" />}
      </View>
      <Text text={label} size="md" weight="medium" />
    </View>

    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 10, paddingHorizontal: 4 }}
      pointerEvents={disabled ? "none" : "auto"}
    >
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
        const isActive = selectedNumbers.includes(num);
        return (
          <TouchableOpacity
            key={num}
            onPress={() => onSelect(num)}
            style={[$numberCircle, isActive && $numberCircleActive, { opacity: disabled ? 0.6 : 1 }]}
          >
            <Text
              text={num.toString()}
              style={{ color: isActive ? '#FFF' : '#333' }}
              weight="bold"
            />
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  </View>
);

export const ResultSettingsSheet = forwardRef((_, ref: any) => {
  const { themed, theme: { colors } } = useAppTheme();
  const dispatch = useAppDispatch();
  const notiSettings = useAppSelector(state => state.auth.user?.settingNotifications);
  const appSettings = useAppSelector(state => state.auth.user?.settingApp);
  const isUpdating = useAppSelector(state => state.auth.isUpdating);
  const snapPoints = useMemo(() => ['75%'], []);

  const handleUpdateAppSetting = (newFields: any) => {
    if (isUpdating) return;
    const payload = {
      settingApp: { ...appSettings, ...newFields }
    };
    //close bottom sheet after update
    ref.current?.close();
    dispatch(optimisticUpdateAppSetting(newFields));
    dispatch(updateUserProfile(payload));
  };

  // Xử lý thông báo (Luồng riêng qua service đồng bộ Firebase)
  const handleToggleNotification = async (key: string, value: boolean) => {
    if (isUpdating) return;
    try {
      dispatch(optimisticUpdateNotiSetting({ [key]: value }));
      await syncNotificationSettings(dispatch, notiSettings, { [key]: value });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Lỗi đồng bộ thông báo' });
    }
  };

  // Xử lý chọn số Highlight
  const handleToggleHighlight = (num: string, key: 'highlightHead' | 'highlightTail') => {
    const current = appSettings?.[key] || [];
    // Model của bạn dùng mảng số [1, 2, 3] nên không cần toString()
    const newList = current.includes(num)
      ? current.filter(n => n !== num)
      : [...current, num];

    handleUpdateAppSetting({ [key]: newList });
  };

  const renderBackdrop = useCallback((p: any) => (
    <BottomSheetBackdrop {...p} disappearsAtIndex={-1} appearsAtIndex={0} opacity={0.3} />
  ), []);

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      detached={false}
      handleIndicatorStyle={{ backgroundColor: '#E0E0E0', width: 60 }}
      topInset={100}
    >
      <View style={themed($sheetHeader)}>
        <Text text="Cài đặt" size="xl" weight="bold" />
        <TouchableOpacity onPress={() => ref.current?.close()}>
          <View style={themed($closeBtn)}>
            <IconClose width={20} height={20} color={colors.palette.neutral400} />
          </View>
        </TouchableOpacity>
      </View>

      <BottomSheetScrollView contentContainerStyle={themed($scrollContent)}>
        <Text text="THÔNG BÁO KẾT QUẢ" style={themed($sectionLabel)} />
        <View style={themed($card)}>
          <SettingRow label="Miền Bắc" icon={IconBell} value={notiSettings?.northResult} themed={themed} colors={colors}
            onToggle={(val: any) => handleToggleNotification('northResult', val)} />
          <SettingRow label="Miền Trung" icon={IconBell} value={notiSettings?.centralResult} themed={themed} colors={colors}
            onToggle={(val: any) => handleToggleNotification('centralResult', val)} />
          <SettingRow label="Miền Nam" icon={IconBell} value={notiSettings?.southResult} themed={themed} colors={colors}
            onToggle={(val: any) => handleToggleNotification('southResult', val)} />
        </View>

        <Text text="TRẢI NGHIỆM NGƯỜI DÙNG" style={themed($sectionLabel)} />
        <View style={themed($card)}>
          <SettingRow label="Đọc kết quả giọng nói" icon={IconVoice} value={appSettings?.isVoiceEnabled} themed={themed} colors={colors}
            onToggle={(val: any) => handleUpdateAppSetting({ isVoiceEnabled: val })} />
          <SettingRow label="Bật nhạc Nền" icon={IconMusic} value={appSettings?.isMusicEnabled} themed={themed} colors={colors}
            onToggle={(val: any) => handleUpdateAppSetting({ isMusicEnabled: val })} />
          <SettingRow label="Hiện bảng Loto" icon={IconTable} value={appSettings?.showLotoTable} themed={themed} colors={colors}
            onToggle={(val: any) => handleUpdateAppSetting({ showLotoTable: val })} />

          {/* <NumberSelector
            label="Highlight Loto Đầu" icon={IconHead} themed={themed} disabled={isUpdating}
            selectedNumbers={appSettings?.highlightHead || []}
            onSelect={(num: string) => handleToggleHighlight(num, 'highlightHead')}
          />
          <NumberSelector
            label="Highlight Loto Đuôi" icon={IconTail} themed={themed} disabled={isUpdating}
            selectedNumbers={appSettings?.highlightTail || []}
            onSelect={(num: string) => handleToggleHighlight(num, 'highlightTail')}
          /> */}
        </View>

        <Text text="KÍCH THƯỚC CHỮ" style={themed($sectionLabel)} />
        <View style={themed($fontSizeCard)}>
          {fontSizes.map(({ label, value, size }) => (
            <TouchableOpacity key={label} style={[themed($sizeBtn), value === appSettings?.fontSize && themed($sizeBtnActive)]} onPress={() => handleUpdateAppSetting({ fontSize: value })}>
              <Text text={`𝓐𝒂` + label} size={size as any} weight="medium" style={{ color: value === appSettings?.fontSize ? '#D90404' : '#999' }} />
            </TouchableOpacity>
          ))}
        </View>

        <Text text="CHIA SẺ" style={themed($sectionLabel)} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8, marginBottom: 24, gap: 30 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={themed($iconBigWrapper)}>
              <IconDownload width={40} height={40} color="#D90404" />
            </View>
            <Text text="Tải Kết Quả" size="sm" weight="medium" style={{ color: colors.text }} />
          </View>
          <View style={{ alignItems: 'center' }}>
            <View style={themed($iconBigWrapper)}>
              <IconShare width={40} height={40} color="#D90404" />
            </View>
            <Text text="Chia sẽ kết quả" size="sm" weight="medium" style={{ color: colors.text }} />
          </View>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

const $scrollContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
  paddingBottom: spacing.xl,
})

const $sheetHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
})

const $closeBtn: ThemedStyle<ViewStyle> = () => ({
  backgroundColor: '#F5F5F5',
  padding: 8,
  borderRadius: 20,
})

const $sectionLabel: ThemedStyle<TextStyle> = ({ spacing }) => ({
  color: '#9CA3AF',
  fontSize: 10,
  fontWeight: 'bold',
  marginTop: spacing.md,
  marginBottom: spacing.xs,
  marginLeft: 4,
})

const $card: ThemedStyle<ViewStyle> = () => ({
  backgroundColor: '#FFF',
  borderRadius: 20,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 3,
  borderWidth: 1,
  borderColor: '#F2F2F2',
  overflow: 'hidden',
})

const $settingRow: ThemedStyle<ViewStyle> = () => ({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#F9F9F9',
})

const $rowLeft: ViewStyle = { flexDirection: 'row', alignItems: 'center' }

const $iconWrapper: ThemedStyle<ViewStyle> = () => ({
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: '#FFF5F5',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
})

const $iconBigWrapper: ThemedStyle<ViewStyle> = () => ({
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: '#FFF5F5',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 8,
})

const $iconWrapperSmall: ThemedStyle<ViewStyle> = () => ({
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: '#FFF5F5',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 10,
})

const $selectorWrapper: ThemedStyle<ViewStyle> = () => ({
  padding: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#F9F9F9',
})

const $selectorHeader: ViewStyle = { flexDirection: 'row', alignItems: 'center', marginBottom: 12 }

const $numberCircle: ViewStyle = {
  width: 38,
  height: 38,
  borderRadius: 19,
  borderWidth: 1,
  borderColor: '#EEE',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#FFF',
}

const $numberCircleActive: ViewStyle = {
  backgroundColor: '#D90404',
  borderColor: '#D90404',
}

const $fontSizeCard: ThemedStyle<ViewStyle> = () => ({
  flexDirection: 'row',
  backgroundColor: '#F2F2F2',
  borderRadius: 16,
  padding: 4,
  height: 48,
})

const $sizeBtn: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 12,
})

const $sizeBtnActive: ThemedStyle<ViewStyle> = () => ({
  backgroundColor: '#FFF',
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
})