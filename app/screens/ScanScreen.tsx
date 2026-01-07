import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, ViewStyle, TextStyle, TouchableOpacity, Dimensions, Animated, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { Camera, useCameraDevice, useCameraFormat, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '@/theme/context';
import type { ThemedStyle } from '@/theme/types';
import { HomeTabScreenProps } from '@/navigators/navigationTypes';
import { Screen } from '@/components/Screen';
import { Text } from "@/components/Text"
import { Header } from '@/components/Header';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from "expo-haptics"
import { useRunOnJS } from 'react-native-worklets-core';
// Icons
import IconClose from "@assets/svg/close.svg";
import IconFlashOn from "@assets/svg/flash_on.svg";
import IconFlashOff from "@assets/svg/flash_off.svg";
import IconGallery from "@assets/svg/gallery.svg";
import IconLightBulb from "@assets/svg/lightbulb.svg";
import Toast from 'react-native-toast-message';
import { PhotoRecognizer, useTextRecognition } from 'react-native-vision-camera-ocr-plus';
import { ScanInfoOverlay } from '@/components/Scan/ScanInfoOverlay';
import { ScanResult } from '@/constants/lotteryTicket';
import { fastParseFrame, getMostFrequent } from '@/utils/fastParseFrame';
import { ScanningTimer } from '@/components/Scan/ScanningTimer';


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

const CONFIDENCE_THRESHOLD = {
  code: 8,
  station: 3,
  date: 5,
};


const createDefaultStats = () => ({
  codes: {} as Record<string, number>,
  stations: {} as Record<string, number>,
  dates: {} as Record<string, number>,
});

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
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [hasFoundResult, setHasFoundResult] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult>({});
  const [appState, setAppState] = useState(AppState.currentState);
  const statsRef = useRef(createDefaultStats());
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCapturingRef = useRef(false); // Tránh việc hàm chụp bị lặp chồng chéo
  const isTakingPhotoRef = useRef(false);
  const isStoppingRef = useRef(false);
  // 1. TÍNH TOÁN SCAN REGION THEO PHẦN TRĂM Ô MÀU
  // Tọa độ Y bắt đầu của khung quét (nằm giữa màn hình)

  const startAutoCapture = () => {
    if (captureIntervalRef.current || isStoppingRef.current) return;

    captureIntervalRef.current = setInterval(async () => {
      // THÊM: Nếu isScanningActive đã false thì phải dừng ngay lập tức
      if (!isScanningActive || !camera.current || isTakingPhotoRef.current || isProcessing || isStoppingRef.current) {
        if (!isScanningActive) stopAutoCapture(); // Tự dọn dẹp nếu phát hiện trạng thái đã tắt
        return;
      }

      isTakingPhotoRef.current = true;
      try {
        const photo = await camera.current.takePhoto({
          flash: isFlashOn ? 'on' : 'off',
          enableShutterSound: false,
        });

        // Kiểm tra lại lần nữa trước khi xử lý OCR nặng
        if (isScanningActive && !isStoppingRef.current) {
          processImageForOCR(photo.path, photo.width, photo.height, true);
        }
      } catch (err) {
        console.error("Lỗi chụp ảnh tự động:", err);
      } finally {
        isTakingPhotoRef.current = false;
      }
    }, 500);
  };

  const handleOCR = useRunOnJS((frameData) => {
    // Xử lý 7 Pipeline của bạn ở đây
    if (!isScanningActive || hasFoundResult) return;


    const current = fastParseFrame(frameData.split('\n'), scanResult?.date);
    if (!current) return;

    // LOGIC NÂNG CAO: Chống nhầm lẫn mmyyyy
    if (current.code && current.date) {
      const dateNumbers = current.date.replace(/[^0-9]/g, ''); // Ví dụ: 12052024

      // Nếu mã vé giống hệt 6 số cuối của ngày (052024) hoặc 6 số đầu (120520)
      // thì khả năng cao là detect nhầm ngày tháng
      if (dateNumbers.includes(current.code)) {
        return;
      }
    }

    // 1. Cập nhật kho dữ liệu (Thêm vào chứ không đè)
    const keys = ['code', 'station', 'date'] as const;

    keys.forEach(key => {
      const val = current[key];
      if (!val) return;

      // Tăng đếm tần suất
      const statsKey = key === 'code' ? 'codes' : key === 'station' ? 'stations' : 'dates';
      statsRef.current[statsKey][val] = (statsRef.current[statsKey][val] || 0) + 1;

      // 2. TÌM GIÁ TRỊ TỐT NHẤT TRONG KHO
      const bestMatch = getMostFrequent(statsRef.current[statsKey]);

      // 3. CẬP NHẬT UI NẾU ĐẠT NGƯỠNG
      // Chỉ cập nhật nếu giá trị mới này có tần suất đủ lớn (Confidence)
      if (bestMatch.freq >= CONFIDENCE_THRESHOLD[key]) {
        setScanResult(prev => {
          // Nếu giá trị tốt nhất trong kho khác với giá trị đang hiển thị trên UI thì mới update
          if (prev[key] !== bestMatch.value) {
            return { ...prev, [key]: bestMatch.value };
          }
          return prev;
        });
      }
    });

    if (!captureIntervalRef.current && isScanningActive && !hasFoundResult) {
      console.log("🚀 bắt đầu chế độ chụp ảnh 0.3s/lần");
      startAutoCapture();
    }


    if (scanResult.code && scanResult.station && scanResult.date) {
      setIsScanningActive(false);
      setHasFoundResult(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      // Bạn có thể navigate hoặc hiện Modal kết quả tại đây
    }
  }, [isScanningActive, isCapturingRef]);

  const { scanText } = useTextRecognition({
    language: 'latin',
    frameSkipThreshold: 10,
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

  const format = useCameraFormat(device, [
    { photoAspectRatio: 4 / 3 },
    { videoAspectRatio: 4 / 3 }
  ])

  const processImageForOCR = async (uri: string, photoWidth: number, photoHeight: number, shouldCrop: boolean = true) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      let finalUri = uri;

      if (shouldCrop) {
        // 1. Tính toán kích thước ảnh hiển thị trong mode "contain"
        const screenAspectRatio = screenWidth / screenHeight;
        const photoAspectRatio = photoWidth / photoHeight;

        let renderWidth, renderHeight, offsetX, offsetY;

        if (photoAspectRatio > screenAspectRatio) {
          // Ảnh bị dải đen trên/dưới
          renderWidth = screenWidth;
          renderHeight = screenWidth / photoAspectRatio;
          offsetX = 0;
          offsetY = (screenHeight - renderHeight) / 2;
        } else {
          // Ảnh bị dải đen trái/phải
          renderHeight = screenHeight;
          renderWidth = screenHeight * photoAspectRatio;
          offsetY = 0;
          offsetX = (screenWidth - renderWidth) / 2;
        }


        // 2. Tính Scale giữa ảnh gốc và vùng hiển thị thực tế
        const scale = renderWidth / photoWidth;

        // 3. Tọa độ khung quét trên màn hình
        const { x: fX, y: fY, width: fW, height: fH } = frameLayout.current;

        // 2. TÍNH TOÁN VÙNG ĐỆM (PADDING) - Thêm 15% diện tích
        const paddingX = fW * 0.15;
        const paddingY = fH * 0.15;
        // Mở rộng tọa độ nhưng đảm bảo không vượt quá biên màn hình
        const paddedX = Math.max(offsetX, fX - paddingX);
        const paddedY = Math.max(offsetY, fY - paddingY);
        const paddedW = Math.min(renderWidth, fW + (paddingX * 2));
        const paddedH = Math.min(renderHeight, fH + (paddingY * 2));
        // 4. CHUYỂN ĐỔI TỌA ĐỘ SANG ẢNH GỐC
        // Ta lấy tọa độ khung hình trừ đi dải đen (offset) rồi mới chia cho scale
        // 3. CHUYỂN ĐỔI SANG TỌA ĐỘ ẢNH GỐC
        const actualOriginX = (paddedX - offsetX) / scale;
        const actualOriginY = (paddedY - offsetY) / scale;
        const actualWidth = paddedW / scale;
        const actualHeight = paddedH / scale;

        // console.log("DEBUG CROP:", { actualOriginY, scale, offsetY, fY });

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




      // await Sharing.shareAsync(finalUri);
      const result = await PhotoRecognizer({ uri: finalUri });
      console.log("Kết quả OCR Ảnh:", result.resultText);
      if (!result || !result.resultText) {
        return;
      }
      const current = fastParseFrame(result.resultText.split('\n'), scanResult?.date, true);
      if (!current) return;
      // LOGIC NÂNG CAO: Chống nhầm lẫn mmyyyy
      if (current.code && current.date) {
        const dateNumbers = current.date.replace(/[^0-9]/g, ''); // Ví dụ: 12052024

        // Nếu mã vé giống hệt 6 số cuối của ngày (052024) hoặc 6 số đầu (120520)
        // thì khả năng cao là detect nhầm ngày tháng
        if (dateNumbers.includes(current.code)) {
          return;
        }
      }

      // 1. Cập nhật kho dữ liệu (Thêm vào chứ không đè)
      const keys = ['code', 'station', 'date'] as const;

      keys.forEach(key => {
        const val = current[key];
        if (!val) return;

        // Tăng đếm tần suất
        const statsKey = key === 'code' ? 'codes' : key === 'station' ? 'stations' : 'dates';
        statsRef.current[statsKey][val] = (statsRef.current[statsKey][val] || 0) + 5; // 5 điểm cho ảnh chụp

        // 2. TÌM GIÁ TRỊ TỐT NHẤT TRONG KHO
        const bestMatch = getMostFrequent(statsRef.current[statsKey]);

        // 3. CẬP NHẬT UI NẾU ĐẠT NGƯỠNG
        // Chỉ cập nhật nếu giá trị mới này có tần suất đủ lớn (Confidence)
        if (bestMatch.freq >= CONFIDENCE_THRESHOLD[key]) {
          setScanResult(prev => {
            // Nếu giá trị tốt nhất trong kho khác với giá trị đang hiển thị trên UI thì mới update
            if (prev[key] !== bestMatch.value) {
              return { ...prev, [key]: bestMatch.value };
            }
            return prev;
          });
        }
      });


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

  const handleTimeout = useCallback(() => {
    stopAutoCapture();
    setIsScanningActive(false);
    // navigation.navigate('ScanTimeoutScreen');
  }, [navigation]);

  const stopAutoCapture = () => {
    isStoppingRef.current = true; // Chặn mọi yêu cầu chụp mới ngay lập tức
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
      console.log("⏹️ Đã dừng chụp ảnh tự động.");
    }
  };

  const toggleScanning = () => {
    if (isScanningActive) {
      stopAutoCapture();
    } else {
      isStoppingRef.current = false; // Mở lại khi bắt đầu scan mới
    }
    setIsScanningActive(!isScanningActive);
    setHasFoundResult(false);
    setScanResult({}); // Reset kết quả khi scan lại
    statsRef.current = createDefaultStats(); // Reset kho dữ liệu
  };


  useEffect(() => {
    const checkPermission = async () => {
      if (!hasPermission) {
        const status = await requestPermission();
        setIsPermissionGranted(status);
      } else {
        setIsPermissionGranted(true);
      }
    };

    checkPermission();

    // Animation giữ nguyên
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: FRAME_HEIGHT - 4,
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
      setIsScanningActive(false); // Reset state luôn tại đây
      statsRef.current = createDefaultStats();
      setScanResult({});
      setShouldRenderCamera(true);
    });

    // 2. Khi màn hình bị che đi hoặc người dùng thoát ra
    const unsubscribeBlur = navigation.addListener('blur', () => {
      setIsFlashOn(false);
      setIsScanningActive(false);
      setShouldRenderCamera(false);
      statsRef.current = createDefaultStats();
      setScanResult({});
    });

    const unSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      setAppState(nextAppState);
    });

    // Cleanup khi component bị hủy hẳn
    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
      unSubscription.remove();
    };
  }, [navigation]);

  // Dọn dẹp khi unmount component hoặc khi tắt scan tay
  useEffect(() => {
    return () => stopAutoCapture();
  }, []);


  if (!isPermissionGranted) {
    return (
      <View style={themed($container)}>
        <Text text="Ứng dụng cần quyền Camera để quét vé số" />

      </View>
    );
  }

  if (!device) {
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
        isActive={shouldRenderCamera && appState === 'active'}
        frameProcessor={frameProcessor}
        format={format}
        pixelFormat={'yuv'}
        torch={isFlashOn ? 'on' : 'off'}
        photo={true}
        zoom={1}
        resizeMode='contain'
      />

      <View style={themed($overlayContainer)}>
        <Header
          title="Quét Vé Số"
          style={themed($headerStyle)}
          titleStyle={themed($headerTitle)}
          backgroundColor="transparent"
          LeftActionComponent={
            <TouchableOpacity onPress={() => navigation.goBack()} disabled={isScanningActive} style={{ opacity: isScanningActive ? 0.4 : 1 }}>
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
        <ScanInfoOverlay isVisible={isScanningActive} data={scanResult} />

        <ScanningTimer
          isActive={isScanningActive}
          maxTime={15}
          onTimeout={handleTimeout}
          style={themed($scanTimerWrapper)}
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
          <TouchableOpacity style={themed([$footerBtn, { opacity: isScanningActive ? 0.4 : 1 }])} onPress={pickImage} disabled={isScanningActive}>
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

const $scanTimerWrapper: ThemedStyle<ViewStyle> = () => ({
  alignItems: 'center',
  position: 'absolute',
  top: topDistance - 30,
  left: screenWidth * 0.5 - 50,
  height: 40,
  width: 100,
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
