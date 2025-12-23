import React from "react"
import { View, ViewStyle, TextStyle, Pressable } from "react-native"
import { useAppTheme } from "@/theme/context"
import { ThemedStyle } from "@/theme/types"
import { DisplayMode } from "./LotteryResultTable"
import { Radio } from "../Toggle/Radio"

export function DisplayModeToggleV2({
  value,
  onChange,
}: {
  value: DisplayMode
  onChange: (v: DisplayMode) => void
}) {
  const { themed, theme: { colors, spacing } } = useAppTheme()

  const options: { label: string; value: DisplayMode }[] = [
    { label: "Đầy đủ", value: "full" },
    { label: "2 số", value: "last2" },
    { label: "3 số", value: "last3" },
  ]

  return (
    <View style={themed($container)}>

      <View style={themed($radioGroup)}>
        {options.map((opt) => (
          <View key={opt.value} style={themed($radioWrapper)}>
            <Radio
              label={opt.label}
              value={value === opt.value}
              onPress={() => onChange(opt.value)}
              containerStyle={themed($radioItem)}
              labelStyle={themed($radioLabel)}
            // Ignite Radio thường có prop box hay circle, bạn có thể tùy chỉnh
            />
          </View>

        ))}
      </View>
    </View>
  )
}

/** Styles */
const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  paddingHorizontal: spacing.md,
})

const $radioGroup: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "space-between",
})

const $radioWrapper: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
})

const $radioItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.xxs,
})

const $radioLabel: ThemedStyle<TextStyle> = () => ({
  fontSize: 14,
  fontWeight: "600",
})