import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { api } from "@/services/api"
import DeviceInfo from "react-native-device-info"
import hmacSHA256 from "crypto-js/hmac-sha256"
import Hex from "crypto-js/enc-hex"
import { APP_CRYPTO_KEY } from '@env';
import { saveString } from "@/utils/storage"
import { REHYDRATE } from "redux-persist"

interface AuthState {
  authToken: string | null
  refreshToken: string | null
  deviceId: string | null
  status: "idle" | "loading" | "authenticated" | "failed"
  error: string | null
}

const initialState: AuthState = {
  authToken: null,
  refreshToken: null,
  deviceId: null,
  status: "idle",
  error: null,
}

/**
 * Thunk: Thực hiện Auto Login bằng DeviceId + Signature
 */
export const loginByDevice = createAsyncThunk(
  "auth/loginByDevice",
  async (_, { rejectWithValue }) => {
    try {
      const deviceId = await DeviceInfo.getUniqueId()
      const timestamp = Date.now()

      // Tạo Signature bảo mật để tránh spam tạo user ảo
      const message = `${deviceId}|${timestamp}`
      const signature = hmacSHA256(message, APP_CRYPTO_KEY).toString(Hex)

      const response = await api.deviceLogin({
        deviceId,
        timestamp,
        signature,
      })

      if (response.kind === "ok") {
        return {
          accessToken: response.data.data.accessToken,
          refreshToken: response.data.data.refreshToken,
          deviceId,
        }
      } else {
        return rejectWithValue(response)
      }
    } catch (e: any) {
      console.log(e)
      return rejectWithValue(e.message)
    }
  },
)

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Cập nhật Token khi Interceptor thực hiện Refresh thành công
    setAuthToken: (state, action: PayloadAction<{ token: string; refreshToken?: string }>) => {
      state.authToken = action.payload.token
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken
      }
    },
    logout: (state) => {
      state.authToken = null
      state.refreshToken = null
      state.status = "idle"
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginByDevice.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(loginByDevice.fulfilled, (state, action) => {
        state.status = "authenticated"
        state.authToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
        state.deviceId = action.payload.deviceId
      })
      .addCase(loginByDevice.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload as string
      })
      .addCase(REHYDRATE, (state, action: any) => {
        if (action.payload?.authToken) {
          state.status = "authenticated";
          state.authToken = action.payload.authToken;
        }
        // Đánh dấu đã nạp xong ngay tại slice
      });
  },
})

export const { setAuthToken, logout } = authSlice.actions
export default authSlice.reducer