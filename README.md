# 鱼者 Yuzhe Mobile V0.2

鱼者是面向普通用户的 AI 助手移动端工程。当前版本提供 React + TypeScript + Vite + Capacitor Android UI、Node API、共享契约和固定版本的 DSH SDK/Runtime Smoke Test 边界。

## 开发

```bash
export NPM_CONFIG_CACHE=/tmp/yuzhe-npm-cache
npm ci
npm run typecheck --workspaces
npm run build --workspaces
npm run test --workspaces
npm run lint --workspaces
```

移动端同步 Capacitor：`npm run cap:sync --workspace=@yuzhe/mobile`。Android 工程位于 `apps/mobile/android`；需要本机 Android SDK 和可访问的 Gradle 发行包才能构建。

## DSH Smoke Test

工程固定使用 `@deepseek-ai/dsh-sdk-client@0.2.1-rc.2` 及其同版本 runtime/peer 依赖，不能替换成 npm `latest`。在已配置 DSH profile、provider、model 和云端凭据的部署环境中运行：

```bash
YUZHE_DSH_PROVIDER=deepseek-official \
YUZHE_DSH_MODEL=<已配置的模型 ID> \
YUZHE_DSH_HOME=<受保护的 DSH_HOME> \
npm run test:dsh:smoke
```

Smoke Test 会启动 `dsh --profile sdk`，执行两次真实会话提示，检查真实回复、复用同一 session，并在 `finally` 中关闭 runtime。缺少依赖、provider/model 或凭据时以阻塞/失败退出，不会伪造通过结果；不会打印密钥。

## 当前边界

移动端演示回复明确标记为演示模式。API 的 `POST /chat` 只接受服务端注入的 DSH adapter；默认未配置时返回 `503 dsh_unavailable`，不生成 mock 回复。真实 DSH 模型回复尚未在当前云环境验证，因为 provider/model 配置和凭据未提供。语音、读图、联网搜索、账号、记忆和办事工具尚未接通；客户端不包含 API 密钥或服务器凭据，DSH Web 端口不会暴露公网。
