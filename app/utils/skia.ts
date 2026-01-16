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
    const fileContent = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' })
    const data = Skia.Data.fromBase64(fileContent)
    const image = Skia.Image.MakeImageFromEncoded(data)

    if (!image) return uri

    // CHỈNH SỬA TẠI ĐÂY: 
    // Chúng ta muốn ảnh kết quả có chiều ngang là 1000px để OCR nét hơn
    const OUTPUT_WIDTH = 1000;
    const OUTPUT_HEIGHT = (h / w) * OUTPUT_WIDTH;

    // Surface phải khớp hoàn toàn với kích thước chúng ta định vẽ
    const surface = Skia.Surface.Make(OUTPUT_WIDTH, OUTPUT_HEIGHT)!
    const canvas = surface.getCanvas()

    const r = 0.299;
    const g = 0.587;
    const b = 0.114;

    // Hệ số điều chỉnh nhẹ nhàng hơn
    const contrast = 1.4;  // Chỉ tăng 40% thay vì 400%
    const brightness = 0.05; // Tăng sáng nhẹ thay vì dìm tối

    const balancedMatrix = [
      r * contrast, g * contrast, b * contrast, 0, brightness,
      r * contrast, g * contrast, b * contrast, 0, brightness,
      r * contrast, g * contrast, b * contrast, 0, brightness,
      0, 0, 0, 1, 0,
    ];


    const paint = Skia.Paint()
    paint.setColorFilter(Skia.ColorFilter.MakeMatrix(balancedMatrix))

    // Vẽ tràn toàn bộ Surface mới
    const destRect = Skia.XYWHRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT)
    const sourceRect = Skia.XYWHRect(x, y, w, h)

    canvas.drawImageRect(image, sourceRect, destRect, paint)

    const snapshot = surface.makeImageSnapshot()
    const processedBase64 = snapshot.encodeToBase64(ImageFormat.JPEG, 90)

    const cacheDir = (FileSystem as any).cacheDirectory ?? (FileSystem as any).documentDirectory ?? ''
    const newPath = `${cacheDir}ocr_clean_${Date.now()}.jpg`

    await FileSystem.writeAsStringAsync(newPath, processedBase64, { encoding: 'base64' })

    return newPath
  } catch (e) {
    console.error("Skia Error:", e)
    return uri
  }
}