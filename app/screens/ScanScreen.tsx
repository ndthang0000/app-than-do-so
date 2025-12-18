import React, { useState, useEffect, useRef } from 'react';
import { View, ViewStyle, TextStyle, TouchableOpacity, Dimensions, Animated, StyleSheet } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { HomeTabScreenProps } from '@/navigators/navigationTypes';
import { Screen } from '@/components/Screen';
import { Text } from "@/components/Text"
import { Header } from '@/components/Header';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
// Icons
import IconClose from "@assets/svg/close.svg";
import IconFlashOn from "@assets/svg/flash_on.svg";
import IconFlashOff from "@assets/svg/flash_off.svg";
import IconGallery from "@assets/svg/gallery.svg";
import IconLightBulb from "@assets/svg/lightbulb.svg";


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
// ĐỊNH NGHĨA KÍCH THƯỚC KHUNG QUÉT CHUẨN 1:2
const FRAME_WIDTH = screenWidth * 0.9;
const FRAME_HEIGHT = FRAME_WIDTH / 2; // Tỉ lệ 1:2
console.log({ screenWidth, screenHeight, FRAME_WIDTH, FRAME_HEIGHT });

export const ScanScreen: React.FC<HomeTabScreenProps<'Scan'>> = function ScanScreen(_props) {
  const { navigation } = _props;
  const { themed, theme: { colors, spacing } } = useAppTheme();

  // Camera & Permissions logic
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const camera = useRef<Camera>(null);

  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  // Thêm useRef để lưu tọa độ thực tế của khung quét
  const frameLayout = useRef({
    x: (screenWidth - FRAME_WIDTH) / 2,
    y: (screenHeight - FRAME_HEIGHT) / 2,
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT
  });

  const containerRef = useRef<View>(null);

  useEffect(() => {
    if (!hasPermission) requestPermission();

    // Animation thanh quét
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: FRAME_HEIGHT - 2, // Trừ đi chiều cao của thanh quét
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [hasPermission]);

  const cleanAndParseLotteryData = (rawText: string) => {
    // 1. Chuẩn hóa văn bản: Viết hoa, xóa khoảng trắng thừa, thay đổi các ký tự dễ nhầm
    let cleanText = rawText.toUpperCase()
      .replace(/O/g, '0')  // Nhầm chữ O thành số 0
      .replace(/[IL|]/g, '1') // Nhầm chữ I, L, gạch đứng thành số 1
      .replace(/S/g, '5')  // Nhầm S thành 5
      .replace(/B/g, '8'); // Nhầm B thành 8


    // 2. Regex tìm dãy 6 số (Ưu tiên lấy dãy số cuối cùng vì vé số thường in số to ở dưới)
    const allNumbers = cleanText.match(/\d{6}/g);
    const ticketCode = allNumbers ? allNumbers[allNumbers.length - 1] : null;

    // 3. Regex tìm ngày tháng (dd-mm-yyyy)
    const dateMatch = cleanText.match(/\d{2}-\d{2}-\d{4}/);
    const ticketDate = dateMatch ? dateMatch[0] : null;

    return {
      code: ticketCode,
      date: ticketDate,
    };
  };

  const processImageForOCR = async (uri: string, photoWidth: number, photoHeight: number, shouldCrop: boolean = true) => {
    console.log({ photoWidth, photoHeight });
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      let finalUri = uri;

      if (shouldCrop) {
        // 1. Với VisionCamera, thường ảnh 4:3 sẽ 'Cover' màn hình theo chiều Cao hoặc Rộng
        // Tính scale để ảnh lấp đầy (Cover) màn hình
        const scale = Math.max(screenWidth / photoWidth, screenHeight / photoHeight);

        // 2. Tính kích thước hiển thị thực tế của ảnh sau khi scale
        const displayedPhotoWidth = photoWidth * scale;
        const displayedPhotoHeight = photoHeight * scale;

        // 3. Tính phần dư bị tràn ra ngoài màn hình (Offsets)
        // Lưu ý: Nếu ảnh lấp đầy chiều cao, offsetY sẽ là 0.
        const offsetX = (displayedPhotoWidth - screenWidth) / 2;
        const offsetY = (displayedPhotoHeight - screenHeight) / 2;

        // 4. LẤY TỌA ĐỘ TƯƠNG ĐỐI
        // Quan trọng: fY bây giờ phải là tọa độ tính từ đỉnh của Camera View
        const { x: fX, y: fY, width: fW, height: fH } = frameLayout.current;

        // 5. Tính toán tọa độ cắt trên ảnh gốc
        const actualOriginX = (fX + offsetX) / scale;
        const actualOriginY = (fY + offsetY) / scale; // fY chuẩn sẽ sửa được lỗi lệch
        const actualWidth = fW / scale;
        const actualHeight = fH / scale;

        console.log("DEBUG CROP:", { actualOriginY, scale, offsetY, fY });

        if (actualWidth > 0 && actualHeight > 0) {
          const manipulatedImage = await ImageManipulator.manipulateAsync(
            uri,
            [
              {
                crop: {
                  originX: Math.max(0, actualOriginX),
                  originY: Math.max(0, actualOriginY),
                  width: Math.min(photoWidth - actualOriginX, actualWidth),
                  height: Math.min(photoHeight - actualOriginY, actualHeight),
                },
              },
              { resize: { width: 1200 } },
            ],
            { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
          );
          finalUri = manipulatedImage.uri;
        }
      } else {
        // NẾU LÀ ẢNH TỪ GALLERY (ĐÃ CROP TAY)
        // Chỉ cần resize nhẹ và grayscale để tăng độ chính xác OCR
        const optimizedImage = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 1024 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        finalUri = optimizedImage.uri;
      }

      // Debug: Xem ảnh thực tế mà AI sẽ đọc
      // await Sharing.shareAsync(finalUri);

      await Sharing.shareAsync(finalUri);
      const result = await TextRecognition.recognize(finalUri,);
      console.log("raw text:", result.text)
      const parsedData = cleanAndParseLotteryData(result.text);

      if (parsedData.code) {
        // Navigation tới màn kết quả hoặc điền code
        console.log("Tìm thấy vé:", parsedData);
      }
    } catch (error) {
      console.error("Lỗi OCR:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const takePhoto = async () => {
    if (camera.current && !isProcessing) {
      const photo = await camera.current.takePhoto({
        flash: isFlashOn ? 'on' : 'off',
      });
      processImageForOCR(`file://${photo.path}`, photo.width, photo.height, true);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      // aspect: [2, 1], // Tỉ lệ 2:1
      quality: 1,
    });
    if (!result.canceled) {
      processImageForOCR(result.assets[0].uri, result.assets[0].width, result.assets[0].height, false);
    }
  };

  if (!hasPermission || !device) {
    return (
      <Screen style={themed($container)} safeAreaEdges={['top']}>
        <Text text="Đang tải Camera..." />
      </Screen>
    );
  }

  return (
    <View style={themed($container)} ref={containerRef}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      <View style={themed($overlayContainer)}>
        <Header
          title="Quét Vé Số"
          style={themed($headerStyle)}
          titleStyle={themed($headerTitle)}
          backgroundColor="transparent"
          LeftActionComponent={
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <IconClose color={colors.palette.neutral100} width={28} height={28} />
            </TouchableOpacity>
          }
          RightActionComponent={
            <TouchableOpacity onPress={() => setIsFlashOn(!isFlashOn)}>
              {isFlashOn ?
                <IconFlashOn color={colors.palette.primary400} width={28} height={28} /> :
                <IconFlashOff color={colors.palette.neutral100} width={28} height={28} />
              }
            </TouchableOpacity>
          }
        />

        <View style={themed($scanAreaWrapper)}>
          <View
            style={themed($scanFrame)}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              frameLayout.current.width = width;
              frameLayout.current.height = height;

              // ĐO TỌA ĐỘ SO VỚI CONTAINER (thay vì Window)
              if (containerRef.current) {
                event.target.measureLayout(
                  containerRef.current,
                  (x, y) => {
                    frameLayout.current.x = x;
                    frameLayout.current.y = y;
                    console.log("Tọa độ khung thực tế:", { x, y });
                  },
                );
              }
            }}
          >
            {/* 4 Góc khung quét */}
            <View style={themed([$corner, $topLeft])} />
            <View style={themed([$corner, $topRight])} />
            <View style={themed([$corner, $bottomLeft])} />
            <View style={themed([$corner, $bottomRight])} />

            <Animated.View
              style={[themed($scanLine), { transform: [{ translateY: scanLineAnim }] }]}
            />
          </View>
          <View style={themed($hintTextWrapper)}>
            <Text text='Di chuyển vé vào khung hình' weight='light' size="xs" style={{ color: colors.palette.neutral100 }} />
          </View>
        </View>

        <View style={themed($footer)}>
          <TouchableOpacity style={themed($footerBtn)} onPress={pickImage}>
            <View style={themed($iconCircle)}>
              <IconGallery color={colors.palette.neutral100} width={24} height={24} />
            </View>
            <Text text='THƯ VIỆN' size='xxs' weight='bold' style={{ color: colors.palette.neutral100 }} />
          </TouchableOpacity>

          <TouchableOpacity style={themed($shutterBtn)} onPress={takePhoto}>
            <View style={themed($shutterInner)} />
          </TouchableOpacity>

          <TouchableOpacity style={themed($footerBtn)}>
            <View style={themed($iconCircle)}>
              <IconLightBulb color={colors.palette.primary400} width={24} height={24} />
            </View>
            <Text text='MẸO' size='xxs' weight='bold' style={{ color: colors.palette.neutral100 }} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ============ STYLES ============

const $container: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  backgroundColor: '#000',
})


const $overlayContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: 'space-between',
  paddingBottom: spacing.xl,
  // backgroundColor: "'rgba(17, 16, 16, 0.3)',"
})

const $headerStyle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
})

const $headerTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontWeight: "semibold",
  fontSize: 20
})

const $scanAreaWrapper: ThemedStyle<ViewStyle> = () => ({
  alignItems: 'center',
})

const $scanFrame: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: FRAME_WIDTH,
  height: FRAME_HEIGHT,
  position: 'relative',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: spacing.md,
})

const $corner: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: 'absolute',
  width: 30,
  height: 30,
  borderColor: colors.palette.primary500,
  borderWidth: 4,
})

const $topLeft: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: spacing.md
})
const $topRight: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: spacing.md
})
const $bottomLeft: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: spacing.md
})
const $bottomRight: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: spacing.md
})

const $scanLine: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: '100%',
  height: 2,
  backgroundColor: colors.palette.primary400,
  shadowColor: colors.palette.primary400,
  shadowOpacity: 0.8,
  shadowRadius: 10,
  elevation: 10,
})

const $hintTextWrapper: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  backgroundColor: 'rgba(0,0,0,0.6)',
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xxs,
  borderRadius: spacing.lg,
})

const $footer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  paddingHorizontal: spacing.lg,
})

const $footerBtn: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: 'center',
  gap: spacing.xxs
})

const $iconCircle: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 50,
  height: 50,
  borderRadius: 25,
  backgroundColor: 'rgba(255,255,255,0.2)',
  justifyContent: 'center',
  alignItems: 'center',
})

const $shutterBtn: ThemedStyle<ViewStyle> = () => ({
  width: 80,
  height: 80,
  borderRadius: 40,
  borderWidth: 4,
  borderColor: 'rgba(255,255,255,0.3)',
  justifyContent: 'center',
  alignItems: 'center',
})

const $shutterInner: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 64,
  height: 64,
  borderRadius: 32,
  backgroundColor: colors.palette.primary500,
})