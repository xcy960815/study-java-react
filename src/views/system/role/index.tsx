import React, { useCallback, useEffect, useState } from 'react'
import {
  Form,
  Input,
  Select,
  Button,
  Table,
  Space,
  Tag,
  Modal,
  Popconfirm,
  InputNumber,
  Radio,
  TreeSelect,
  message,
} from 'antd'
import type { TableColumnsType, TablePaginationConfig } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import {
  getRoleList,
  insertRole,
  updateRole,
  deleteRole,
  disableRole,
  enableRole,
} from '@/apis/system/role'
import type { RoleInfoVo, RoleInfoDto, RoleListParams } from '@/apis/system/role'
import { getAllMenuTree } from '@/apis/system/menu'
import type { MenuVo } from '@/apis/system/menu'

const { Option } = Select

type RoleSearchValues = Pick<RoleListParams, 'roleName' | 'roleCode' | 'status'>

type RoleFormValues = RoleInfoDto

type PaginationState = {
  current: number
  pageSize: number
}

/** 将菜单树过滤为仅包含目录类型（menuType === 0）的节点 */
const filterMenuTree = (tree: MenuVo[]): MenuVo[] => {
  return tree
    .filter((item) => item.menuType === 0)
    .map((item) => ({
      ...item,
      children: item.children ? filterMenuTree(item.children) : undefined,
    }))
}

interface TreeNode {
  title: string
  value: number
  children?: TreeNode[]
}

/** 将 MenuVo[] 转为 TreeSelect 需要的 treeData 格式 */
const buildTreeData = (tree: MenuVo[]): TreeNode[] => {
  return tree.map((item) => ({
    title: item.menuName,
    value: item.id,
    children: item.children?.length ? buildTreeData(item.children) : undefined,
  }))
}

const RoleList: React.FC = () => {
  const defaultPageSize = 10
  // 搜索表单
  const [searchForm] = Form.useForm<RoleSearchValues>()

  // 弹窗表单
  const [modalForm] = Form.useForm<RoleFormValues>()

  // 表格数据
  const [tableData, setTableData] = useState<RoleInfoVo[]>([])

  // 总数
  const [total, setTotal] = useState(0)

  // 加载状态
  const [loading, setLoading] = useState(false)

  // 分页
  const [pagination, setPagination] = useState<PaginationState>({ current: 1, pageSize: 10 })

  // 菜单树数据
  const [menuTreeData, setMenuTreeData] = useState<MenuVo[]>([])

  // 弹窗状态
  const [modalVisible, setModalVisible] = useState(false)

  // 弹窗标题
  const [modalTitle, setModalTitle] = useState('新增角色')

  // 保存加载状态
  const [saveLoading, setSaveLoading] = useState(false)

  // 请求菜单树
  const fetchMenuTree = useCallback(async () => {
    try {
      const result = await getAllMenuTree()
      setMenuTreeData(filterMenuTree(result || []))
    } catch {
      message.error('获取菜单树失败，请稍后重试。')
    }
  }, [])

  // 请求角色列表
  const fetchRoleList = useCallback(
    async (page: number, size: number) => {
      setLoading(true)
      try {
        const searchValues = searchForm.getFieldsValue()
        const res = await getRoleList({
          pageNum: page,
          pageSize: size,
          ...searchValues,
        })
        setTableData(res.data || [])
        setTotal(res.total || 0)
        setPagination({ current: page, pageSize: size })
      } catch {
        message.error('获取角色列表失败，请稍后重试。')
      } finally {
        setLoading(false)
      }
    },
    [searchForm]
  )

  useEffect(() => {
    void fetchMenuTree()
    void fetchRoleList(1, defaultPageSize)
  }, [fetchMenuTree, fetchRoleList])

  // 搜索
  const handleSearch = () => {
    void fetchRoleList(1, pagination.pageSize)
  }

  // 重置
  const handleReset = () => {
    searchForm.resetFields()
    void fetchRoleList(1, pagination.pageSize)
  }

  // 表格切换
  const handleTableChange = (pag: TablePaginationConfig) => {
    void fetchRoleList(pag.current ?? pagination.current, pag.pageSize ?? pagination.pageSize)
  }

  // 新增角色
  const handleAdd = () => {
    setModalTitle('新增角色')
    modalForm.resetFields()
    modalForm.setFieldsValue({ roleSort: 0, status: 1 })
    setModalVisible(true)
  }

  // 编辑角色
  const handleEdit = (record: RoleInfoVo) => {
    setModalTitle('编辑角色')
    modalForm.setFieldsValue(record)
    setModalVisible(true)
  }

  // 删除角色
  const handleDelete = async (record: RoleInfoVo) => {
    try {
      await deleteRole(record)
      message.success('删除成功')
      await fetchRoleList(pagination.current, pagination.pageSize)
    } catch {
      message.error('删除角色失败，请稍后重试。')
    }
  }

  // 禁用角色
  const handleDisable = async (record: RoleInfoVo) => {
    try {
      await disableRole(record)
      message.success('操作成功')
      await fetchRoleList(pagination.current, pagination.pageSize)
    } catch {
      message.error('禁用角色失败，请稍后重试。')
    }
  }

  // 启用角色
  const handleEnable = async (record: RoleInfoVo) => {
    try {
      await enableRole(record)
      message.success('操作成功')
      await fetchRoleList(pagination.current, pagination.pageSize)
    } catch {
      message.error('启用角色失败，请稍后重试。')
    }
  }

  // 弹窗确认
  const handleModalOk = async () => {
    try {
      const values = await modalForm.validateFields()
      setSaveLoading(true)
      const { id, ...payload } = values
      if (modalTitle === '新增角色') {
        await insertRole(payload)
        message.success('新增成功')
      } else {
        await updateRole({ ...payload, id })
        message.success('修改成功')
      }
      setModalVisible(false)
      await fetchRoleList(pagination.current, pagination.pageSize)
    } catch (error) {
      console.error('Validation failed', error)
    } finally {
      setSaveLoading(false)
    }
  }

  const columns: TableColumnsType<RoleInfoVo> = [
    { title: '角色名称', dataIndex: 'roleName', key: 'roleName', width: 150 },
    { title: '角色编码', dataIndex: 'roleCode', key: 'roleCode', width: 150 },
    { title: '显示顺序', dataIndex: 'roleSort', key: 'roleSort', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={status === 1 ? 'success' : 'error'}>{status === 1 ? '正常' : '停用'}</Tag>
      ),
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 250 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 200 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 200,
      render: (_value, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)} className="p-0">
            编辑
          </Button>
          <Popconfirm
            title={`确认要删除角色【${record.roleName}】吗?`}
            onConfirm={() => handleDelete(record)}
          >
            <Button type="link" danger className="p-0">
              删除
            </Button>
          </Popconfirm>
          {record.status === 1 ? (
            <Popconfirm
              title={`确认要禁用角色【${record.roleName}】吗?`}
              onConfirm={() => handleDisable(record)}
            >
              <Button type="link" danger className="p-0">
                禁用
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm
              title={`确认要启用角色【${record.roleName}】吗?`}
              onConfirm={() => handleEnable(record)}
            >
              <Button type="link" className="p-0">
                启用
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="system-role-page">
      <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="roleName" label="角色名称">
          <Input
            placeholder="请输入角色名称"
            allowClear
            style={{ width: 200 }}
            onPressEnter={handleSearch}
          />
        </Form.Item>
        <Form.Item name="roleCode" label="角色编码">
          <Input
            placeholder="请输入角色编码"
            allowClear
            style={{ width: 200 }}
            onPressEnter={handleSearch}
          />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select placeholder="请选择状态" style={{ width: 200 }} allowClear>
            <Option value={1}>正常</Option>
            <Option value={0}>停用</Option>
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
          新增角色
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
          total,
          showSizeChanger: true,
          defaultPageSize,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条`,
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
            name="roleName"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item
            name="roleCode"
            label="角色编码"
            rules={[{ required: true, message: '请输入角色编码' }]}
          >
            <Input
              placeholder="请输入角色编码"
              disabled={modalTitle === '编辑角色' && !!modalForm.getFieldValue('id')}
            />
          </Form.Item>
          <Form.Item
            name="roleSort"
            label="显示顺序"
            rules={[{ required: true, message: '请输入显示顺序' }]}
          >
            <InputNumber min={0} max={999} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Radio.Group>
              <Radio value={1}>正常</Radio>
              <Radio value={0}>停用</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="menuIds" label="菜单权限">
            <TreeSelect
              treeData={buildTreeData(menuTreeData)}
              treeCheckable
              treeCheckStrictly
              placeholder="请选择菜单权限"
              allowClear
              showCheckedStrategy={TreeSelect.SHOW_ALL}
            />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea placeholder="请输入备注" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default RoleList
