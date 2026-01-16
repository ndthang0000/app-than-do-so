// Định nghĩa interface rõ ràng
export interface Detection {
  classId: number;
  className: string;
  confidence: number;
  rect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

const LABELS = ['code', 'date', 'station'];

/**
 * Tính toán chỉ số giao nhau (Intersection over Union)
 */
const iou = (rectA: Detection['rect'], rectB: Detection['rect']): number => {
  'worklet';
  const x1 = Math.max(rectA.left, rectB.left);
  const y1 = Math.max(rectA.top, rectB.top);
  const x2 = Math.min(rectA.left + rectA.width, rectB.left + rectB.width);
  const y2 = Math.min(rectA.top + rectA.height, rectB.top + rectB.height);

  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = rectA.width * rectA.height;
  const areaB = rectB.width * rectB.height;
  const union = areaA + areaB - intersection;

  return intersection / union;
};

/**
 * Hàm NMS: Giữ lại box tốt nhất, loại bỏ box chồng lấn
 */
const nms = (detections: Detection[], iouThreshold: number): Detection[] => {
  'worklet';
  // Sắp xếp giảm dần theo độ tin cậy
  const sorted = detections.sort((a, b) => b.confidence - a.confidence);
  const result: Detection[] = [];

  while (sorted.length > 0) {
    const best = sorted.shift();
    if (best) {
      result.push(best);
      // Loại bỏ các box có độ chồng lấn cao với box "best"
      for (let i = 0; i < sorted.length; i++) {
        if (iou(best.rect, sorted[i].rect) > iouThreshold) {
          sorted.splice(i, 1);
          i--;
        }
      }
    }
  }
  return result;
};


export const decodeYOLOFloat32 = (output: Float32Array): Detection[] => {
  'worklet';
  const results: Detection[] = [];
  const rows = 8400; // YOLOv8 640px
  const numClasses = 3;
  const threshold = 0.45; // Ngưỡng tin cậy

  for (let i = 0; i < rows; i++) {
    let maxConf = 0;
    let classId = -1;

    // Truy xuất xác suất của 3 class (code, date, station)
    // Output của YOLOv8 Float32 thường nằm ở các hàng từ index 4 trở đi
    for (let c = 0; c < numClasses; c++) {
      const conf = output[(4 + c) * rows + i];
      if (conf > maxConf) {
        maxConf = conf;
        classId = c;
      }
    }

    if (maxConf > threshold) {
      // Tọa độ đã là số thực chuẩn từ model
      const x = output[0 * rows + i];
      const y = output[1 * rows + i];
      const w = output[2 * rows + i];
      const h = output[3 * rows + i];

      results.push({
        classId,
        className: LABELS[classId],
        confidence: maxConf,
        rect: {
          left: x - w / 2,
          top: y - h / 2,
          width: w,
          height: h,
        },
      });
    }
  }

  return nms(results, 0.45);
};