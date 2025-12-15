import React, { useEffect } from "react"
import Svg, { Rect } from "react-native-svg"
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated"
import IconScanRed from "@assets/svg/scan-red.svg";
import { useAppTheme } from "@/theme/context"

const AnimatedRect = Animated.createAnimatedComponent(Rect)

type Props = {
  size?: number
  color?: string
  glowColor?: string
}

export function ScanAnimatedIcon({
  size = 64,
}: Props) {

  const translateY = useSharedValue(0)
  const { theme: { colors } } = useAppTheme();

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(12, {
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true // reverse
    )
  }, [])

  const animatedProps = useAnimatedProps(() => ({
    y: translateY.value,
  }))

  return (
    <Svg
      width={size}
      height={(size * 18) / 16}
      viewBox="0 0 16 18"
    >
      {/* Frame icon */}
      <IconScanRed width="100%" height="100%" fill={colors.primary} />

      {/* Thanh sáng */}
      <AnimatedRect
        x={2}
        width={12}
        height={1.2}
        rx={1}
        fill={colors.gold}
        animatedProps={animatedProps}
        opacity={0.9}
      />
    </Svg>
  )
}
