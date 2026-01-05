import { ApiResponse, ApisauceInstance, create } from "apisauce"
import Config from "@/config"
import { GeneralApiProblem, getGeneralApiProblem } from "./apiProblem"
import type { ApiConfig } from "./types"
import { store } from "@/store"
import axios from "axios"
import { loginByDevice, logout, setAuthToken } from "@/store/slices/authSlice"

export const DEFAULT_API_CONFIG: ApiConfig = {
  url: Config.API_URL + '/api',
  timeout: 10000,
}


export class Api {
  apisauce: ApisauceInstance
  config: ApiConfig

  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config
    this.apisauce = create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        Accept: "application/json",
      },
    })

    this.setupInterceptors()
  }

  setupInterceptors() {
    // --- Request Interceptor: Gắn Access Token vào Header ---
    this.apisauce.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = store.getState().auth.authToken
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    // --- Response Interceptor: Xử lý Refresh Token khi gặp lỗi 401 ---
    this.apisauce.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        // Nếu lỗi 401 và chưa từng thử refresh cho request này
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            // Gọi API refresh token riêng biệt bằng axios thuần để tránh loop vô tận
            const refreshToken = store.getState().auth.refreshToken
            const deviceId = store.getState().auth.deviceId // Lấy từ store của bạn

            const res = await axios.post(`${this.config.url}/auth/refresh-token`, {
              refreshToken,
              deviceId
            })

            const { accessToken, newRefreshToken } = res.data

            // Lưu token mới vào Redux
            store.dispatch(setAuthToken({
              token: accessToken,
              refreshToken: newRefreshToken
            }))

            // Cập nhật header và thực hiện lại request cũ
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return this.apisauce.axiosInstance(originalRequest)
          } catch (refreshError) {
            try {
              // Lưu ý: Dùng unwrap() để lấy dữ liệu trực tiếp từ thunk
              const result = await store.dispatch(loginByDevice()).unwrap()

              // Cập nhật Token mới vào request cũ và thử lại lần cuối
              originalRequest.headers.Authorization = `Bearer ${result.accessToken}`
              return this.apisauce.axiosInstance(originalRequest)
            } catch (reLoginError) {
              // Nếu đến cả Login bằng Device cũng lỗi (VD: server sập, Device bị ban)
              // Lúc này mới thực sự cho logout
              store.dispatch(logout())
              return Promise.reject(reLoginError)
            }
          }
        }
        return Promise.reject(error)
      },
    )
  }

  /**
   * Ví dụ hàm Device Login với Signature bảo mật
   */
  async deviceLogin(payload: { deviceId: string; timestamp: number; signature: string }): Promise<{ kind: "ok"; data: any } | GeneralApiProblem> {
    const response: ApiResponse<any> = await this.apisauce.post("/auth/device-login", payload)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    return { kind: "ok", data: response.data }
  }

  async getLotteryResults(date: string, region: string, station: string): Promise<{ kind: "ok"; data: any } | GeneralApiProblem> {
    const response: ApiResponse<any> = await this.apisauce.get("/lottery-results", { date, region, station })

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem

    }
    return { kind: "ok", data: response.data }
  }
}

export const api = new Api()