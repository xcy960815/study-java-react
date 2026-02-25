const TOKEN_KEY = 'study_java_react_token'
const REFRESH_TOKEN_KEY = 'study_java_react_refresh_token'

/**
 * 获取本地存储的认证 Token
 * @returns {string | null} 存储的 accessToken
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * 设置本地存储的认证 Token
 * @param {string} token 要保存的 accessToken 字符串
 */
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * 移除本地存储的认证 Token
 */
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * 获取本地存储的刷新 Token (Refresh Token)
 * @returns {string | null} 存储的 refreshToken
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

/**
 * 设置本地存储的刷新 Token (Refresh Token)
 * @param {string} token 要保存的 refreshToken 字符串
 */
export const setRefreshToken = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}
