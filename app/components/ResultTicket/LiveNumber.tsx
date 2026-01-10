import { useAppTheme } from "@/theme/context";
import { useEffect, useMemo, useState } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { Text } from "../Text";
import { TextStyle, View, ViewStyle } from "react-native";
import { BALL_COLORS, LOTTERY_NUMBER_LENGTH, PrizeKey, Region } from "@/constants/lotteryTicket";
import { DisplayMode } from "./LotteryResultTable";

export type NumberType = 'PENDING' | 'ROLLING' | 'NEW' | 'DONE';

const SlotMachineTicker = ({ digitCount }: { digitCount: number }) => {
  // Tạo mảng dựa trên số lượng chữ số của giải (vd: Giải Đặc biệt có 6 bóng)
  return (
    <View style={$ballRow}>
      {Array.from({ length: digitCount }).map((_, i) => (
        <SingleBall key={i} />
      ))}
    </View>
  )
}

const SingleBall = () => {
  const [num, setNum] = useState(0)

  // Chọn 1 màu ngẫu nhiên duy nhất khi trái bóng được khởi tạo (Mount)
  const randomBgColor = useMemo(() => {
    return BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)]
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setNum(Math.floor(Math.random() * 10))
    }, 80 + Math.random() * 50) // Tốc độ lệch nhau chút cho tự nhiên
    return () => clearInterval(interval)
  }, [])

  return (
    <View style={[$ballInner, { backgroundColor: randomBgColor }]}>
      <Text text={num.toString()} style={[$ballText, { color: "white" }]} />
    </View>
  )
}

export const LiveNumber = ({ value, state, textStyle, prizeKey, region, displayMode }: { value: string, state: NumberType, textStyle: any, prizeKey: PrizeKey, region: Region, displayMode: DisplayMode }) => {
  const { theme: { colors } } = useAppTheme();

  // Hiệu ứng nhấp nháy cho số vừa có kết quả (NEW)
  const scaleValue = useSharedValue(1);
  useEffect(() => {
    if (state === 'NEW') {
      scaleValue.value = withRepeat(withTiming(1.1, { duration: 500 }), -1, true);
    } else {
      scaleValue.value = 1;
    }
  }, [state]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }]
  }));

  if (state === 'ROLLING') {
    let digitCount = LOTTERY_NUMBER_LENGTH[region]?.[prizeKey] || 5
    if (displayMode === 'last2') {
      digitCount = 2;
    } else if (displayMode === 'last3') {
      digitCount = 3;
    }
    return <SlotMachineTicker digitCount={digitCount} />; // Hiệu ứng số chạy
  }

  if (state === 'DONE') {
    return <Text text={value} style={textStyle} />; // Hiển thị số bình thường
  }

  return (
    <Animated.View style={[animatedStyle, $numberBox, { backgroundColor: state === 'NEW' ? colors.palette.accent200 : 'transparent' }]}>
      <Text
        text={state === 'PENDING' ? "•••" : value}
        style={[
          $textStyle,
          { color: state === 'NEW' ? colors.palette.accent500 : (state === 'PENDING' ? colors.textDim : colors.text) }
        ]}
      />
    </Animated.View>
  );
};

const $numberBox: ViewStyle = {
  justifyContent: "center",
  alignItems: "center",
  minHeight: 30,
  minWidth: 40,
  position: "relative", // Để chứa Badge "NEW"
}

const $textStyle: TextStyle = {
  fontSize: 18,
  fontWeight: "900",
  textAlign: "center",
}

const $ballRow: ViewStyle = {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
}

const $ballInner: ViewStyle = {
  width: 14,
  height: 18,
  borderRadius: 9,
  borderWidth: 0.6,
  backgroundColor: "#fff",
  justifyContent: "center",
  alignItems: "center",
  // Đổ bóng cho trái bóng có độ khối
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.2,
  shadowRadius: 1,
  elevation: 2,
}

const $ballText: TextStyle = {
  fontSize: 12,
  color: "#FFFFFF", // Chữ trắng trên nền màu sẽ đẹp hơn
  fontWeight: "900",
  textAlign: "center",
  // Fix lỗi căn giữa trên Android
  includeFontPadding: false,
  textAlignVertical: "center",
  // Đảm bảo không bị lệch
  padding: 0,
  lineHeight: 12,
}