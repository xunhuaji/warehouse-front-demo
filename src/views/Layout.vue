<template>
  <el-container class="layout">
    <el-aside width="230px" class="aside">
      <div class="logo">养老院管理系统</div>
      <el-menu :default-active="activeMenu" router background-color="#001529" text-color="#fff" active-text-color="#409eff">
        <el-menu-item v-if="userStore.hasPermission('material:view')" index="/material">
          <span>物资库存</span>
        </el-menu-item>
        <el-menu-item v-if="userStore.hasPermission('purchase:view')" index="/purchase">
          <span>采购记录</span>
        </el-menu-item>
        <el-menu-item v-if="userStore.hasPermission('usage:view')" index="/usage">
          <span>领用审批</span>
        </el-menu-item>
        <el-menu-item v-if="userStore.hasPermission('alert:view')" index="/alert">
          <span>库存预警</span>
        </el-menu-item>
        <el-sub-menu v-if="userStore.hasPermission('fee:view')" index="fee">
          <template #title>费用管理</template>
          <el-menu-item index="/bill">月度账单</el-menu-item>
          <el-menu-item index="/payment">缴费记录</el-menu-item>
          <el-menu-item v-if="userStore.hasPermission('fee:report')" index="/report">费用报表</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-title">{{ currentTitle }}</div>
        <div class="header-right">
          <span class="username">{{ userStore.nickname || userStore.username }}</span>
          <el-tag size="small" type="info">{{ userStore.role === 'admin' ? '管理员' : '普通用户' }}</el-tag>
          <el-button type="primary" link @click="pwdVisible = true">修改密码</el-button>
          <el-button type="danger" link @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>

    <el-dialog v-model="pwdVisible" title="修改密码" width="420px" destroy-on-close>
      <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="90px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="pwdForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="pwdForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdVisible = false">取消</el-button>
        <el-button type="primary" :loading="pwdLoading" @click="handleChangePassword">确定</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { changePassword } from '@/api/auth'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const pwdVisible = ref(false)
const pwdLoading = ref(false)
const pwdFormRef = ref()

const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirm = (rule, value, callback) => {
  if (value !== pwdForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const pwdRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ]
}

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title || '首页')

const handleChangePassword = async () => {
  await pwdFormRef.value.validate()
  pwdLoading.value = true
  try {
    await changePassword({ oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword })
    ElMessage.success('密码修改成功，请重新登录')
    pwdVisible.value = false
    await userStore.logout()
    router.push('/login')
  } finally {
    pwdLoading.value = false
  }
}

const handleLogout = async () => {
  await ElMessageBox.confirm('确定退出登录吗？', '提示', { type: 'warning' })
  await userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout { height: 100vh; }
.aside { background: #001529; }
.logo {
  height: 60px; line-height: 60px; text-align: center;
  color: #fff; font-size: 16px; font-weight: 600;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.header {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; border-bottom: 1px solid #ebeef5; padding: 0 24px;
}
.header-title { font-size: 18px; font-weight: 600; color: #303133; }
.header-right { display: flex; align-items: center; gap: 12px; }
.username { color: #606266; }
.main { background: #f5f7fa; padding: 20px; }
</style>
