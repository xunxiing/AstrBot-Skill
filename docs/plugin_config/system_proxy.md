---
title: 系统代理配置与 SOCKS5 支持 (System Proxy Configuration & SOCKS5 Support)
type: improvement
status: stable
last_updated: 2025-02-11
related_base: plugin_config/schema.md
---

## 概述
AstrBot 核心配置系统增强了对网络代理的支持，明确支持 HTTP、HTTPS 以及 SOCKS5 协议。这一变更主要通过引入底层协议库并更新配置元数据（Schema Hints）来实现，确保在受限网络环境下（如需要通过 SOCKS5 访问 LLM Provider 或执行 `pip` 安装）的连通性。

## 配置契约 (Configuration Contract)
在 `ChatProvider` 或系统级配置中，`http_proxy` 字段的定义和行为已更新：
- **字段名称**: `http_proxy` (在 UI 中通常显示为“代理”)。
- **支持格式**: 
    - `http://<ip>:<port>`
    - `https://<ip>:<port>`
    - `socks5://<ip>:<port>`
- **注入机制**: 启用后，系统会通过添加环境变量的方式设置代理，影响范围涵盖核心请求、Provider 通讯以及插件依赖的自动化安装过程。

## 依赖与协议支持
为了支撑多协议代理，系统新增了以下依赖：
- **`pysocks`**: 提供对 SOCKS 代理协议的基础支持，特别是针对需要通过代理进行 `pip` 安装或底层 socket 通讯的场景。
- **`python-socks`**: 增强异步环境下的代理处理能力。

## 变更影响分析
- **连通性扩展**: 开发者和用户现在可以配置 SOCKS5 代理来解决某些 Provider（如 OpenAI）在特定网络环境下的访问问题，而不再局限于 HTTP 隧道。
- **配置引导**: 在编写插件的 `_conf_schema.json` 时，如果涉及网络代理配置，建议参考核心库的 `hint` 描述，明确标注支持 `socks5://` 格式，以保持用户体验的一致性。
- **副作用**: 代理设置会以环境变量形式注入。如果插件内部使用了不遵循标准环境变量的自定义网络库，可能需要手动读取 `http_proxy` 配置并应用到其客户端实例中。