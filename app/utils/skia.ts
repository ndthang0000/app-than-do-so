import { Skia, ImageFormat } from "@shopify/react-native-skia"
// Use the legacy API to avoid runtime deprecation warnings for readAsStringAsync
// The modern API uses File/Directory classes; switching to legacy keeps current code stable.
import * as FileSystem from 'expo-file-system/legacy'

/**
 * Hàm làm sạch ảnh: Chuyển xám, tăng tương phản cực hạn để xóa chữ "SAU/TAM"
 * Tốc độ ước tính: < 50ms cho mảnh crop
 */
export const cleanImageForOCR = async (uri: string, x: number, y: number, w: number, h: number) => {
  try {
    const fileContent = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const data = Skia.Data.fromBase64(fileContent);
    const image = Skia.Image.MakeImageFromEncoded(data);

    if (!image) return uri;

    const OUTPUT_WIDTH = 1200;
    const OUTPUT_HEIGHT = (h / w) * OUTPUT_WIDTH;

    const surface = Skia.Surface.Make(OUTPUT_WIDTH, OUTPUT_HEIGHT)!;
    const canvas = surface.getCanvas();

    /**
     * CHIẾN THUẬT MỚI:
     * 1. Tăng tương phản vừa phải (Contrast: 1.5 - 1.8)
     * 2. Dìm độ sáng xuống một chút (Brightness: -0.1 đến -0.2) để không bị trắng xóa
     * 3. Sử dụng trọng số Grayscale chuẩn để giữ chi tiết
     */
    const contrast = 1.8;
    const brightness = -0.2;
    const r = 0.2126 * contrast;
    const g = 0.7152 * contrast;
    const b = 0.0722 * contrast;

    const safeMatrix = [
      r, g, b, 0, brightness,
      r, g, b, 0, brightness,
      r, g, b, 0, brightness,
      0, 0, 0, 1, 0,
    ];

    const paint = Skia.Paint();
    paint.setColorFilter(Skia.ColorFilter.MakeMatrix(safeMatrix));

    // Vẽ nền xám nhẹ để kiểm tra nếu ảnh bị mất (optional)
    canvas.drawColor(Skia.Color('white'));

    const destRect = Skia.XYWHRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
    const sourceRect = Skia.XYWHRect(x, y, w, h);

    canvas.drawImageRect(image, sourceRect, destRect, paint);

    const snapshot = surface.makeImageSnapshot();
    const processedBase64 = snapshot.encodeToBase64(ImageFormat.JPEG, 90);

    const cacheDir = FileSystem.cacheDirectory ?? '';
    const newPath = `${cacheDir}ocr_clean_${Date.now()}.jpg`;

    await FileSystem.writeAsStringAsync(newPath, processedBase64, { encoding: 'base64' });

    return newPath;
  } catch (e) {
    console.error("Skia Error:", e);
    return uri;
  }
};