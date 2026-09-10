import { Badge, Button, Empty, Popconfirm, Popover } from 'antd'
import { BellOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useNotificationStore } from '@/store'
import {
  formatRelativeTime,
  getNotificationRoute,
  type AppNotification,
} from '@/utils/notification'

/** 顶栏通知铃铛：本地通知列表，支持已读/清空与点击跳转 */
export const NotificationBell: React.FC = () => {
  const navigate = useNavigate()
  const notifications = useNotificationStore((state) => state.notifications)
  const markAsRead = useNotificationStore((state) => state.markAsRead)
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead)
  const clearNotifications = useNotificationStore((state) => state.clearNotifications)
  const unreadCount = notifications.filter((item) => !item.read).length

  const handleItemClick = (item: AppNotification) => {
    markAsRead(item.id)
    const target = getNotificationRoute(item)
    if (target) navigate(target)
  }

  const panel = (
    <div style={{ width: 328 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 8,
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600 }}>通知（{unreadCount} 条未读）</span>
        <span>
          <Button type="link" size="small" disabled={unreadCount === 0} onClick={markAllAsRead}>
            全部已读
          </Button>
          <Popconfirm title="确认清空所有通知吗？" onConfirm={clearNotifications}>
            <Button type="link" size="small" danger disabled={notifications.length === 0}>
              清空
            </Button>
          </Popconfirm>
        </span>
      </div>

      {notifications.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无通知" />
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 360, overflowY: 'auto' }}>
          {notifications.map((item) => (
            <li
              key={item.id}
              onClick={() => handleItemClick(item)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '10px 4px',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  marginTop: 6,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: item.read ? 'transparent' : '#1677ff',
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{item.title}</p>
                <p
                  style={{
                    margin: '4px 0',
                    fontSize: 13,
                    color: '#555',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.content}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#999' }}>
                  {formatRelativeTime(item.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <Popover content={panel} placement="bottomRight" trigger="click">
      <Badge count={unreadCount} overflowCount={99} size="small">
        <Button type="text" shape="circle" icon={<BellOutlined style={{ fontSize: 18 }} />} />
      </Badge>
    </Popover>
  )
}

export default NotificationBell
