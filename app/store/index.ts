import { combineReducers, configureStore } from "@reduxjs/toolkit"
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"
import { persistStore, persistReducer } from "redux-persist"
import { timeDrawSlice } from "./slices/timeDrawSlice"
import { authSlice } from "./slices/authSlice"
import { lotterySlice } from "./slices/lotterySlice"
import { reduxStorage } from "@/utils/storage"
import { ticketSlice } from "./slices/ticketSlice"

const authPersistConfig = {
  key: "auth",
  storage: reduxStorage,
  whitelist: ["authToken", "deviceId"], // Chỉ lưu những thứ này
}

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authSlice.reducer),
  timeDraw: timeDrawSlice.reducer,
  lottery: lotterySlice.reducer,
  ticket: ticketSlice.reducer,
  // các reducer khác không cần persist thì để bình thường
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Bắt buộc phải tắt khi dùng redux-persist
    }),
})

export const persistor = persistStore(store)

// Khai báo type để dùng Hook cho chuẩn TypeScript
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector