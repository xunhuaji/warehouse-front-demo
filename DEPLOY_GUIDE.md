# GitHub Pages 部署问题排查指南

## 问题原因

你的项目在 GitHub Pages 上显示空白的主要原因：

### 1. **API 请求失败（核心问题）**
- **现象**：前端页面可以加载，但所有数据请求失败
- **原因**：前端配置的 API 地址是 `/api`，在 GitHub Pages 上会请求 `https://用户名.github.io/api/xxx`
- **实际问题**：你的后端服务运行在本地 `http://localhost:8080`，GitHub Pages 无法访问

### 2. **路由模式问题**
- **现象**：刷新页面可能 404
- **原因**：使用了 History 模式 (`createWebHistory`)，需要服务器端配置支持
- **解决**：已改为 Hash 模式 (`createWebHashHistory`)

## 已完成的修改

✅ 1. 路由模式从 `createWebHistory()` 改为 `createWebHashHistory()`
✅ 2. 添加了环境变量配置文件（`.env.production` 和 `.env.development`）
✅ 3. API 请求改为使用环境变量配置基础 URL

## 你需要做的事情

### 方案一：使用内网穿透（当前方案）✅

你已经通过内网穿透将后端暴露到公网：`https://mpxbit.space-xboard.ggff.net`

1. **配置已完成**：`.env.production` 已设置为 `https://mpxbit.space-xboard.ggff.net/api`
2. **提交代码并推送**到 GitHub：
   ```bash
   git add .
   git commit -m "fix: 配置内网穿透后端地址"
   git push origin main
   ```
3. **等待 GitHub Actions 自动部署**（约 1-2 分钟）
4. **访问前端页面**：`https://你的用户名.github.io/warehouse-front-demo/`

### 方案二：前后端一起部署（简化方案）

如果你的后端是 Spring Boot，可以将前端构建文件放在后端的 static 目录：

1. **本地构建前端**：
   ```bash
   npm run build
   ```
   （当前配置会自动输出到 `../warehouse-backend-demo/src/main/resources/static`）

2. **启动后端服务**，通过后端端口访问前端

3. **不使用 GitHub Pages**，直接访问后端提供的页面

### 方案三：使用代理转发（临时测试）

如果只是想在 GitHub Pages 上展示界面（不需要真实数据），可以：

1. **修改 mock 数据**或在代码中添加假数据
2. **捕获 API 错误**，不让页面完全空白

## 重要提醒

⚠️ **CORS 跨域问题**：
- 如果后端部署在不同域名，需要后端配置 CORS 允许跨域访问
- Spring Boot 后端添加配置：
  ```java
  @Configuration
  public class CorsConfig implements WebMvcConfigurer {
      @Override
      public void addCorsMappings(CorsRegistry registry) {
          registry.addMapping("/**")
                  .allowedOrigins("https://你的用户名.github.io")
                  .allowedMethods("GET", "POST", "PUT", "DELETE")
                  .allowCredentials(true);
      }
  }
  ```
- **重要**：由于你使用内网穿透，还需要允许 `https://mpxbit.space-xboard.ggff.net` 的跨域请求

⚠️ **HTTPS 限制**：
- GitHub Pages 使用 HTTPS
- ✅ 你的内网穿透地址已经是 `https://mpxbit.space-xboard.ggff.net`，符合要求
- 确保后端服务也支持 HTTPS（由内网穿透工具处理）

## 验证步骤

1. ✅ 已完成：`.env.production` 已配置为 `https://mpxbit.space-xboard.ggff.net/api`
2. **提交并推送到 GitHub**：
   ```bash
   git add .
   git commit -m "fix: 配置内网穿透后端地址"
   git push origin main
   ```
3. **等待 GitHub Actions 自动部署**（约 1-2 分钟）
4. **访问前端页面**：`https://你的用户名.github.io/warehouse-front-demo/`
5. **打开浏览器控制台（F12）**查看是否有错误
6. **确保本地后端服务正在运行**，且内网穿透工具正常工作

## 常见问题

**Q: 页面还是空白怎么办？**
A: 打开浏览器开发者工具（F12），查看：
- Console 标签：看 JavaScript 错误
- Network 标签：看 API 请求是否失败
- 根据具体错误信息进一步排查

**Q: 能看到登录页面但无法登录？**
A: 这是正常的，说明前端加载成功了，但后端 API 连接有问题。检查：
- 本地后端服务是否正在运行（localhost:8080）
- 内网穿透工具是否正常工作
- 访问 `https://mpxbit.space-xboard.ggff.net/api/xxx` 是否能返回数据
- 浏览器控制台 Network 标签查看具体错误

**Q: 刷新页面后 404？**
A: 已经修复，现在使用 Hash 模式，URL 会变成 `/#/login` 这种形式，不会再 404。
