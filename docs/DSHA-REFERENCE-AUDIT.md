# DSHA / DSH 参考审计

本阶段只读检查了上游仓库 `deepseek-ai/deepseek-harness`，没有修改或打包上游代码。

## 已核对的 SDK 版本和导出

- 上游源码 HEAD：`687f282e8625c6b8d11ff58211a90524be2e4317`
- `packages/sdk/client/package.json`：`@deepseek-ai/dsh-sdk-client` `0.2.1-rc.2`
- npm 元数据：`latest` 仍为 `0.0.1-rc.1`，`next` 为 `0.2.1-rc.2`，因此不能无条件安装 `latest`。
- 工程已锁定并通过 npm 安装 `@deepseek-ai/dsh-sdk-client@0.2.1-rc.2`；其精确 `@deepseek-ai/dsh` runtime、peer 包和 `node_modules/.bin/dsh` 均可用，`dsh --version` 返回 `0.2.1-rc.2`。当前云环境只有 `OPENAI_CLUSTER` 名称可见，未提供 DSH provider/model 配置或凭据绑定。
- `src/index.ts` 的实际导出包括：`DeepSeekHarness`、`HarnessSession`、`HarnessClient`、`JsonRpcResponseError`、`RequestTimeoutError`、`SdkProtocolError`、`TransportClosedError`、`validatedSessionEvent`，以及 `RunResult`、`DeepSeekHarnessOptions`、`HarnessClientOptions`、`SdkPromptContentBlock` 等类型。

## 实际启动与协议流程

`DeepSeekHarness` 首次使用时通过 `HarnessClient` 懒启动子进程。默认解析同版本 `@deepseek-ai/dsh`，以 Node 子进程执行 `dsh --profile sdk`，也可通过 `dshBin` 指定路径；初始化默认超时 10 秒。

初始化发送 `initialize`，携带绝对工作目录、provider、model，可选 `reasoningEffort` 和 `maxTokens`。文字或图片输入通过 `session/prompt` 入队，响应只提供持久消息 ID；高层 `run()` 订阅 `session.event` 与通知，等待该消息出现在 durable inbox receipt，再收集到下一个整体 `idle`。持久会话通过 `session/resume` 恢复，不发送新输入。

关闭流程是协议 `shutdown`（默认 1 秒）后 stdin EOF、SIGTERM、SIGKILL 梯级清理，直到子进程实际退出。SDK 暴露请求超时、协议错误和传输关闭错误；超时不会取消服务端正在进行的 turn，需关闭运行时。

## 可行版本路径与当前阻塞

已比较两条路径：

- A（采用）：npm 已发布 `@deepseek-ai/dsh-sdk-client@0.2.1-rc.2` 和 `@deepseek-ai/dsh@0.2.1-rc.2`，其 peer 包 `@deepseek-ai/cordis@~4.0.5`、`@deepseek-ai/dsh-llm@0.2.1-rc.2`、`@deepseek-ai/dsh-session@0.2.1-rc.2`、`@deepseek-ai/dsh-sdk-protocol@0.2.1-rc.2` 可按精确版本安装。SDK 启动代码会比较 client/runtime manifest，要求同版本；这是当前最容易复现的路径。
- B（不采用）：从固定源码 commit `687f282e8625c6b8d11ff58211a90524be2e4317` 构建整个 workspace。该 commit 可获取，根 `package.json` 要求 Node `^22.19.0 || >=24.0.0`，但会引入完整 workspace、profile bundle 和构建链，不如已发布的精确包易维护。

当前环境 Node 为 `v24.19.0`，满足上游要求；精确包已安装，且独立 Smoke Test 已实际启动 runtime、完成 JSON-RPC initialize 并收到真实 `turn/end` 事件。由于没有 provider/model 配置和凭据，真实 turn 以 `MISSING_CREDENTIAL` 结束、没有 assistant 回复，因此不能宣称真实模型调用成功，也没有执行成功的文本/图片 `session/prompt` 或 `session/resume` 集成测试。`packages/dsh-adapter` 继续保持未配置边界；它的自动化测试验证的是明确失败，而不是伪造 AI 回复。

可借鉴的工程思想包括启动状态管理、初始化超时、版本锁定、事件流收集、错误分类、会话恢复和 EOF→SIGTERM→SIGKILL 关闭梯级。Ubuntu、proot/bxroot、完整 DSH runtime 和任意 Shell 能力不应打包进鱼者移动 App，也不会把 DSH Web 端口暴露到公网。
