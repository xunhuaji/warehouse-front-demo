<template>
  <div class="product-page">
    <el-card shadow="never">
      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="商品名称">
          <el-input v-model="query.name" placeholder="模糊搜索" clearable @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item label="商品编码">
          <el-input v-model="query.code" placeholder="模糊搜索" clearable @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="query.category" placeholder="模糊搜索" clearable @keyup.enter="loadData" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <el-button
          v-if="userStore.hasPermission('product:add')"
          type="primary"
          @click="openDialog()"
        >
          新增商品
        </el-button>
        <el-button
          v-if="userStore.hasPermission('product:delete')"
          type="danger"
          :disabled="!selectedIds.length"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="userStore.hasPermission('product:delete')" type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="商品名称" min-width="120" />
        <el-table-column prop="code" label="商品编码" min-width="100" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="quantity" label="库存" width="80" />
        <el-table-column prop="price" label="单价" width="100">
          <template #default="{ row }">¥ {{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="location" label="库位" width="100" />
        <el-table-column prop="description" label="描述" min-width="140" show-overflow-tooltip />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="userStore.hasPermission('product:edit')"
              type="primary"
              link
              @click="openDialog(row.id)"
            >
              编辑
            </el-button>
            <el-button
              v-if="userStore.hasPermission('product:delete')"
              type="danger"
              link
              @click="handleDelete(row.id)"
            >
              删除
            </el-button>
            <span v-if="!userStore.hasPermission('product:edit') && !userStore.hasPermission('product:delete')">-</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="商品编码" prop="code">
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-input v-model="form.category" />
        </el-form-item>
        <el-form-item label="库存数量" prop="quantity">
          <el-input-number v-model="form.quantity" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="单价" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="库位" prop="location">
          <el-input v-model="form.location" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/user'
import {
  addProduct,
  deleteProduct,
  deleteProductBatch,
  getProductById,
  getProductPage,
  updateProduct
} from '@/api/product'

const userStore = useUserStore()
const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])
const total = ref(0)
const selectedIds = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增商品')
const formRef = ref()

const query = reactive({
  name: '',
  code: '',
  category: '',
  pageNum: 1,
  pageSize: 10
})

const defaultForm = () => ({
  id: null,
  name: '',
  code: '',
  category: '',
  quantity: 0,
  price: 0,
  location: '',
  description: ''
})

const form = reactive(defaultForm())

const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入商品编码', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入库存数量', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getProductPage({ ...query })
    tableData.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  query.name = ''
  query.code = ''
  query.category = ''
  query.pageNum = 1
  loadData()
}

const handleSelectionChange = (rows) => {
  selectedIds.value = rows.map((item) => item.id)
}

const openDialog = async (id) => {
  Object.assign(form, defaultForm())
  if (id) {
    dialogTitle.value = '编辑商品'
    const res = await getProductById(id)
    Object.assign(form, res.data)
  } else {
    dialogTitle.value = '新增商品'
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    if (form.id) {
      await updateProduct({ ...form })
      ElMessage.success('修改成功')
    } else {
      await addProduct({ ...form })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (id) => {
  await ElMessageBox.confirm('确定删除该商品吗？', '提示', { type: 'warning' })
  await deleteProduct(id)
  ElMessage.success('删除成功')
  loadData()
}

const handleBatchDelete = async () => {
  await ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 条数据吗？`, '提示', { type: 'warning' })
  await deleteProductBatch(selectedIds.value)
  ElMessage.success('批量删除成功')
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.search-form {
  margin-bottom: 8px;
}

.toolbar {
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
