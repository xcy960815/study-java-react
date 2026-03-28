import React, { useState, useEffect } from 'react'
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
import { getMenuTree, getAllMenuTree, insertMenu, updateMenu, deleteMenu } from '@/apis/system/menu'
import type { MenuVo, MenuDto, MenuListParams } from '@/apis/system/menu'

const { Option } = Select

type MenuSearchValues = Pick<MenuListParams, 'menuName' | 'menuType'>

type MenuFormValues = MenuDto

type PaginationState = {
  current: number
  pageSize: number
}

/** 将菜单树过滤为仅包含目录类型（menuType === 0）的节点，用于 TreeSelect */
const filterDirTree = (tree: MenuVo[]): MenuVo[] => {
  return tree
    .filter((item) => item.menuType === 0)
    .map((item) => ({
      ...item,
      children: item.children ? filterDirTree(item.children) : undefined,
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

const MenuList: React.FC = () => {
  // 搜索表单
  const [searchForm] = Form.useForm<MenuSearchValues>()

  // 弹窗表单
  const [modalForm] = Form.useForm<MenuFormValues>()

  // 表格数据（树形）
  const [treeData, setTreeData] = useState<MenuVo[]>([])

  // 总数
  const [total, setTotal] = useState(0)

  // 加载状态
  const [loading, setLoading] = useState(false)

  // 分页
  const [pagination, setPagination] = useState<PaginationState>({ current: 1, pageSize: 10 })

  // 父菜单 TreeSelect 数据
  const [parentTreeData, setParentTreeData] = useState<MenuVo[]>([])

  // 弹窗状态
  const [modalVisible, setModalVisible] = useState(false)

  // 弹窗标题
  const [modalTitle, setModalTitle] = useState('新增菜单')

  // 保存加载状态
  const [saveLoading, setSaveLoading] = useState(false)

  useEffect(() => {
    fetchMenuList()
    fetchParentTree()
  }, [])

  // 请求菜单树列表（分页）
  const fetchMenuList = async (page = pagination.current, size = pagination.pageSize) => {
    setLoading(true)
    try {
      const searchValues = searchForm.getFieldsValue()
      const res = await getMenuTree({
        pageNum: page,
        pageSize: size,
        ...searchValues,
      })
      setTreeData(res.data || [])
      setTotal(res.total || 0)
      setPagination({ current: page, pageSize: size })
    } catch (e) {
      console.error('Failed to fetch menu list')
    } finally {
      setLoading(false)
    }
  }

  // 请求父菜单树（全量）
  const fetchParentTree = async () => {
    try {
      const result = await getAllMenuTree()
      setParentTreeData(filterDirTree(result || []))
    } catch (e) {
      console.error('Failed to fetch parent tree')
    }
  }

  // 搜索
  const handleSearch = () => {
    fetchMenuList(1, pagination.pageSize)
  }

  // 重置
  const handleReset = () => {
    searchForm.resetFields()
    fetchMenuList(1, pagination.pageSize)
  }

  // 表格切换
  const handleTableChange = (pag: TablePaginationConfig) => {
    fetchMenuList(pag.current ?? pagination.current, pag.pageSize ?? pagination.pageSize)
  }

  // 新增菜单
  const handleAdd = () => {
    setModalTitle('新增菜单')
    modalForm.resetFields()
    modalForm.setFieldsValue({ menuType: 0, orderNum: 0, parentId: null })
    setModalVisible(true)
  }

  // 编辑菜单
  const handleEdit = (record: MenuVo) => {
    setModalTitle('编辑菜单')
    modalForm.setFieldsValue(record)
    setModalVisible(true)
  }

  // 复制菜单
  const handleCopy = (record: MenuVo) => {
    setModalTitle('复制菜单')
    modalForm.setFieldsValue({ ...record, id: null })
    setModalVisible(true)
  }

  // 创建子菜单
  const handleCreateSub = (record: MenuVo) => {
    setModalTitle('创建子菜单')
    modalForm.resetFields()
    modalForm.setFieldsValue({ menuType: 0, orderNum: 0, parentId: record.id })
    setModalVisible(true)
  }

  // 删除菜单
  const handleDelete = async (record: MenuVo) => {
    try {
      await deleteMenu(record as MenuDto)
      message.success('删除成功')
      fetchMenuList()
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
      if (modalTitle === '新增菜单' || modalTitle === '复制菜单' || modalTitle === '创建子菜单') {
        await insertMenu(payload)
      } else {
        await updateMenu({ ...payload, id })
      }
      message.success('操作成功')
      setModalVisible(false)
      fetchMenuList()
      fetchParentTree()
    } catch (e) {
      console.error('Validation failed', e)
    } finally {
      setSaveLoading(false)
    }
  }

  const columns: TableColumnsType<MenuVo> = [
    { title: '菜单名称', dataIndex: 'menuName', key: 'menuName', width: 150 },
    { title: '菜单路径', dataIndex: 'path', key: 'path', width: 250 },
    { title: '组件路径', dataIndex: 'component', key: 'component', width: 260 },
    { title: '图标', dataIndex: 'icon', key: 'icon', width: 100 },
    {
      title: '类型',
      dataIndex: 'menuType',
      key: 'menuType',
      width: 80,
      render: (menuType) => {
        const map: Record<number, { color: string; label: string }> = {
          0: { color: 'success', label: '目录' },
          1: { color: 'warning', label: '菜单' },
          2: { color: 'default', label: '按钮' },
        }
        const item = map[menuType] || { color: 'default', label: '未知' }
        return <Tag color={item.color}>{item.label}</Tag>
      },
    },
    { title: '权限标识', dataIndex: 'perms', key: 'perms', width: 150 },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 200 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 280,
      render: (_value, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)} className="p-0">
            编辑
          </Button>
          <Button type="link" onClick={() => handleCopy(record)} className="p-0">
            复制
          </Button>
          {record.menuType === 0 && (
            <Button type="link" onClick={() => handleCreateSub(record)} className="p-0">
              创建子菜单
            </Button>
          )}
          <Popconfirm
            title={`确认要删除【${record.menuName}】吗?`}
            onConfirm={() => handleDelete(record)}
          >
            <Button type="link" danger className="p-0">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="system-menu-page">
      <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="menuName" label="菜单名称">
          <Input
            placeholder="请输入菜单名称"
            allowClear
            style={{ width: 200 }}
            onPressEnter={handleSearch}
          />
        </Form.Item>
        <Form.Item name="menuType" label="菜单类型">
          <Select placeholder="菜单类型" style={{ width: 200 }} allowClear>
            <Option value={0}>目录</Option>
            <Option value={1}>菜单</Option>
            <Option value={2}>按钮</Option>
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
          新增菜单
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={treeData}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }}
        bordered
        expandable={{ childrenColumnName: 'children' }}
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
          <Form.Item name="parentId" label="父菜单">
            <TreeSelect
              treeData={buildTreeData(parentTreeData)}
              placeholder="请选择父菜单"
              allowClear
              treeDefaultExpandAll
            />
          </Form.Item>
          <Form.Item
            name="menuName"
            label="菜单名称"
            rules={[{ required: true, message: '请输入菜单名称' }]}
          >
            <Input placeholder="请输入菜单名称" />
          </Form.Item>
          <Form.Item
            name="path"
            label="菜单路径"
            rules={[{ required: true, message: '请输入菜单路径' }]}
          >
            <Input placeholder="请输入菜单路径" />
          </Form.Item>
          <Form.Item
            name="component"
            label="组件路径"
            rules={[{ required: true, message: '请输入组件路径' }]}
          >
            <Input placeholder="请输入组件路径" />
          </Form.Item>
          <Form.Item name="icon" label="菜单图标">
            <Input placeholder="请输入图标名称" />
          </Form.Item>
          <Form.Item
            name="menuType"
            label="菜单类型"
            rules={[{ required: true, message: '请选择菜单类型' }]}
          >
            <Radio.Group>
              <Radio value={0}>目录</Radio>
              <Radio value={1}>菜单</Radio>
              <Radio value={2}>按钮</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="perms" label="权限标识">
            <Input placeholder="请输入权限标识" />
          </Form.Item>
          <Form.Item name="orderNum" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default MenuList
