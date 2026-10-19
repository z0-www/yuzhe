# DSHA / DSH 参考审计

本阶段只读检查了上游仓库 `deepseek-ai/deepseek-harness`，没有修改或打包上游代码。

## 已核对的 SDK 版本和导出

- 上游源码 HEAD：`687f282e8625c6b8d11ff58211a90524be2e4317`
- `packages/sdk/client/package.json`：`@deepseek-ai/dsh-sdk-client` `0.2.1-rc.2`
- npm 元数据：`latest` 仍为 `0.0.1-rc.1`，`next` 为 `0.2.1-rc.2`，因此不能无条件安装 `latest`。
- 当前客户端没有安装 `@deepseek-ai/dsh-sdk-client` 或 `@deepseek-ai/dsh`，系统也没有 `dsh` 可执行文件；本环境只有 `OPENAI_CLUSTER` 名称可见，没有 DSH 运行时/凭据绑定。
- `src/index.ts` 的实际导出包括：`DeepSeekHarness`、`HarnessSession`、`HarnessClient`、`JsonRpcResponseError`、`RequestTimeoutError`、`SdkProtocolError`、`TransportClosedError`、`validatedSessionEvent`，以及 `RunResult`、`DeepSeekHarnessOptions`、`HarnessClientOptions`、`SdkPromptContentBlock` 等类型。

## 实际启动与协议流程

`DeepSeekHarness` 首次使用时通过 `HarnessClient` 懒启动子进程。默认解析同版本 `@deepseek-ai/dsh`，以 Node 子进程执行 `dsh --profile sdk`，也可通过 `dshBin` 指定路径；初始化默认超时 10 秒。

初始化发送 `initialize`，携带绝对工作目录、provider、model，可选 `reasoningEffort` 和 `maxTokens`。文字或图片输入通过 `session/prompt` 入队，响应只提供持久消息 ID；高层 `run()` 订阅 `session.event` 与通知，等待该消息出现在 durable inbox receipt，再收集到下一个整体 `idle`。持久会话通过 `session/resume` 恢复，不发送新输入。

关闭流程是协议 `shutdown`（默认 1 秒）后 stdin EOF、SIGTERM、SIGKILL 梯级清理，直到子进程实际退出。SDK 暴露请求超时、协议错误和传输关闭错误；超时不会取消服务端正在进行的 turn，需关闭运行时。

## 当前阻塞与边界

本环境缺少同版本 DSH runtime、SDK peer 包、`dsh --profile sdk` 所需 profile/patch、模型 provider 配置和可验证的云端凭据，因此不能执行真实 `initialize`、文本/图片 `session/prompt`、`session/resume` 或事件流集成测试。`packages/dsh-adapter` 继续保持未配置边界；它的自动化测试验证的是明确失败，而不是伪造 AI 回复。

可借鉴的工程思想包括启动状态管理、初始化超时、版本锁定、事件流收集、错误分类、会话恢复和 EOF→SIGTERM→SIGKILL 关闭梯级。Ubuntu、proot/bxroot、完整 DSH runtime 和任意 Shell 能力不应打包进鱼者移动 App，也不会把 DSH Web 端口暴露到公网。
