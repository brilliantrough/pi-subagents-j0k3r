# 包内 Agent 注册

在保留上游工具、配置与历史机制的基础上，支持其它 Pi 扩展在会话内提供命名 Agent；不复制定义到用户或项目目录。

## 安装

```bash
pi install git:github.com/brilliantrough/pi-subagents-j0k3r@v1.6.1-agent-skills.1
```

与 `npm:pi-subagents-j0k3r` 二选一；已有安装优先运行 agent-skills 的 `pi-setup.sh`，它会备份 settings 并保留资源过滤、Agent 定义和模型配置。

## 注册协议 v1

- 运行器在 `session_start` 监听 `subagents:register`，然后发出 `subagents:ready`（`{version: 1}`）。
- 提供方在 `session_start` 监听 ready 并尝试注册；收到 ready 时再次注册，兼容两种加载顺序。
- 请求：`{source, agents, onRegistered(dispose)}`。`source` 是包的稳定唯一名；`agents` 使用 `SubagentDefinition` 字段：`name`、`description`、`filePath`、`instructions`、`tools`，以及可选模型／effort／mode。
- `filePath` 指向包内的原始正文，用于来源展示；无需全局落盘。指令正文由提供方读取。
- 同一 source 重注册替换旧值；旧 disposer 不会删除较新的注册。不同包不能抢占同名角色。
- 提供方在 `session_shutdown` 取消 ready 监听并调用 disposer；运行器也清除本次会话的注册。停用包后 reload 即移除角色。
- 包内角色优先级低于四个原有文件目录。同名本地定义仍优先；包内角色使用 global `model_profiles`，不改原有配置优先级。
- `subagent_*` 工具仍被运行器过滤。建议审查角色仅允许 read/grep/find/ls，命令输出及差异由主会话交付。

`subagent_list_agents`、`subagent_run`、`/subagent-models` 及历史继续使用同一发现入口。
