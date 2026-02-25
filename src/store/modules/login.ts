import { create } from 'zustand'
import { message } from 'antd'
import { eventEmitter } from '@/utils/event-emits'
import { loginModule } from '@/apis/index'
import { setToken, removeToken, setRefreshToken } from '@/utils/token'
import type { LoginRequestDto } from '@/apis/login'

interface LoginState {
  // state fields if any
}

interface LoginActions {
  login: (loginData: LoginRequestDto) => Promise<void>
  logout: () => Promise<void>
}

export const useLoginStore = create<LoginState & LoginActions>(() => ({
  login: async (loginData: LoginRequestDto) => {
    try {
      const response = await loginModule.login(loginData)
      message.success('登入成功')
      const { token, refreshToken } = response
      setToken(token)
      setRefreshToken(refreshToken)
      eventEmitter.emit('login')
    } catch (error) {
      throw error
    }
  },

  logout: async () => {
    try {
      await loginModule.logout()
      message.success('退出成功')
      removeToken()
      eventEmitter.emit('logout')
    } catch (error) {
      removeToken() // ensuring token is removed even if request fails
      eventEmitter.emit('logout')
    }
  },
}))
