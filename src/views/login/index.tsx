import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Checkbox } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import md5 from 'md5'
import { useLoginStore } from '@/store'
import { loginModule } from '@/apis'
import type { LoginRequestDto } from '@/apis/login'
import { initBackground } from '@/views/login/background'
import { useWatch } from 'antd/es/form/Form'

const Login: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [logining, setLogining] = useState(false)
  const [captchaUrl, setCaptchaUrl] = useState('')
  const [captchaLoading, setCaptchaLoading] = useState(false)

  // Zustand hook
  const { login } = useLoginStore()

  // Watch form fields to determine if button should dodge
  const usernameValue = useWatch('username', form)
  const passwordValue = useWatch('password', form)
  const captchaValue = useWatch('captcha', form)

  const isFormIncomplete =
    !usernameValue || !passwordValue || !captchaValue || captchaValue.length !== 4

  useEffect(() => {
    // Run background rain
    const cleanup = initBackground()
    handleGetCaptcha()

    const button = document.querySelector('.login-btn') as HTMLElement
    if (!button) return

    const distanceBetween = (p1x: number, p1y: number, p2x: number, p2y: number) => {
      const dx = p1x - p2x
      const dy = p1y - p2y
      return Math.sqrt(dx * dx + dy * dy)
    }

    let currentOx = 0
    let currentOy = 0

    const handleMouseMove = (event: MouseEvent) => {
      if (!isFormIncomplete) {
        currentOx = 0
        currentOy = 0
        button.style.transform = ''
        button.style.boxShadow = ''
        return
      }

      const radius = Math.max(button.offsetWidth * 0.75, button.offsetHeight * 0.75, 100)
      const rect = button.getBoundingClientRect()
      const bx = rect.left - currentOx + rect.width / 2
      const by = rect.top - currentOy + rect.height / 2

      const dist = distanceBetween(event.clientX, event.clientY, bx, by) * 2
      const angle = Math.atan2(event.clientY - by, event.clientX - bx)

      const ox = -1 * Math.cos(angle) * Math.max(radius - dist, 0)
      const oy = -1 * Math.sin(angle) * Math.max(radius - dist, 0)

      currentOx = ox
      currentOy = oy

      const rx = oy / 2
      const ry = -ox / 2

      button.style.transition = `all 0.1s ease`
      button.style.transform = `translate(${ox}px, ${oy}px) rotateX(${rx}deg) rotateY(${ry}deg)`
      button.style.boxShadow = `0px ${Math.abs(oy)}px ${(Math.abs(oy) / radius) * 40}px rgba(0,0,0,0.15)`
    }

    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      cleanup()
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isFormIncomplete])

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
    try {
      const loginData = { ...values }
      if (loginData.password) {
        loginData.password = md5(loginData.password)
      }
      await login(loginData)
      // redirect after success
      navigate('/system')
    } catch (error) {
      // Re-fetch captcha if login fails
      handleGetCaptcha()
    } finally {
      setLogining(false)
    }
  }

  return (
    <div className="relative flex items-center justify-center w-screen h-screen">
      <canvas className="absolute top-0 bottom-0 left-0 right-0 -z-10" id="cvs"></canvas>
      <div className="bg-white rounded p-6 w-[400px]">
        <h3 className="text-gray-500 text-center mb-6 text-xl italic">
          {import.meta.env.VITE_APP_TITLE || 'Study Java React'}
        </h3>

        <Form
          form={form}
          name="loginForm"
          onFinish={handleLogin}
          initialValues={{ username: '13700002703', password: '123456', rememberMe: false }}
          size="large"
        >
          <Form.Item name="username">
            <Input prefix={<UserOutlined />} placeholder="账号" />
          </Form.Item>

          <Form.Item name="password">
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item name="captcha">
            <div className="flex gap-2">
              <Input placeholder="验证码" />
              <div
                className="w-24 h-10 shrink-0 cursor-pointer border rounded flex items-center justify-center overflow-hidden"
                onClick={handleGetCaptcha}
              >
                {captchaUrl ? (
                  <img src={captchaUrl} alt="captcha" className="w-full h-full object-fill" />
                ) : (
                  <span className="text-xs text-gray-400">
                    {captchaLoading ? '加载中' : '失败'}
                  </span>
                )}
              </div>
            </div>
          </Form.Item>

          <Form.Item name="rememberMe" valuePropName="checked" className="mb-6">
            <Checkbox>记住密码</Checkbox>
          </Form.Item>

          <Form.Item className="mb-2">
            <Button
              type="primary"
              htmlType="submit"
              className="w-full login-btn"
              loading={logining}
            >
              {logining ? '登 录 中...' : '登 录'}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default Login
