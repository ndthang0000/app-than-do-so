import { LotteryResultTable } from "@/components/ResultTicket/LotteryResultTable"
import { Screen } from "@/components/Screen"

const SOUTH_PROVINCES = [
  {
    code: "PY",
    name: "Phú Yên",
    prizes: {
      G8: ["12"],
      G7: ["34"],
      G6: ["567", "890", "123"],
      G5: ["4567"],
      G4: ["7890", "2345", "6789", "0123", "3456", "7891", "2346"],
      G3: ["12345", "67890"],
      G2: ["23456"],
      G1: ["34567"],
      DB: ["456789"],
    },
  },
  {
    code: "KH",
    name: "Khánh Hoà",
    prizes: {
      G8: ["12"],
      G7: ["34"],
      G6: ["567", "890", "123"],
      G5: ["4567"],
      G4: ["7890", "2345", "6789", "0123", "3456", "7891", "2346"],
      G3: ["12345", "67890"],
      G2: ["23456"],
      G1: ["34567"],
      DB: ["456789"],
    },
  },
]


export const SouthResult = () => {
  return <>
    <Screen preset="scroll" safeAreaEdges={["bottom"]}>
      <LotteryResultTable provinces={SOUTH_PROVINCES} region="south" />
    </Screen>
  </>
}