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
import { fastParseFrame } from '@/utils/fastParseFrame';
import { ScanningTimer, ScanningTimerRef } from '@/components/Scan/ScanningTimer';
import { prepareTicketPayload } from '@/utils/ticket-helper';
import { api } from '@/services/api';
import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { decodeYOLOFloat32 } from '@/utils/yolov8';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import * as MediaLibrary from 'expo-media-library';

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
  const timerRef = useRef<ScanningTimerRef>(null);
  // Camera & Permissions logic
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const camera = useRef<Camera>(null);

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
  const statsRef = useRef(createDefaultStats());
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCapturingRef = useRef(false); // Tránh việc hàm chụp bị lặp chồng chéo
  const isTakingPhotoRef = useRef(false);
  const isStoppingRef = useRef(false);
  const [model, setModel] = useState<TensorflowModel | null>(null);
  const { resize } = useResizePlugin();
  const frameCount = useRef(0);
  const [detections, setDetections] = useState<any[]>([]);
  const isAutoCapturing = useRef(false);
  const lastDetections = useRef<any[]>([]);

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
    }, 400);
  };

  const updateVoting = useRunOnJS((label: string, value: string, isPhoto: boolean) => {
    const points = isPhoto ? 10 : 1; // Ảnh chụp nét hơn nên điểm cao hơn
    const category = `${label}s` as 'codes' | 'stations' | 'dates';
    const bestKey = `${label}Best` as 'codeBest' | 'stationBest' | 'dateBest';

    // 1. Cộng dồn điểm
    statsRef.current[category][value] = (statsRef.current[category][value] || 0) + points;

    // 2. Tìm giá trị có tổng điểm cao nhất
    const currentScore = statsRef.current[category][value];
    if (currentScore > statsRef.current[bestKey].freq) {
      statsRef.current[bestKey] = { value, freq: currentScore };

      // 3. Cập nhật UI ngay nếu đạt ngưỡng tin cậy (ví dụ 5 điểm)
      if (currentScore >= 5) {
        setScanResult(prev => ({ ...prev, [label]: value }));
      }
    }

    // 4. Kiểm tra hoàn tất (Ngưỡng chốt kết quả: 25 điểm)
    const isDone =
      statsRef.current.codeBest.freq >= 25 &&
      statsRef.current.dateBest.freq >= 25 &&
      statsRef.current.stationBest.freq >= 15;

    if (isDone && isScanningActive) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setHasFoundResult(true);
      setIsScanningActive(false);
      stopAutoCapture();
    }
  }, [isScanningActive]);

  const handleOCR = useRunOnJS((frameData) => {
    // Xử lý 7 Pipeline của bạn ở đây
    if (!isScanningActive || hasFoundResult) return;


    const current = fastParseFrame(frameData.split('\n'), statsRef.current?.dateBest?.value);
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
      // const bestMatch = getMostFrequent(statsRef.current[statsKey]);
      if (statsRef.current[statsKey][val] > statsRef.current[`${key}Best`].freq) {
        statsRef.current[`${key}Best`] = { value: val, freq: statsRef.current[statsKey][val] };
      }

      // 3. CẬP NHẬT UI NẾU ĐẠT NGƯỠNG
      // Chỉ cập nhật nếu giá trị mới này có tần suất đủ lớn (Confidence)
      if (statsRef.current[`${key}Best`].freq >= CONFIDENCE_THRESHOLD[key]) {
        setScanResult(prev => {
          // Nếu giá trị tốt nhất trong kho khác với giá trị đang hiển thị trên UI thì mới update
          if (prev[key] !== statsRef.current[`${key}Best`].value) {
            return { ...prev, [key]: statsRef.current[`${key}Best`].value };
          }
          return prev;
        });
      }
    });

    if (!captureIntervalRef.current && isScanningActive && !hasFoundResult) {
      console.log("🚀 bắt đầu chế độ chụp ảnh 0.3s/lần");
      startAutoCapture();
    }

    const isFullyCaptured =
      statsRef.current.codeBest.freq >= DETERMINE_THRESHOLD.code &&
      statsRef.current.stationBest.freq >= DETERMINE_THRESHOLD.station &&
      statsRef.current.dateBest.freq >= DETERMINE_THRESHOLD.date;
    if (isFullyCaptured) {
      setIsScanningActive(false);
      setHasFoundResult(true);
      stopAutoCapture();
    }

  }, [isScanningActive, isCapturingRef, hasFoundResult]);

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


  const handleAIResults = useRunOnJS((results) => {
    if (results.length === 0 || !isScanningActive || isAutoCapturing.current) return;

    const filtered = Object.values(
      results.reduce((acc: any, current: any) => {
        if (!acc[current.className] || acc[current.className].confidence < current.confidence) {
          acc[current.className] = current;
        }
        return acc;
      }, {} as Record<string, any>)
    );

    setDetections(filtered as any[]);
    lastDetections.current = filtered;

    // CHIẾN THUẬT MỚI: Chỉ cần thấy ít nhất 1 vùng quan trọng là "Bắn" ngay
    const shouldTrigger = filtered.some((d: any) =>
      (d.className === 'code' || d.className === 'date') && d.confidence > 0.45
    );

    if (shouldTrigger) {
      // Gọi hàm chụp ảnh ngay không cần đợi lockCounter
      triggerBurstPhoto();
    }
  }, [isScanningActive]);

  const processSubCrops = async (path: string, pW: number, pH: number) => {
    const currentDetections = lastDetections.current;

    // 1. Xác định hướng ảnh (Photo Orientation)
    // Nếu pH > pW nghĩa là ảnh dọc, ngược lại là ảnh ngang.
    const isPhotoPortrait = pH > pW;

    // 2. Tính toán SquareSize dựa trên ảnh gốc
    // Vì UI bạn dùng FRAME_WIDTH = screenWidth * 0.9, ta map tương ứng qua ảnh gốc
    const squareSizeInPhoto = (isPhotoPortrait ? pW : pH) * 0.9;

    const offsetX = (pW - squareSizeInPhoto) / 2;
    const offsetY = (pH - squareSizeInPhoto) / 2;

    for (const det of currentDetections) {
      // 3. MA TRẬN CHUYỂN ĐỔI TỌA ĐỘ (Cực kỳ quan trọng)
      // det.rect trả về giá trị 0-1 từ AI (đã fix xoay ở FrameProcessor)
      // Chúng ta cần map nó về Pixel thực tế của ảnh chụp

      // Giả sử AI đang nhìn theo hệ trục hoán đổi (giống UI)
      let originX = offsetX + (1 - det.rect.top - det.rect.height) * squareSizeInPhoto;
      let originY = offsetY + (det.rect.left) * squareSizeInPhoto;
      let width = det.rect.height * squareSizeInPhoto;
      let height = det.rect.width * squareSizeInPhoto;

      // 4. THÊM PADDING 30% ĐỂ AN TOÀN (Tăng diện tích bao quanh chữ)
      const padW = width * 0.1;
      const padH = height * 0.1;

      const finalX = Math.max(0, originX - padW);
      const finalY = Math.max(0, originY - padH);
      const finalW = Math.min(pW - finalX, width + padW * 2);
      const finalH = Math.min(pH - finalY, height + padH * 2);

      try {
        const crop = await ImageManipulator.manipulateAsync(
          path,
          [{
            crop: {
              originX: Math.round(finalX),
              originY: Math.round(finalY),
              width: Math.round(finalW),
              height: Math.round(finalH)
            }
          }],
          { format: ImageManipulator.SaveFormat.JPEG, compress: 0.9 }
        );

        // DEBUG: Chia sẻ ảnh để xem AI đã cắt đúng chưa
        // await Sharing.shareAsync(crop.uri); 
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(crop.uri);
          console.log("📸 Đã lưu ảnh crop vào Gallery để kiểm tra!");
        }
        const ocrResult = await PhotoRecognizer({ uri: crop.uri });
        if (ocrResult?.resultText) {
          console.log("ocrResult", ocrResult.resultText)
          const parsed = fastParseFrame(ocrResult.resultText.split('\n'), statsRef.current.dateBest.value);
          console.log("parsed: ", parsed)
          const validClasses = ['code', 'date', 'station'];
          if (parsed && validClasses.includes(det.className)) {
            const key = det.className as 'code' | 'date' | 'station';
            if (parsed[key]) {
              updateVoting(key, parsed[key] as any, true);
            }
          }
        }
      } catch (e) {
        console.error("Lỗi cắt ảnh OCR:", e);
      }
    }
  };

  const triggerBurstPhoto = async () => {
    console.log("đc chụp hình rồi đó")
    if (!camera.current || isAutoCapturing.current) return;
    isAutoCapturing.current = true;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Chụp 2 tấm liên tiếp để lấy được tấm nét nhất
      for (let i = 0; i < 2; i++) {
        const photo = await camera.current.takePhoto({ flash: isFlashOn ? 'on' : 'off' });
        processSubCrops(photo.path, photo.width, photo.height);
      }
    } finally {
      isAutoCapturing.current = false;
    }
  };

  // Run model inference on the JS thread. Calling native JS objects inside a worklet
  // causes errors because worklets run on a separate thread and cannot access JS state.
  const handleFrameOnJS = useRunOnJS(async (buffer: ArrayBuffer) => {
    try {
      if (!isScanningActive || model == null) return;

      // CHỈNH SỬA Ở ĐÂY: Chuyển ArrayBuffer sang Uint8Array
      const inputData = new Uint8Array(buffer);

      const outputs = await model.run([inputData]);

      if (outputs && outputs.length > 0) {
        const detections = decodeYOLOFloat32(outputs[0] as Float32Array);
        if (detections.length > 0) {
          handleAIResults(detections);
        }
      }
    } catch (e) {
      console.error('Error running model on JS thread:', e);
    }
  }, [isScanningActive, model]);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';

    // 1. Kiểm soát điều kiện và tần suất (3-5 FPS là đủ để tracking)
    if (!isScanningActive || model == null) return;
    frameCount.current++;
    if (frameCount.current % 10 !== 0) return;

    const isPortrait = frame.orientation === 'portrait' || frame.orientation === 'portrait-upside-down';
    const frameActualWidth = isPortrait ? frame.width : frame.height;
    const frameActualHeight = isPortrait ? frame.height : frame.width;

    const scaleX = frameActualWidth / screenWidth;
    const scaleY = frameActualHeight / screenHeight;

    // 2. TÍNH CẠNH HÌNH VUÔNG
    // Chúng ta lấy FRAME_WIDTH làm chuẩn để đảm bảo bao trọn chiều ngang vé số
    const squareSizeInFrame = FRAME_WIDTH * scaleX;

    // 3. Tọa độ X, Y để cắt chính giữa vùng Camera
    // Đảm bảo không vượt quá kích thước frame
    const cropX = Math.max(0, (frameActualWidth - squareSizeInFrame) / 2);
    const cropY = Math.max(0, (frameActualHeight - squareSizeInFrame) / 2);

    try {
      // 2. Resize trực tiếp ra Float32
      // Plugin sẽ tự động chuyển giá trị pixel về khoảng [0, 1] cho bạn
      const resized = resize(frame, {
        scale: { width: 640, height: 640 },
        pixelFormat: 'rgb',
        dataType: 'float32',
      });
      // 3. Chạy inference (Bản Float32 không cần cộng trừ 128)
      // Lưu ý: Dùng mảng [resized] vì model mong đợi list tensors
      const outputs = model.runSync([resized]);

      if (outputs && outputs.length > 0) {
        // Ép kiểu về Float32Array để tính toán
        const outputTensor = outputs[0] as Float32Array;

        // 4. Decode kết quả (Nhớ hạ threshold xuống như đã thảo luận)
        const detections = decodeYOLOFloat32(outputTensor);
        if (detections.length > 0) {
          // Log để kiểm tra xem đã hiện đủ 3 nhãn chưa
          console.log("Tìm thấy:", detections.map(d => d.className + '=' + d.confidence.toFixed(2)).join(', '));

          // Gửi kết quả về JS Thread để xử lý UI hoặc chụp ảnh
          handleAIResults(detections);
        }
      }
    } catch (error) {
      console.log("Lỗi Inference:", error);
    }
  }, [isScanningActive, model]);

  // const frameProcessor = useFrameProcessor((frame) => {
  //   'worklet';
  //   if (!isScanningActive || hasFoundResult) return;
  //   const data = scanText(frame);
  //   if (data && data.resultText) {
  //     handleOCR(data.resultText);
  //   }
  // }, [isScanningActive]);

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
        if (statsRef.current[statsKey][val] > statsRef.current[`${key}Best`].freq) {
          statsRef.current[`${key}Best`] = { value: val, freq: statsRef.current[statsKey][val] };
        }


        // 3. CẬP NHẬT UI NẾU ĐẠT NGƯỠNG
        // Chỉ cập nhật nếu giá trị mới này có tần suất đủ lớn (Confidence)
        if (statsRef.current[`${key}Best`].freq >= CONFIDENCE_THRESHOLD[key]) {
          setScanResult(prev => {
            // Nếu giá trị tốt nhất trong kho khác với giá trị đang hiển thị trên UI thì mới update
            if (prev[key] !== statsRef.current[`${key}Best`].value) {
              return { ...prev, [key]: statsRef.current[`${key}Best`].value };
            }
            return prev;
          });
        }

        const isFullyCaptured =
          statsRef.current.codeBest.freq >= DETERMINE_THRESHOLD.code &&
          statsRef.current.stationBest.freq >= DETERMINE_THRESHOLD.station &&
          statsRef.current.dateBest.freq >= DETERMINE_THRESHOLD.date;

        if (isFullyCaptured) {
          setIsScanningActive(false);
          setHasFoundResult(true);
          stopAutoCapture();
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
    setIsTimeout(true);
  }, []);

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
    async function loadAI() {
      try {
        // Đường dẫn này tùy thuộc vào việc bạn đặt file ở đâu (thường là trong assets)
        const loadedModel = await loadTensorflowModel(require('@assets/model/best_float32.tflite'));
        console.log("Model Inputs:", loadedModel.inputs);
        console.log("Model Outputs:", loadedModel.outputs);
        setModel(loadedModel);
        console.log("✅ YOLOv8 Model Loaded");
      } catch (e) {
        console.error("❌ Lỗi load model AI:", e);
      }
    }
    loadAI();
  }, []);


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

  useEffect(() => {
    async function callAPICheckTicket() {
      if (hasFoundResult && scanResult.code && scanResult.station && scanResult.date) {
        const duration = timerRef.current?.getElapsed() || 0;

        const payload = prepareTicketPayload(scanResult, duration);
        console.log("🚀 Payload gửi đi:", payload);

        // Gọi API check-and-save của bạn ở đây
        setIsLoading(true);
        const response = await api.checkAndSave(payload);
        setIsLoading(false);
        setHasFoundResult(false);
        if (response.kind === 'ok') {
          navigation.navigate('TicketDetail', { ticketId: response?.data?.data?.ticket?._id, source: 'scan' });
        } else {
          // xử lý lỗi
          Toast.show({
            type: 'error',
            text1: `  ❌ Lỗi: ${response.kind || 'Không thể kết nối đến máy chủ'}`,
            position: 'bottom',
            bottomOffset: 150,
            visibilityTime: 700,
          });
        }
      }
    }
    callAPICheckTicket();
  }, [hasFoundResult]);

  useEffect(() => {
    if (isTimeout) {
      // Dừng mọi tiến trình trước khi đi
      stopAutoCapture();
      setIsScanningActive(false);

      // Navigate sau khi kết thúc chu kỳ render
      navigation.navigate("ErrorOCR");

      // Reset lại để tránh quay lại màn hình bị lặp lại logic
      setIsTimeout(false);
    }
  }, [isTimeout]);

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


      {/* Vẽ các khung nhận diện */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {detections.map((det, index) => {
          // 1. Kích thước vùng vuông bạn đã crop trong Frame Processor
          const squareSize = screenWidth * 0.9;

          // 2. Điểm bắt đầu của hình vuông này trên màn hình (để bù trừ tọa độ)
          const offsetX = (screenWidth - squareSize) / 2;
          const offsetY = (screenHeight - squareSize) / 2;

          // 3. Công thức tính tọa độ UI dựa trên việc HOÁN ĐỔI TRỤC (đã fix ở bước trước)
          // AI left -> UI top
          // AI top -> UI right (UI left = 1 - top - width)

          const uiWidth = det.rect.height * squareSize;
          const uiHeight = det.rect.width * squareSize;

          const uiLeft = offsetX + (1 - det.rect.top - det.rect.height) * squareSize;
          const uiTop = offsetY + (det.rect.left * squareSize);

          return (
            <View
              key={index}
              style={{
                position: 'absolute',
                left: uiLeft,
                top: uiTop,
                width: uiWidth,
                height: uiHeight,
                borderWidth: 2,
                borderColor: det.className === 'code' ? '#00FF00' : '#FFD700',
                borderRadius: 4,
                pointerEvents: 'none',
                zIndex: 999
              }}
            >
              <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', alignSelf: 'flex-start' }}>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                  {det.className} {(det.confidence * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
          );
        })}
      </View>

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
        <ScanInfoOverlay isVisible={(isScanningActive || hasFoundResult)} data={scanResult} />

        <ScanningTimer
          ref={timerRef}
          isActive={isScanningActive}
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
