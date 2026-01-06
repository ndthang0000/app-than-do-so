import Tts from 'react-native-tts';

Tts.setDefaultLanguage('vi-VN');
Tts.setDefaultRate(0.55);
Tts.setDefaultPitch(1.0);

let speechQueue: string[] = [];
let isSpeaking = false;
let onSpeechEndCallback: (() => void) | null = null;

Tts.addEventListener('tts-finish', () => {
  isSpeaking = false;
  if (speechQueue.length === 0 && onSpeechEndCallback) {
    onSpeechEndCallback(); // Gọi để trả lại volume nhạc nền
  }
  processNextInQueue();
});

const processNextInQueue = () => {
  if (speechQueue.length > 0 && !isSpeaking) {
    isSpeaking = true;
    const text = speechQueue.shift();
    if (text) Tts.speak(text);
  }
};

export const speakLotteryResult = (station: string, rank: string, value: string, onEnd: () => void) => {
  onSpeechEndCallback = onEnd;
  const prizeName = rank === "DB" ? "Giải Đặc biệt" : `Giải ${rank[1]}`;

  // Tạo độ trễ: Dấu phẩy (,) tạo khoảng nghỉ ngắn, dấu chấm (.) nghỉ dài hơn
  // Thêm khoảng trắng giữa các con số để máy đọc chậm rãi hơn
  const formattedValue = value.split("").join("      ");

  // Chuỗi văn bản: Tên đài -> Giải -> Nghỉ 1 nhịp -> Số (đọc chậm)
  const text = `Đài ${station}, ${prizeName}. . . Con số là: ${formattedValue}`;

  speechQueue.push(text);
  processNextInQueue();
};