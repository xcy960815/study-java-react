import ChangePasswordForm from '@/components/change-password-form'

/** 独立修改密码页：个人中心提供 Tab 入口后保留此直达路由 */
const PasswordPage: React.FC = () => (
  <div style={{ maxWidth: 600, margin: '100px auto 0', padding: 25 }}>
    <ChangePasswordForm />
  </div>
)

export default PasswordPage
