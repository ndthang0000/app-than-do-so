import { CountDownDraw } from "@/components/ResultTicket/CountDownDraw"
import { LotteryResultTable } from "@/components/ResultTicket/LotteryResultTable"
import { Screen } from "@/components/Screen"
import { useAppSelector } from "@/store"
import { isToday, parseISO } from "date-fns"
import { shallowEqual } from "react-redux"

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

  const { type } = useAppSelector(
    (state) => ({ type: state.timeDraw.regions["south"].type }),
    shallowEqual
  )
  const dateSelected = useAppSelector((state) => state.lottery.dateSelected);
  const isSelectedToday = isToday(parseISO(dateSelected));

  const isUpcoming = type === "UPCOMING" && isSelectedToday
  const isLive = type === "LIVE" && isSelectedToday
  const isFinished = type === "FINISHED"


  return <>
    <Screen
      preset="scroll"
      safeAreaEdges={["bottom"]}
      style={{ ...(isUpcoming ? { backgroundColor: "#C00000" } : {}) }}
    >
      {
        isUpcoming ?
          <CountDownDraw regionName="XỔ SỐ MIỀN NAM" region="south" />
          : <LotteryResultTable region="south" isLive={isLive} />
      }
    </Screen>
  </>
}