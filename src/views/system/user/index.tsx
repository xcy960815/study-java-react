import React, { useState, useEffect } from 'react'
import { Form, Input, Select, Button, Table, Space, Tag, Modal, Popconfirm, message } from 'antd'
import type { TableColumnsType, TablePaginationConfig } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { getUserList, insertUser, updateUser, deleteUser } from '@/apis/system/user'
import type { UserInfoVo, UserListParams } from '@/apis/system/user'
import { getAllRoleList } from '@/apis/system/role'
import type { RoleInfoVo } from '@/apis/system/role'

const { Option } = Select

type UserSearchValues = Pick<UserListParams, 'nickName' | 'loginName' | 'roleIds'>

type UserFormValues = Partial<UserInfoVo>

type PaginationState = {
  current: number
  pageSize: number
}

const UserList: React.FC = () => {
  // 表单
  const [searchForm] = Form.useForm<UserSearchValues>()

  // 弹窗表单
  const [modalForm] = Form.useForm<UserFormValues>()

  // 表格数据
  const [tableData, setTableData] = useState<UserInfoVo[]>([])

  // 总数
  const [total, setTotal] = useState(0)

  // 加载状态
  const [loading, setLoading] = useState(false)

  // 分页
  const [pagination, setPagination] = useState<PaginationState>({ current: 1, pageSize: 10 })

  // 角色列表
  const [roleList, setRoleList] = useState<RoleInfoVo[]>([])

  // 弹窗状态
  const [modalVisible, setModalVisible] = useState(false)

  // 弹窗标题
  const [modalTitle, setModalTitle] = useState('新增用户')

  // 保存加载状态
  const [saveLoading, setSaveLoading] = useState(false)

  useEffect(() => {
    fetchRoleList()
    fetchUserList()
  }, [])

  // 请求角色列表
  const fetchRoleList = async () => {
    try {
      const roles = await getAllRoleList()
      setRoleList(roles || [])
    } catch (e) {
      console.error('Failed to fetch roles')
    }
  }

  // 请求用户列表
  const fetchUserList = async (page = pagination.current, size = pagination.pageSize) => {
    setLoading(true)
    try {
      const searchValues = searchForm.getFieldsValue()
      const res = await getUserList({
        pageNum: page,
        pageSize: size,
        ...searchValues,
      })
      setTableData(res.data || [])
      setTotal(res.total || 0)
      setPagination({ current: page, pageSize: size })
    } catch (e) {
      console.error('Failed to fetch user list')
    } finally {
      setLoading(false)
    }
  }

  // 搜索
  const handleSearch = () => {
    fetchUserList(1, pagination.pageSize)
  }

  // 重置
  const handleReset = () => {
    searchForm.resetFields()
    fetchUserList(1, pagination.pageSize)
  }

  // 表格切换
  const handleTableChange = (pag: TablePaginationConfig) => {
    fetchUserList(pag.current ?? pagination.current, pag.pageSize ?? pagination.pageSize)
  }

  const handleAdd = () => {
    setModalTitle('新增用户')
    modalForm.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: UserInfoVo) => {
    setModalTitle('编辑用户')
    modalForm.setFieldsValue({
      ...record,
      // Default mappings if necessary
    })
    setModalVisible(true)
  }

  // 删除用户
  const handleDelete = async (record: UserInfoVo) => {
    try {
      await deleteUser(record)
      message.success('删除成功')
      fetchUserList()
    } catch (e) {
      console.error('Failed to delete')
    }
  }

  // 弹窗确认
  const handleModalOk = async () => {
    try {
      const values = await modalForm.validateFields()
      setSaveLoading(true)
      const { id, ...payload } = values
      if (modalTitle === '新增用户') {
        await insertUser(payload)
        message.success('新增成功')
      } else {
        await updateUser({ ...payload, id })
        message.success('修改成功')
      }
      setModalVisible(false)
      fetchUserList()
    } catch (e) {
      console.error('Validation failed', e)
    } finally {
      setSaveLoading(false)
    }
  }

  const columns: TableColumnsType<UserInfoVo> = [
    { title: '用户昵称', dataIndex: 'nickName', key: 'nickName' },
    { title: '用户年龄', dataIndex: 'age', key: 'age' },
    { title: '登陆账号', dataIndex: 'loginName', key: 'loginName' },
    {
      title: '角色',
      dataIndex: 'roleNames',
      key: 'roleNames',
      render: (roleNames) => (
        <>
          {roleNames?.map((role: string) => (
            <Tag color="blue" key={role}>
              {role}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: '角色编码',
      dataIndex: 'roleCodes',
      key: 'roleCodes',
      render: (roleCodes) => (
        <>
          {roleCodes?.map((code: string) => (
            <Tag color="cyan" key={code}>
              {code}
            </Tag>
          ))}
        </>
      ),
    },
    { title: '个性签名', dataIndex: 'introduceSign', key: 'introduceSign' },
    { title: '收货地址', dataIndex: 'address', key: 'address' },
    { title: '注册时间', dataIndex: 'createTime', key: 'createTime' },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 150,
      render: (_value, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)} className="p-0">
            编辑
          </Button>
          <Popconfirm title="确认要删除该用户吗?" onConfirm={() => handleDelete(record)}>
            <Button type="link" danger className="p-0">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="user-page">
      <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="nickName" label="用户昵称">
          <Input
            placeholder="请输入用户昵称"
            allowClear
            style={{ width: 200 }}
            onPressEnter={handleSearch}
          />
        </Form.Item>
        <Form.Item name="loginName" label="登陆账号">
          <Input
            placeholder="请输入登陆账号"
            allowClear
            style={{ width: 200 }}
            onPressEnter={handleSearch}
          />
        </Form.Item>
        <Form.Item name="roleIds" label="角色">
          <Select placeholder="请选择角色" mode="multiple" style={{ width: 200 }} allowClear>
            {roleList.map((role) => (
              <Option key={role.id} value={role.id}>
                {role.roleName}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" onClick={handleSearch}>
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增用户
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={tableData}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }}
        bordered
      />

      <Modal
        title={modalTitle}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        confirmLoading={saveLoading}
        width={600}
      >
        <Form form={modalForm} layout="vertical">
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="nickName"
            label="用户昵称"
            rules={[{ required: true, message: '请输入用户昵称' }]}
          >
            <Input placeholder="请输入用户昵称" />
          </Form.Item>
          <Form.Item
            name="loginName"
            label="登陆账号"
            rules={[{ required: true, message: '请输入登陆账号' }]}
          >
            <Input placeholder="请输入登陆账号" />
          </Form.Item>
          <Form.Item
            name="roleIds"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色" mode="multiple" allowClear>
              {roleList.map((role) => (
                <Option key={role.id} value={role.id}>
                  {role.roleName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="introduceSign"
            label="个性签名"
            rules={[{ required: true, message: '请输入个性签名' }]}
          >
            <Input placeholder="请输入个性签名" />
          </Form.Item>
          <Form.Item
            name="address"
            label="收货地址"
            rules={[{ required: true, message: '请输入收货地址' }]}
          >
            <Input placeholder="请输入收货地址" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UserList
