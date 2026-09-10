import React, { useEffect, useState } from 'react'
import { Avatar, Button, Descriptions, Form, Input, message, Tabs, Upload } from 'antd'
import type { UploadProps } from 'antd'
import { updateUser, updateUserAvatar } from '@/apis/system/user'
import { useLoginStore } from '@/store'
import { hasPermission } from '@/utils/permission'
import ChangePasswordForm from '@/components/change-password-form'

interface ProfileFormValues {
  nickName: string
  introduceSign: string
  address: string
}

const AVATAR_MAX_SIZE = 2 * 1024 * 1024
const AVATAR_TYPES = ['image/jpeg', 'image/png']

/** 个人中心：左侧资料卡（头像可上传），右侧基本资料 / 修改密码 */
const UserInfoPage: React.FC = () => {
  const user = useLoginStore((state) => state.user)
  const loadCurrentUser = useLoginStore((state) => state.loadCurrentUser)
  const [profileForm] = Form.useForm<ProfileFormValues>()
  const [profileSubmitting, setProfileSubmitting] = useState(false)

  useEffect(() => {
    profileForm.setFieldsValue({
      nickName: user?.nickName || '',
      introduceSign: user?.introduceSign || '',
      address: user?.address || '',
    })
    // 仅在进入页面时按当前用户初始化一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** 校验头像文件（jpg/png 且不超过 2MB），返回 false 阻止上传 */
  const beforeAvatarUpload: UploadProps['beforeUpload'] = (file) => {
    if (!AVATAR_TYPES.includes(file.type)) {
      message.error('头像仅支持 jpg / png 格式')
      return false
    }
    if (file.size > AVATAR_MAX_SIZE) {
      message.error('头像大小不能超过 2MB')
      return false
    }
    return true
  }

  /** 上传头像并刷新顶栏用户信息 */
  const handleUploadAvatar: UploadProps['customRequest'] = async (options) => {
    if (!user?.id) {
      message.error('无法获取当前登录用户，请重新登录后重试')
      return
    }
    const formData = new FormData()
    formData.append('userId', String(user.id))
    formData.append('file', options.file)
    const avatar = await updateUserAvatar(formData)
    if (avatar) {
      message.success('头像更新成功')
      await loadCurrentUser()
    }
  }

  const handleSaveProfile = async () => {
    if (profileSubmitting) return
    const values = await profileForm.validateFields()
    setProfileSubmitting(true)
    try {
      const result = await updateUser({
        id: user?.id,
        nickName: values.nickName,
        introduceSign: values.introduceSign,
        address: values.address,
      })
      if (result) {
        message.success('资料保存成功')
        await loadCurrentUser()
      }
    } finally {
      setProfileSubmitting(false)
    }
  }

  const canEditProfile = hasPermission(user?.permissions, 'system:user:edit')

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}
    >
      {/* 左侧资料卡 */}
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 2px 12px 0 rgba(0,0,0,0.03)',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <Upload
          showUploadList={false}
          accept="image/jpeg,image/png"
          beforeUpload={beforeAvatarUpload}
          customRequest={handleUploadAvatar}
        >
          <Avatar shape="square" size={120} src={user?.avatar} style={{ cursor: 'pointer' }}>
            {user?.nickName?.charAt(0)}
          </Avatar>
        </Upload>
        <h3 style={{ margin: '16px 0 4px', fontSize: 20, fontWeight: 600 }}>{user?.nickName}</h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#888' }}>
          {user?.introduceSign || '这个人很懒，什么都没有留下'}
        </p>
        <Descriptions column={1} bordered size="small" labelStyle={{ width: 90 }}>
          <Descriptions.Item label="登录账号">{user?.loginName}</Descriptions.Item>
          <Descriptions.Item label="注册时间">{user?.createTime || '-'}</Descriptions.Item>
          <Descriptions.Item label="收货地址">{user?.address || '暂无'}</Descriptions.Item>
        </Descriptions>
      </div>

      {/* 右侧编辑区 */}
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 2px 12px 0 rgba(0,0,0,0.03)',
          padding: 24,
        }}
      >
        <Tabs
          items={[
            {
              key: 'profile',
              label: '基本资料',
              children: (
                <Form form={profileForm} layout="vertical" style={{ maxWidth: 480 }}>
                  <Form.Item
                    name="nickName"
                    label="昵称"
                    rules={[{ required: true, message: '请输入昵称' }]}
                  >
                    <Input placeholder="请输入昵称" />
                  </Form.Item>
                  <Form.Item name="introduceSign" label="个性签名">
                    <Input.TextArea
                      rows={2}
                      maxLength={100}
                      showCount
                      placeholder="请输入个性签名"
                    />
                  </Form.Item>
                  <Form.Item name="address" label="收货地址">
                    <Input placeholder="请输入收货地址" />
                  </Form.Item>
                  <Form.Item>
                    {canEditProfile && (
                      <Button
                        type="primary"
                        loading={profileSubmitting}
                        onClick={() => void handleSaveProfile()}
                      >
                        保存修改
                      </Button>
                    )}
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'password',
              label: '修改密码',
              children: <ChangePasswordForm />,
            },
          ]}
        />
      </div>
    </div>
  )
}

export default UserInfoPage
