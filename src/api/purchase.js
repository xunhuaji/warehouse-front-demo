import request from '@/utils/request'

export function getPurchasePage(params) {
  return request.get('/purchase/page', { params })
}

export function addPurchase(data) {
  return request.post('/purchase', data)
}
