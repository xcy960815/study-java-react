import { create } from 'zustand'
import { message } from 'antd'
import { eventEmitter } from '@/utils/event-emits'
import { loginModule } from '@/apis/index'
import { clearAuthTokens, setRefreshToken, setToken } from '@/utils/token'
import type { LoginRequestDto } from '@/apis/login'

/**
 * 登录模块对外暴露的动作集合。
 */
interface LoginActions {
  /** 发起登录并写入本地登录态 */
  login: (loginData: LoginRequestDto) => Promise<void>
  /** 发起退出并清理本地登录态 */
  logout: () => Promise<void>
}

/**
 * 登录状态仓库。
 * 当前仅承载登录、退出两个动作，便于在页面和请求层之间复用。
 */
export const useLoginStore = create<LoginActions>(() => ({
  login: async (loginData: LoginRequestDto) => {
    const response = await loginModule.login(loginData)
    message.success('登入成功')
    const { token, refreshToken } = response
    setToken(token)
    setRefreshToken(refreshToken)
    eventEmitter.emit('login')
  },

  logout: async () => {
    let logoutSucceeded = false

    try {
      await loginModule.logout()
      logoutSucceeded = true
    } catch {
      message.warning('退出请求失败，已清理本地登录状态。')
    } finally {
      if (logoutSucceeded) {
        message.success('退出成功')
      }
      clearAuthTokens()
      eventEmitter.emit('logout')
    }
  },
}))
