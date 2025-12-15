import { DatePickerScreen } from "@/components/DatePicker";
import { HomeTabScreenProps } from "@/navigators/navigationTypes";
import { DrawerIconButton } from "./DemoShowroomScreen/DrawerIconButton";
import { useCallback, useState } from "react";
import { useSafeAreaInsetsStyle } from "@/utils/useSafeAreaInsetsStyle";

export const AccountScreen: React.FC<HomeTabScreenProps<'Account'>> = function AccountScreen(_props) {
  const [open, setOpen] = useState(false)
  const toggleDrawer = useCallback(() => {
    if (!open) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [open])

  const $drawerInsets = useSafeAreaInsetsStyle(["top"])

  return <>
    <DrawerIconButton onPress={toggleDrawer} />
  </>
}