import request from '@/utils/request'

export function getProductPage(params) {
  return request.get('/product/page', { params })
}

export function getProductById(id) {
  return request.get(`/product/${id}`)
}

export function addProduct(data) {
  return request.post('/product', data)
}

export function updateProduct(data) {
  return request.put('/product', data)
}

export function deleteProduct(id) {
  return request.delete(`/product/${id}`)
}

export function deleteProductBatch(ids) {
  return request.delete('/product/batch', { data: { ids } })
}
