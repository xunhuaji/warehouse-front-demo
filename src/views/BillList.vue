<template>
  <div>
    <el-card shadow="never">
      <el-form :inline="true" :model="query">
        <el-form-item label="老人姓名"><el-input v-model="query.elderName" clearable /></el-form-item>
        <el-form-item label="账单月份">
          <el-date-picker v-model="query.billMonth" type="month" value-format="YYYY-MM" placeholder="选择月份" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部" style="width: 160px">
            <el-option label="未缴" value="unpaid" />
            <el-option label="部分缴" value="partial" />
            <el-option label="已缴清" value="paid" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button v-if="userStore.hasPermission('fee:bill')" type="success" @click="openGenerate">生成月度账单</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="elderName" label="老人姓名" width="100" />
        <el-table-column prop="roomNo" label="房间号" width="80" />
        <el-table-column prop="billMonth" label="账单月份" width="100" />
        <el-table-column prop="bedFee" label="床位费" width="100">
          <template #default="{ row }">¥ {{ row.bedFee }}</template>
        </el-table-column>
        <el-table-column prop="nursingFee" label="护理费" width="100">
          <template #default="{ row }">¥ {{ row.nursingFee }}</template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="应缴总额" width="110">
          <template #default="{ row }">¥ {{ row.totalAmount }}</template>
        </el-table-column>
        <el-table-column prop="paidAmount" label="已缴金额" width="110">
          <template #default="{ row }">¥ {{ row.paidAmount }}</template>
        </el-table-column>
        <el-table-column label="待缴" width="100">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.status !== 'paid' }">
              ¥ {{ (row.totalAmount - row.paidAmount).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="billStatusType(row.status)" size="small">{{ billStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status !== 'paid' && userStore.hasPermission('fee:pay')" type="primary" link @click="openPay(row)">
              在线缴费
            </el-button>
            <el-button type="info" link @click="viewPayments(row)">缴费明细</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination v-model:current-page="query.pageNum" v-model:page-size="query.pageSize" :total="total"
          layout="total, prev, pager, next" @change="loadData" />
      </div>
    </el-card>

    <!-- 生成账单 -->
    <el-dialog v-model="genVisible" title="生成月度账单" width="400px">
      <el-form label-width="90px">
        <el-form-item label="账单月份">
          <el-date-picker v-model="genMonth" type="month" value-format="YYYY-MM" style="width:100%" />
        </el-form-item>
        <el-alert type="info" :closable="false" description="将根据在住老人的床位类型和护理等级，自动计算床位费与护理费并生成账单。" />
      </el-form>
      <template #footer>
        <el-button @click="genVisible = false">取消</el-button>
        <el-button type="primary" :loading="genLoading" @click="handleGenerate">生成</el-button>
      </template>
    </el-dialog>

    <!-- 在线缴费 -->
    <el-dialog v-model="payVisible" title="在线缴费" width="480px" destroy-on-close>
      <div class="pay-info">
        <p><strong>缴费对象：</strong>{{ payBill.elderName }}（{{ payBill.roomNo }}）</p>
        <p><strong>账单月份：</strong>{{ payBill.billMonth }}</p>
        <p><strong>应缴总额：</strong>¥ {{ payBill.totalAmount }}</p>
        <p><strong>已缴金额：</strong>¥ {{ payBill.paidAmount }}</p>
        <p class="text-danger"><strong>待缴金额：</strong>¥ {{ remainAmount.toFixed(2) }}</p>
      </div>
      <el-divider />
      <el-form ref="payFormRef" :model="payForm" :rules="payRules" label-width="90px">
        <el-form-item label="缴费金额" prop="amount">
          <el-input-number v-model="payForm.amount" :min="0.01" :max="remainAmount" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="payForm.remark" /></el-form-item>
      </el-form>
      <div class="pay-methods">
        <p class="pay-label">选择支付方式（演示）</p>
        <div class="pay-btns">
          <el-button type="primary" size="large" class="pay-btn" @click="handlePay('微信支付')">
            <span class="pay-icon">💚</span> 微信支付
          </el-button>
          <el-button type="success" size="large" class="pay-btn" @click="handlePay('支付宝')">
            <span class="pay-icon">💙</span> 支付宝
          </el-button>
          <el-button type="warning" size="large" class="pay-btn" @click="handlePay('银行卡')">
            <span class="pay-icon">💳</span> 银行卡
          </el-button>
        </div>
        <p class="pay-tip">* 以上为演示界面，点击即模拟完成缴费</p>
      </div>
    </el-dialog>

    <!-- 缴费明细 -->
    <el-dialog v-model="detailVisible" title="缴费明细" width="600px">
      <el-table :data="paymentDetails" border size="small">
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">¥ {{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" width="100" />
        <el-table-column prop="operator" label="操作人" width="90" />
        <el-table-column prop="remark" label="备注" />
        <el-table-column prop="payTime" label="缴费时间" width="160" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { generateBills, getBillPage, getPaymentsByBill, payBill as payBillApi } from '@/api/fee'

const userStore = useUserStore()
const loading = ref(false)
const genLoading = ref(false)
const tableData = ref([])
const total = ref(0)
const genVisible = ref(false)
const payVisible = ref(false)
const detailVisible = ref(false)
const genMonth = ref('')
const payBill = ref({})
const payFormRef = ref()
const paymentDetails = ref([])
const query = reactive({ elderName: '', billMonth: '', status: '', pageNum: 1, pageSize: 10 })
const payForm = reactive({ amount: 0, remark: '' })
const payRules = { amount: [{ required: true, message: '请输入缴费金额', trigger: 'blur' }] }

const remainAmount = computed(() => {
  const b = payBill.value
  return b.totalAmount ? Number(b.totalAmount) - Number(b.paidAmount) : 0
})

const billStatusText = (s) => ({ unpaid: '未缴', partial: '部分缴', paid: '已缴清' }[s] || s)
const billStatusType = (s) => ({ unpaid: 'danger', partial: 'warning', paid: 'success' }[s] || 'info')

const loadData = async () => {
  loading.value = true
  try { const res = await getBillPage({ ...query }); tableData.value = res.data.list; total.value = res.data.total } finally { loading.value = false }
}
const openGenerate = () => { genMonth.value = ''; genVisible.value = true }
const handleGenerate = async () => {
  if (!genMonth.value) { ElMessage.warning('请选择账单月份'); return }
  genLoading.value = true
  try { const res = await generateBills(genMonth.value); ElMessage.success(res.msg); genVisible.value = false; loadData() }
  finally { genLoading.value = false }
}
const openPay = (row) => {
  payBill.value = row
  payForm.amount = Number(row.totalAmount) - Number(row.paidAmount)
  payForm.remark = ''
  payVisible.value = true
}
const handlePay = async (method) => {
  await payFormRef.value.validate()
  await payBillApi({ billId: payBill.value.id, amount: payForm.amount, remark: payForm.remark || method })
  ElMessage.success(`已通过${method}完成缴费 ¥${payForm.amount}`)
  payVisible.value = false
  loadData()
}
const viewPayments = async (row) => {
  const res = await getPaymentsByBill(row.id)
  paymentDetails.value = res.data
  detailVisible.value = true
}
onMounted(loadData)
</script>

<style scoped>
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.text-danger { color: #f56c6c; font-weight: 600; }
.pay-info p { margin: 8px 0; color: #606266; }
.pay-methods { margin-top: 8px; }
.pay-label { font-size: 14px; color: #303133; margin-bottom: 12px; }
.pay-btns { display: flex; gap: 12px; flex-wrap: wrap; }
.pay-btn { flex: 1; min-width: 120px; height: 56px; }
.pay-icon { margin-right: 6px; }
.pay-tip { font-size: 12px; color: #909399; margin-top: 12px; }
</style>
