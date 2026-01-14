import React from 'react';
import { View, ViewStyle, TextStyle, Platform } from 'react-native';
import { ToastConfig } from 'react-native-toast-message';
import { Text } from "@/components/Text"; // Sử dụng component Text của bạn
import { Icon } from "@/components/Icon"; // Import Icon component

// Hàm tạo config nhận theme từ app của bạn
export const getToastConfig = (theme: any): ToastConfig => {
  const { colors, spacing } = theme;

  // Style chung cho container của Toast
  const $baseContainer: ViewStyle = {
    height: 'auto',
    minHeight: 60,
    width: '90%',
    backgroundColor: 'rgba(28, 28, 30, 0.95)', // Dark neutral
    borderRadius: spacing.md,
    borderLeftWidth: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  };

  const $titleStyle: TextStyle = {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.palette.neutral100,
  };

  const $textStyle: TextStyle = {
    fontSize: 12,
    color: colors.palette.neutral400,
  };

  return {
    /* INFO: Dùng cho việc Bật/Tắt Flash 
    */
    info: ({ text1, text2 }) => (
      <View style={[$baseContainer, { borderLeftColor: colors.palette.secondary500 }]}>
        <View>
          <Text text={text1} style={[$titleStyle, { color: colors.palette.secondary500 }]} />
          {text2 && <Text text={text2} style={$textStyle} />}
        </View>
      </View>
    ),

    /* SUCCESS: Dùng khi quét vé thành công 
    */
    success: ({ text1, text2 }) => (
      <View style={[$baseContainer, { borderLeftColor: '#4CAF50' }]}>
        <View>
          <Text text={text1} style={$titleStyle} />
          {text2 && <Text text={text2} style={$textStyle} />}
        </View>
      </View>
    ),

    /* ERROR: Dùng khi không đọc được vé hoặc lỗi Camera 
    */
    error: ({ text1, text2 }) => (
      <View style={[$baseContainer, { borderLeftColor: colors.error }]}>
        <View>
          <Text text={text1} style={[$titleStyle, { color: colors.error }]} />
          {text2 && <Text text={text2} style={$textStyle} />}
        </View>
      </View>
    ),

    /* NOTIFICATION: Custom toast giống notification native cho foreground message
    */
    notification: ({ text1, text2, onPress }: any) => {
      const $notificationContainer: ViewStyle = {
        width: '92%',
        backgroundColor: Platform.OS === 'ios'
          ? 'rgba(255, 255, 255, 0.98)'
          : 'rgba(255, 255, 255, 0.97)',
        borderRadius: Platform.OS === 'ios' ? 12 : 8,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        flexDirection: 'row',
        alignItems: 'flex-start',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 10,
        borderWidth: Platform.OS === 'android' ? 0.5 : 0,
        borderColor: 'rgba(0, 0, 0, 0.08)',
      };

      const $iconContainer: ViewStyle = {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.palette.primary500 || '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
      };

      const $textContainer: ViewStyle = {
        flex: 1,
        justifyContent: 'center',
      };

      const $notificationTitle: TextStyle = {
        fontSize: 15,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 2,
      };

      const $notificationBody: TextStyle = {
        fontSize: 13,
        color: '#3C3C43',
        lineHeight: 18,
      };

      return (
        <View style={$notificationContainer}>
          <View style={$iconContainer}>
            <Icon icon="bell" size={22} color="#FFFFFF" />
          </View>
          <View style={$textContainer}>
            <Text text={text1} style={$notificationTitle} numberOfLines={1} />
            {text2 && <Text text={text2} style={$notificationBody} numberOfLines={2} />}
          </View>
        </View>
      );
    },
  };
};