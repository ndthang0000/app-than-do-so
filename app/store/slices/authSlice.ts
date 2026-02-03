import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { api } from "@/services/api"
import uuid from 'react-native-uuid';
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

export interface AppSettings {
  theme?: string;
  language?: string;
  showLotoTable?: boolean;
  isVoiceEnabled?: boolean;
  isMusicEnabled?: boolean;
  fontSize?: string;
  highlightHead: string[];
  highlightTail: string[];
}
interface User {
  _id: string;
  role: string;
  settingNotifications?: NotificationSettings; // Thêm field này
  settingApp?: AppSettings;
}

interface AuthState {
  authToken: string | null
  deviceId: string | null
  status: "idle" | "loading" | "authenticated" | "failed"
  isUpdating: boolean; // Trạng thái loading riêng cho update
  error: string | null
  user: User | null
}

const initialState: AuthState = {
  authToken: null,
  deviceId: null,
  status: "idle",
  isUpdating: false,
  error: null,
  user: null,
}

/**
 * Helper: Lấy hoặc tạo deviceId từ AsyncStorage
 */


/**
 * Thunk: Thực hiện Auto Login bằng DeviceId + Signature
 */
export const loginByDevice = createAsyncThunk(
  "auth/loginByDevice",
  async (_, { rejectWithValue }) => {
    try {
      if (!APP_CRYPTO_KEY) {
        throw new Error("APP_CRYPTO_KEY is not defined in .env file");
      }

      const deviceId = uuid.v4();
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

export const updateUserProfile = createAsyncThunk(
  "auth/updateUserProfile",
  async (payload: any, { rejectWithValue }) => {
    try {
      const response = await api.updateMyProfile(payload);
      if (response.kind === "ok") {
        return response.data.data; // Trả về user object mới
      } else {
        return rejectWithValue(response);
      }
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

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
    updateUserData: (state, action: PayloadAction<Partial<User>>) => {
      state.user = action.payload as User;
    },
    optimisticUpdateAppSetting: (state, action: PayloadAction<Partial<AppSettings>>) => {
      if (state.user?.settingApp) {
        state.user.settingApp = { ...state.user.settingApp, ...action.payload };
      }
    },
    // Cập nhật nhanh Notification cho UI
    optimisticUpdateNotiSetting: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      if (state.user?.settingNotifications) {
        state.user.settingNotifications = { ...state.user.settingNotifications, ...action.payload };
      }
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
      .addCase(updateUserProfile.pending, (state) => {
        state.isUpdating = true;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.user = action.payload; // Cập nhật user mới từ API
      })
      .addCase(updateUserProfile.rejected, (state) => {
        state.isUpdating = false;
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

export const {
  logout,
  updateNotificationSettings,
  updateUserData,
  optimisticUpdateAppSetting,
  optimisticUpdateNotiSetting,
} = authSlice.actions

export default authSlice.reducer