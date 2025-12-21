import React, { useState, useEffect, useRef } from 'react';
import { View, ViewStyle, TextStyle, TouchableOpacity, Dimensions, Animated, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
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
import * as Haptics from "expo-haptics"
import { useRunOnJS } from 'react-native-worklets-core';
// Icons
import IconClose from "@assets/svg/close.svg";
import IconFlashOn from "@assets/svg/flash_on.svg";
import IconFlashOff from "@assets/svg/flash_off.svg";
import IconGallery from "@assets/svg/gallery.svg";
import IconLightBulb from "@assets/svg/lightbulb.svg";
import Toast from 'react-native-toast-message';
import { cleanAndParseLotteryData } from '@/utils/cleanLotteryData';
import { useTextRecognition } from 'react-native-vision-camera-ocr-plus';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
// ĐỊNH NGHĨA KÍCH THƯỚC KHUNG QUÉT CHUẨN 1:2
const FRAME_WIDTH = screenWidth * 0.9;
const FRAME_HEIGHT = FRAME_WIDTH / 2; // Tỉ lệ 1:2

const topDistance = (screenHeight - FRAME_HEIGHT) / 2;
const leftDistance = 5 / 100 * screenWidth;

const topPercent = (topDistance / screenHeight) * 100;
// Tọa độ X bắt đầu (cách lề 5% vì FRAME_WIDTH = 90%)
const leftPercent = 5;
const widthPercent = 90;
const heightPercent = (FRAME_HEIGHT / screenHeight) * 100;

console.log({ screenWidth, screenHeight, FRAME_WIDTH, FRAME_HEIGHT });

const toastConfig = {
  info: ({ text1, text2 }: any) => {
    const { theme: { colors } } = useAppTheme();
    return (
      <View style={{
        height: 60,
        width: '80%',
        backgroundColor: colors.palette.neutral800,
        borderRadius: 30,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFD700', // Màu vàng primary của bạn
        paddingHorizontal: 8
      }}>
        <Text style={{ color: colors.palette.accent300, fontWeight: 'bold', fontSize: 14 }} text={text1} />
        {text2 &&
          <Text style={{ color: colors.palette.accent200, fontSize: 12 }}>{text2}</Text>
        }
      </View>
    )
  }
};


export const ScanScreen: React.FC<HomeTabScreenProps<'Scan'>> = function ScanScreen(_props) {

  const { navigation } = _props;
  const { themed, theme: { colors, spacing } } = useAppTheme();

  // Camera & Permissions logic
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const camera = useRef<Camera>(null);

  const [shouldRenderCamera, setShouldRenderCamera] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [hasFoundResult, setHasFoundResult] = useState(false);

  // 1. TÍNH TOÁN SCAN REGION THEO PHẦN TRĂM Ô MÀU
  // Tọa độ Y bắt đầu của khung quét (nằm giữa màn hình)


  const { scanText } = useTextRecognition({
    language: 'latin',
    frameSkipThreshold: 5,
    useLightweightMode: true,
    scanRegion: {
      left: `${leftPercent}%`,
      top: `${topPercent}%`,
      width: `${widthPercent}%`,
      height: `${heightPercent}%`
    }
  });

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (!isScanningActive || hasFoundResult) return;
    const data = scanText(frame);
    if (data && data.resultText) {
      handleOCR(data.resultText);
    }
  }, [isScanningActive]);

  const scanLineAnim = useRef(new Animated.Value(0)).current;
  // Thêm useRef để lưu tọa độ thực tế của khung quét
  const frameLayout = useRef({
    x: (screenWidth - FRAME_WIDTH) / 2,
    y: (screenHeight - FRAME_HEIGHT) / 2,
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT
  });

  const containerRef = useRef<View>(null);

  const handleOCR = useRunOnJS((result) => {
    // Xử lý 7 Pipeline của bạn ở đây
    if (!isScanningActive || hasFoundResult) return;
    console.log(result)
  }, [isScanningActive]);

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




      await Sharing.shareAsync(finalUri);
      const result = await TextRecognition.recognize(finalUri,);
      console.log("raw text:", result.text)
      const parsedData = cleanAndParseLotteryData(result.text);
      console.log("parsedData", parsedData);

    } catch (error) {
      console.error("Lỗi OCR:", error);
    } finally {
      setIsProcessing(false);
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

  const handleToggleFlash = () => {
    setIsFlashOn(!isFlashOn);
    Toast.show({
      type: 'info',
      text1: `${!isFlashOn ? '💡' : ''}Đèn Flash đang ${!isFlashOn ? 'BẬT' : 'TẮT'}`,
      position: 'bottom',
      bottomOffset: 150,
      visibilityTime: 700,
    });
    if (!isFlashOn) {

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
    }
  }

  const toggleScanning = () => {
    setIsScanningActive(!isScanningActive);
    setHasFoundResult(false);
  };

  if (!hasPermission || !device) {
    return (
      <Screen style={themed($container)} safeAreaEdges={['top']}>
        <Text text="Đang tải Camera..." />
      </Screen>
    );
  }

  useEffect(() => {
    if (!hasPermission) requestPermission();

    // Animation thanh quét
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: FRAME_HEIGHT - 4, // Trừ đi chiều cao của thanh quét
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [hasPermission]);

  useEffect(() => {
    // 1. Khi màn hình thực sự hiện ra trước mắt người dùng
    const unsubscribeFocus = navigation.addListener('focus', () => {
      console.log("Màn hình Scan ĐÃ VÀO - Bật camera");
      setIsScanningActive(false); // Reset state luôn tại đây
      setShouldRenderCamera(true);
    });

    // 2. Khi màn hình bị che đi hoặc người dùng thoát ra
    const unsubscribeBlur = navigation.addListener('blur', () => {
      console.log("Màn hình Scan ĐÃ THOÁT - Hủy hoàn toàn camera");
      setIsFlashOn(false);
      setIsScanningActive(false);
      setShouldRenderCamera(false);
    });

    // Cleanup khi component bị hủy hẳn
    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  return (
    <View style={themed($container)} ref={containerRef}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={shouldRenderCamera}
        frameProcessor={frameProcessor}
        pixelFormat={'yuv'}
        torch={isFlashOn ? 'on' : 'off'}
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
            <TouchableOpacity onPress={handleToggleFlash}>
              <View style={themed($iconCircle)}>
                {isFlashOn ?
                  <IconFlashOn color={colors.palette.accent400} width={28} height={28} /> :
                  <IconFlashOff color={colors.palette.neutral300} width={28} height={28} />
                }
              </View>
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
              style={[themed([$scanLine, { opacity: isScanningActive ? 1 : 0 }]), { transform: [{ translateY: scanLineAnim }] }]}
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
          <View style={{ alignItems: 'center', gap: spacing.xxs }}>
            <TouchableOpacity style={themed($shutterBtn)} onPress={toggleScanning}>
              <View style={themed(isScanningActive ? $shutterInnerScanning : $shutterInner)} />
            </TouchableOpacity>
            <Text text={isScanningActive ? 'Đang quét...' : 'Nhấn để bắt đầu quét'} size='xs' weight='bold' style={{ color: isScanningActive ? colors.tint : colors.palette.neutral100, textAlign: 'center' }} />
          </View>

          <TouchableOpacity style={themed($footerBtn)}>
            <View style={themed($iconCircle)}>
              <IconLightBulb color={colors.palette.accent400} width={24} height={24} />
            </View>
            <Text text='MẸO' size='xxs' weight='bold' style={{ color: colors.palette.neutral100 }} />
          </TouchableOpacity>
        </View>
      </View>
      <Toast config={toastConfig} />
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
  position: 'absolute',
  top: topDistance,
  left: leftDistance,
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
  width: '98%',
  height: 2,
  marginHorizontal: '1%',
  backgroundColor: colors.palette.primary400,
  shadowColor: colors.palette.primary500,
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
  justifyContent: 'space-between',
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

const $shutterInnerScanning: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 36,
  height: 36,
  borderRadius: 8,
  backgroundColor: colors.palette.primary500,
})
