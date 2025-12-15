import { DatePicker } from "@/components/DatePicker";
import { HomeTabScreenProps } from "@/navigators/navigationTypes";
import { useState } from "react";
import { View } from "react-native";

export const MyTicketScreen: React.FC<HomeTabScreenProps<'MyTicket'>> = function MyTicketScreen(_props) {
  const [currentSelectedDate, setCurrentSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  return <View style={{ flex: 1 }} >
    <DatePicker initialDate={currentSelectedDate} onDateSelect={setCurrentSelectedDate} />
  </View  >
}