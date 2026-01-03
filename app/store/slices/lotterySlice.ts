import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { api } from "@/services/api"
import { GeneralApiProblem } from "@/services/api/apiProblem"

// Kiểu dữ liệu cho từng đài xổ số
export interface LotteryResult {
  _id: string
  date: string
  region: "north" | "central" | "south"
  station: string
  prizes: Record<string, any>
  isLive: boolean
  type: string
  updatedAt: string,
  loto?: Record<string, string[]>
}

interface LotteryState {
  // Lưu trữ theo key: "region_date" để tránh lặp dữ liệu và dễ quản lý
  results: Record<string, LotteryResult[]>
  loading: boolean
  error: string | null,
  dateSelected: string,
}

const initialState: LotteryState = {
  results: {},
  loading: false,
  error: null,
  dateSelected: new Date().toISOString().split("T")[0],
}

/**
 * Thunk: Lấy kết quả xổ số từ API
 */
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

        // 1. Tính toán sẵn loto cho từng tỉnh/đài
        const processedResults = data.result.map((p: any) => {
          // Tạo bản sao để tránh làm hỏng dữ liệu gốc (tốt cho tính bất biến)
          const province = { ...p, loto: {} as Record<string, string[]> }

          if (!province.prizes) return province

          const lotoSet = new Set<string>()

          // 2. Lấy 2 số cuối từ các giải (bỏ qua specialCode vì nó không phải Array)
          Object.values(province.prizes).forEach((nums) => {
            if (Array.isArray(nums)) {
              nums.forEach((num) => {
                if (typeof num === "string" && num.length >= 2 && num !== "*") {
                  lotoSet.add(num.slice(-2))
                }
              })
            }
          })

          // 3. Phân loại theo Đầu - Đuôi
          const sortedLoto = Array.from(lotoSet).sort()
          sortedLoto.forEach((num) => {
            const head = num.charAt(0)
            const tail = num.charAt(1)
            if (!province.loto[head]) {
              province.loto[head] = []
            }
            province.loto[head].push(tail)
          })

          return province
        })

        // 4. Lưu vào Store
        state.results[key] = processedResults
      })
      .addCase(fetchLotteryResults.rejected, (state, action) => {
        state.loading = false
        state.error = "Không thể lấy kết quả xổ số"
      })
  },
})

export const { clearOldResults, setDateSelected } = lotterySlice.actions
export default lotterySlice.reducer

import { RootState } from "@/store" // Đảm bảo bạn đã export RootState từ store/index.ts

export const selectLotteryResults = (state: RootState, region: string, date: string) => {
  const key = `${region}_${date}`
  return state.lottery.results[key]
}

export const fetchLotteryIfNeeded = (params: { date: string; region: string; station?: string }) =>
  async (dispatch: any, getState: any) => {
    const state = getState() as RootState
    const key = `${params.region}_${params.date}`
    const cached = state.lottery.results[key]

    if (!cached) {
      return dispatch(fetchLotteryResults(params))
    }

    // Nếu đã có dữ liệu FINISHED, không làm gì cả (tiết kiệm băng thông)
    return Promise.resolve()
  }