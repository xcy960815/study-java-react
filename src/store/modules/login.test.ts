import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCurrentUser, type UserInfoVo } from '@/apis/system/user'
import { useLoginStore } from './login'

vi.mock('@/apis/system/user', () => ({ getCurrentUser: vi.fn() }))

const oldUser: UserInfoVo = { nickName: 'old', loginName: 'old', introduceSign: '', address: '' }
const nextUser: UserInfoVo = { ...oldUser, nickName: 'next', loginName: 'next' }

beforeEach(() => {
  useLoginStore.getState().resetUser()
  vi.mocked(getCurrentUser).mockReset()
})

describe('会话切换后的用户状态', () => {
  it('失效会话的用户请求晚到不能恢复旧用户或覆盖新会话的 loading 状态', async () => {
    let resolveOld!: (user: UserInfoVo) => void
    let resolveNext!: (user: UserInfoVo) => void
    vi.mocked(getCurrentUser)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOld = resolve
        })
      )
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveNext = resolve
        })
      )
    const old = useLoginStore.getState().loadCurrentUser()
    useLoginStore.getState().resetUser()
    const next = useLoginStore.getState().loadCurrentUser()
    resolveOld(oldUser)
    await old
    expect(useLoginStore.getState().user).toBeNull()
    expect(useLoginStore.getState().userLoading).toBe(true)
    resolveNext(nextUser)
    await next
    expect(useLoginStore.getState().user).toEqual(nextUser)
    expect(useLoginStore.getState().userLoading).toBe(false)
  })
})
