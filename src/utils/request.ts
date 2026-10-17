import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
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

/**
 * 提取请求 URL 的路径部分（去掉查询串），用于精确匹配。
 *
 * @param url 请求 URL
 */
const getRequestPath = (url?: string) => (url ? url.split('?')[0] : url)

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
 * 判断刷新失败是否属于「后端明确拒绝续期」：
 * 400/401 才具备清理会话的资格；网络层失败（超时/断网/网关 5xx）
 * 一律保留登录态，避免后端抖动被误判成会话过期。
 *
 * @param error 刷新请求异常
 * @returns boolean
 */
const isServerDeclinedRefresh = (error: unknown) =>
  error instanceof AxiosError &&
  !!error.response &&
  (error.response.status === loginEnum.InvalidToken || error.response.status === 400)

/**
 * 刷新失败收尾，按失败性质分流：
 * - 非后端明确拒绝：保留登录态，仅拒绝排队请求，等待下一轮续期兜底；
 * - 后端明确拒绝且本地 refresh token 未变：清理登录态并广播失效，跳回登录页；
 * - 后端明确拒绝但本地已被其他标签页轮换：直接采用新 token 放行排队请求，避免误踢。
 *
 * @param staleRefreshToken 发起刷新时的 refresh token
 * @param refreshError 刷新请求异常
 */
const handleRefreshFailure = (staleRefreshToken: string, refreshError: unknown) => {
  if (!isServerDeclinedRefresh(refreshError)) {
    rejectQueuedRequests(refreshError)
    return
  }
  const currentRefreshToken = getRefreshToken()
  if (currentRefreshToken && currentRefreshToken !== staleRefreshToken) {
    // 存储已变化：其他标签页抢先完成轮换，沿用其新 token
    const latestToken = getToken()
    if (latestToken) resolveQueuedRequests(latestToken)
    return
  }
  rejectQueuedRequests(refreshError)
  clearAuthTokens()
  eventEmitter.emit('token-invalid')
}

/**
 * 单飞刷新 Token：并发调用共享同一次刷新请求，全部等待同一个结果。
 * 成功时更新本地存储并放行排队请求；进行中的后续调用会挂起并共享结果。
 *
 * @returns 新 access token
 */
const refreshTokens = async (): Promise<string> => {
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      requests.push({ resolve, reject })
    })
  }

  const staleRefreshToken = getRefreshToken()
  if (!staleRefreshToken) {
    // 本地连 refresh token 都没有，视为会话结束
    const error = new Error('本地无 Refresh Token')
    rejectQueuedRequests(error)
    clearAuthTokens()
    eventEmitter.emit('token-invalid')
    throw error
  }

  isRefreshing = true
  try {
    const { data } = await axios.post<RefreshResponse>(baseUrl + '/refreshToken', {
      refreshToken: staleRefreshToken,
    })
    if (data && data.token) {
      setToken(data.token)
      setRefreshToken(data.refreshToken)
      resolveQueuedRequests(data.token)
      return data.token
    }
    // 理论上后端总是返回新 token；异常响应交给统一失败收尾
    throw new Error('刷新 Token 响应无效')
  } catch (refreshError) {
    handleRefreshFailure(staleRefreshToken, refreshError)
    throw refreshError
  } finally {
    isRefreshing = false
  }
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
  timeout: 30 * 1000,
})

request.interceptors.request.use(
  (config) => {
    const token = getToken()
    const requestPath = getRequestPath(config.url)
    const isWithoutAuthorizationUrl = requestPath
      ? !withoutAuthorizationUrls.includes(requestPath)
      : true
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

        if (getRequestPath(originalRequest.url) === '/refreshToken') {
          handleInvalidSession()
          return Promise.reject(error)
        }

        if (!originalRequest._retry) {
          originalRequest._retry = true
          try {
            const newToken = await refreshTokens()
            setAuthorizationHeader(originalRequest, newToken)
            return request(originalRequest)
          } catch (refreshError) {
            return Promise.reject(refreshError)
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

export { request, refreshTokens }
