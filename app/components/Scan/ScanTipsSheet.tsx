import React, { useCallback, useMemo, forwardRef } from "react"
import { View, ViewStyle, TextStyle, Image, ImageStyle, TouchableOpacity } from "react-native"
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet"
import { useAppTheme } from "@/theme/context"
import { Text } from "@/components/Text"
import { ThemedStyle } from "@/theme/types"
import IconFocus from "@assets/svg/focus.svg" // Thay bằng icon của bạn
import IconSun from "@assets/svg/sunny.svg"
import IconHand from "@assets/svg/hand-off.svg"

export const ScanTipsSheet = forwardRef<BottomSheetModal>((props, ref) => {
  const { themed, theme: { colors, spacing } } = useAppTheme()

  // Điểm dừng của Sheet (khoảng 85% màn hình)
  const snapPoints = useMemo(() => ["85%"], [])

  // Nền mờ phía sau
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  )

  const handleClose = () => (ref as any).current?.dismiss()

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: colors.palette.neutral300 }}
      backgroundStyle={{ backgroundColor: colors.background }}
    >
      <BottomSheetView style={themed($container)}>
        <Text text="Mẹo Chụp Vé Số" style={themed($title)} weight="bold" />

        <View style={themed($headerSection)}>
          <Text >
            <Text text="Để nhận diện " style={themed($subTitle)} />
            <Text text="Chính Xác" style={{ color: colors.error, }} size="xl" weight="semiBold" />
          </Text>

        </View>

        {/* Khu vực minh họa Hình ảnh (Grid) */}
        <View style={themed($imageGrid)}>
          {/* Bạn hãy thay source bằng ảnh thực tế của bạn */}
          <View style={themed($mainImageWrapper)}>
            <Image source={require("@assets/images/scan-correct.png")} style={$imageMain} />
            <Text text="CHÍNH XÁC" style={themed($labelGreen)} weight="bold" />
          </View>
          <View style={themed($sideImages)}>
            <Image source={require("@assets/images/scan-wrong.png")} style={$imageSmall} />
            <Text text="SAI CÁCH" style={themed($labelRed)} weight="bold" />
          </View>
        </View>

        {/* Danh sách các mẹo */}
        <View style={themed($tipsList)}>
          <TipItem
            Icon={IconFocus}
            title="Căn chỉnh khung hình"
            desc="Đặt vé nằm phẳng, 4 góc nằm trọn trong khung đỏ."
          />
          <TipItem
            Icon={IconSun}
            title="Ánh sáng rõ ràng"
            desc="Tránh bóng đổ, lóa sáng hoặc chụp ở nơi quá tối."
          />
          <TipItem
            Icon={IconHand}
            title="Không che khuất số"
            desc="Đảm bảo ngón tay không che mất dãy số dự thưởng."
          />
        </View>

        {/* Nút hành động */}
        <TouchableOpacity style={themed($button)} onPress={handleClose}>
          <Text text="Hiểu rồi, Thử ngay" style={themed($buttonText)} weight="bold" />
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheetModal>
  )
})

// Thành phần phụ cho mỗi dòng mẹo
const TipItem = ({ Icon, title, desc }: any) => {
  const { themed } = useAppTheme()
  return (
    <View style={themed($tipItem)}>
      <View style={themed($iconWrapper)}>
        <Icon width={24} height={24} fill="red" />
      </View>
      <View style={{ flex: 1 }}>
        <Text text={title} style={themed($tipTitle)} weight="bold" />
        <Text text={desc} style={themed($tipDesc)} />
      </View>
    </View>
  )
}

/** Styles */
const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
  flex: 1,
  alignItems: "center",
})

const $title: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 18,
  marginBottom: 10,
})

const $subTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 22,
  textAlign: "center",
})

const $description: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 14,
  textAlign: "center",
  marginTop: 8,
})

const $imageGrid: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  marginVertical: 20,
  gap: 10,
})

const $mainImageWrapper: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.palette.neutral800,
  borderRadius: 15,
  padding: 10,
  alignItems: "center",
})

const $tipItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  backgroundColor: colors.palette.neutral100,
  padding: spacing.md,
  borderRadius: 15,
  marginBottom: spacing.sm,
  alignItems: "center",
  //box shadow
  shadowColor: colors.palette.neutral600,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 3.84,
  elevation: 5,
})

const $iconWrapper: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.primary100,
  padding: 10,
  borderRadius: 12,
  marginRight: 15,
})

const $button: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.primary,
  width: "100%",
  padding: 16,
  borderRadius: 30,
  alignItems: "center",
  marginTop: "auto", // Đẩy xuống dưới cùng
})
const $headerSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
})

const $imageMain: ImageStyle = {
  width: "100%",
  height: 120,
  borderRadius: 8,
  marginBottom: 8,
}

const $imageSmall: ImageStyle = {
  width: 120,
  height: 120,
  borderRadius: 4,
  marginBottom: 4,
}

const $sideImages: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: colors.palette.neutral800,
  borderRadius: 15,
  padding: 8,
})

const $labelGreen: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: "#10B981", // Màu xanh lá Success
  fontSize: 12,
  textAlign: "center",
})

const $labelRed: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
  fontSize: 10,
  textAlign: "center",
  width: "100%",
})

const $tipsList: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  marginBottom: spacing.md,
})

const $tipTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontSize: 15,
  marginBottom: 4,
})

const $tipDesc: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  fontSize: 13,
  lineHeight: 18,
})

const $buttonText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontSize: 16,
})