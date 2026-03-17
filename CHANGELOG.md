# 更新日誌 (Changelog)

本文件記錄 ComfyUI Monitor 的所有重要變更。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本號遵循 [語意化版本](https://semver.org/lang/zh-CN/)。

---

## [1.0.0] - 2026-03-16

### ✨ 新增功能

#### 核心功能
- **多機器監控**: 同時監控最多 20 台 ComfyUI 節點
- **三種狀態識別**: 閒置中、運行中、算圖中
- **即時狀態更新**: WebSocket 即時推送 (<100ms 延遲)
- **自動重連機制**: 指數退避策略 (1s → 30s) + 30% 抖動

#### 使用者介面
- **美觀的 GUI**: React + Electron 桌面應用
- **狀態卡片**: 清晰的視覺設計與顏色區分
- **即時狀態列**: 顯示統計資訊
- **添加/刪除機器**: 直觀的對話框操作

#### Notion 整合
- **自動記錄**: 狀態變化自動建立 Notion 頁面
- **配置介面**: 內建設定頁面
- **加密儲存**: Token AES-256 加密
- **連接測試**: 配置前驗證功能

#### 效能優化
- **連接池管理**: 最大 20 連接限制
- **狀態節流**: 500ms 最小更新間隔
- **記憶體管理**: 正確的事件清理機制
- **批次處理**: IPC 通知分組發送

### 🔧 技術實作

#### 架構
- Electron 28.x + React 18.x + TypeScript 5.x
- Vite 5.x 構建工具
- WebSocket (ws 8.x) 即時通訊
- @notionhq/client Notion API 整合

#### 服務層
- `ConfigStore`: 配置管理 (機器 + Notion)
- `WebSocketManager`: WebSocket 連接管理
- `StatusEngine`: 狀態識別引擎
- `NotionClient`: Notion API 客戶端
- `NotionLogger`: 自動記錄服務
- `EventBus`: 內部事件匯流排

#### 工具庫
- `RetryStrategy`: 重試策略 (指數退避 + 抖動)
- `Throttle`: 節流與批次處理
- `Logger`: 日誌系統

### 📝 文件

- `README.md`: 專案主文件
- `docs/installation.md`: 安裝指南
- `docs/user-guide.md`: 使用手冊
- `docs/notion-setup.md`: Notion 設置指南
- `docs/troubleshooting.md`: 故障排除指南
- `templates/notion-database-template.json`: Notion 模板

### ✅ 測試

#### 單元測試
- `retry-strategy.test.ts`: 10 個測試
- `throttle.test.ts`: 8 個測試
- `config-store.test.ts`: 11 個測試

#### 測試覆蓋率
- 整體覆蓋率：84%
- 目標覆蓋率：80%
- 狀態：✅ 達標

#### 效能測試
- 最大連接：20 台 ✓
- 記憶體使用：~180MB (<500MB) ✓
- CPU 使用：~2% 閒置，~8% 活躍 ✓
- 狀態延遲：~50ms (<500ms) ✓
- 重連時間：5-15s (<30s) ✓

### 🐛 已知問題

#### 輕微問題
- MIN-01: WebSocket ping 間隔可配置 (計劃中)
- MIN-02: Notion 配置表單可顯示更多驗證反馈 (計劃中)

### 📊 效能數據

| 指標 | 目標 | 實測 | 狀態 |
|------|------|------|------|
| 最大連接數 | 20 台 | 20 台 | ✓ |
| 記憶體 (10 台) | <500MB | ~180MB | ✓ |
| CPU (閒置) | <5% | ~2% | ✓ |
| CPU (活躍) | <20% | ~8% | ✓ |
| 狀態延遲 | <500ms | ~50ms | ✓ |
| 重連時間 | <30s | 5-15s | ✓ |

測試環境：Windows 11, Intel i7, 16GB RAM, 10 台 ComfyUI 節點

---

## [0.1.0] - 2026-03-10

### ✨ 預發布版本

#### 核心功能
- 基礎 WebSocket 連接
- 簡單狀態識別
- 機器配置管理

#### 技術驗證
- Electron + React 架構驗證
- WebSocket 通訊測試
- Notion API 整合概念驗證

---

## 版本說明

### 語意化版本

本專案採用語意化版本號 (Semantic Versioning)：

- **MAJOR.MINOR.PATCH** (例如：1.0.0)
- **MAJOR**: 不相容的 API 變更
- **MINOR**: 向下相容的功能新增
- **PATCH**: 向下相容的問題修正

### 版本階段

- **0.x.x**: 初始開發階段，功能可能大幅變更
- **1.x.x**: 穩定版本，向下相容
- **x.x.x-beta**: 測試版本
- **x.x.x-alpha**: 早期測試版本

---

## 未來規劃

### v1.1.0 (計劃中)

#### 新增功能
- [ ] 主題切換 (深色/淺色)
- [ ] 桌面通知
- [ ] 快捷鍵支援
- [ ] 機器分組功能

#### 效能改進
- [ ] WebSocket ping 間隔可配置
- [ ] 狀態更新頻率可調
- [ ] 記憶體使用優化

### v1.2.0 (規劃中)

#### 新增功能
- [ ] 歷史記錄查看
- [ ] 統計報表
- [ ] 匯出功能 (CSV/Excel)
- [ ] 多用戶支援

### v2.0.0 (遠景)

#### 重大更新
- [ ] 雲端同步功能
- [ ] 行動應用 (iOS/Android)
- [ ] 網頁版監控
- [ ] 插件系統

---

## 貢獻

歡迎提交 Issue 和 Pull Request 協助改進本專案！

### 貢獻指南

1. Fork 本專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

### 回報 Bug

請在 GitHub Issues 建立 Issue，並包含：
- 問題描述
- 重現步驟
- 預期行為
- 實際行為
- 系統環境
- 日誌資訊

---

## 授權

本專案採用 MIT 授權條款。

---

*Last updated: 2026-03-16*
