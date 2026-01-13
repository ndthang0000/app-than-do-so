import React, { ReactNode, useState, useEffect } from "react"
import { ViewStyle, Dimensions } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing
} from "react-native-reanimated"

const SCREEN_WIDTH = Dimensions.get("window").width

interface Props {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  dependency: any // Truyền dateSelected vào đây
}

export const DateSwipeWrapper: React.FC<Props> = ({ children, onSwipeLeft, onSwipeRight, dependency }) => {
  const translateX = useSharedValue(0)
  const [displayChildren, setDisplayChildren] = useState(children)

  // Khi ngày thay đổi từ bên ngoài (ví dụ bấm nút mũi tên)
  useEffect(() => {
    setDisplayChildren(children)
  }, [dependency])

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onUpdate((event) => {
      translateX.value = event.translationX
    })
    .onEnd((event) => {
      if (event.translationX < -60 && Math.abs(event.velocityX) > 400) {
        // TRƯỢT SANG TRÁI (TIẾN NGÀY)
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200, easing: Easing.out(Easing.quad) }, () => {
          runOnJS(onSwipeLeft!)()
          // Đặt view mới ở bên phải để sẵn sàng trượt vào
          translateX.value = SCREEN_WIDTH
          translateX.value = withTiming(0, { duration: 250 })
        })
      } else if (event.translationX > 60 && Math.abs(event.velocityX) > 400) {
        // TRƯỢT SANG PHẢI (LÙI NGÀY)
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 200, easing: Easing.out(Easing.quad) }, () => {
          runOnJS(onSwipeRight!)()
          translateX.value = -SCREEN_WIDTH
          translateX.value = withTiming(0, { duration: 250 })
        })
      } else {
        translateX.value = withTiming(0)
      }
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        {displayChildren}
      </Animated.View>
    </GestureDetector>
  )
}