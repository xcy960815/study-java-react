import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Checkbox } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import md5 from 'md5'
import { useLoginStore } from '@/store'
import { loginModule } from '@/apis'
import { initBackground } from '@/views/login/background'

const Login: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [logining, setLogining] = useState(false)
  const [captchaUrl, setCaptchaUrl] = useState('')
  const [captchaLoading, setCaptchaLoading] = useState(false)

  // Zustand hook
  const { login } = useLoginStore()

  useEffect(() => {
    // Run background rain
    const cleanup = initBackground()
    handleGetCaptcha()

    return () => {
      cleanup()
    }
  }, [])

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

  const handleLogin = async (values: any) => {
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
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="账号" />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item
            name="captcha"
            rules={[
              { required: true, message: '请输入验证码' },
              { len: 4, message: '验证码长度为 4' },
            ]}
          >
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
            <Button type="primary" htmlType="submit" className="w-full" loading={logining}>
              {logining ? '登 录 中...' : '登 录'}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default Login
