import { request } from '@/utils/request'

/** 登录请求参数 */
export interface LoginRequestDto {
  username?: string
  password?: string
  captchaId?: string
  captcha?: string
  rememberMe?: boolean
}

/** 注册请求参数 */
export interface RegisterRequestDto {
  username?: string
  password?: string
  confirmPassword?: string
  captchaId?: string
  captcha?: string
}

/** 验证码响应 */
export interface CaptchaResponseVo {
  captchaId: string
  captchaImage: string
}

/** 登录响应 */
export interface LoginResponseVo {
  token: string
  refreshToken: string
  id?: number
  nickName?: string
  loginName?: string
  address?: string
  permissions?: string[]
}

/**
 * 登录接口。
 *
 * @param requestParams - 登录请求参数（用户名、密码、验证码等）
 * @returns 登录成功后的用户信息与令牌
 */
export function login<
  T extends LoginResponseVo = LoginResponseVo,
  D extends LoginRequestDto = LoginRequestDto,
>(requestParams: D): Promise<T> {
  const url = `/login`
  return request.post<T, T>(url, requestParams)
}

/**
 * 注册接口。
 *
 * @param requestParams - 注册请求参数（用户名、密码、验证码等）
 * @returns 是否注册成功
 */
export function register(requestParams: RegisterRequestDto): Promise<boolean> {
  const url = `/register`
  return request.post<boolean, boolean>(url, requestParams)
}

/**
 * 登出接口。
 *
 * @returns 空
 */
export function logout(): Promise<void> {
  const url = `/logout`
  return request.post<void, void>(url)
}

/**
 * 获取图形验证码。
 *
 * @returns 验证码ID与Base64图片
 */
export function getCaptcha(): Promise<CaptchaResponseVo> {
  const url = `/captcha`
  return request.get<CaptchaResponseVo, CaptchaResponseVo>(url)
}
