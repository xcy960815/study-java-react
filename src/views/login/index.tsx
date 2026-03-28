import React, { useEffect, useState } from 'react'
import { Form, Input, Checkbox, message } from 'antd'
import {
  UserOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import md5 from 'md5'
import { useLoginStore } from '@/store'
import { loginModule } from '@/apis'
import type { LoginRequestDto } from '@/apis/login'
import { AnimatedCharacters } from '@/components/ui/animated-characters'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'

const Login: React.FC = () => {
  const [form] = Form.useForm<LoginRequestDto>()
  const navigate = useNavigate()
  const [logining, setLogining] = useState(false)
  const [captchaUrl, setCaptchaUrl] = useState('')
  const [captchaLoading, setCaptchaLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const { login } = useLoginStore()

  const usernameValue = Form.useWatch('username', form)
  const passwordValue = Form.useWatch('password', form)
  const captchaValue = Form.useWatch('captcha', form)

  const isFormIncomplete =
    !usernameValue || !passwordValue || !captchaValue || captchaValue.length !== 4

  useEffect(() => {
    handleGetCaptcha()
  }, [])

  useEffect(() => {
    if (errorMessage && (usernameValue || passwordValue || captchaValue)) {
      setErrorMessage('')
    }
  }, [captchaValue, errorMessage, passwordValue, usernameValue])

  const handleGetCaptcha = async () => {
    setCaptchaLoading(true)
    try {
      const captchaRes = await loginModule.getCaptcha()
      setCaptchaUrl(captchaRes)
    } catch (error) {
      console.error('Failed to get captcha', error)
    } finally {
      setCaptchaLoading(false)
    }
  }

  const handleLogin = async (values: LoginRequestDto) => {
    setLogining(true)
    setErrorMessage('')
    try {
      const loginData = { ...values }
      if (loginData.password) {
        loginData.password = md5(loginData.password)
      }
      await login(loginData)
      navigate('/system')
    } catch (error) {
      setErrorMessage('登录失败，请检查账号、密码和验证码后重试。')
      handleGetCaptcha()
    } finally {
      setLogining(false)
    }
  }

  const handleGoogleLogin = () => {
    message.info('第三方登录暂未开放，当前请使用账号密码登录。')
  }

  const applicationTitle = import.meta.env.VITE_APP_TITLE || 'Study Java React'

  return (
    <div className="login-page relative h-screen overflow-hidden bg-[#f6f0ff] text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(108,63,245,0.24),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(255,155,107,0.28),_transparent_26%),linear-gradient(135deg,_#fff8ef_0%,_#f4f2ff_48%,_#eef7ff_100%)]" />
      <div className="absolute left-[-10%] top-[-10%] h-72 w-72 rounded-full bg-[#6c3ff5]/18 blur-3xl" />
      <div className="absolute bottom-[-14%] right-[-8%] h-80 w-80 rounded-full bg-[#ff9b6b]/24 blur-3xl" />

      <div className="relative grid h-full lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden h-full overflow-hidden bg-[#130c2f] px-12 py-8 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,_rgba(232,215,84,0.20),_transparent_28%),radial-gradient(circle_at_85%_18%,_rgba(108,63,245,0.48),_transparent_28%),radial-gradient(circle_at_72%_82%,_rgba(255,155,107,0.30),_transparent_26%)]" />
          <div className="absolute left-10 top-14 h-28 w-28 rounded-full border border-white/10 bg-white/6 blur-2xl" />
          <div className="absolute bottom-8 right-10 h-52 w-52 rounded-full border border-white/10 bg-[#6c3ff5]/20 blur-3xl" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/14 text-lg font-bold tracking-[0.26em] text-white shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
              CC
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.38em] text-white/60">
                Creative Access
              </p>
              <h1 className="text-2xl font-semibold tracking-[0.08em]">{applicationTitle}</h1>
            </div>
          </div>

          <div className="relative z-10 mt-10 max-w-xl">
            <span className="inline-flex rounded-full border border-white/12 bg-white/8 px-4 py-1 text-xs font-medium tracking-[0.28em] uppercase text-white/72">
              Fresh Login
            </span>
            <h2 className="mt-5 text-5xl font-semibold leading-tight">
              把登录入口变成
              <span className="block text-[#f4c95d]">更有记忆点的第一屏。</span>
            </h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-white/72">
              保留你项目现有认证流程，把视觉层升级成更具识别度的双栏登录体验。邮箱聚焦、密码显隐和按钮悬浮都会触发细节联动。
            </p>
          </div>

          <div className="relative z-10 mt-auto flex items-end justify-center xl:justify-start">
            <AnimatedCharacters
              isTyping={isTyping}
              showPassword={showPassword}
              passwordLength={passwordValue?.length ?? 0}
            />
          </div>
        </section>

        <section className="relative flex h-full items-center justify-center overflow-hidden px-5 py-4 sm:px-8 lg:px-12">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-[480px] overflow-y-auto rounded-[32px] border border-white/70 bg-white/82 p-5 shadow-[0_32px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:max-h-[calc(100vh-2.5rem)] sm:p-7">
            <div className="mb-6">
              <h3 className="mt-3 text-3xl font-semibold tracking-[0.04em] text-slate-900">
                登录到 {applicationTitle}
              </h3>
            </div>

            {errorMessage ? (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-500">
                {errorMessage}
              </div>
            ) : null}

            <Form
              form={form}
              name="loginForm"
              onFinish={handleLogin}
              initialValues={{ username: '13700002703', password: '123456', rememberMe: false }}
              size="large"
              layout="vertical"
            >
              <Form.Item
                label={
                  <span className="text-xs font-semibold tracking-[0.18em] uppercase text-slate-500">
                    账号
                  </span>
                }
                name="username"
                className="mb-4"
              >
                <Input
                  prefix={<UserOutlined className="text-slate-400" />}
                  placeholder="请输入账号"
                  autoComplete="username"
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  className="!h-13 !rounded-2xl !border-slate-200 !bg-slate-50 !px-4 !text-slate-900 placeholder:!text-slate-400 hover:!border-[#6c3ff5] focus-within:!border-[#6c3ff5] focus-within:!shadow-[0_0_0_4px_rgba(108,63,245,0.12)]"
                />
              </Form.Item>

              <Form.Item
                label={
                  <span className="text-xs font-semibold tracking-[0.18em] uppercase text-slate-500">
                    密码
                  </span>
                }
                name="password"
                className="mb-4"
              >
                <Input.Password
                  prefix={<LockOutlined className="text-slate-400" />}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  visibilityToggle={{
                    visible: showPassword,
                    onVisibleChange: setShowPassword,
                  }}
                  className="!h-13 !rounded-2xl !border-slate-200 !bg-slate-50 !px-4 !text-slate-900 placeholder:!text-slate-400 hover:!border-[#6c3ff5] focus-within:!border-[#6c3ff5] focus-within:!shadow-[0_0_0_4px_rgba(108,63,245,0.12)]"
                />
              </Form.Item>

              <Form.Item
                label={
                  <span className="text-xs font-semibold tracking-[0.18em] uppercase text-slate-500">
                    验证码
                  </span>
                }
                name="captcha"
                className="mb-4"
              >
                <div className="grid grid-cols-[1fr_112px] gap-3">
                  <Input
                    prefix={<SafetyCertificateOutlined className="text-slate-400" />}
                    placeholder="请输入验证码"
                    autoComplete="off"
                    maxLength={4}
                    className="!h-13 !rounded-2xl !border-slate-200 !bg-slate-50 !px-4 !text-slate-900 placeholder:!text-slate-400 hover:!border-[#6c3ff5] focus-within:!border-[#6c3ff5] focus-within:!shadow-[0_0_0_4px_rgba(108,63,245,0.12)]"
                  />
                  <button
                    type="button"
                    onClick={handleGetCaptcha}
                    className="flex h-13 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition hover:border-[#6c3ff5] hover:bg-white"
                  >
                    {captchaUrl ? (
                      <img src={captchaUrl} alt="captcha" className="h-full w-full object-fill" />
                    ) : (
                      <span className="text-xs text-slate-400">
                        {captchaLoading ? '加载中' : '点击重试'}
                      </span>
                    )}
                  </button>
                </div>
              </Form.Item>

              <div className="mb-5 flex items-center justify-between gap-4 text-sm">
                <Form.Item
                  name="rememberMe"
                  valuePropName="checked"
                  className="mb-0 [&_.ant-checkbox-wrapper]:text-slate-500"
                >
                  <Checkbox>记住密码</Checkbox>
                </Form.Item>
                <button
                  type="button"
                  onClick={() => message.info('找回密码功能可在后续接入。')}
                  className="text-sm text-[#6c3ff5] transition hover:text-[#5730d6]"
                >
                  忘记密码？
                </button>
              </div>

              <Form.Item className="mb-3">
                <InteractiveHoverButton
                  type="submit"
                  text={logining ? '登录中...' : '立即登录'}
                  disabled={isFormIncomplete || logining}
                  overlayClassName="bg-[#6c3ff5] text-white"
                  icon={<ArrowRightOutlined />}
                />
              </Form.Item>

              <div className="mb-5">
                <InteractiveHoverButton
                  type="button"
                  text="Google Sign In"
                  onClick={handleGoogleLogin}
                  overlayClassName="bg-[#1f2937] text-white"
                  icon={
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4"
                      viewBox="0 0 48 48"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fill="#FFC107"
                        d="M43.611 20.083H42V20H24v8h11.303C33.652 32.657 29.214 36 24 36c-6.627 0-12-5.373-12-12S17.373 12 24 12c3.059 0 5.84 1.154 7.957 3.043l5.657-5.657C34.053 6.053 29.277 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917Z"
                      />
                      <path
                        fill="#FF3D00"
                        d="M6.306 14.691 12.88 19.51C14.661 15.108 18.961 12 24 12c3.059 0 5.84 1.154 7.957 3.043l5.657-5.657C34.053 6.053 29.277 4 24 4c-7.682 0-14.41 4.337-17.694 10.691Z"
                      />
                      <path
                        fill="#4CAF50"
                        d="M24 44c5.176 0 9.86-1.977 13.408-5.192l-6.19-5.238C29.145 35.091 26.715 36 24 36c-5.193 0-9.624-3.33-11.302-7.948l-6.525 5.025C9.418 39.556 16.585 44 24 44Z"
                      />
                      <path
                        fill="#1976D2"
                        d="M43.611 20.083H42V20H24v8h11.303a12.07 12.07 0 0 1-4.085 5.57l.003-.002 6.19 5.238C36.973 39.287 44 34 44 24c0-1.341-.138-2.65-.389-3.917Z"
                      />
                    </svg>
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                <span>还没有账号？</span>
                <Link
                  to="/register"
                  className="font-semibold text-[#6c3ff5] transition hover:text-[#5730d6]"
                >
                  去注册
                </Link>
              </div>
            </Form>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Login
