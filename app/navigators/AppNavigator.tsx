/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow which the user will use once logged in.
 */
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import Config from "@/config"
import { ErrorBoundary } from "@/screens/ErrorScreen/ErrorBoundary"
import { useAppTheme } from "@/theme/context"

import type { AppStackParamList, NavigationProps } from "./navigationTypes"
import { navigationRef, useBackButtonHandler } from "./navigationUtilities"
import { MainNavigator } from "./MainNavigator"
import { ManualInputScreen } from "@/screens/ManualInputScreen"
import { LotteryScheduleScreen } from "@/screens/LotteryScheduleScreen"
import { NotificationScreen } from "@/screens/NotificationScreen"
import Toast from "react-native-toast-message"
import { getToastConfig } from "@/components/toastConfig"
import { WelcomeScreen } from "@/screens/WelcomeScreen"
import { useAppSelector } from "@/store"

/**
 * This is a list of all the route names that will exit the app if the back button
 * is pressed while in that screen. Only affects Android.
 */
const exitRoutes = Config.exitRoutes

// Documentation: https://reactnavigation.org/docs/stack-navigator/
const Stack = createNativeStackNavigator<AppStackParamList>()

const AppStack = () => {

  const {
    theme: { colors },
  } = useAppTheme()

  // Lấy trạng thái nạp dữ liệu của redux-persist
  // Lưu ý: path này phụ thuộc vào cách bạn đặt rootReducer, 
  // thường là state.auth._persist.rehydrated hoặc dùng selector riêng
  const isRehydrated = useAppSelector((state) => state.auth._persist?.rehydrated)

  // Logic kiểm tra: Nếu có authToken thì coi như đã login
  const token = useAppSelector((state) => state.auth.authToken)
  console.log(token)
  const isAuthenticated = !!token

  // Quan trọng: Nếu chưa nạp xong dữ liệu từ MMKV, 
  // hãy trả về null hoặc SplashScreen để tránh render WelcomeScreen quá sớm
  if (!isRehydrated) return null

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: colors.background,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      {isAuthenticated ? (
        <>
          {/* Khi isAuthenticated = true, bộ màn hình này mới tồn tại */}
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen name="ManualInput" component={ManualInputScreen} />
          <Stack.Screen name="Schedule" component={LotteryScheduleScreen} />
          <Stack.Screen name="Notification" component={NotificationScreen} />
        </>
      ) : (
        <>
          {/* Khi isAuthenticated = false, chỉ màn hình Welcome tồn tại */}
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
        </>
      )}
    </Stack.Navigator>
  )
}

export const AppNavigator = (props: NavigationProps) => {
  const { navigationTheme, theme } = useAppTheme()

  useBackButtonHandler((routeName) => exitRoutes.includes(routeName))

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} {...props}>
      <ErrorBoundary catchErrors={Config.catchErrors}>
        <AppStack />
        <Toast config={getToastConfig(theme)} />
      </ErrorBoundary>
    </NavigationContainer>
  )
}
