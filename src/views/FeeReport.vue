<template>
  <div>
    <el-row :gutter="16" style="margin-bottom:16px">
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>按月份查询统计</template>
          <el-date-picker v-model="queryMonth" type="month" value-format="YYYY-MM" placeholder="选择月份" style="width:100%;margin-bottom:12px" />
          <el-button type="primary" @click="loadMonthReport">查询</el-button>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card v-if="monthReport.billMonth" shadow="never">
          <template #header>{{ monthReport.billMonth }} 月度统计</template>
          <el-row :gutter="16">
            <el-col :span="6"><div class="stat-item"><div class="stat-label">床位费合计</div><div class="stat-value">¥ {{ monthReport.totalBedFee || 0 }}</div></div></el-col>
            <el-col :span="6"><div class="stat-item"><div class="stat-label">护理费合计</div><div class="stat-value">¥ {{ monthReport.totalNursingFee || 0 }}</div></div></el-col>
            <el-col :span="6"><div class="stat-item"><div class="stat-label">应缴总额</div><div class="stat-value primary">¥ {{ monthReport.totalAmount || 0 }}</div></div></el-col>
            <el-col :span="6"><div class="stat-item"><div class="stat-label">已缴总额</div><div class="stat-value success">¥ {{ monthReport.totalPaid || 0 }}</div></div></el-col>
          </el-row>
          <el-row :gutter="16" style="margin-top:16px">
            <el-col :span="6"><div class="stat-item"><div class="stat-label">待缴总额</div><div class="stat-value danger">¥ {{ monthReport.totalUnpaid || 0 }}</div></div></el-col>
            <el-col :span="6"><div class="stat-item"><div class="stat-label">账单数</div><div class="stat-value">{{ monthReport.billCount || 0 }}</div></div></el-col>
            <el-col :span="6"><div class="stat-item"><div class="stat-label">已缴清</div><div class="stat-value success">{{ monthReport.paidCount || 0 }}</div></div></el-col>
            <el-col :span="6"><div class="stat-item"><div class="stat-label">未缴清</div><div class="stat-value danger">{{ monthReport.unpaidCount || 0 }}</div></div></el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>各月份费用汇总报表</template>
      <el-table v-loading="loading" :data="summaryList" border stripe show-summary :summary-method="getSummary">
        <el-table-column prop="billMonth" label="月份" width="100" />
        <el-table-column prop="totalBedFee" label="床位费合计" width="130">
          <template #default="{ row }">¥ {{ row.totalBedFee }}</template>
        </el-table-column>
        <el-table-column prop="totalNursingFee" label="护理费合计" width="130">
          <template #default="{ row }">¥ {{ row.totalNursingFee }}</template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="应缴总额" width="130">
          <template #default="{ row }">¥ {{ row.totalAmount }}</template>
        </el-table-column>
        <el-table-column prop="totalPaid" label="已缴总额" width="130">
          <template #default="{ row }"><span class="text-success">¥ {{ row.totalPaid }}</span></template>
        </el-table-column>
        <el-table-column prop="totalUnpaid" label="待缴总额" width="130">
          <template #default="{ row }"><span class="text-danger">¥ {{ row.totalUnpaid }}</span></template>
        </el-table-column>
        <el-table-column prop="billCount" label="账单数" width="80" />
        <el-table-column prop="paidCount" label="已缴清" width="80" />
        <el-table-column prop="unpaidCount" label="未缴清" width="80" />
        <el-table-column label="收缴率" width="100">
          <template #default="{ row }">
            {{ row.totalAmount > 0 ? ((row.totalPaid / row.totalAmount) * 100).toFixed(1) + '%' : '-' }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="never" style="margin-top:16px">
      <template #header>费用标准参考</template>
      <el-table :data="standards" border size="small">
        <el-table-column prop="type" label="费用类型" width="100">
          <template #default="{ row }">{{ row.type === 'bed' ? '床位费' : '护理费' }}</template>
        </el-table-column>
        <el-table-column prop="code" label="编码" width="100" />
        <el-table-column prop="name" label="名称" width="120" />
        <el-table-column prop="amount" label="月费标准" width="120">
          <template #default="{ row }">¥ {{ row.amount }} / 月</template>
        </el-table-column>
        <el-table-column prop="description" label="说明" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getFeeStandards, getReportByMonth, getReportSummary } from '@/api/fee'

const loading = ref(false)
const queryMonth = ref('')
const monthReport = reactive({})
const summaryList = ref([])
const standards = ref([])

const loadSummary = async () => {
  loading.value = true
  try { const res = await getReportSummary(); summaryList.value = res.data } finally { loading.value = false }
}
const loadStandards = async () => {
  const res = await getFeeStandards()
  standards.value = res.data
}
const loadMonthReport = async () => {
  if (!queryMonth.value) { ElMessage.warning('请选择月份'); return }
  const res = await getReportByMonth(queryMonth.value)
  Object.assign(monthReport, res.data)
  if (!res.data.billMonth) ElMessage.info('该月份暂无账单数据')
}
const getSummary = ({ columns, data }) => {
  const sums = []
  columns.forEach((col, index) => {
    if (index === 0) { sums[index] = '合计'; return }
    const prop = col.property
    if (['totalBedFee','totalNursingFee','totalAmount','totalPaid','totalUnpaid'].includes(prop)) {
      sums[index] = '¥ ' + data.reduce((s, r) => s + Number(r[prop] || 0), 0).toFixed(2)
    } else if (['billCount','paidCount','unpaidCount'].includes(prop)) {
      sums[index] = data.reduce((s, r) => s + Number(r[prop] || 0), 0)
    } else { sums[index] = '' }
  })
  return sums
}
onMounted(() => { loadSummary(); loadStandards() })
</script>

<style scoped>
.stat-item { text-align: center; padding: 12px 0; }
.stat-label { font-size: 13px; color: #909399; margin-bottom: 8px; }
.stat-value { font-size: 22px; font-weight: 600; color: #303133; }
.stat-value.primary { color: #409eff; }
.stat-value.success { color: #67c23a; }
.stat-value.danger { color: #f56c6c; }
.text-success { color: #67c23a; }
.text-danger { color: #f56c6c; }
</style>
