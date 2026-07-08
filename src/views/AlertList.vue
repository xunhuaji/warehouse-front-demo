<template>
  <div>
    <el-card shadow="never">
      <el-alert title="以下物资库存已低于预警阈值，请及时补货" type="warning" show-icon :closable="false" style="margin-bottom:16px" />
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="name" label="物资名称" min-width="120" />
        <el-table-column prop="code" label="编码" width="100" />
        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 'medicine' ? 'success' : 'warning'" size="small">
              {{ row.type === 'medicine' ? '药品' : '器械' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="当前库存" width="100">
          <template #default="{ row }">
            <span class="text-danger">{{ row.quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="minStock" label="预警阈值" width="100" />
        <el-table-column label="缺口" width="80">
          <template #default="{ row }">
            <span class="text-danger">{{ Math.max(row.minStock - row.quantity, 0) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="库位" width="100" />
        <el-table-column prop="supplier" label="供应商" width="120" />
        <el-table-column prop="expiryDate" label="有效期" width="110">
          <template #default="{ row }">
            <span v-if="row.expiryDate" :class="{ 'text-danger': isExpiringSoon(row.expiryDate) }">{{ row.expiryDate }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="预警级别" width="100">
          <template #default="{ row }">
            <el-tag type="danger" size="small">{{ row.quantity === 0 ? '缺货' : '低库存' }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !tableData.length" description="暂无库存预警，物资充足" />
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getMaterialAlerts } from '@/api/material'

const loading = ref(false)
const tableData = ref([])

const isExpiringSoon = (date) => {
  const d = new Date(date)
  const now = new Date()
  const diff = (d - now) / (1000 * 60 * 60 * 24)
  return diff <= 90
}

const loadData = async () => {
  loading.value = true
  try { const res = await getMaterialAlerts(); tableData.value = res.data } finally { loading.value = false }
}
onMounted(loadData)
</script>

<style scoped>
.text-danger { color: #f56c6c; font-weight: 600; }
</style>
