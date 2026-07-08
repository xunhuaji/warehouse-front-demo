<template>
  <div>
    <el-card shadow="never">
      <el-form :inline="true" :model="query">
        <el-form-item label="物资名称"><el-input v-model="query.materialName" clearable /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部">
            <el-option label="待审批" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请人"><el-input v-model="query.applicant" clearable /></el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button v-if="userStore.hasPermission('usage:apply')" type="success" @click="openApply">申请领用</el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="materialName" label="物资" min-width="120" />
        <el-table-column prop="materialType" label="类型" width="80">
          <template #default="{ row }">{{ row.materialType === 'medicine' ? '药品' : '器械' }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="70" />
        <el-table-column prop="applicant" label="申请人" width="90" />
        <el-table-column prop="applyReason" label="领用原因" min-width="140" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="approver" label="审批人" width="90" />
        <el-table-column prop="approveRemark" label="审批意见" min-width="120" show-overflow-tooltip />
        <el-table-column prop="createTime" label="申请时间" width="160" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending' && userStore.hasPermission('usage:approve')">
              <el-button type="success" link @click="handleApprove(row.id, true)">通过</el-button>
              <el-button type="danger" link @click="handleApprove(row.id, false)">驳回</el-button>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination v-model:current-page="query.pageNum" v-model:page-size="query.pageSize" :total="total"
          layout="total, prev, pager, next" @change="loadData" />
      </div>
    </el-card>

    <el-dialog v-model="applyVisible" title="申请领用" width="500px" destroy-on-close>
      <el-form ref="applyFormRef" :model="applyForm" :rules="applyRules" label-width="90px">
        <el-form-item label="领用物资" prop="materialId">
          <el-select v-model="applyForm.materialId" filterable placeholder="选择物资" style="width:100%">
            <el-option v-for="m in materials" :key="m.id" :label="`${m.name} (库存:${m.quantity})`" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="领用数量" prop="quantity">
          <el-input-number v-model="applyForm.quantity" :min="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="领用原因" prop="applyReason">
          <el-input v-model="applyForm.applyReason" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applyVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleApply">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/user'
import { getMaterialPage } from '@/api/material'
import { applyUsage, approveUsage, getUsagePage } from '@/api/usage'

const userStore = useUserStore()
const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])
const total = ref(0)
const materials = ref([])
const applyVisible = ref(false)
const applyFormRef = ref()
const query = reactive({ materialName: '', status: '', applicant: '', pageNum: 1, pageSize: 10 })
const applyForm = reactive({ materialId: null, quantity: 1, applyReason: '' })
const applyRules = {
  materialId: [{ required: true, message: '请选择物资', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  applyReason: [{ required: true, message: '请填写领用原因', trigger: 'blur' }]
}

const statusText = (s) => ({ pending: '待审批', approved: '已通过', rejected: '已驳回' }[s] || s)
const statusType = (s) => ({ pending: 'warning', approved: 'success', rejected: 'danger' }[s] || 'info')

const loadData = async () => {
  loading.value = true
  try { const res = await getUsagePage({ ...query }); tableData.value = res.data.list; total.value = res.data.total } finally { loading.value = false }
}
const loadMaterials = async () => {
  const res = await getMaterialPage({ pageNum: 1, pageSize: 200 })
  materials.value = res.data.list
}
const openApply = () => { Object.assign(applyForm, { materialId: null, quantity: 1, applyReason: '' }); applyVisible.value = true }
const handleApply = async () => {
  await applyFormRef.value.validate(); submitLoading.value = true
  try { await applyUsage({ ...applyForm }); ElMessage.success('申请已提交'); applyVisible.value = false; loadData() }
  finally { submitLoading.value = false }
}
const handleApprove = async (id, approved) => {
  const action = approved ? '通过' : '驳回'
  try {
    const { value } = await ElMessageBox.prompt(`请输入审批意见（${action}）`, '审批', { inputPlaceholder: '选填' })
    await approveUsage({ id, approved, approveRemark: value || '' })
    ElMessage.success(`已${action}`)
    loadData()
  } catch { /* cancelled */ }
}
onMounted(() => { loadData(); loadMaterials() })
</script>

<style scoped>
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
