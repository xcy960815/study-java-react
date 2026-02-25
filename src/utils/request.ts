import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { message } from 'antd'
import { eventEmitter } from './event-emits'
import { getToken, removeToken, getRefreshToken, setToken, setRefreshToken } from './token'
import { loginEnum } from '@/enums'

// Directly use relative URL or env proxy
const baseUrl = import.meta.env.VITE_API_DOMAIN_PREFIX || ''

const withoutAuthorizationUrls = ['/login']

let isRefreshing = false
let requests: Function[] = []

interface RetryRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

axios.defaults.withCredentials = false

/**
 * 带有拦截器及 Token 刷新处理机制的全局 Axios 实例。
 * 用于业务代码侧发起 Restful API 请求。
 */
const request = axios.create({
  baseURL: baseUrl,
  timeout: 60 * 1000 * 10,
})

request.interceptors.request.use(
  async (config) => {
    const token = await getToken()
    const isWithoutAuthorizationUrl = !withoutAuthorizationUrls.some((url) =>
      config.url?.includes(url)
    )
    if (isWithoutAuthorizationUrl && token) {
      config.headers['Authorization'] = `Bearer ${token}`
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
          await removeToken()
          eventEmitter.emit('token-invalid')
          return Promise.reject(error)
        }

        if (!originalRequest._retry) {
          if (isRefreshing) {
            return new Promise((resolve) => {
              requests.push((token: string) => {
                originalRequest.headers['Authorization'] = `Bearer ${token}`
                resolve(request(originalRequest))
              })
            })
          }

          originalRequest._retry = true
          isRefreshing = true

          try {
            const refreshToken = await getRefreshToken()

            const { data } = await axios.post(baseUrl + '/refreshToken', { refreshToken })

            if (data && data.token) {
              await setToken(data.token)
              await setRefreshToken(data.refreshToken)

              requests.forEach((cb) => cb(data.token))
              requests = []

              originalRequest.headers['Authorization'] = `Bearer ${data.token}`
              return request(originalRequest)
            }
          } catch (refreshError) {
            await removeToken()
            eventEmitter.emit('token-invalid')
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
