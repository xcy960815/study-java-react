import React, { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Pagination,
  Radio,
  Result,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useSearchParams } from 'react-router-dom'
import {
  deleteOrder,
  getOrderDetail,
  getOrderList,
  payOrder,
  transitionOrder,
  type Order,
  type OrderQuery,
  type PaymentResult,
} from '@/apis/order'
import {
  ORDER_ACTION_META,
  ORDER_ACTIONS_BY_STATUS,
  ORDER_STATUS_META,
  PAY_STATUS_META,
  PAYMENT_TYPE_LABEL,
  OrderStatus,
  PaymentType,
  type PayablePaymentType,
  type OrderAction,
} from '@/enums/order'
import { useLoginStore } from '@/store'
import { eventEmitter } from '@/utils/event-emits'
import { hasPermission } from '@/utils/permission'

type OrderSearchValues = Pick<OrderQuery, 'orderNo' | 'userId' | 'orderStatus' | 'payStatus'>

const formatAmount = (amount: number) => `¥${amount.toFixed(2)}`

const getErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError(error)) return ''
  return (error.response?.data as { message?: string } | undefined)?.message || error.message
}

const OrderStatusTag = ({ status }: { status: OrderStatus }) => {
  const meta = ORDER_STATUS_META[status]
  return <Tag color={meta?.color || 'default'}>{meta?.label || `未知状态（${status}）`}</Tag>
}

const PayStatusTag = ({ status }: { status: Order['payStatus'] }) => {
  const meta = PAY_STATUS_META[status]
  return <Tag color={meta?.color || 'default'}>{meta?.label || `未知状态（${status}）`}</Tag>
}

const OrderPage: React.FC = () => {
  const [searchForm] = Form.useForm<OrderSearchValues>()
  const [searchParams, setSearchParams] = useSearchParams()
  const canQuery = useLoginStore((state) => hasPermission(state.user?.permissions, 'order:query'))
  const userLoaded = useLoginStore((state) => state.userLoaded)
  const canEdit = useLoginStore((state) => hasPermission(state.user?.permissions, 'order:edit'))
  const canRemove = useLoginStore((state) => hasPermission(state.user?.permissions, 'order:remove'))
  const [tableData, setTableData] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<Order | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [payingOrder, setPayingOrder] = useState<Order | null>(null)
  const [paymentType, setPaymentType] = useState<PayablePaymentType>(PaymentType.WECHAT_PAY)
  const [paying, setPaying] = useState(false)
  const [transitioningOrderId, setTransitioningOrderId] = useState<number | null>(null)
  const [lastPayment, setLastPayment] = useState<PaymentResult | null>(null)
  const paymentInFlight = useRef(new Set<number>())
  const transitionInFlight = useRef(new Set<number>())

  const fetchList = useCallback(
    async (pn: number, ps: number) => {
      if (!canQuery) return
      setLoading(true)
      try {
        const res = await getOrderList({
          ...searchForm.getFieldsValue(),
          isDeleted: 0,
          pageNum: pn,
          pageSize: ps,
        })
        setTableData(res.data)
        setTotal(res.total)
      } finally {
        setLoading(false)
      }
    },
    [canQuery, searchForm]
  )

  const fetchDetail = useCallback(async (orderId: number) => {
    setDetailLoading(true)
    try {
      const order = await getOrderDetail(orderId)
      setDetail(order)
      return order
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    if (canQuery) void fetchList(1, pageSize)
  }, [canQuery, fetchList, pageSize])

  useEffect(() => {
    const orderId = Number(searchParams.get('orderId'))
    if (canQuery && Number.isInteger(orderId) && orderId > 0) {
      void fetchDetail(orderId)
    }
  }, [canQuery, fetchDetail, searchParams])

  useEffect(() => {
    const handleOrderPaid = (orderId: number) => {
      void fetchList(pageNum, pageSize)
      if (detail?.orderId === orderId) void fetchDetail(orderId)
    }
    eventEmitter.on('order-paid', handleOrderPaid)
    return () => eventEmitter.off('order-paid', handleOrderPaid)
  }, [detail?.orderId, fetchDetail, fetchList, pageNum, pageSize])

  const refreshOrder = async (orderId: number) => {
    await Promise.all([
      fetchList(pageNum, pageSize),
      detail?.orderId === orderId ? fetchDetail(orderId) : Promise.resolve(),
    ])
  }

  const handlePay = async () => {
    if (!payingOrder || paymentInFlight.current.has(payingOrder.orderId)) return
    const orderId = payingOrder.orderId
    const storageKey = `paymentRequestId:${orderId}:${paymentType}`
    let requestId = sessionStorage.getItem(storageKey)
    if (!requestId) {
      requestId = crypto.randomUUID()
      sessionStorage.setItem(storageKey, requestId)
    }

    paymentInFlight.current.add(orderId)
    setPaying(true)
    try {
      const result = await payOrder({ requestId, orderId, payType: paymentType })
      sessionStorage.removeItem(storageKey)
      setLastPayment(result)
      setPayingOrder(null)
      message.success(
        result.idempotent
          ? `该订单已经支付，本次返回原支付结果：${result.transactionNo}`
          : `支付成功，交易流水号：${result.transactionNo}`
      )
      await refreshOrder(orderId)
    } catch (error) {
      const errorMessage = getErrorMessage(error)
      if (errorMessage.includes('状态') || errorMessage.includes('订单不存在')) {
        await refreshOrder(orderId)
      }
      // 失败和网络超时均保留 sessionStorage 中的 requestId，供同一支付方式安全重试。
    } finally {
      paymentInFlight.current.delete(orderId)
      setPaying(false)
    }
  }

  const handleTransition = (order: Order, action: OrderAction) => {
    if (transitionInFlight.current.has(order.orderId)) return
    const meta = ORDER_ACTION_META[action]
    Modal.confirm({
      title: meta.confirm,
      okButtonProps: { danger: meta.danger },
      onOk: async () => {
        if (transitionInFlight.current.has(order.orderId)) return
        transitionInFlight.current.add(order.orderId)
        setTransitioningOrderId(order.orderId)
        try {
          await transitionOrder({ orderId: order.orderId, action })
          message.success(`${meta.label}成功`)
          await refreshOrder(order.orderId)
        } catch (error) {
          const errorMessage = getErrorMessage(error)
          if (errorMessage.includes('状态') || errorMessage.includes('不能')) {
            await refreshOrder(order.orderId)
          }
          throw error
        } finally {
          transitionInFlight.current.delete(order.orderId)
          setTransitioningOrderId(null)
        }
      },
    })
  }

  const handleDelete = (order: Order) => {
    Modal.confirm({
      title: `确认删除订单 ${order.orderNo}？`,
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteOrder(order.orderId)
        message.success('删除成功')
        if (detail?.orderId === order.orderId) setDetail(null)
        await fetchList(pageNum, pageSize)
      },
    })
  }

  const renderActions = (order: Order) => {
    const actions = ORDER_ACTIONS_BY_STATUS[order.orderStatus] || []
    return (
      <Space wrap>
        <Button type="link" size="small" onClick={() => void fetchDetail(order.orderId)}>
          详情
        </Button>
        {canEdit && order.orderStatus === OrderStatus.PENDING_PAYMENT && (
          <Button
            type="link"
            size="small"
            loading={paying && payingOrder?.orderId === order.orderId}
            disabled={transitioningOrderId === order.orderId}
            onClick={() => setPayingOrder(order)}
          >
            支付
          </Button>
        )}
        {canEdit &&
          actions.map((action) => {
            const meta = ORDER_ACTION_META[action]
            return (
              <Button
                key={action}
                type="link"
                size="small"
                danger={meta.danger}
                loading={transitioningOrderId === order.orderId}
                disabled={paying && payingOrder?.orderId === order.orderId}
                onClick={() => handleTransition(order, action)}
              >
                {meta.label}
              </Button>
            )
          })}
        {canRemove && (
          <Button type="link" size="small" danger onClick={() => handleDelete(order)}>
            删除
          </Button>
        )}
      </Space>
    )
  }

  const columns: ColumnsType<Order> = [
    { title: '订单号', dataIndex: 'orderNo', width: 190 },
    { title: '收货人', dataIndex: 'userName', width: 110 },
    {
      title: '总金额',
      dataIndex: 'totalPrice',
      width: 110,
      render: (value: number) => formatAmount(value),
    },
    {
      title: '支付状态',
      dataIndex: 'payStatus',
      width: 110,
      render: (value: Order['payStatus']) => <PayStatusTag status={value} />,
    },
    {
      title: '支付方式',
      dataIndex: 'payType',
      width: 110,
      render: (value: PaymentType) => PAYMENT_TYPE_LABEL[value] || `未知（${value}）`,
    },
    {
      title: '订单状态',
      dataIndex: 'orderStatus',
      width: 120,
      render: (value: OrderStatus) => <OrderStatusTag status={value} />,
    },
    { title: '创建时间', dataIndex: 'createTime', width: 180 },
    {
      title: '操作',
      fixed: 'right',
      width: 330,
      render: (_, order) => renderActions(order),
    },
  ]

  if (!userLoaded) {
    return <Spin tip="正在加载当前用户及权限" fullscreen />
  }

  if (!canQuery) {
    return <Result status="403" title="无订单查询权限" subTitle="需要 order:query 权限。" />
  }

  return (
    <div style={{ padding: 16 }}>
      <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="orderNo" label="订单号">
          <Input allowClear style={{ width: 200 }} />
        </Form.Item>
        <Form.Item name="userId" label="用户ID">
          <InputNumber min={1} precision={0} style={{ width: 130 }} />
        </Form.Item>
        <Form.Item name="orderStatus" label="订单状态">
          <Select
            allowClear
            style={{ width: 150 }}
            options={Object.entries(ORDER_STATUS_META).map(([value, meta]) => ({
              value: Number(value),
              label: meta.label,
            }))}
          />
        </Form.Item>
        <Form.Item name="payStatus" label="支付状态">
          <Select
            allowClear
            style={{ width: 130 }}
            options={Object.entries(PAY_STATUS_META).map(([value, meta]) => ({
              value: Number(value),
              label: meta.label,
            }))}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button
              type="primary"
              onClick={() => {
                setPageNum(1)
                void fetchList(1, pageSize)
              }}
            >
              查询
            </Button>
            <Button
              onClick={() => {
                searchForm.resetFields()
                setPageNum(1)
                void fetchList(1, pageSize)
              }}
            >
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      {lastPayment && (
        <Alert
          closable
          showIcon
          type="success"
          style={{ marginBottom: 16 }}
          message={`订单 ${lastPayment.orderNo} 支付成功`}
          description={`交易流水号：${lastPayment.transactionNo}${lastPayment.idempotent ? '（幂等重试返回原支付结果）' : ''}`}
          onClose={() => setLastPayment(null)}
        />
      )}

      <Table
        rowKey="orderId"
        columns={columns}
        dataSource={tableData}
        loading={loading}
        pagination={false}
        scroll={{ x: 1250 }}
      />
      {total > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Pagination
            current={pageNum}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            showTotal={(value) => `共 ${value} 条`}
            onChange={(page, size) => {
              setPageNum(page)
              setPageSize(size)
              void fetchList(page, size)
            }}
          />
        </div>
      )}

      <Drawer
        title="订单详情"
        width={640}
        open={Boolean(detail)}
        loading={detailLoading}
        onClose={() => {
          setDetail(null)
          setSearchParams({})
        }}
        extra={detail ? renderActions(detail) : null}
      >
        {detail && (
          <>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="订单号">{detail.orderNo}</Descriptions.Item>
              <Descriptions.Item label="用户ID">{detail.userId}</Descriptions.Item>
              <Descriptions.Item label="总金额">
                {formatAmount(detail.totalPrice)}
              </Descriptions.Item>
              <Descriptions.Item label="支付状态">
                <PayStatusTag status={detail.payStatus} />
              </Descriptions.Item>
              <Descriptions.Item label="支付方式">
                {PAYMENT_TYPE_LABEL[detail.payType]}
              </Descriptions.Item>
              <Descriptions.Item label="支付时间">{detail.payTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <OrderStatusTag status={detail.orderStatus} />
              </Descriptions.Item>
              <Descriptions.Item label="收货人">{detail.userName}</Descriptions.Item>
              <Descriptions.Item label="手机号">{detail.userPhone}</Descriptions.Item>
              <Descriptions.Item label="收货地址">{detail.userAddress}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{detail.createTime}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{detail.updateTime}</Descriptions.Item>
            </Descriptions>
            <Alert
              type="info"
              showIcon
              style={{ marginTop: 16 }}
              message="后端当前未提供订单商品明细查询接口，页面不展示或伪造商品明细。"
            />
          </>
        )}
      </Drawer>

      <Modal
        title={`支付订单 ${payingOrder?.orderNo || ''}`}
        open={Boolean(payingOrder)}
        confirmLoading={paying}
        okText="确认支付"
        okButtonProps={{ disabled: paying }}
        cancelButtonProps={{ disabled: paying }}
        onOk={() => handlePay()}
        onCancel={() => !paying && setPayingOrder(null)}
      >
        <Typography.Paragraph>
          请选择支付方式。支付失败或网络超时后可重试，重试会复用同一幂等键。
        </Typography.Paragraph>
        <Radio.Group
          value={paymentType}
          onChange={(event) => setPaymentType(event.target.value as PayablePaymentType)}
        >
          <Radio value={PaymentType.ALIPAY}>支付宝</Radio>
          <Radio value={PaymentType.WECHAT_PAY}>微信支付</Radio>
        </Radio.Group>
      </Modal>
    </div>
  )
}

export default OrderPage
