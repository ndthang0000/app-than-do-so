import { CountDownDraw } from "@/components/ResultTicket/CountDownDraw"
import { LotteryResultTable } from "@/components/ResultTicket/LotteryResultTable"
import { Screen } from "@/components/Screen"
import { useAppSelector } from "@/store"
import { useIsFocused, useNavigationState } from "@react-navigation/native"
import { isToday, parseISO } from "date-fns"
import { memo } from "react"
import { shallowEqual } from "react-redux"

const NORTH_PROVINCES = [
  {
    code: "HNI",
    name: "Hà Nội",
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


export const NorthResult = memo(() => {

  const { type } = useAppSelector(
    (state) => ({ type: state.timeDraw.regions["north"].type }),
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
          <CountDownDraw regionName="XỔ SỐ MIỀN BẮC" region="north" />
          : <LotteryResultTable region="north" isLive={isLive} />
      }
    </Screen>
  </>
});