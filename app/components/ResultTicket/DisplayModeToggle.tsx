// cSpell:ignore Pressable đuôi
import { Pressable, View, ViewStyle } from "react-native";
import { DisplayMode } from "./LotteryResultTable";
import IconEye from "@assets/svg/eye.svg";
import { useAppTheme } from "@/theme/context";
import { ThemedStyle } from "@/theme/types";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";

export function DisplayModeToggle({
  value,
  onChange,
}: {
  value: DisplayMode
  onChange: (v: DisplayMode) => void
}) {
  const options: { label: string; value: DisplayMode; icon?: React.ComponentType<{ color?: string; style?: any }> }[] = [
    { label: "Đầy đủ", value: "full", icon: IconEye },
    { label: "2 số đuôi", value: "last2" },
    { label: "3 số đuôi", value: "last3" },
  ]

  const { themed, theme: { colors } } = useAppTheme();

  return (
    <View
      style={themed($container)}
    >
      {options.map((opt) => {
        const active = value === opt.value

        return (
          <AnimatedOption
            key={opt.value}
            active={active}
            option={opt}
            onPress={() => onChange(opt.value)}
          />
        )
      })}
    </View>
  )
}

function AnimatedOption({
  active,
  option,
  onPress,
}: {
  active: boolean
  option: { label: string; value: DisplayMode; icon?: React.ComponentType<{ color?: string; style?: any }> }
  onPress: () => void
}) {
  const { theme: { colors, spacing } } = useAppTheme();
  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(
        active ? colors.surface : "transparent",
        { duration: 500 }
      ),
    }
  }, [active])

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      color: withTiming(
        active ? colors.tint : colors.tintInactive,
        { duration: 500 }
      ),
    }
  }, [active])

  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[
          {
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: spacing.sm,
            borderRadius: spacing.lg,
          },
          animatedStyle,
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", alignContent: "center", gap: 4 }}>
          {option.icon && <option.icon color={active ? colors.tint : colors.tintInactive} />}
          <Animated.Text
            style={[
              {
                fontWeight: "700",
                fontSize: 16,
              },
              animatedTextStyle,
            ]}
          >
            {option.label}
          </Animated.Text>
        </View>
      </Animated.View>
    </Pressable>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  backgroundColor: "#fffaec",
  borderRadius: spacing.lg,
  padding: spacing.xxs,
  marginTop: spacing.lg,
  //box shadow
  shadowColor: colors.palette.neutral600,
  shadowOffset: { width: -2, height: 4, top: 2, right: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 3,
  elevation: 3,
});

