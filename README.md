# ComfyUI Monitor → Notion

> **[English](#english) | [繁體中文](#繁體中文)**

---

<a name="english"></a>
# 🖥️ ComfyUI Monitor → Notion (English)

A lightweight desktop tool (Electron) that monitors multiple **ComfyUI** instances on your local network and automatically syncs their real-time status to a **Notion** database.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)
![Built with Electron](https://img.shields.io/badge/built%20with-Electron%2028-47848F.svg)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🖥️ **Multi-machine monitoring** | Monitor up to 20 ComfyUI nodes simultaneously |
| ⚡ **Real-time updates** | Status latency < 100ms via WebSocket + HTTP polling |
| 🔌 **Auto-reconnect** | Exponential back-off (1s → 30s) with 30% jitter |
| 📝 **Notion sync** | Status changes written to Notion in Traditional Chinese |
| 🎨 **Clean GUI** | Color-coded cards; status bar summary |

### Status Labels (in Notion)

| Status | Chinese Label | Meaning |
|--------|---------------|---------|
| 🟢 Idle | 閒置 | No tasks in queue |
| 🟡 Running | 運行中 | Tasks queued, waiting |
| 🔵 Generating | 算圖中 | Actively rendering |
| ⚫ Disconnected | 未連接 | Offline / reconnecting |

---

## 🚀 Quick Start

### Requirements

- **OS**: Windows 10 / 11
- **Node.js**: v20.x or higher ([download](https://nodejs.org/))
- **Network**: LAN access to your ComfyUI nodes

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/tackcrypto1031/comfyui_monitor-to-notion.git
cd comfyui_monitor-to-notion

# 2. Install dependencies
npm install

# 3. Run in development mode
npm run electron:dev
```

### Build a distributable installer (Windows)

```bash
npm run electron:build
# Output: release/*.exe
```

---

## 📖 Usage

### 1. Add a ComfyUI machine

1. Click **"+ 添加機器"** (Add Machine) in the top-right corner
2. Fill in:
   - **Name** — e.g. `GPU-01`
   - **IP Address** — e.g. `192.168.1.100`
   - **Port** — default `8188`
3. Click **"添加"** (Add)

### 2. Set up Notion sync

1. Click **"⚙️ 設定"** (Settings)
2. Go to the **"Notion 整合"** tab
3. Enter your **Notion Integration Token** and **Database ID**
4. Click **"測試連接"** (Test Connection)
5. Click **"儲存配置"** (Save Config)

> **How to get your Notion token & database ID** → see [docs/notion-setup.md](docs/notion-setup.md)

The tool will auto-create the required columns in your Notion database on first connection.

### Notion Database Columns (auto-created)

| Column | Type | Description |
|--------|------|-------------|
| Name (title) | Title | Machine name |
| 狀態 | Select | Current status (繁中) |
| 前狀態 | Select | Previous status |
| 連接狀態 | Select | Connection status |
| IP 位置 | Text | IP:Port |
| 時間戳記 | Date | Timestamp of the change |

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| App framework | Electron 28 |
| Frontend | React 19 + TypeScript |
| Build | Vite 5 |
| WebSocket | ws 8 |
| Notion API | @notionhq/client 5 |
| Tests | Vitest |

---

## 📁 Project Structure

```
comfyui_monitor-to-notion/
├── src/
│   ├── main/          # Electron main process + IPC
│   ├── renderer/      # React UI (components, styles)
│   ├── services/      # Core services (WebSocket, Notion, Status engine)
│   ├── shared/        # Shared IPC types
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utilities (Logger, RetryStrategy, Throttler)
├── tests/             # Unit & integration tests
├── docs/              # Documentation
└── templates/         # Notion database template
```

---

## 📊 Performance

| Metric | Target | Measured |
|--------|--------|---------|
| Max machines | 20 | 20 ✓ |
| RAM (10 machines) | < 500MB | ~180MB ✓ |
| CPU (idle) | < 5% | ~2% ✓ |
| CPU (active) | < 20% | ~8% ✓ |
| Status update latency | < 500ms | ~50ms ✓ |
| Reconnect time | < 30s | 5-15s ✓ |

*Tested on: Windows 11, Intel i7, 16GB RAM, 10 ComfyUI nodes*

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch: `git checkout -b feature/MyFeature`
3. Commit your changes: `git commit -m 'Add MyFeature'`
4. Push to the branch: `git push origin feature/MyFeature`
5. Open a Pull Request

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---
---

<a name="繁體中文"></a>
# 🖥️ ComfyUI Monitor → Notion（繁體中文）

一個輕量的桌面工具（Electron），可即時監控內網中多台 **ComfyUI** 節點的狀態，並自動同步記錄到 **Notion** 資料庫。

---

## ✨ 功能特色

| 功能 | 說明 |
|---|---|
| 🖥️ **多機器監控** | 最多同時監控 20 台 ComfyUI 節點 |
| ⚡ **即時更新** | WebSocket + HTTP 輪詢，延遲 < 100ms |
| 🔌 **自動重連** | 指數退避重連（1s → 30s），附 30% 抖動 |
| 📝 **Notion 同步** | 狀態變化自動以繁體中文寫入 Notion |
| 🎨 **直觀介面** | 顏色區分狀態卡片，底部狀態列摘要 |

### 狀態說明（Notion 上顯示）

| 內部狀態 | Notion 標籤 | 說明 |
|----------|------------|------|
| 🟢 idle | 閒置 | 無任務 |
| 🟡 running | 運行中 | 有任務在隊列 |
| 🔵 generating | 算圖中 | 正在生成 |
| ⚫ disconnected | 未連接 | 離線 / 重連中 |

---

## 🚀 快速開始

### 系統需求

- **作業系統**：Windows 10 / 11
- **Node.js**：v20.x 或更高（[下載](https://nodejs.org/)）
- **網路**：能存取 ComfyUI 節點的內網

### 安裝步驟

```bash
# 1. 克隆專案
git clone https://github.com/tackcrypto1031/comfyui_monitor-to-notion.git
cd comfyui_monitor-to-notion

# 2. 安裝依賴
npm install

# 3. 開發模式執行
npm run electron:dev
```

### 打包成 Windows 安裝程式

```bash
npm run electron:build
# 輸出：release/*.exe
```

---

## 📖 使用說明

### 1. 新增 ComfyUI 機器

1. 點擊右上角 **「+ 添加機器」**
2. 填入：
   - **名稱**：例如 `GPU-01`
   - **IP 位址**：例如 `192.168.1.100`
   - **埠號**：預設 `8188`
3. 點擊 **「添加」**

### 2. 設定 Notion 同步

1. 點擊 **「⚙️ 設定」**
2. 選擇 **「Notion 整合」** 頁籤
3. 填入 **Notion Integration Token** 與 **Database ID**
4. 點擊 **「測試連接」** 驗證
5. 點擊 **「儲存配置」**

> 如何取得 Notion Token 與 Database ID，請參考 [docs/notion-setup.md](docs/notion-setup.md)

首次連接時，工具會自動在 Notion 資料庫中建立所需欄位。

### Notion 資料庫欄位（自動建立）

| 欄位 | 類型 | 說明 |
|------|------|------|
| Name（標題）| Title | 機器名稱 |
| 狀態 | Select | 目前狀態（繁中） |
| 前狀態 | Select | 前一個狀態 |
| 連接狀態 | Select | 連接狀態 |
| IP 位置 | Text | IP:Port |
| 時間戳記 | Date | 狀態變化時間 |

---

## 🔧 技術棧

| 類別 | 技術 |
|------|------|
| 應用框架 | Electron 28 |
| 前端 | React 19 + TypeScript |
| 建置工具 | Vite 5 |
| WebSocket | ws 8 |
| Notion API | @notionhq/client 5 |
| 測試框架 | Vitest |

---

## 📁 專案結構

```
comfyui_monitor-to-notion/
├── src/
│   ├── main/          # Electron 主進程 + IPC
│   ├── renderer/      # React UI（元件、樣式）
│   ├── services/      # 核心服務（WebSocket、Notion、狀態引擎）
│   ├── shared/        # 共用 IPC 類型
│   ├── types/         # TypeScript 型別定義
│   └── utils/         # 工具函數（Logger、RetryStrategy、Throttler）
├── tests/             # 單元測試與整合測試
├── docs/              # 文件
└── templates/         # Notion 資料庫範本
```

---

## 📊 效能數據

| 指標 | 目標 | 實測 |
|------|------|------|
| 最大連接數 | 20 台 | 20 台 ✓ |
| 記憶體（10 台）| < 500MB | ~180MB ✓ |
| CPU（閒置）| < 5% | ~2% ✓ |
| CPU（活躍）| < 20% | ~8% ✓ |
| 狀態更新延遲 | < 500ms | ~50ms ✓ |
| 重連時間 | < 30s | 5-15s ✓ |

*測試環境：Windows 11、Intel i7、16GB RAM、10 台 ComfyUI 節點*

---

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

1. Fork 本專案
2. 建立功能分支：`git checkout -b feature/MyFeature`
3. 提交變更：`git commit -m 'Add MyFeature'`
4. 推送分支：`git push origin feature/MyFeature`
5. 開啟 Pull Request

---

## 📄 授權

MIT — 詳見 [LICENSE](LICENSE)

---

*Made with ❤️ for the ComfyUI community*
