import React, { useState, useEffect } from 'react'
import { Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import md5 from 'md5'
import { loginModule } from '@/apis'
import type { RegisterRequestDto } from '@/apis/login'
import { initBackground } from '@/views/login/background'

import { useLoginButtonAnimation } from '@/hooks/useLoginButtonAnimation'

const Register: React.FC = () => {
  const [form] = Form.useForm<RegisterRequestDto>()
  const navigate = useNavigate()
  const [registering, setRegistering] = useState(false)
  const [captchaUrl, setCaptchaUrl] = useState('')
  const [captchaLoading, setCaptchaLoading] = useState(false)

  // Watch form fields to determine if button should dodge
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

  useLoginButtonAnimation(isFormIncomplete, '.register-btn')

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

  const handleRegister = async (values: RegisterRequestDto) => {
    setRegistering(true)
    try {
      if (values.password !== values.confirmPassword) {
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
      // redirect after success
      navigate('/login')
    } catch (error) {
      // Re-fetch captcha if register fails
      handleGetCaptcha()
    } finally {
      setRegistering(false)
    }
  }

  return (
    <div className="relative flex items-center justify-center w-screen h-screen">
      <canvas className="absolute top-0 bottom-0 left-0 right-0 -z-10" id="cvs"></canvas>
      <div className="bg-white rounded p-6 w-[400px]">
        <h3 className="text-gray-500 text-center mb-6 text-xl italic">用户注册</h3>

        <Form form={form} name="registerForm" onFinish={handleRegister} size="large">
          <Form.Item name="username">
            <Input prefix={<UserOutlined />} placeholder="账号" />
          </Form.Item>

          <Form.Item name="password">
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item name="confirmPassword">
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
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

          <div className="flex justify-between items-center mb-6 text-sm">
            <Link to="/login" className="text-blue-500 hover:text-blue-600 ml-auto">
              已有账号? 去登录
            </Link>
          </div>

          <Form.Item className="mb-2">
            <Button
              type="primary"
              htmlType="submit"
              className="w-full register-btn"
              loading={registering}
              disabled={isFormIncomplete}
            >
              {registering ? '注 册 中...' : '注 册'}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default Register
