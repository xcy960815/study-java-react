import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { message } from 'antd'
import { eventEmitter } from './event-emits'
import { clearAuthTokens, getRefreshToken, getToken, setRefreshToken, setToken } from './token'
import { loginEnum } from '@/enums'

// Directly use relative URL or env proxy
const baseUrl = import.meta.env.VITE_API_DOMAIN_PREFIX || ''

/**
 * 不需要自动附带 Authorization 头的接口列表。
 */
const withoutAuthorizationUrls = ['/login', '/register', '/captcha', '/refreshToken']

let isRefreshing = false

/**
 * 刷新 Token 接口的返回结构。
 */
interface RefreshResponse {
  token: string
  refreshToken: string
}

/**
 * 刷新 Token 期间排队中的请求。
 */
interface QueuedRequest {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}

let requests: QueuedRequest[] = []

interface RetryRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

/**
 * 给请求头补充 Bearer Token。
 *
 * @param config Axios 请求配置
 * @param token 当前 access token
 */
const setAuthorizationHeader = (config: InternalAxiosRequestConfig, token: string) => {
  config.headers.Authorization = `Bearer ${token}`
}

/**
 * 在刷新成功后重放排队中的请求。
 *
 * @param token 新的 access token
 */
const resolveQueuedRequests = (token: string) => {
  requests.forEach(({ resolve }) => resolve(token))
  requests = []
}

/**
 * 在刷新失败后统一拒绝排队中的请求。
 *
 * @param error 刷新失败原因
 */
const rejectQueuedRequests = (error: unknown) => {
  requests.forEach(({ reject }) => reject(error))
  requests = []
}

/**
 * 统一处理无效会话：
 * 清理本地登录态、终止排队请求，并广播 token 失效事件。
 */
const handleInvalidSession = () => {
  clearAuthTokens()
  rejectQueuedRequests(new Error('Authentication expired'))
  eventEmitter.emit('token-invalid')
}

axios.defaults.withCredentials = false

/**
 * 带有拦截器及 Token 刷新处理机制的项目统一 Axios 实例。
 * 用于业务代码侧发起 Restful API 请求。
 */
const request = axios.create({
  baseURL: baseUrl,
  timeout: 60 * 1000 * 10,
})

request.interceptors.request.use(
  (config) => {
    const token = getToken()
    const isWithoutAuthorizationUrl = !withoutAuthorizationUrls.some((url) =>
      config.url?.includes(url)
    )
    if (isWithoutAuthorizationUrl && token) {
      setAuthorizationHeader(config, token)
    }

    return config
  },
  (error: AxiosError) => {
    const { message: errMsg } = error
    message.error(errMsg)
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response: AxiosResponse) => {
    // Return data directly like the Vue version
    return response.data
  },
  async (error: AxiosError) => {
    if (error.response) {
      const statusCode = error.response.status
      const errorData = error.response.data as { message?: string } | undefined

      // 401: Token invalid or expired
      if (statusCode === loginEnum.InvalidToken) {
        const originalRequest = error.config as RetryRequestConfig

        if (originalRequest.url?.includes('/refreshToken')) {
          handleInvalidSession()
          return Promise.reject(error)
        }

        if (!originalRequest._retry) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              requests.push({
                resolve: (token: string) => {
                  setAuthorizationHeader(originalRequest, token)
                  resolve(request(originalRequest))
                },
                reject,
              })
            })
          }

          originalRequest._retry = true
          isRefreshing = true

          try {
            const refreshToken = getRefreshToken()

            if (!refreshToken) {
              handleInvalidSession()
              return Promise.reject(error)
            }

            const { data } = await axios.post<RefreshResponse>(baseUrl + '/refreshToken', {
              refreshToken,
            })

            if (data && data.token) {
              setToken(data.token)
              setRefreshToken(data.refreshToken)

              resolveQueuedRequests(data.token)

              setAuthorizationHeader(originalRequest, data.token)
              return request(originalRequest)
            }

            handleInvalidSession()
          } catch (refreshError) {
            handleInvalidSession()
            return Promise.reject(refreshError)
          } finally {
            isRefreshing = false
          }
        }
      } else {
        message.error(errorData?.message || error.message || '请求失败')
      }
    } else {
      message.error(error.message || '网络错误')
    }

    return Promise.reject(error)
  }
)

export { request }
