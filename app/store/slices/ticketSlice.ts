import { Region } from "@/constants/lotteryTicket";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { api } from "@/services/api"


export type WinStatus = "WIN" | "LOSE" | "PENDING";

export interface Ticket {
  _id: string;
  userId: string;
  code: string;
  date: string;
  station: string;
  region: Region;
  winStatus: WinStatus;
  winDetails: string[];
  prizes: any; // Bạn có thể định nghĩa interface chi tiết hơn cho prizes
  message: string;
  prizeMoney: number;
  durationScan: number;
  createdAt: string;
  updatedAt: string;
}

interface TicketState {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  // Phân trang & Filter
  pagination: {
    page: number;
    limit: number;
    totalResults: number;
    totalPages: number;
  };
  filters: {
    region?: Region;
    winStatus?: WinStatus;
    sortBy: string;
  };
}



// Thunk để fetch danh sách vé
export const fetchTickets = createAsyncThunk(
  "tickets/fetchTickets",
  async (params: any, { rejectWithValue }) => {
    try {
      // Build query string từ params
      const response = await api.getMyTickets(params);
      if (response.kind === "ok") {
        return response.data.data;
      } else {
        return rejectWithValue(response)
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Lỗi tải danh sách vé");
    }
  }
);

const initialState: TicketState = {
  tickets: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalResults: 0,
    totalPages: 0,
  },
  filters: {
    sortBy: "createdAt:desc", // Mặc định như API ví dụ
  },
};

export const ticketSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {
    // Cập nhật filter từ UI (ví dụ chọn vùng miền, trạng thái trúng thưởng)
    setFilters: (state, action: PayloadAction<Partial<TicketState["filters"]>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset về trang 1 khi đổi filter
    },
    // Chuyển trang
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    // Reset toàn bộ state khi unmount
    resetTicketState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        const { results, page, limit, totalResults, totalPages } = action.payload;
        state.loading = false;
        state.tickets = results;
        state.pagination = { page, limit, totalResults, totalPages };
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, setPage, resetTicketState } = ticketSlice.actions;
export default ticketSlice.reducer;