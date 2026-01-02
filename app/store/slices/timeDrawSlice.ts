import { DrawStatus, getRegionStatus, LOTTERY_SCHEDULE } from "@/constants/lotterySchedule"
import { createSlice } from "@reduxjs/toolkit"

const timeSouth = LOTTERY_SCHEDULE[0].time
const timeCentral = LOTTERY_SCHEDULE[1].time
const timeNorth = LOTTERY_SCHEDULE[2].time

interface TimeDrawState {
  regions: {
    north: DrawStatus
    central: DrawStatus
    south: DrawStatus
  }
  lastUpdated: string,
  dateSelected: string,
}

const initialState: TimeDrawState = {
  regions: {
    north: { type: "FINISHED", targetTime: timeNorth },
    central: { type: "FINISHED", targetTime: timeCentral },
    south: { type: "FINISHED", targetTime: timeSouth },
  },
  dateSelected: new Date().toISOString().split("T")[0],
  lastUpdated: new Date().toISOString(),
}

export const timeDrawSlice = createSlice({
  name: "timeDraw",
  initialState,
  reducers: {
    // Action này sẽ được gọi mỗi giây từ App hoặc Root component
    tick: (state) => {
      state.regions.north = getRegionStatus('north')
      state.regions.central = getRegionStatus('central')
      state.regions.south = getRegionStatus('south')
      state.lastUpdated = new Date().toISOString()
    },
    setDateSelected: (state, action: { payload: string }) => {
      state.dateSelected = action.payload
    }
  },
})

export const { tick, setDateSelected } = timeDrawSlice.actions
export default timeDrawSlice.reducer