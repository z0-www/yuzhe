# 路线图

1. 在具备 DSH runtime、provider/model 配置和安全凭据的部署环境中安装并锁定 `@deepseek-ai/dsh-sdk-client`、`@deepseek-ai/dsh`、`@deepseek-ai/dsh-llm`、`@deepseek-ai/dsh-session`、`@deepseek-ai/dsh-sdk-protocol` 为 `0.2.1-rc.2`，运行 `npm run test:dsh:smoke`。
2. Smoke Test 成功后，把真实 SDK-backed adapter 注入 API，覆盖创建/恢复会话、文字提示、receipt→idle 事件收集、超时和 EOF→SIGTERM→SIGKILL 关闭；保留没有取消协议时的安全限制。
3. 增加 API 身份认证、按用户隔离 DSH_HOME/会话目录、限流和资源配额；继续禁止客户端传入命令、路径、插件和 dshBin。
4. 接入 Capacitor Android 构建与真机安全区、键盘、语音权限验证；无 macOS/Xcode 时不声称 iOS 原生构建。
5. 在独立授权和确认机制下逐步实现读图、联网搜索、工具执行和记忆；本阶段不扩大到完整语音、记忆或全部办事系统。
