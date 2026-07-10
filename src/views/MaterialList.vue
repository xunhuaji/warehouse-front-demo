<template>
  <div>
    <el-card shadow="never">
      <el-form :inline="true" :model="query" class="search-form">
        <el-form-item label="名称"><el-input v-model="query.name" clearable @keyup.enter="loadData" /></el-form-item>
        <el-form-item label="编码"><el-input v-model="query.code" clearable @keyup.enter="loadData" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="query.type" clearable placeholder="全部" style="width: 160px">
            <el-option label="药品" value="medicine" />
            <el-option label="器械" value="equipment" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="toolbar">
        <el-button v-if="userStore.hasPermission('material:add')" type="primary" @click="openDialog()">新增物资</el-button>
      </div>
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column prop="code" label="编码" width="100" />
        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 'medicine' ? 'success' : 'warning'" size="small">
              {{ row.type === 'medicine' ? '药品' : '器械' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="spec" label="规格" width="100" />
        <el-table-column prop="quantity" label="库存" width="80">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.quantity <= row.minStock }">{{ row.quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="minStock" label="预警阈值" width="90" />
        <el-table-column prop="price" label="单价" width="90">
          <template #default="{ row }">¥ {{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="location" label="库位" width="100" />
        <el-table-column prop="expiryDate" label="有效期" width="110" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button v-if="userStore.hasPermission('material:edit')" type="primary" link @click="openDialog(row.id)">编辑</el-button>
            <el-button v-if="userStore.hasPermission('material:delete')" type="danger" link @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination v-model:current-page="query.pageNum" v-model:page-size="query.pageSize" :total="total"
          :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next" @change="loadData" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="名称" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="编码" prop="code"><el-input v-model="form.code" /></el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" style="width:100%">
            <el-option label="药品" value="medicine" /><el-option label="器械" value="equipment" />
          </el-select>
        </el-form-item>
        <el-form-item label="规格"><el-input v-model="form.spec" /></el-form-item>
        <el-form-item label="单位"><el-input v-model="form.unit" /></el-form-item>
        <el-form-item label="库存"><el-input-number v-model="form.quantity" :min="0" style="width:100%" /></el-form-item>
        <el-form-item label="预警阈值"><el-input-number v-model="form.minStock" :min="0" style="width:100%" /></el-form-item>
        <el-form-item label="单价"><el-input-number v-model="form.price" :min="0" :precision="2" style="width:100%" /></el-form-item>
        <el-form-item label="库位"><el-input v-model="form.location" /></el-form-item>
        <el-form-item v-if="form.type === 'medicine'" label="有效期">
          <el-date-picker v-model="form.expiryDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="供应商"><el-input v-model="form.supplier" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
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
import { addMaterial, deleteMaterial, getMaterialById, getMaterialPage, updateMaterial } from '@/api/material'

const userStore = useUserStore()
const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref('新增物资')
const formRef = ref()
const query = reactive({ name: '', code: '', type: '', pageNum: 1, pageSize: 10 })
const defaultForm = () => ({ id: null, name: '', code: '', type: 'medicine', spec: '', unit: '件', quantity: 0, minStock: 10, price: 0, location: '', expiryDate: null, supplier: '', description: '' })
const form = reactive(defaultForm())
const rules = { name: [{ required: true, message: '请输入名称', trigger: 'blur' }], code: [{ required: true, message: '请输入编码', trigger: 'blur' }], type: [{ required: true, message: '请选择类型', trigger: 'change' }] }

const loadData = async () => {
  loading.value = true
  try { const res = await getMaterialPage({ ...query }); tableData.value = res.data.list; total.value = res.data.total } finally { loading.value = false }
}
const resetQuery = () => { query.name = ''; query.code = ''; query.type = ''; query.pageNum = 1; loadData() }
const openDialog = async (id) => {
  Object.assign(form, defaultForm())
  if (id) { dialogTitle.value = '编辑物资'; const res = await getMaterialById(id); Object.assign(form, res.data) }
  else dialogTitle.value = '新增物资'
  dialogVisible.value = true
}
const handleSubmit = async () => {
  await formRef.value.validate(); submitLoading.value = true
  try {
    if (form.id) { await updateMaterial({ ...form }); ElMessage.success('修改成功') }
    else { await addMaterial({ ...form }); ElMessage.success('新增成功') }
    dialogVisible.value = false; loadData()
  } finally { submitLoading.value = false }
}
const handleDelete = async (id) => {
  await ElMessageBox.confirm('确定删除该物资吗？', '提示', { type: 'warning' })
  await deleteMaterial(id); ElMessage.success('删除成功'); loadData()
}
onMounted(loadData)
</script>

<style scoped>
.search-form { margin-bottom: 8px; }
.toolbar { margin-bottom: 16px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.text-danger { color: #f56c6c; font-weight: 600; }
</style>
