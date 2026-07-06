import { defineStore } from 'pinia'
import { getUserInfo, login as loginApi, logout as logoutApi } from '@/api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    id: null,
    username: '',
    nickname: '',
    role: '',
    permissions: [],
    loaded: false
  }),
  getters: {
    isAdmin: (state) => state.role === 'admin',
    hasPermission: (state) => (perm) => state.permissions.includes(perm)
  },
  actions: {
    setUser(data) {
      this.id = data.id
      this.username = data.username
      this.nickname = data.nickname
      this.role = data.role
      this.permissions = data.permissions || []
      this.loaded = true
    },
    clearUser() {
      this.id = null
      this.username = ''
      this.nickname = ''
      this.role = ''
      this.permissions = []
      this.loaded = false
    },
    async login(form) {
      const res = await loginApi(form)
      this.setUser(res.data)
      return res
    },
    async fetchUserInfo() {
      const res = await getUserInfo()
      this.setUser(res.data)
      return res
    },
    async logout() {
      try {
        await logoutApi()
      } finally {
        this.clearUser()
      }
    }
  }
})
