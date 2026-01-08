import React from 'react'
import { View, ViewStyle, TextStyle, TouchableOpacity, Image } from 'react-native'
import { useAppTheme } from '@/theme/context'
import type { ThemedStyle } from '@/theme/types'
import { AppStackScreenProps } from '@/navigators/navigationTypes'
import { Screen } from '@/components/Screen'
import { Text } from "@/components/Text"
import { Header } from '@/components/Header'
import IconClose from "@assets/svg/close.svg"
import IconKeyboard from "@assets/svg/keyboard.svg"
import IconRetry from "@assets/svg/retry.svg"

export const ErrorOCRScreen: React.FC<AppStackScreenProps<'ErrorOCR'>> = function ErrorOCRScreen(_props) {
  const { navigation } = _props
  const { themed, theme: { colors, spacing } } = useAppTheme()

  const handleRetry = () => navigation.goBack()
  const handleManualInput = () => {
    navigation.navigate("ManualInput" as any)
  }

  return (
    <>
      <Header
        LeftActionComponent={
          <TouchableOpacity
            onPress={() => navigation.replace("Main", { screen: "Scan" })}
            style={themed($closeButton)}
          >
            <IconClose width={24} height={24} color={colors.text} />
          </TouchableOpacity>
        }
        backgroundColor={colors.background}
      />

      {/* Sử dụng preset="auto" để bao quát toàn bộ view */}
      <Screen
        preset="auto"
        safeAreaEdges={["bottom"]}
        style={themed($container)}
        contentContainerStyle={themed($contentContainer)}
      >
        {/* Phần nội dung chính nằm giữa */}
        <View style={themed($contentWrapper)}>
          <View style={themed($illustrationContainer)}>
            <View style={themed($imageCircleBg)}>
              <Image
                source={require("@assets/images/error-ocr.png")}
                resizeMode="contain"
                style={{ width: 220, height: 220 }}
              />
            </View>
          </View>

          <View style={themed($textGroup)}>
            <Text
              text="Rất tiếc, không đọc được vé"
              preset="bold"
              style={themed($title)}
            />
            <Text
              text="Vui lòng kiểm tra ánh sáng hoặc thử nhập số trên vé thủ công."
              style={themed($description)}
            />
          </View>
        </View>

        {/* Phần nút bấm nằm dưới cùng */}
        <View style={themed($buttonGroup)}>
          <TouchableOpacity
            style={themed($primaryButton)}
            activeOpacity={0.8}
            onPress={handleManualInput}
          >
            <IconKeyboard width={20} height={20} color={colors.palette.neutral100} />
            <Text text="Nhập thủ công" weight="bold" style={themed($primaryButtonText)} />
          </TouchableOpacity>

          <TouchableOpacity
            style={themed($secondaryButton)}
            activeOpacity={0.6}
            onPress={handleRetry}
          >
            <IconRetry width={18} height={18} color={colors.palette.primary500} />
            <Text text="Thử quét lại" weight="bold" style={themed($secondaryButtonText)} />
          </TouchableOpacity>
        </View>
      </Screen>
    </>
  )
}

/** Styles */
const $container: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background,
})

const $contentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1, // Ép content container chiếm hết màn hình
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.lg,
  justifyContent: 'space-between', // Đẩy content lên trên và button xuống dưới
})

const $closeButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.sm,
})

const $contentWrapper: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center', // Căn giữa nội dung robot và text theo chiều dọc
})

const $illustrationContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xl,
  alignItems: 'center',
  justifyContent: 'center',
})

const $imageCircleBg: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 280,
  height: 280,
  borderRadius: 140,
  backgroundColor: colors.palette.neutral100,
  alignItems: 'center',
  justifyContent: 'center',
})

const $textGroup: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: 'center',
})

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  fontSize: 24,
  textAlign: 'center',
  marginBottom: spacing.sm,
})

const $description: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  textAlign: 'center',
  color: colors.palette.neutral500,
  lineHeight: 22,
  paddingHorizontal: 12,
})

const $buttonGroup: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: '100%',
  gap: spacing.sm,
  marginTop: spacing.md,
})

const $primaryButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary500,
  flexDirection: 'row',
  height: 56,
  borderRadius: 28,
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.xs,
  shadowColor: colors.palette.primary500,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 6,
})

const $primaryButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontSize: 18,
})

const $secondaryButton: ThemedStyle<ViewStyle> = () => ({
  flexDirection: 'row',
  height: 48,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
})

const $secondaryButtonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.primary500,
  fontSize: 16,
})