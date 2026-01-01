import { CentraResult } from "@/screens/CentraResult"
import { NorthResult } from "@/screens/NorthResult"
import { SouthResult } from "@/screens/SouthResult"
import { useAppTheme } from "@/theme/context"
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs"

const Tab = createMaterialTopTabNavigator()

export function ResultTicketTab() {
  const { theme: { colors } } = useAppTheme()
  return (
    <Tab.Navigator
      screenOptions={{
        swipeEnabled: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarIndicatorStyle: {
          backgroundColor: colors.primary,
          height: 2,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
        },
        tabBarLabelStyle: {
          fontWeight: "700",
          fontSize: 16
        },

      }}
    >
      <Tab.Screen name="Bac" component={NorthResult} options={{ title: "Miền Bắc" }} />
      <Tab.Screen name="Trung" component={CentraResult} options={{ title: "Miền Trung" }} />
      <Tab.Screen name="Nam" component={SouthResult} options={{ title: "Miền Nam" }} />
    </Tab.Navigator>
  )
}
