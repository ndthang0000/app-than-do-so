import { CountDownDraw } from "@/components/ResultTicket/CountDownDraw"
import { LotteryResultTable } from "@/components/ResultTicket/LotteryResultTable"
import { Screen } from "@/components/Screen"
import { useAppSelector } from "@/store"
import { isToday, parseISO } from "date-fns"
import { memo } from "react"
import { shallowEqual } from "react-redux"

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