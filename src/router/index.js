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
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/material',
    children: [
      {
        path: 'material',
        name: 'Material',
        component: () => import('@/views/MaterialList.vue'),
        meta: { permission: 'material:view', title: '物资库存' }
      },
      {
        path: 'purchase',
        name: 'Purchase',
        component: () => import('@/views/PurchaseList.vue'),
        meta: { permission: 'purchase:view', title: '采购记录' }
      },
      {
        path: 'usage',
        name: 'Usage',
        component: () => import('@/views/UsageList.vue'),
        meta: { permission: 'usage:view', title: '领用审批' }
      },
      {
        path: 'alert',
        name: 'Alert',
        component: () => import('@/views/AlertList.vue'),
        meta: { permission: 'alert:view', title: '库存预警' }
      },
      {
        path: 'bill',
        name: 'Bill',
        component: () => import('@/views/BillList.vue'),
        meta: { permission: 'fee:view', title: '月度账单' }
      },
      {
        path: 'payment',
        name: 'Payment',
        component: () => import('@/views/PaymentList.vue'),
        meta: { permission: 'fee:view', title: '缴费记录' }
      },
      {
        path: 'report',
        name: 'Report',
        component: () => import('@/views/FeeReport.vue'),
        meta: { permission: 'fee:report', title: '费用报表' }
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
    if (userStore.loaded && (to.path === '/login' || to.path === '/register')) {
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
    next('/')
    return
  }

  next()
})

export default router
