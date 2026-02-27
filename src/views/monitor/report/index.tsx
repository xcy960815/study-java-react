import React, { useState, useEffect } from 'react'
import { Card, Statistic, Row, Col, Spin } from 'antd'
import { ShoppingCartOutlined, DollarOutlined } from '@ant-design/icons'
import { getDailyReportData, type DailyReportVo } from '@/apis/monitor/report'

const ReportPage: React.FC = () => {
  /** 报表数据 */
  const [reportData, setReportData] = useState<DailyReportVo>({ totalOrders: 0, totalRevenue: 0 })
  /** 加载状态 */
  const [loading, setLoading] = useState(false)

  /** 获取报表数据 */
  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getDailyReportData()
      if (res) setReportData(res)
    } catch (err) {
      console.error('获取报表数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>经营报表（昨日数据）</h2>
      <Spin spinning={loading}>
        <Row gutter={24}>
          {/* 昨日订单总数 */}
          <Col xs={24} md={12}>
            <Card>
              <Statistic
                title="昨日订单总数"
                value={reportData.totalOrders}
                prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontSize: 32, fontWeight: 'bold' }}
              />
            </Card>
          </Col>

          {/* 昨日销售总额 */}
          <Col xs={24} md={12}>
            <Card>
              <Statistic
                title="昨日销售总额"
                value={reportData.totalRevenue}
                prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                suffix="元"
                precision={2}
                valueStyle={{ color: '#52c41a', fontSize: 32, fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  )
}

export default ReportPage
