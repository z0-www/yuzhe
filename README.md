# 鱼者 Yuzhe Mobile V0.1

鱼者是面向普通用户的 AI 助手移动端工程骨架。当前版本提供 React + TypeScript + Vite + Capacitor Android UI 原型、Node API 健康检查、共享契约和 DSH 适配边界。

## 开发

```bash
export NPM_CONFIG_CACHE=/tmp/yuzhe-npm-cache
npm install
npm run build --workspaces
npm run typecheck --workspaces
npm run test --workspaces
npm run dev --workspace=@yuzhe/mobile
```

移动端同步 Capacitor：`npm run cap:sync --workspace=@yuzhe/mobile`。Android 工程位于 `apps/mobile/android`；需要本机 Android SDK 和可访问的 Gradle 发行包才能构建。

## 当前边界

UI 回复明确标记为演示模式。DSH、语音、读图、联网搜索、账号、记忆和办事工具尚未接通；客户端不包含 API 密钥或服务器凭据。API 目前只提供 `GET /health`，DSH Web 端口不会暴露公网。
