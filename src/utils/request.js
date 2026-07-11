import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useUserStore } from '@/store/user'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

const request = axios.create({
  baseURL: baseURL,
  timeout: 15000,
  withCredentials: true
})

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('satoken')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 200) {
      if (res.data && res.data.satoken) {
        localStorage.setItem('satoken', res.data.satoken)
      }
      return res
    }
    if (res.code === 401) {
      const userStore = useUserStore()
      userStore.clearUser()
      localStorage.removeItem('satoken')
      router.push('/login')
      ElMessage.error(res.msg || '未登录或会话已过期')
      return Promise.reject(new Error(res.msg))
    }
    if (res.code === 403) {
      ElMessage.error(res.msg || '无权限访问')
      return Promise.reject(new Error(res.msg))
    }
    ElMessage.error(res.msg || '请求失败')
    return Promise.reject(new Error(res.msg))
  },
  (error) => {
    ElMessage.error(error.message || '网络异常')
    return Promise.reject(error)
  }
)

export default request
