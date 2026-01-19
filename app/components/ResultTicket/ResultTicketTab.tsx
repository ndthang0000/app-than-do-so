import { CentraResult } from "@/screens/CentraResult"
import { NorthResult } from "@/screens/NorthResult"
import { SouthResult } from "@/screens/SouthResult"
import { useAppTheme } from "@/theme/context"
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs"
import { AnimatedTabLabel } from "./CustomTabLabel"
import { memo } from "react"

const Tab = createMaterialTopTabNavigator()

export const ResultTicketTab = memo(() => {
  const { theme: { colors, spacing } } = useAppTheme()
  return (
    <Tab.Navigator
      screenOptions={{
        lazy: true,
        swipeEnabled: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarIndicatorStyle: { height: 0 },
        tabBarPressColor: 'transparent',
        tabBarStyle: {
          backgroundColor: colors.palette.accent400, // Màu nền xám nhạt cho cả thanh tab
          borderRadius: 12,
          marginHorizontal: spacing.sm,
          marginVertical: spacing.xxs,
          height: 40, // Ép chiều cao thấp xuống
          elevation: 0,
          shadowOpacity: 0,
          overflow: 'hidden',
        },
        tabBarItemStyle: {
          flex: 1,
          padding: 0,
        },
        // Quan trọng: Dùng container để căn giữa các tab
        tabBarContentContainerStyle: {
          alignItems: 'center',
          paddingHorizontal: 3,
        }
      }}
    >
      <Tab.Screen
        name="Bac"
        component={NorthResult}
        options={{
          tabBarLabel: ({ focused }) => (
            <AnimatedTabLabel
              focused={focused}
              label="Miền Bắc"
              activeColor={colors.primary}
              inactiveColor={colors.textDim}
            />
          )
        }}
      />
      <Tab.Screen
        name="Trung"
        component={CentraResult}
        options={{
          tabBarLabel: ({ focused }) => (
            <AnimatedTabLabel
              focused={focused}
              label="Miền Trung"
              activeColor={colors.primary}
              inactiveColor={colors.textDim}
            />
          )
        }}
      />
      <Tab.Screen
        name="Nam"
        component={SouthResult}
        options={{
          tabBarLabel: ({ focused }) => (
            <AnimatedTabLabel
              focused={focused}
              label="Miền Nam"
              activeColor={colors.primary}
              inactiveColor={colors.textDim}
            />
          )
        }}
      />
    </Tab.Navigator>
  )
})
