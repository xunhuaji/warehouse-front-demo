<template>
  <div>
    <el-card shadow="never">
      <el-form :inline="true" :model="query">
        <el-form-item label="老人姓名"><el-input v-model="query.elderName" clearable /></el-form-item>
        <el-form-item label="账单月份">
          <el-date-picker v-model="query.billMonth" type="month" value-format="YYYY-MM" placeholder="选择月份" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="elderName" label="老人姓名" width="100" />
        <el-table-column prop="billMonth" label="账单月份" width="100" />
        <el-table-column prop="amount" label="缴费金额" width="110">
          <template #default="{ row }">¥ {{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" width="110" />
        <el-table-column prop="operator" label="操作人" width="100" />
        <el-table-column prop="remark" label="备注" min-width="120" />
        <el-table-column prop="payTime" label="缴费时间" width="160" />
      </el-table>
      <div class="pagination">
        <el-pagination v-model:current-page="query.pageNum" v-model:page-size="query.pageSize" :total="total"
          layout="total, prev, pager, next" @change="loadData" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { getPaymentPage } from '@/api/fee'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const query = reactive({ elderName: '', billMonth: '', pageNum: 1, pageSize: 10 })

const loadData = async () => {
  loading.value = true
  try { const res = await getPaymentPage({ ...query }); tableData.value = res.data.list; total.value = res.data.total } finally { loading.value = false }
}
onMounted(loadData)
</script>

<style scoped>
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
