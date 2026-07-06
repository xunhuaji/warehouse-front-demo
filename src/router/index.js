import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/product',
    children: [
      {
        path: 'product',
        name: 'Product',
        component: () => import('@/views/ProductList.vue'),
        meta: { permission: 'product:view', title: '商品管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.public) {
    if (userStore.loaded && to.path === '/login') {
      next('/')
    } else {
      next()
    }
    return
  }

  if (!userStore.loaded) {
    try {
      await userStore.fetchUserInfo()
    } catch {
      next('/login')
      return
    }
  }

  const requiredPerm = to.meta.permission
  if (requiredPerm && !userStore.hasPermission(requiredPerm)) {
    next('/login')
    return
  }

  next()
})

export default router
