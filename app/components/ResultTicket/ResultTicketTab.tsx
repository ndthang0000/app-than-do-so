import { CentraResult } from "@/screens/CentraResult"
import { NorthResult } from "@/screens/NorthResult"
import { SouthResult } from "@/screens/SouthResult"
import { useAppTheme } from "@/theme/context"
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs"
import { AnimatedTabLabel } from "./CustomTabLabel"
import { memo, useCallback } from "react"

const Tab = createMaterialTopTabNavigator()

interface Props {
  hideTabBar?: boolean
  onActiveRegionChange?: (region: "south" | "central" | "north") => void
}

export const ResultTicketTab = memo(({ hideTabBar = false, onActiveRegionChange }: Props) => {
  const { theme: { colors, spacing } } = useAppTheme()

  const handleTabChange = useCallback((tabName: string) => {
    const map: Record<string, "south" | "central" | "north"> = {
      Nam: "south",
      Trung: "central",
      Bac: "north",
    }
    const region = map[tabName]
    if (region) onActiveRegionChange?.(region)
  }, [onActiveRegionChange])

  return (
    <Tab.Navigator
      screenListeners={{
        focus: (e) => {
          const name = (e.target as string).split("-")[0]
          handleTabChange(name)
        },
      }}
      screenOptions={{
        lazy: true,
        swipeEnabled: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarIndicatorStyle: { height: 0 },
        tabBarPressColor: 'transparent',
        tabBarStyle: {
          backgroundColor: colors.palette.accent400,
          borderRadius: 12,
          marginHorizontal: spacing.sm,
          marginVertical: spacing.xxs,
          height: hideTabBar ? 0 : 40,
          overflow: 'hidden',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          flex: 1,
          padding: 0,
        },
        tabBarContentContainerStyle: {
          alignItems: 'center',
          paddingHorizontal: 3,
        }
      }}
    >
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

    </Tab.Navigator>
  )
})

