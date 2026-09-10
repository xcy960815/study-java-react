import React, { useCallback, useEffect, useState } from 'react'
import { Button, Empty, Spin, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  DollarOutlined,
  ProfileOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getGoodsList } from '@/apis/goods'
import { getOrderList, type Order } from '@/apis/order'
import { getDailyReportData, type DailyReport } from '@/apis/report'
import { ORDER_STATUS_META, OrderStatus } from '@/enums/order'
import { useLoginStore } from '@/store'
import { hasPermission } from '@/utils/permission'
import {
  ORDER_STATUS_PIE_COLORS,
  buildOrderStatusPieData,
  getGreeting,
  getTopStockGoods,
  type NamedValue,
} from '@/utils/dashboard-stats'

/** 统计卡片：彩色圆形图标 + 标签 + 数值 */
const StatCard: React.FC<{
  label: string
  value: React.ReactNode
  color: string
  icon: React.ReactNode
}> = ({ label, value, color, icon }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      background: '#fff',
      borderRadius: 8,
      boxShadow: '0 2px 12px 0 rgba(0, 0, 0, 0.03)',
      padding: 24,
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 56,
        height: 56,
        borderRadius: '50%',
        marginRight: 16,
        background: `${color}1a`,
        color,
        fontSize: 24,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div>
      <p style={{ margin: 0, fontSize: 14, color: '#888' }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 700 }}>{value}</p>
    </div>
  </div>
)

/** 卡片容器 */
const ChartCard: React.FC<{
  title: React.ReactNode
  children: React.ReactNode
  extra?: React.ReactNode
}> = ({ title, children, extra }) => (
  <div
    style={{
      background: '#fff',
      borderRadius: 8,
      boxShadow: '0 2px 12px 0 rgba(0, 0, 0, 0.03)',
      padding: 20,
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}
    >
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{title}</h3>
      {extra}
    </div>
    {children}
  </div>
)

/** SVG 环图（替代 echarts pie），按数据占比绘制扇区 */
const DonutChart: React.FC<{ data: NamedValue[] }> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const radius = 70
  const circumference = 2 * Math.PI * radius

  // 单次 reduce 同时算出每段弧长与起点偏移，避免渲染期间的可变累加
  const segments = data.reduce<{ offset: number; nodes: React.ReactNode[] }>(
    (state, item, index) => {
      const dash = (item.value / total) * circumference
      state.nodes.push(
        <circle
          key={item.name}
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={ORDER_STATUS_PIE_COLORS[index % ORDER_STATUS_PIE_COLORS.length]}
          strokeWidth={30}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeDashoffset={-state.offset}
          transform="rotate(-90 100 100)"
        />
      )
      return { offset: state.offset + dash, nodes: state.nodes }
    },
    { offset: 0, nodes: [] }
  ).nodes

  return (
    <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
      {segments}
      <text x="100" y="96" textAnchor="middle" fontSize={12} fill="#888">
        订单总数
      </text>
      <text x="100" y="118" textAnchor="middle" fontSize={22} fontWeight="bold" fill="#333">
        {total}
      </text>
    </svg>
  )
}

/** 图例列表：色点 + 名称 + 数值 */
const DonutLegend: React.FC<{ data: NamedValue[] }> = ({ data }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginTop: 12 }}>
    {data.map((item, index) => (
      <span
        key={item.name}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: ORDER_STATUS_PIE_COLORS[index % ORDER_STATUS_PIE_COLORS.length],
          }}
        />
        {item.name}：{item.value}
      </span>
    ))}
  </div>
)

/** 横向条形图（替代 echarts bar），按最大值归一化 */
const StockBarList: React.FC<{ data: NamedValue[] }> = ({ data }) => {
  const max = Math.max(...data.map((item) => item.value), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data.map((item) => (
        <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              width: 110,
              fontSize: 13,
              color: '#555',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'right',
              flexShrink: 0,
            }}
            title={item.name}
          >
            {item.name}
          </span>
          <div
            style={{
              flex: 1,
              height: 18,
              background: '#f5f5f5',
              borderRadius: 9,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(item.value / max) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #69b1ff, #1677ff)',
                borderRadius: 9,
                transition: 'width 0.3s',
              }}
            />
          </div>
          <span style={{ width: 56, fontSize: 13, color: '#555' }}>{item.value}</span>
        </div>
      ))}
    </div>
  )
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const user = useLoginStore((state) => state.user)
  const canQueryOrder = useLoginStore((state) =>
    hasPermission(state.user?.permissions, 'order:query')
  )
  const canQueryGoods = useLoginStore((state) =>
    hasPermission(state.user?.permissions, 'goods:query')
  )

  const [statsLoading, setStatsLoading] = useState(false)
  const [dailyReport, setDailyReport] = useState<DailyReport>({ totalOrders: 0, totalRevenue: 0 })
  const [orderTotal, setOrderTotal] = useState(0)
  const [goodsTotal, setGoodsTotal] = useState(0)
  const [orderStatusPieData, setOrderStatusPieData] = useState<NamedValue[]>([])
  const [topStockGoods, setTopStockGoods] = useState<NamedValue[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])

  const loadDashboardStats = useCallback(async () => {
    if (statsLoading) return
    setStatsLoading(true)
    try {
      const loadDailyReport = async () => {
        setDailyReport(await getDailyReportData())
      }

      // 并行取各状态 total（pageSize=1 只要计数）
      const loadOrderStats = async () => {
        const statuses = Object.keys(ORDER_STATUS_META).map(Number) as OrderStatus[]
        const totals = await Promise.all(
          statuses.map((status) =>
            getOrderList({ orderStatus: status, pageNum: 1, pageSize: 1 })
              .then((result) => result.total)
              .catch(() => 0)
          )
        )
        const statusTotals: Partial<Record<OrderStatus, number>> = {}
        statuses.forEach((status, index) => {
          statusTotals[status] = totals[index]
        })
        setOrderTotal(totals.reduce((sum, value) => sum + value, 0))
        setOrderStatusPieData(buildOrderStatusPieData(statusTotals))

        const recentResult = await getOrderList({ pageNum: 1, pageSize: 8 })
        setRecentOrders(recentResult.data)
      }

      const loadGoodsStats = async () => {
        const goodsResult = await getGoodsList({ pageNum: 1, pageSize: 50 })
        setGoodsTotal(goodsResult.total)
        setTopStockGoods(getTopStockGoods(goodsResult.data, 8))
      }

      await Promise.all([
        loadDailyReport().catch(() => undefined),
        canQueryOrder ? loadOrderStats() : Promise.resolve(),
        canQueryGoods ? loadGoodsStats() : Promise.resolve(),
      ])
    } catch (error) {
      console.error('获取工作台数据失败:', error)
    } finally {
      setStatsLoading(false)
    }
    // statsLoading 不进依赖：仅用于并发防抖，避免加载完成后重复拉取
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canQueryGoods, canQueryOrder])

  useEffect(() => {
    void loadDashboardStats()
  }, [loadDashboardStats])

  const recentOrderColumns: ColumnsType<Order> = [
    { title: '订单号', dataIndex: 'orderNo', align: 'center' },
    { title: '收货人', dataIndex: 'userName', align: 'center' },
    {
      title: '金额',
      dataIndex: 'totalPrice',
      align: 'center',
      render: (value: number) => `¥ ${value}`,
    },
    {
      title: '订单状态',
      dataIndex: 'orderStatus',
      align: 'center',
      render: (value: OrderStatus) => {
        const meta = ORDER_STATUS_META[value]
        return <Tag color={meta?.color || 'default'}>{meta?.label || `未知状态（${value}）`}</Tag>
      },
    },
    { title: '创建时间', dataIndex: 'createTime', align: 'center' },
  ]

  const greeting = getGreeting(new Date().getHours())

  return (
    <div style={{ padding: 24 }}>
      {/* 问候区 */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>
          {greeting}，{user?.nickName}
        </h2>
        <p style={{ margin: '4px 0 0', color: '#888', fontSize: 13 }}>
          欢迎回到工作台，这是今天的概览
        </p>
      </div>

      <Spin spinning={statsLoading}>
        {/* 统计卡片 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 24,
            marginBottom: 24,
          }}
        >
          <StatCard
            label="昨日订单总数"
            value={dailyReport.totalOrders}
            color="#1677ff"
            icon={<ShoppingCartOutlined />}
          />
          <StatCard
            label="昨日销售总额"
            value={`¥ ${dailyReport.totalRevenue}`}
            color="#52c41a"
            icon={<DollarOutlined />}
          />
          {canQueryOrder && (
            <StatCard
              label="订单总数"
              value={orderTotal}
              color="#fa8c16"
              icon={<ProfileOutlined />}
            />
          )}
          {canQueryGoods && (
            <StatCard label="商品总数" value={goodsTotal} color="#6979c9" icon={<ShopOutlined />} />
          )}
        </div>

        {/* 图表区 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
            gap: 24,
            marginBottom: 24,
          }}
        >
          {canQueryOrder && (
            <ChartCard title="订单状态分布">
              {orderStatusPieData.length > 0 ? (
                <>
                  <div style={{ height: 260 }}>
                    <DonutChart data={orderStatusPieData} />
                  </div>
                  <DonutLegend data={orderStatusPieData} />
                </>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无订单数据" />
              )}
            </ChartCard>
          )}
          {canQueryGoods && (
            <ChartCard title="商品库存 TOP 8">
              {topStockGoods.length > 0 ? (
                <StockBarList data={topStockGoods} />
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无商品数据" />
              )}
            </ChartCard>
          )}
        </div>

        {/* 最近订单 */}
        {canQueryOrder && (
          <ChartCard
            title="最近订单"
            extra={
              <Button type="link" size="small" onClick={() => navigate('/order')}>
                查看全部
              </Button>
            }
          >
            <Table
              rowKey="orderId"
              size="small"
              bordered
              columns={recentOrderColumns}
              dataSource={recentOrders}
              pagination={false}
            />
          </ChartCard>
        )}
      </Spin>
    </div>
  )
}

export default DashboardPage
