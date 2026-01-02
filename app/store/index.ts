import { configureStore } from "@reduxjs/toolkit"
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"
import { timeDrawSlice } from "./slices/timeDrawSlice"

export const store = configureStore({
  reducer: {
    timeDraw: timeDrawSlice.reducer,
  },
})

// Khai báo type để dùng Hook cho chuẩn TypeScript
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector