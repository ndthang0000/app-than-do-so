import { useAppTheme } from "@/theme/context";
import { useEffect, useMemo, useState } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { Text } from "../Text";
import { Image, ImageStyle, TextStyle, View, ViewStyle } from "react-native";
import { BALL_COLORS, LOTTERY_NUMBER_LENGTH, PrizeKey, Region, getLotteryTypography, FontSizeLevel } from "@/constants/lotteryTicket";
import { DisplayMode } from "./LotteryResultTable";
import { useAppSelector } from "@/store";

export type NumberType = 'PENDING' | 'ROLLING' | 'NEW' | 'DONE';

const SlotMachineTicker = ({ digitCount, fontSize, provinceCount = 1 }: { digitCount: number, fontSize: FontSizeLevel, provinceCount?: number }) => {
  // Tạo mảng dựa trên số lượng chữ số của giải (vd: Giải Đặc biệt có 6 bóng)
  return (
    <View style={$ballRow}>
      {Array.from({ length: digitCount }).map((_, i) => (
        <SingleBall key={i} fontSize={fontSize} provinceCount={provinceCount} />
      ))}
    </View>
  )
}

const SingleBall = ({ fontSize, provinceCount = 1 }: { fontSize: FontSizeLevel, provinceCount?: number }) => {
  const [num, setNum] = useState(0)
  const typography = getLotteryTypography(fontSize);

  // Điều chỉnh kích thước bóng dựa trên số lượng đài
  const ballScale = provinceCount >= 4 ? 0.75 : provinceCount === 3 ? 0.85 : 1;
  const ballWidth = 14 * ballScale;
  const ballHeight = 18 * ballScale;
  const adjustedFontSize = typography.ballText.fontSize * ballScale;

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
    <View style={[$ballInner, { backgroundColor: randomBgColor, width: ballWidth, height: ballHeight, borderRadius: ballWidth / 2 }]}>
      <Text text={num.toString()} style={[{ color: "white", fontSize: adjustedFontSize, fontWeight: typography.ballText.fontWeight, lineHeight: adjustedFontSize * 1.2 }]} />
    </View>
  )
}

export const LiveNumber = ({ value, state, textStyle, prizeKey, region, displayMode, highlightDigit, provinceCount = 1 }:
  {
    value: string,
    state: NumberType,
    textStyle: TextStyle, prizeKey:
    PrizeKey, region: Region,
    displayMode: DisplayMode,
    highlightDigit?: number | null,
    provinceCount?: number
  }) => {
  const { theme: { colors } } = useAppTheme(); const userFontSize = useAppSelector(state => state.auth.user?.settingApp?.fontSize as FontSizeLevel) || 'MEDIUM';
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
    return <SlotMachineTicker digitCount={digitCount} fontSize={userFontSize} provinceCount={provinceCount} />; // Hiệu ứng số chạy
  }

  if (state === 'PENDING' || value === '*') {
    return (
      <View style={$gifContainer}>
        <Image
          source={require("@assets/images/long-cau.gif")}
          style={$longCauImage}
          resizeMode="contain"
        />
      </View>
    );
  }

  const renderValueWithHighlight = () => {
    // Chỉ highlight khi ở chế độ xem đầy đủ số và có số được chọn
    if (highlightDigit === null || highlightDigit === undefined) {
      return <Text text={value} style={textStyle} />;
    }

    const highlightStr = highlightDigit.toString();
    const lastTwo = value.slice(-2);
    const prefix = value.slice(0, -2);
    const isMatch = lastTwo.includes(highlightStr);

    if (isMatch) {
      return (
        <Text style={textStyle}>
          {/* Phần đầu: không truyền prop text, dùng children */}
          {prefix && <Text style={textStyle} text={prefix} />}

          {/* Phần đuôi: highlight dùng children để nhận style lồng nhau */}
          <Text
            style={{
              ...textStyle,
              color: colors.palette.accent100,
              backgroundColor: colors.gold,
            }}
            text={lastTwo}
          />

        </Text>
      );
  }

    return <Text text={value} style={textStyle} />;
  };

  const isNew = state === 'NEW';

  return (
    <Animated.View
      style={[
        animatedStyle,
        $numberBox,
        { backgroundColor: isNew ? colors.palette.accent200 : 'transparent' }
      ]}
    >
      {renderValueWithHighlight()}
    </Animated.View>
  );
};

const $numberBox: ViewStyle = {
  paddingHorizontal: 4,
  paddingVertical: 2,
  borderRadius: 4,
  justifyContent: 'center',
  alignItems: 'center',
}

const $gifContainer: ViewStyle = {
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  paddingVertical: 4
}

const $longCauImage: ImageStyle = {
  width: 15, // Điều chỉnh kích thước phù hợp với ô kết quả của bạn
  height: 15, //TODO: here
}

const $ballRow: ViewStyle = {
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  gap: 0,
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