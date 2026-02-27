---
title: 部署模式与网络标准 (Deployment & Network Standards)
type: improvement
status: stable
last_updated: 2025-02-27
related_base: design_standards/architecture_overview.md
---

## 1. 部署模式：后端解耦 (Backend-only)
AstrBot 支持脱离集成式 WebUI 运行，实现核心逻辑与管理界面的物理分离，优化了在服务器或资源受限环境下的部署能力。
- **配置项**：通过 CLI 参数 `--backend-only` 或环境变量 `DASHBOARD_ENABLE=False` 开启。
- **远程控制**：在此模式下，开发者可使用在线面板（v4.14.4+）通过填写后端地址的方式进行远程控制。
- **环境变量**：支持通过 `DASHBOARD_HOST` 和 `DASHBOARD_PORT` 显式指定后端服务的监听地址。

## 2. 网络绑定标准 (IPv6/IPv4 Dual-Stack)
系统核心组件的默认监听地址从 `0.0.0.0` 统一迁移至 `::`，以原生支持现代网络环境。
- **默认行为**：Dashboard、OneBot (aiocqhttp) 适配器、QQ 官方 Webhook 及企业微信适配器默认绑定 `::`。
- **双栈支持**：在支持双栈的主机上，`::` 能够同时接受 IPv4 和 IPv6 的入站连接。

## 3. 网络工具集 (IO Utils)
`astrbot.core.utils.io` 模块增强了对 IP 地址的感知与处理能力：
- **`get_local_ip_addresses()`**: 返回本地网络接口的 `IPv4Address | IPv6Address` 对象列表。自动过滤 IPv6 link-local 地址（fe80::/10）并处理 zone index。
- **`get_public_ip_address()`**: **新增** 异步工具函数。通过并发请求多个权威服务（如 ipify, ident.me, ifconfig.me）获取当前环境的公网 IPv4/IPv6 地址。

## 变更影响分析
- **类型契约变更**：`get_local_ip_addresses` 的返回值由 `str` 列表变更为 `ipaddress` 对象列表。插件开发者在进行字符串拼接或路径计算时，必须显式调用 `str()` 进行转换。
- **部署灵活性**：支持纯后端运行意味着 AstrBot 可以作为轻量级微服务部署，仅暴露必要的 API 端口，降低了攻击面和资源占用。
- **网络可达性校验**：新增的 `get_public_ip_address` 为插件提供了动态感知公网环境的能力，适用于自动配置 Webhook 回调地址或进行基于地理位置的服务优化。