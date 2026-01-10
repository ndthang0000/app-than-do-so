import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { api } from "@/services/api"
import DeviceInfo from "react-native-device-info"
import hmacSHA256 from "crypto-js/hmac-sha256"
import Hex from "crypto-js/enc-hex"
import { APP_CRYPTO_KEY } from '@env';
import { REHYDRATE } from "redux-persist"

export interface NotificationSettings {
  ticketResult: boolean;
  centralResult: boolean;
  southResult: boolean;
  northResult: boolean;
  system: boolean;
  promotion: boolean;
}
interface User {
  _id: string;
  role: string;
  settingNotifications?: NotificationSettings; // Thêm field này
}

interface AuthState {
  authToken: string | null
  deviceId: string | null
  status: "idle" | "loading" | "authenticated" | "failed"
  error: string | null
  user: User | null
}

const initialState: AuthState = {
  authToken: null,
  deviceId: null,
  status: "idle",
  error: null,
  user: null,
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
          deviceId,
          user: response.data.data.user,
        }
      } else {
        return rejectWithValue(response)
      }
    } catch (e: any) {
      return rejectWithValue(e.message)
    }
  },
);

(async () => {
  const deviceId = await DeviceInfo.getUniqueId()
  const timestamp = Date.now()

  // Tạo Signature bảo mật để tránh spam tạo user ảo
  const message = `${deviceId}|${timestamp}`
  const signature = hmacSHA256(message, APP_CRYPTO_KEY).toString(Hex)
  console.log({ deviceId, timestamp, signature })
})()

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Cập nhật Token khi Interceptor thực hiện Refresh thành công
    updateNotificationSettings: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      if (state.user) {
        state.user.settingNotifications = {
          ...state.user.settingNotifications,
          ...action.payload,
        } as NotificationSettings;
      }
    },
    logout: (state) => {
      state.authToken = null
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
        state.deviceId = action.payload.deviceId
        state.user = action.payload.user
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

export const { logout, updateNotificationSettings } = authSlice.actions
export default authSlice.reducer