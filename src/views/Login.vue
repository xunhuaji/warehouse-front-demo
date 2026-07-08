<template>
  <div class="login-page">
    <div class="login-card">
      <h2>养老院管理系统</h2>
      <p class="subtitle">物资管理 · 费用收缴 · 领用审批</p>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="0">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="请输入账号" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large" show-password @keyup.enter="handleLogin" />
        </el-form-item>
        <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleLogin">登 录</el-button>
      </el-form>
      <div class="footer-links">
        <router-link to="/register">没有账号？立即注册</router-link>
      </div>
      <div class="tips">
        <p>管理员：admin / 123456</p>
        <p>普通用户：user / 123456</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)
const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    await userStore.login(form)
    ElMessage.success('登录成功')
    router.push('/')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); }
.login-card { width: 420px; padding: 40px; background: #fff; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.login-card h2 { text-align: center; margin-bottom: 8px; color: #303133; }
.subtitle { text-align: center; color: #909399; margin-bottom: 32px; font-size: 14px; }
.login-btn { width: 100%; margin-top: 8px; }
.footer-links { text-align: center; margin-top: 16px; }
.footer-links a { color: #409eff; text-decoration: none; font-size: 14px; }
.tips { margin-top: 24px; padding-top: 16px; border-top: 1px solid #ebeef5; font-size: 12px; color: #909399; line-height: 1.8; }
</style>
