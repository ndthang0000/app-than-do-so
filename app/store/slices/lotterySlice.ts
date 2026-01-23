import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { api } from "@/services/api"
import { parse, format } from 'date-fns';

// Kiểu dữ liệu cho từng đài xổ số
export interface LotteryResult {
  _id: string
  date: string
  region: "north" | "central" | "south"
  station: string
  prizes: Record<string, any>
  isFinished: boolean
  type: string
  updatedAt: string,
  loto?: Record<string, string[]>
}

interface LotteryState {
  // Lưu trữ theo key: "region_date" để tránh lặp dữ liệu và dễ quản lý
  results: Record<string, LotteryResult[]>
  loading: boolean
  error: string | null,
  dateSelected: string, // DD-MM-YYYY
  recentlyAdded: string[] // <--- Thêm cái này để quản lý highlight 15s
}

const initialState: LotteryState = {
  results: {},
  loading: false,
  error: null,
  dateSelected: new Date().toISOString().split("T")[0], // DD-MM-YYYY mặc định là TODAY
  recentlyAdded: [], // <--- Khởi tạo mảng rỗng
}

/**
 * Thunk: Lấy kết quả xổ số từ API
 */
// Helper: Tái sử dụng logic tính toán Loto
export const processSingleProvinceLoto = (p: any) => {
  const province = { ...p, loto: {} as Record<string, string[]> }
  if (!province.prizes) return province
  const lotoSet = new Set<string>()

  Object.values(province.prizes).forEach((nums) => {
    if (Array.isArray(nums)) {
      nums.forEach((num) => {
        if (typeof num === "string" && num.length >= 2 && num !== "*" && num !== "-") {
          lotoSet.add(num.slice(-2))
        }
      })
    }
  })

  const sortedLoto = Array.from(lotoSet).sort()
  sortedLoto.forEach((num) => {
    const head = num.charAt(0)
    const tail = num.charAt(1)
    if (!province.loto[head]) province.loto[head] = []
    province.loto[head].push(tail)
  })
  return province
}

export const fetchLotteryResults = createAsyncThunk(
  "lottery/fetchResults",
  async (params: { date: string; region: string; station?: string }, { rejectWithValue }) => {
    // conver date from yyyy-mm-dd to dd-mm-yyyy
    const dateParts = params.date.split("-");
    const dateAPI = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    const response = await api.getLotteryResults(dateAPI, params.region, params.station || "")

    if (response.kind === "ok") {
      return {
        data: response.data.data, // Chứa { result: [], status: "LIVE" }
        region: params.region,
        date: params.date,
      }
    } else {
      return rejectWithValue(response)
    }
  },
)

export const lotterySlice = createSlice({
  name: "lottery",
  initialState,
  reducers: {
    // Xóa bớt dữ liệu cũ nếu cần để giải phóng bộ nhớ
    clearOldResults: (state) => {
      state.results = {}
    },
    setDateSelected: (state, action: { payload: string }) => {
      state.dateSelected = action.payload
    },
    updateLotteryFromSocket: (state, action: PayloadAction<{
      region: string,
      date: string,
      station: string,
      prizes: any,
      changes: any[]
    }>) => {
      const { region, date, station, prizes, changes } = action.payload
      const parsedDate = parse(date, 'dd-MM-yyyy', new Date());
      const outputDateString = format(parsedDate, 'yyyy-MM-dd');

      const key = `${region}_${outputDateString}`
      if (!state.results[key]) return
      // 1. Tìm index của đài (station) cần cập nhật trong mảng kết quả
      const stationIndex = state.results[key].findIndex(p => p.station === station)

      if (stationIndex !== -1) {
        const province = state.results[key][stationIndex]

        // 2. Cập nhật dữ liệu mới và tính lại Loto cho đài này
        const updatedProvince = processSingleProvinceLoto({
          ...province,
          prizes: prizes,
          isLive: true
        })

        state.results[key][stationIndex] = updatedProvince
        // 3. Xử lý highlight (NEW)
        // Dựa vào payload: c.rank chính là prizeKey (G1, G2...)
        const newIds = changes.map(c => `${station}-${c.rank}-${c.index}`)

        // Thêm vào danh sách highlight, dùng Set để tránh trùng lặp
        state.recentlyAdded = [...new Set([...state.recentlyAdded, ...newIds])]
      }
    },

    // Xóa trạng thái highlight sau 15s
    clearNewStatus: (state, action: PayloadAction<string[]>) => {
      state.recentlyAdded = state.recentlyAdded.filter(id => !action.payload.includes(id))
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLotteryResults.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchLotteryResults.fulfilled, (state, action) => {
        state.loading = false
        const { region, date, data } = action.payload
        const key = `${region}_${date}`

        // Kiểm tra nếu không có kết quả thì dừng
        if (!data?.result) return

        state.results[key] = data.result.map((p: any) => processSingleProvinceLoto(p))
      })
      .addCase(fetchLotteryResults.rejected, (state, action) => {
        state.loading = false
        state.error = "Không thể lấy kết quả xổ số"
      })
  },
})

export const { clearOldResults, setDateSelected, updateLotteryFromSocket, clearNewStatus } = lotterySlice.actions
export default lotterySlice.reducer

import { RootState } from "@/store" // Đảm bảo bạn đã export RootState từ store/index.ts

export const selectLotteryResults = (state: RootState, region: string, date: string) => {
  const key = `${region}_${date}`
  return state.lottery.results[key]
}

export const fetchLotteryIfNeeded = (params: { date: string; region: string; station?: string, noCache?: boolean }) =>
  async (dispatch: any, getState: any) => {
    const state = getState() as RootState
    const key = `${params.region}_${params.date}`
    const cached = state.lottery.results[key]

    if (!cached || params.noCache) {
      return dispatch(fetchLotteryResults(params))
    }

    // Nếu đã có dữ liệu FINISHED, không làm gì cả (tiết kiệm băng thông)
    return Promise.resolve()
  }