import React, { useEffect, useState } from 'react'
import { Form, Input, Checkbox, message } from 'antd'
import {
  UserOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLoginStore } from '@/store'
import { loginModule } from '@/apis'
import type { LoginRequestDto } from '@/apis/login'
import { AnimatedCharacters } from '@/components/ui/animated-characters'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'

const Login: React.FC = () => {
  const [form] = Form.useForm<LoginRequestDto>()
  const navigate = useNavigate()
  const location = useLocation()
  const [logining, setLogining] = useState(false)
  const [captchaUrl, setCaptchaUrl] = useState('')
  const [captchaId, setCaptchaId] = useState('')
  const [captchaLoading, setCaptchaLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const { login } = useLoginStore()
  const redirectTo = (location.state as { from?: string } | null)?.from || '/system'

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
      setCaptchaId(captchaRes.captchaId)
      setCaptchaUrl(captchaRes.captchaImage)
    } catch {
      message.error('验证码获取失败，请稍后重试。')
    } finally {
      setCaptchaLoading(false)
    }
  }

  const handleLogin = async (values: LoginRequestDto) => {
    setLogining(true)
    setErrorMessage('')
    try {
      const loginData = { ...values }
      loginData.captchaId = captchaId
      await login(loginData)
      navigate(redirectTo, { replace: true })
    } catch {
      setErrorMessage('登录失败，请检查账号、密码和验证码后重试。')
      void handleGetCaptcha()
    } finally {
      setLogining(false)
    }
  }

  const applicationTitle = import.meta.env.VITE_APP_TITLE || 'Study Java React'

  return (
    <div className="login-page relative h-screen overflow-hidden bg-[#f6f0ff] text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(108,63,245,0.24),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,155,107,0.28),transparent_26%),linear-gradient(135deg,#fff8ef_0%,#f4f2ff_48%,#eef7ff_100%)]" />
      <div className="absolute left-[-10%] top-[-10%] h-72 w-72 rounded-full bg-[#6c3ff5]/18 blur-3xl" />
      <div className="absolute bottom-[-14%] right-[-8%] h-80 w-80 rounded-full bg-[#ff9b6b]/24 blur-3xl" />

      <div className="relative grid h-full lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden h-full overflow-hidden bg-[#130c2f] px-12 py-8 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(232,215,84,0.20),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(108,63,245,0.48),transparent_28%),radial-gradient(circle_at_72%_82%,rgba(255,155,107,0.30),transparent_26%)]" />
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
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-120 overflow-y-auto rounded-4xl border border-white/70 bg-white/82 p-5 shadow-[0_32px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:max-h-[calc(100vh-2.5rem)] sm:p-7">
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
              initialValues={{ rememberMe: false }}
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
                rules={[{ required: true, message: '请输入账号' }]}
              >
                <Input
                  prefix={<UserOutlined className="text-slate-400" />}
                  placeholder="请输入账号"
                  autoComplete="username"
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  className="h-13! rounded-2xl! border-slate-200! bg-slate-50! px-4! text-slate-900! placeholder:text-slate-400! hover:border-[#6c3ff5]! focus-within:border-[#6c3ff5]! focus-within:shadow-[0_0_0_4px_rgba(108,63,245,0.12)]!"
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
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-slate-400" />}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  visibilityToggle={{
                    visible: showPassword,
                    onVisibleChange: setShowPassword,
                  }}
                  className="h-13! rounded-2xl! border-slate-200! bg-slate-50! px-4! text-slate-900! placeholder:text-slate-400! hover:border-[#6c3ff5]! focus-within:border-[#6c3ff5]! focus-within:shadow-[0_0_0_4px_rgba(108,63,245,0.12)]!"
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
                rules={[
                  { required: true, message: '请输入验证码' },
                  { len: 4, message: '验证码长度应为 4 位' },
                ]}
              >
                <div className="grid grid-cols-[1fr_112px] gap-3">
                  <Input
                    prefix={<SafetyCertificateOutlined className="text-slate-400" />}
                    placeholder="请输入验证码"
                    autoComplete="off"
                    maxLength={4}
                    className="h-13! rounded-2xl! border-slate-200! bg-slate-50! px-4! text-slate-900! placeholder:text-slate-400! hover:border-[#6c3ff5]! focus-within:border-[#6c3ff5]! focus-within:shadow-[0_0_0_4px_rgba(108,63,245,0.12)]!"
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
