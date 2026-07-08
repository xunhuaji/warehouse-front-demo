import request from '@/utils/request'

export function getBillPage(params) {
  return request.get('/fee/bill/page', { params })
}

export function generateBills(billMonth) {
  return request.post('/fee/bill/generate', { billMonth })
}

export function payBill(data) {
  return request.post('/fee/pay', data)
}

export function getPaymentPage(params) {
  return request.get('/fee/payment/page', { params })
}

export function getPaymentsByBill(billId) {
  return request.get(`/fee/payment/${billId}`)
}

export function getReportByMonth(billMonth) {
  return request.get('/fee/report/month', { params: { billMonth } })
}

export function getReportSummary() {
  return request.get('/fee/report/summary')
}

export function getFeeStandards() {
  return request.get('/fee/standard')
}

export function getResidentPage(params) {
  return request.get('/fee/resident/page', { params })
}
