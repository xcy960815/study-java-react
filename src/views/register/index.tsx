import React, { useEffect, useState } from 'react'
import { Form, Input, message } from 'antd'
import {
  UserOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import md5 from 'md5'
import { loginModule } from '@/apis'
import type { RegisterRequestDto } from '@/apis/login'
import { AnimatedCharacters } from '@/components/ui/animated-characters'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'

const Register: React.FC = () => {
  const [form] = Form.useForm<RegisterRequestDto>()
  const navigate = useNavigate()
  const [registering, setRegistering] = useState(false)
  const [captchaUrl, setCaptchaUrl] = useState('')
  const [captchaLoading, setCaptchaLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const usernameValue = Form.useWatch('username', form)
  const passwordValue = Form.useWatch('password', form)
  const confirmPasswordValue = Form.useWatch('confirmPassword', form)
  const captchaValue = Form.useWatch('captcha', form)

  const isFormIncomplete =
    !usernameValue ||
    !passwordValue ||
    !confirmPasswordValue ||
    !captchaValue ||
    captchaValue.length !== 4

  useEffect(() => {
    handleGetCaptcha()
  }, [])

  useEffect(() => {
    if (errorMessage && (usernameValue || passwordValue || confirmPasswordValue || captchaValue)) {
      setErrorMessage('')
    }
  }, [captchaValue, confirmPasswordValue, errorMessage, passwordValue, usernameValue])

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

  const handleRegister = async (values: RegisterRequestDto) => {
    setRegistering(true)
    setErrorMessage('')
    try {
      if (values.password !== values.confirmPassword) {
        setErrorMessage('两次输入的密码不一致，请重新确认。')
        message.error('两次输入的密码不一致')
        setRegistering(false)
        return
      }

      const registerData = { ...values }
      if (registerData.password) {
        registerData.password = md5(registerData.password)
        registerData.confirmPassword = md5(registerData.confirmPassword!)
      }

      await loginModule.register(registerData)
      message.success('注册成功，请登录')
      navigate('/login')
    } catch (error) {
      setErrorMessage('注册失败，请检查填写内容后重试。')
      handleGetCaptcha()
    } finally {
      setRegistering(false)
    }
  }

  const applicationTitle = import.meta.env.VITE_APP_TITLE || 'Study Java React'
  const visiblePasswordLength =
    (showPassword ? (passwordValue?.length ?? 0) : 0) +
    (showConfirmPassword ? (confirmPasswordValue?.length ?? 0) : 0)

  return (
    <div className="register-page relative h-screen overflow-hidden bg-[#f6f0ff] text-slate-900">
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
                New Account
              </p>
              <h1 className="text-2xl font-semibold tracking-[0.08em]">{applicationTitle}</h1>
            </div>
          </div>

          <div className="relative z-10 mt-10 max-w-xl">
            <span className="inline-flex rounded-full border border-white/12 bg-white/8 px-4 py-1 text-xs font-medium tracking-[0.28em] uppercase text-white/72">
              Create Access
            </span>
            <h2 className="mt-5 text-5xl font-semibold leading-tight">
              注册一个全新的
              <span className="block text-[#f4c95d]">系统工作台账号。</span>
            </h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-white/72">
              保持你现有项目的注册接口和验证码流程，只把入口界面升级成更统一、更有记忆点的第一屏。
            </p>
          </div>

          <div className="relative z-10 mt-auto flex items-end justify-center xl:justify-start">
            <AnimatedCharacters
              isTyping={isTyping}
              showPassword={showPassword || showConfirmPassword}
              passwordLength={visiblePasswordLength}
            />
          </div>
        </section>

        <section className="relative flex h-full items-center justify-center overflow-hidden px-5 py-4 sm:px-8 lg:px-12">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-[480px] overflow-y-auto rounded-[32px] border border-white/70 bg-white/82 p-5 shadow-[0_32px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:max-h-[calc(100vh-2.5rem)] sm:p-7">
            <div className="mb-6">
              <span className="inline-flex rounded-full bg-[#efe7ff] px-3 py-1 text-xs font-semibold tracking-[0.22em] uppercase text-[#6c3ff5]">
                Join In
              </span>
              <h3 className="mt-3 text-3xl font-semibold tracking-[0.04em] text-slate-900">
                创建 {applicationTitle} 账号
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                填写账号信息完成注册，注册成功后会自动跳转回登录页面。
              </p>
            </div>

            {errorMessage ? (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-500">
                {errorMessage}
              </div>
            ) : null}

            <Form
              form={form}
              name="registerForm"
              onFinish={handleRegister}
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
                  autoComplete="new-password"
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
                    确认密码
                  </span>
                }
                name="confirmPassword"
                className="mb-4"
              >
                <Input.Password
                  prefix={<LockOutlined className="text-slate-400" />}
                  placeholder="请再次输入密码"
                  autoComplete="new-password"
                  visibilityToggle={{
                    visible: showConfirmPassword,
                    onVisibleChange: setShowConfirmPassword,
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

              <Form.Item className="mb-5">
                <InteractiveHoverButton
                  type="submit"
                  text={registering ? '注册中...' : '创建账号'}
                  disabled={isFormIncomplete || registering}
                  overlayClassName="bg-[#6c3ff5] text-white"
                  icon={<ArrowRightOutlined />}
                />
              </Form.Item>

              <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                <span>已经有账号？</span>
                <Link
                  to="/login"
                  className="font-semibold text-[#6c3ff5] transition hover:text-[#5730d6]"
                >
                  返回登录
                </Link>
              </div>
            </Form>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Register
