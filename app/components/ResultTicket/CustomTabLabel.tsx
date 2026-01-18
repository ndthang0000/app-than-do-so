import React, { useEffect, useRef } from "react"
import { Animated, StyleSheet, View } from "react-native"
import { Text } from "../Text"
import { useAppTheme } from "@/theme/context"

interface Props {
  focused: boolean
  label: string
  activeColor: string
  inactiveColor: string
}

export const AnimatedTabLabel = ({ focused, label, activeColor, inactiveColor }: Props) => {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const bgOpacityAnim = useRef(new Animated.Value(0)).current
  const { theme: { colors } } = useAppTheme()

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.25 : 1, // Zoom mạnh lên 25%
      useNativeDriver: true,
      friction: 7,
      tension: 40,
    }).start()

    Animated.timing(bgOpacityAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start()
  }, [focused])

  const backgroundColor = bgOpacityAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", colors.background], // Hiện mảnh trắng nổi lên trên nền xám
  })

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.backgroundPill, { backgroundColor }]} />

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Text
          allowFontScaling={false} // Chặn việc user đổi size chữ hệ thống làm vỡ layout
          style={{
            color: focused ? activeColor : inactiveColor,
            fontWeight: "bold",
            fontSize: 14, // Giảm font gốc xuống để có khoảng trống cho việc Zoom
            paddingHorizontal: 8,
            textAlign: 'center',
            minWidth: 120,
          }}
          text={label}
        />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    alignItems: "center",
    justifyContent: "center",
    // Cho phép nội dung tràn ra ngoài một chút nếu cần khi scale
    overflow: 'visible',
  },
  backgroundPill: {
    position: 'absolute',
    // Giảm các giá trị này để background chiếm diện tích lớn nhất có thể trong ô Tab
    top: 6,
    bottom: 6,
    left: 2,  // Mở rộng ra sát vách trái của ô Tab
    right: 2, // Mở rộng ra sát vách phải của ô Tab
    borderRadius: 12, // Chuyển sang bo góc nhẹ kiểu Apple sẽ hợp với diện tích rộng
  },
})

