import request from '@/utils/request'

export function getUsagePage(params) {
  return request.get('/usage/page', { params })
}

export function applyUsage(data) {
  return request.post('/usage/apply', data)
}

export function approveUsage(data) {
  return request.put('/usage/approve', data)
}
