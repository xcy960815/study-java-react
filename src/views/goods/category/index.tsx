import { useCallback, useEffect, useState } from 'react'
import { Button, Form, Input, InputNumber, Modal, Space, Table, TreeSelect, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  deleteGoodsCategory,
  getGoodsCategoryTree,
  insertGoodsCategory,
  updateGoodsCategory,
  type GoodsCategoryDto,
  type GoodsCategoryVo,
} from '@/apis/goods'
import { useLoginStore } from '@/store'
import { hasPermission } from '@/utils/permission'

interface CategoryTreeNode {
  title: string
  value: number
  children?: CategoryTreeNode[]
}

const toTreeData = (nodes: GoodsCategoryVo[]): CategoryTreeNode[] =>
  nodes.map((node) => ({
    title: node.categoryName,
    value: node.categoryId,
    children: node.children?.length ? toTreeData(node.children) : undefined,
  }))

const excludeCategory = (nodes: GoodsCategoryVo[], categoryId?: number): GoodsCategoryVo[] =>
  nodes
    .filter((node) => node.categoryId !== categoryId)
    .map((node) => ({
      ...node,
      children: node.children ? excludeCategory(node.children, categoryId) : undefined,
    }))

const GoodsCategoryPage = () => {
  const [form] = Form.useForm<GoodsCategoryDto>()
  const permissions = useLoginStore((state) => state.user?.permissions)
  const canAdd = hasPermission(permissions, 'goods:add')
  const canEdit = hasPermission(permissions, 'goods:edit')
  const canRemove = hasPermission(permissions, 'goods:remove')
  const [tree, setTree] = useState<GoodsCategoryVo[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<GoodsCategoryVo | null>(null)

  const loadTree = useCallback(async () => {
    setLoading(true)
    try {
      setTree(await getGoodsCategoryTree())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTree().catch(() => undefined)
  }, [loadTree])

  const openCreate = (parent?: GoodsCategoryVo) => {
    setEditing(null)
    form.setFieldsValue({
      parentId: parent?.categoryId ?? 0,
      categoryName: '',
      orderNum: 0,
    })
    setOpen(true)
  }

  const openEdit = (row: GoodsCategoryVo) => {
    setEditing(row)
    form.setFieldsValue({
      categoryId: row.categoryId,
      parentId: row.parentId,
      categoryName: row.categoryName,
      orderNum: row.orderNum,
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    if (editing) {
      await updateGoodsCategory({ ...values, categoryId: editing.categoryId })
      message.success('更新成功')
    } else {
      await insertGoodsCategory(values)
      message.success('新增成功')
    }
    setOpen(false)
    await loadTree()
  }

  const handleDelete = (row: GoodsCategoryVo) => {
    Modal.confirm({
      title: `确认删除分类「${row.categoryName}」？`,
      onOk: async () => {
        await deleteGoodsCategory(row.categoryId)
        message.success('删除成功')
        await loadTree()
      },
    })
  }

  const columns: ColumnsType<GoodsCategoryVo> = [
    { title: '分类名称', dataIndex: 'categoryName' },
    { title: '层级', dataIndex: 'categoryLevel', width: 80, align: 'center' },
    { title: '排序', dataIndex: 'orderNum', width: 80, align: 'center' },
    {
      title: '操作',
      width: 220,
      align: 'center',
      render: (_, row) => (
        <Space>
          {canAdd && (
            <Button type="link" size="small" onClick={() => openCreate(row)}>
              新增下级
            </Button>
          )}
          {canEdit && (
            <Button type="link" size="small" onClick={() => openEdit(row)}>
              编辑
            </Button>
          )}
          {canRemove && (
            <Button type="link" size="small" danger onClick={() => handleDelete(row)}>
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const parentTree = toTreeData([
    {
      categoryId: 0,
      parentId: 0,
      categoryName: '顶级分类',
      categoryLevel: 0,
      orderNum: 0,
      children: excludeCategory(tree, editing?.categoryId),
    },
  ])

  return (
    <div style={{ padding: 16 }}>
      {canAdd && (
        <Button type="primary" onClick={() => openCreate()} style={{ marginBottom: 16 }}>
          新增分类
        </Button>
      )}
      <Table
        key={tree.map((item) => item.categoryId).join(',')}
        rowKey="categoryId"
        columns={columns}
        dataSource={tree}
        loading={loading}
        pagination={false}
        defaultExpandAllRows
      />
      <Modal
        title={editing ? '编辑分类' : '新增分类'}
        open={open}
        onOk={() => void handleSubmit()}
        onCancel={() => setOpen(false)}
        destroyOnHidden
      >
        <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
          <Form.Item
            name="categoryName"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input maxLength={50} placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item
            name="parentId"
            label="上级分类"
            rules={[{ required: true, message: '请选择上级分类' }]}
          >
            <TreeSelect treeData={parentTree} treeDefaultExpandAll placeholder="顶级分类" />
          </Form.Item>
          <Form.Item name="orderNum" label="排序">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default GoodsCategoryPage
