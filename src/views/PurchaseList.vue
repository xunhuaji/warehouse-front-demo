<template>
  <div>
    <el-card shadow="never">
      <el-form :inline="true" :model="query">
        <el-form-item label="物资名称"><el-input v-model="query.materialName" clearable /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="query.materialType" clearable placeholder="全部" style="width: 160px">
            <el-option label="药品" value="medicine" /><el-option label="器械" value="equipment" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button v-if="userStore.hasPermission('purchase:add')" type="success" @click="openDialog">登记采购</el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="materialName" label="物资名称" min-width="120" />
        <el-table-column prop="materialType" label="类型" width="80">
          <template #default="{ row }">{{ row.materialType === 'medicine' ? '药品' : '器械' }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="采购数量" width="90" />
        <el-table-column prop="unitPrice" label="单价" width="90">
          <template #default="{ row }">¥ {{ row.unitPrice }}</template>
        </el-table-column>
        <el-table-column prop="totalPrice" label="总价" width="100">
          <template #default="{ row }">¥ {{ row.totalPrice }}</template>
        </el-table-column>
        <el-table-column prop="supplier" label="供应商" width="120" />
        <el-table-column prop="purchaser" label="采购人" width="90" />
        <el-table-column prop="purchaseDate" label="采购日期" width="110" />
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
      </el-table>
      <div class="pagination">
        <el-pagination v-model:current-page="query.pageNum" v-model:page-size="query.pageSize" :total="total"
          layout="total, prev, pager, next" @change="loadData" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="登记采购" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="采购物资" prop="materialId">
          <el-select v-model="form.materialId" filterable placeholder="选择物资" style="width:100%" @change="onMaterialChange">
            <el-option v-for="m in materials" :key="m.id" :label="`${m.name} (${m.code})`" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="采购数量" prop="quantity">
          <el-input-number v-model="form.quantity" :min="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="单价"><el-input-number v-model="form.unitPrice" :min="0" :precision="2" style="width:100%" /></el-form-item>
        <el-form-item label="供应商"><el-input v-model="form.supplier" /></el-form-item>
        <el-form-item label="采购日期" prop="purchaseDate">
          <el-date-picker v-model="form.purchaseDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
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
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { getMaterialPage } from '@/api/material'
import { addPurchase, getPurchasePage } from '@/api/purchase'

const userStore = useUserStore()
const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])
const total = ref(0)
const materials = ref([])
const dialogVisible = ref(false)
const formRef = ref()
const query = reactive({ materialName: '', materialType: '', pageNum: 1, pageSize: 10 })
const form = reactive({ materialId: null, quantity: 1, unitPrice: 0, supplier: '', purchaseDate: '', remark: '' })
const rules = {
  materialId: [{ required: true, message: '请选择物资', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  purchaseDate: [{ required: true, message: '请选择日期', trigger: 'change' }]
}

const loadData = async () => {
  loading.value = true
  try { const res = await getPurchasePage({ ...query }); tableData.value = res.data.list; total.value = res.data.total } finally { loading.value = false }
}
const loadMaterials = async () => {
  const res = await getMaterialPage({ pageNum: 1, pageSize: 200 })
  materials.value = res.data.list
}
const onMaterialChange = (id) => {
  const m = materials.value.find(i => i.id === id)
  if (m) { form.unitPrice = m.price; form.supplier = m.supplier || '' }
}
const openDialog = () => { Object.assign(form, { materialId: null, quantity: 1, unitPrice: 0, supplier: '', purchaseDate: '', remark: '' }); dialogVisible.value = true }
const handleSubmit = async () => {
  await formRef.value.validate(); submitLoading.value = true
  try { await addPurchase({ ...form }); ElMessage.success('采购登记成功，库存已更新'); dialogVisible.value = false; loadData() }
  finally { submitLoading.value = false }
}
onMounted(() => { loadData(); loadMaterials() })
</script>

<style scoped>
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
