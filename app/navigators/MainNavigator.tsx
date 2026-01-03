import { TextStyle, ViewStyle } from "react-native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { HomeTabParamList } from "./navigationTypes"
import { HomeScreen } from "@/screens/HomeScreen"
import IconHome from "@assets/svg/home.svg"
import IconResult from "@assets/svg/draw-lottery.svg"
import IconScanRed from "@assets/svg/scan-red.svg"
import IconMyTicket from "@assets/svg/my-ticket.svg"
import IconAccount from "@assets/svg/account.svg"
import { Text } from "@/components/Text"
import { ResultScreen } from "@/screens/ResultScreen"
import { ScanScreen } from "@/screens/ScanScreen"
import { MyTicketScreen } from "@/screens/MyTicket"
import { DemoShowroomScreen } from "@/screens/DemoShowroomScreen/DemoShowroomScreen"
import { useEffect } from "react"
import { useAppDispatch } from "@/store"
import { tick } from "@/store/slices/timeDrawSlice"

const Tab = createBottomTabNavigator<HomeTabParamList>()

/**
 * This is the main navigator for the demo screens with a bottom tab bar.
 * Each tab is a stack navigator with its own set of screens.
 *
 * More info: https://reactnavigation.org/docs/bottom-tab-navigator/
 * @returns {JSX.Element} The rendered `HomeNavigator`.
 */
export function MainNavigator() {
  const { bottom } = useSafeAreaInsets()
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  const dispatch = useAppDispatch()

  useEffect(() => {

    // Thiết lập đếm nhịp mỗi giây
    const timer = setInterval(() => {
      dispatch(tick())
    }, 1000)

    // Quan trọng: Clear interval khi component unmount
    return () => clearInterval(timer)
  }, [dispatch])

  return (
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: themed([$tabBar, { height: bottom + 70 }]),
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.text,
          tabBarLabelStyle: themed($tabBarLabel),
          tabBarItemStyle: themed($tabBarItem),
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: ({ focused }) => {
              return <Text text="Trang chủ" style={themed([$tabBarLabel, { color: focused ? colors.tint : colors.tintInactive }])} />
            },
            tabBarIcon: ({ focused }) => (
              <IconHome
                color={focused ? colors.tint : colors.tintInactive}
                width={25}
                height={25}
              />
            ),
          }}
        />

        <Tab.Screen
          name="Result"
          component={ResultScreen}
          options={{
            tabBarStyle: { display: "none" },
            tabBarLabel: ({ focused }) => {
              return <Text text="Kết quả" style={themed([$tabBarLabel, { color: focused ? colors.tint : colors.tintInactive }])} />
            },
            tabBarIcon: ({ focused }) => (
              <IconResult
                color={focused ? colors.tint : colors.tintInactive}
                width={25}
                height={25}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Scan"
          component={ScanScreen}
          options={{
            tabBarStyle: { display: 'none' },
            tabBarLabel: ({ focused }) => {
              return <Text text="" style={themed([$tabBarLabel, { color: focused ? colors.tint : colors.tintInactive }])} />
            },
            tabBarIconStyle: { marginTop: -10 },
            tabBarIcon: ({ focused }) => (
              <IconScanRed
                color={focused ? colors.tint : colors.tintInactive}
                width={90}
                height={90}
              />
            ),
          }}
        />

        <Tab.Screen
          name="MyTicket"
          component={MyTicketScreen}
          options={{
            tabBarLabel: ({ focused }) => {
              return <Text text="Vé của tôi" style={themed([$tabBarLabel, { color: focused ? colors.tint : colors.tintInactive }])} />
            },
            tabBarIcon: ({ focused }) => (
              <IconMyTicket
                color={focused ? colors.tint : colors.tintInactive}
                width={25}
                height={25}
              />
            ),
          }}
        />

        <Tab.Screen
          name="Account"
          component={DemoShowroomScreen}
          options={{
            tabBarLabel: ({ focused }) => {
              return <Text text="Tài khoản" style={themed([$tabBarLabel, { color: focused ? colors.tint : colors.tintInactive }])} />
            },
            tabBarIcon: ({ focused }) => (
              <IconAccount
                color={focused ? colors.tint : colors.tintInactive}
                width={25}
                height={25}
              />
            ),
          }}
        />
    </Tab.Navigator>
  )
}

const $tabBar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.surface,
  borderTopColor: colors.transparent,
})

const $tabBarItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingTop: spacing.md,
})

const $tabBarLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 12,
  fontFamily: typography.primary.medium,
  lineHeight: 20,
  color: colors.text,
})

