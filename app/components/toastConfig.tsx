import React from 'react';
import { View, ViewStyle, TextStyle } from 'react-native';
import { ToastConfig } from 'react-native-toast-message';
import { Text } from "@/components/Text"; // Sử dụng component Text của bạn

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
  };
};