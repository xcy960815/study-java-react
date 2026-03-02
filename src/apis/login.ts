import { request } from '@/utils/request'

export interface LoginRequestDto {
  username?: string
  password?: string
  captcha?: string
  rememberMe?: boolean
}

export interface RegisterRequestDto {
  username?: string
  password?: string
  confirmPassword?: string
  captcha?: string
}

export interface LoginResponseVo {
  token: string
  refreshToken: string
}

/**
 * 登入接口
 * @param requestParams
 * @returns
 */
export function login<
  T extends LoginResponseVo = LoginResponseVo,
  D extends LoginRequestDto = LoginRequestDto,
>(requestParams: D): Promise<T> {
  const url = `/login`
  return request.post<T, T>(url, requestParams)
}

/**
 * 注册接口
 * @param requestParams
 * @returns
 */
export function register(requestParams: RegisterRequestDto): Promise<boolean> {
  const url = `/register`
  return request.post<boolean, boolean>(url, requestParams)
}

/**
 * 登出接口
 * @returns
 */
export function logout(): Promise<void> {
  const url = `/logout`
  return request.post<void, void>(url)
}

/**
 * 获取验证码
 * @returns
 */
export function getCaptcha(): Promise<string> {
  const url = `/captcha`
  return request.get<string, string>(url)
}
