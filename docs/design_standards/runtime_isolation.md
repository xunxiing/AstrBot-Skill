---
title: 打包环境与动态依赖隔离 (Packaged Runtime & Dependency Isolation)
type: feature
status: stable
last_updated: 2025-02-08
related_base: design_standards/architecture_overview.md
---

## 概述

AstrBot 引入了对打包环境（如 Electron 封装的 Frozen Runtime）的原生支持。为了解决打包后程序目录只读以及 Python 环境封闭的问题，系统实现了一套动态依赖隔离与路径注入机制，确保插件在不同运行模式下均能正常安装和加载第三方依赖。

## 核心机制

### 1. 运行环境识别
系统通过 `sys.frozen` 属性及环境变量 `ASTRBOT_CLI` 识别当前的运行模式：
- **CLI 模式**：标准的 Python 环境，依赖通常安装在全局或虚拟环境的 `site-packages`。
- **打包模式 (Frozen)**：由 PyInstaller 或类似工具打包的二进制环境。此时程序目录通常不可写。

### 2. 动态依赖重定向 (`PipInstaller`)
在打包环境下，插件的 `requirements.txt` 不再尝试安装到系统环境，而是重定向到用户数据目录：
- **存储路径**：通过 `get_astrbot_site_packages_path()` 获取，通常位于 `data/site-packages`。
- **安装策略**：调用 `pip` 时强制增加 `--target` 参数指向上述隔离目录。
- **进程内执行**：在受限环境下，系统会回退至 `_run_pip_in_process` 模式，直接在当前进程线程中调用 `pip._internal.cli.main`，以绕过外部进程调用限制。

### 3. 运行时路径注入
为了使动态安装的依赖能够被插件 `import`，系统在插件加载阶段执行以下逻辑：
- **路径优先**：将 `data/site-packages` 动态插入到 `sys.path[0]`，确保隔离目录中的依赖包具有最高优先级。
- **缓存刷新**：调用 `importlib.invalidate_caches()`，强制 Python 解释器重新扫描模块路径，实现依赖的“即装即用”。

## 关键 API 与方法

- `get_astrbot_site_packages_path() -> str`: 获取当前运行环境下专用于存放插件动态依赖的目录路径。
- `_is_frozen_runtime() -> bool`: 判断当前是否处于打包后的二进制运行状态。
- `PipInstaller.install(requirements_path)`: 自动识别环境并执行依赖安装，处理路径重定向与日志句柄清理。

## 变更影响分析

- **依赖冲突风险**：由于 `data/site-packages` 被注入到 `sys.path` 的首位，插件安装的依赖可能会覆盖系统自带的同名模块。AI 开发者在编写插件时应尽量避免使用过于通用的依赖版本约束。
- **环境一致性**：插件作者无需关心用户是运行源码还是 Electron 客户端，`PipInstaller` 会自动处理路径差异。但需注意，在打包环境下，依赖安装在数据目录而非插件目录，这保证了插件自身的“绿色化”。
- **调试建议**：若在桌面端发现模块找不到（ImportError），应检查 `data/site-packages` 是否包含目标包，并确认 `sys.path` 是否已正确注入该路径。