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
import { fastParseFrame, getCodePenaltyFactor } from '@/utils/fastParseFrame';
import { ScanningTimer, ScanningTimerRef } from '@/components/Scan/ScanningTimer';
import { prepareTicketPayload } from '@/utils/ticket-helper';
import { api } from '@/services/api';

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

const scanRegion = { left: `${leftPercent}%`, top: `${topPercent}%`, width: `${widthPercent}%`, height: `${heightPercent}%` }



const CONFIDENCE_THRESHOLD = {
  code: 3,
  station: 3,
  date: 5,
};

const DETERMINE_THRESHOLD = {
  code: 9,
  station: 4,
  date: 9,
}

const createDefaultStats = () => ({
  codes: {} as Record<string, number>,
  stations: {} as Record<string, number>,
  dates: {} as Record<string, number>,
  codeBest: { value: "", freq: 0 },
  stationBest: { value: "", freq: 0 },
  dateBest: { value: "", freq: 0 },
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

  // Refs
  const camera = useRef<Camera>(null);
  const timerRef = useRef<ScanningTimerRef>(null);
  const statsRef = useRef(createDefaultStats());
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const frameLayout = useRef({ x: leftDistance, y: topDistance, width: FRAME_WIDTH, height: FRAME_HEIGHT });
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const isStoppingRef = useRef(false);
  const isTakingPhotoRef = useRef(false);

  // States
  const [shouldRenderCamera, setShouldRenderCamera] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanningActive, setIsScanningActive] = useState(false);
  const [hasFoundResult, setHasFoundResult] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult>({});
  const [appState, setAppState] = useState(AppState.currentState);

  // Camera Settings
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const format = useCameraFormat(device, [{ photoAspectRatio: 4 / 3 }, { videoAspectRatio: 4 / 3 }]);

  // 1. TÍNH TOÁN SCAN REGION THEO PHẦN TRĂM Ô MÀU
  // Tọa độ Y bắt đầu của khung quét (nằm giữa màn hình)
  const startAutoCapture = useCallback(() => {
    if (captureIntervalRef.current || isStoppingRef.current) return;

    const captureOnce = async () => {
      if (!isScanningActive || !camera.current || isTakingPhotoRef.current || isProcessing || isStoppingRef.current) return;

      isTakingPhotoRef.current = true;
      try {
        const photo = await camera.current.takePhoto({ flash: isFlashOn ? 'on' : 'off', enableShutterSound: false, });
        if (isMounted.current && isScanningActive && !isStoppingRef.current) {
          processImageForOCR(photo.path, photo.width, photo.height);
        }
      } catch (err) {
        console.log("Capture error (Camera potentially closed)", err);
      } finally {
        isTakingPhotoRef.current = false;
      }
    };
    captureOnce();

    captureIntervalRef.current = setInterval(captureOnce, 500);
  }, [isScanningActive, isFlashOn, isProcessing]);

  const stopAutoCapture = () => {
    isStoppingRef.current = true; // Chặn mọi yêu cầu chụp mới ngay lập tức
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
      console.log("⏹️ Đã dừng chụp ảnh tự động.");
    }
  };

  const handleProcessedOCR = useCallback((textData: string, baseWeight: number = 1, fromImage: boolean = false) => {
    if (!isScanningActive || hasFoundResult || !isMounted.current) return;

    const current = fastParseFrame(textData.toUpperCase()?.split('\n'), statsRef.current?.dateBest?.value, fromImage);
    if (!current) return;

    let needsUpdateUI = false;
    const keys = ['code', 'station', 'date'] as const;

    keys.forEach(key => {
      const val = current[key];
      if (!val) return;

      let finalWeight = baseWeight;

      // CHỈ ÁP DỤNG PHẠT CHO "CODE" (MÃ VÉ)
      if (key === 'code') {
        const penalty = getCodePenaltyFactor(val, statsRef.current.dateBest.value);
        finalWeight = baseWeight * penalty;

        // Nếu điểm sau phạt quá thấp (ví dụ < 0.5), ta có thể log để debug
        if (penalty < 1) {
          console.log(`⚠️ Code ${val} bị phạt hệ số ${penalty}. Điểm cộng: ${finalWeight}`);
        }
      }

      const statsKey = key === 'code' ? 'codes' : key === 'station' ? 'stations' : 'dates';
      statsRef.current[statsKey][val] = (statsRef.current[statsKey][val] || 0) + finalWeight;

      if (statsRef.current[statsKey][val] > statsRef.current[`${key}Best`].freq) {
        needsUpdateUI = true;
        statsRef.current[`${key}Best`] = { value: val, freq: statsRef.current[statsKey][val] };
      }
    });
    if (needsUpdateUI) {
      setScanResult({
        code: statsRef.current.codeBest.freq >= CONFIDENCE_THRESHOLD.code ? statsRef.current.codeBest.value : scanResult.code,
        station: statsRef.current.stationBest.freq >= CONFIDENCE_THRESHOLD.station ? statsRef.current.stationBest.value : scanResult.station,
        date: statsRef.current.dateBest.freq >= CONFIDENCE_THRESHOLD.date ? statsRef.current.dateBest.value : scanResult.date,
      });
    }

    const isFullyCaptured =
      statsRef.current.codeBest.freq >= DETERMINE_THRESHOLD.code &&
      statsRef.current.stationBest.freq >= DETERMINE_THRESHOLD.station &&
      statsRef.current.dateBest.freq >= DETERMINE_THRESHOLD.date;

    if (isFullyCaptured && !hasFoundResult) {
      setHasFoundResult(true);
      setIsScanningActive(false);
      stopAutoCapture();
    }
  }, [isScanningActive, hasFoundResult, stopAutoCapture]);

  const onFrameOCR = useRunOnJS((text: string) => {
    handleProcessedOCR(text, 1);
    if (!captureIntervalRef.current && isScanningActive && !hasFoundResult) {
      startAutoCapture();
    }
  }, [handleProcessedOCR, isScanningActive, hasFoundResult, startAutoCapture]);


  const { scanText } = useTextRecognition({
    language: 'latin',
    frameSkipThreshold: 12,
    scanRegion: scanRegion as any,
  });

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (!isScanningActive || hasFoundResult) return;
    const data = scanText(frame);
    if (data?.resultText) onFrameOCR(data.resultText);
  }, [isScanningActive, hasFoundResult]);

  // Thêm useRef để lưu tọa độ thực tế của khung quét

  const containerRef = useRef<View>(null);

  const processImageForOCR = async (uri: string, pW: number, pH: number, shouldCrop = true) => {
    if (isProcessing || !isMounted.current || isStoppingRef.current) return;
    setIsProcessing(true);
    try {
      let finalUri = uri;
      if (shouldCrop) {
        const scale = screenWidth / pW;
        const { x, y, width, height } = frameLayout.current;
        const offsetY = (screenHeight - (screenWidth * pH / pW)) / 2;

        const crop = await ImageManipulator.manipulateAsync(uri, [
          {
            crop: {
              originX: Math.max(0, x / scale),
              originY: Math.max(0, (y - offsetY) / scale),
              width: width / scale,
              height: height / scale
            }
          },
          { resize: { width: 1000 } }
        ], { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG });
        finalUri = crop.uri;
      }

      const result = await PhotoRecognizer({ uri: finalUri });
      if (result?.resultText) {
        handleProcessedOCR(result.resultText, 5, true); // Tặng 5 điểm tin cậy cho ảnh chụp
      }
    } catch (e) {
      console.error("OCR Photo Error:", e);
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
    if (isScanningActive) {
      stopAutoCapture();
    } else {
      isStoppingRef.current = false;
      setScanResult({});
      statsRef.current = createDefaultStats();
      setHasFoundResult(false);
    }
    setIsScanningActive(!isScanningActive);
  };

  const handleTimeout = useCallback(() => setIsTimeout(true), [])

  useEffect(() => {
    isMounted.current = true;
    requestPermission().then(setIsPermissionGranted);

    Animated.loop(Animated.sequence([
      Animated.timing(scanLineAnim, { toValue: FRAME_HEIGHT - 4, duration: 2000, useNativeDriver: true }),
      Animated.timing(scanLineAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
    ])).start();

    const sub = AppState.addEventListener('change', (state) => setAppState(state));
    return () => {
      isMounted.current = false;
      sub.remove();
      stopAutoCapture();
    };
  }, []);

  useEffect(() => {
    const focusSub = navigation.addListener('focus', () => {
      setShouldRenderCamera(true);
      setIsScanningActive(false);
      setHasFoundResult(false);
      isStoppingRef.current = false;
      setScanResult({});
      statsRef.current = createDefaultStats();
      setIsFlashOn(false);
    });
    const blurSub = navigation.addListener('blur', () => {
      setShouldRenderCamera(false);
      stopAutoCapture();
    });
    return () => { focusSub(); blurSub(); };
  }, [navigation, stopAutoCapture]);

  useEffect(() => {
    if (hasFoundResult && scanResult.code && scanResult.station && scanResult.date) {
      const finalizeScan = async () => {
        stopAutoCapture();
        setShouldRenderCamera(false);
        setIsLoading(true);

        const payload = prepareTicketPayload(scanResult, timerRef.current?.getElapsed() || 0);
        console.log('Payload send: ', JSON.stringify(payload))
        const response = await api.checkAndSave(payload);

        setIsLoading(false);
        if (response.kind === 'ok' && isMounted.current) {
          setTimeout(() => {
            navigation.navigate('TicketDetail', { ticketId: response.data?.data?.ticket?._id, source: 'scan' });
          }, 200);
        } else {
          Toast.show({
            type: 'info',
            text1: `❌ Lỗi: đọc vé số không thành công. Vui lòng đưa vé vào sát khung hình và thử lại!`,
            position: 'bottom',
            bottomOffset: 150,
            visibilityTime: 1500,
          });

        }
      };
      finalizeScan();
    }
  }, [hasFoundResult]);

  useEffect(() => {
    if (isTimeout && isMounted.current) {
      // 1. Dừng mọi tác vụ ngầm
      stopAutoCapture();

      // 2. Sử dụng setTimeout để đẩy lệnh navigate ra khỏi chu kỳ render hiện tại
      // Việc này giúp tránh lỗi "Cannot update a component while rendering another"
      const timeoutId = setTimeout(() => {
        if (isMounted.current) {
          setShouldRenderCamera(false);
          setIsTimeout(false); // Reset state an toàn
          navigation.navigate("ErrorOCR");
        }
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [isTimeout, navigation, stopAutoCapture]);

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
        photoQualityBalance='speed'
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
        <ScanInfoOverlay isVisible={isScanningActive || hasFoundResult} data={scanResult} />
        <ScanningTimer
          ref={timerRef}
          isActive={isScanningActive && !hasFoundResult}
          maxTime={10}
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
