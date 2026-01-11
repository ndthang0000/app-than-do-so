import { ApiResponse, ApisauceInstance, create } from "apisauce"
import Config from "@/config"
import { GeneralApiProblem, getGeneralApiProblem } from "./apiProblem"
import type { ApiConfig } from "./types"
import { store } from "@/store"
import { loginByDevice, logout } from "@/store/slices/authSlice"

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

            const { accessToken } = await store.dispatch(loginByDevice()).unwrap()

            // Cập nhật header và thực hiện lại request cũ
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return this.apisauce.axiosInstance(originalRequest)

          } catch (refreshError) {

              // Nếu đến cả Login bằng Device cũng lỗi (VD: server sập, Device bị ban)
              // Lúc này mới thực sự cho logout
              store.dispatch(logout())
            return Promise.reject(refreshError)
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

  async getMyTickets(params: any): Promise<{ kind: "ok"; data: any } | GeneralApiProblem> {
    const response: ApiResponse<any> = await this.apisauce.get("/tickets/paginate", params)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem

    }
    return { kind: "ok", data: response.data }
  }

  async checkAndSave(payload: any): Promise<{ kind: "ok"; data: any } | GeneralApiProblem> {
    const response: ApiResponse<any> = await this.apisauce.post("/tickets/check-and-save", payload)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem

    }
    return { kind: "ok", data: response.data }
  }

  async getTicketById(ticketId: string): Promise<{ kind: "ok"; data: any } | GeneralApiProblem> {
    const response: ApiResponse<any> = await this.apisauce.get(`/tickets/${ticketId}`)
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem

    }
    return { kind: "ok", data: response.data }
  }

  async subscribeToNotificationTopic(payload: any): Promise<{ kind: "ok"; data: any } | GeneralApiProblem> {
    const response: ApiResponse<any> = await this.apisauce.post("/notifications/subscribe-topic", payload)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem

    }
    return { kind: "ok", data: response.data }
  }

  async updateMyProfile(payload: any): Promise<{ kind: "ok"; data: any } | GeneralApiProblem> {
    const response: ApiResponse<any> = await this.apisauce.patch("/users", payload)

    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem

    }
    return { kind: "ok", data: response.data }
  }
}

export const api = new Api()