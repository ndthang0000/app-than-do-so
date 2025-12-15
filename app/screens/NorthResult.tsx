import { LotteryResultTable } from "@/components/ResultTicket/LotteryResultTable"
import { Screen } from "@/components/Screen"

const NORTH_PROVINCES = [
  {
    code: "HNI",
    name: "Huế",
    prizes: {
      G8: ["12"],
      G7: ["34", "66", "31", "78"],
      G6: ["567", "890", "123"],
      G5: ["4567", "4234", "8765", "2345", "3456", "5678"],
      G4: ["7890", "2345", "6789", "0123"],
      G3: ["12345", "67890", "54321", "09876", "11223", "33445",],
      G2: ["23456", "34567"],
      G1: ["34567"],
      DB: ["456789"],
    },
  },]


export const NorthResult = () => {
  return <>
    <Screen preset="scroll" safeAreaEdges={["bottom"]}>
      <LotteryResultTable provinces={NORTH_PROVINCES} region="north" />
    </Screen>
  </>
}