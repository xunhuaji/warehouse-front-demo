import request from '@/utils/request'

export function getMaterialPage(params) {
  return request.get('/material/page', { params })
}

export function getMaterialById(id) {
  return request.get(`/material/${id}`)
}

export function addMaterial(data) {
  return request.post('/material', data)
}

export function updateMaterial(data) {
  return request.put('/material', data)
}

export function deleteMaterial(id) {
  return request.delete(`/material/${id}`)
}

export function getMaterialAlerts() {
  return request.get('/material/alert')
}
