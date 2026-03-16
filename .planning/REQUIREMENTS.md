# Requirements: ComfyUI 內網監控工具

**Defined:** 2026-03-16
**Core Value:** 即時、準確地監控內網多台 ComfyUI 電腦的狀態變化，並自動記錄到 Notion 形成可追溯的運行歷史。

## v1 Requirements

### Core Monitoring

- [ ] **CORE-01**: 工具可以添加多台內網 ComfyUI 電腦 (IP+ 埠號)
- [ ] **CORE-02**: 通過 WebSocket 連接遠端 ComfyUI 並接收即時狀態推送
- [ ] **CORE-03**: 識別三種狀態：運行中 (Running)、閒置中 (Idle)、算圖中 (Generating)
- [ ] **CORE-04**: 狀態變化時即時更新本地 GUI 介面顯示
- [ ] **CORE-05**: 狀態變化時自動呼叫 Notion API 更新資料庫記錄
- [ ] **CORE-06**: WebSocket 斷線後自動重連

### GUI Interface

- [ ] **GUI-01**: Electron 桌面應用顯示所有監控電腦的狀態列表
- [ ] **GUI-02**: 每台電腦顯示：IP 位置、當前狀態、最後更新時間
- [ ] **GUI-03**: 狀態以不同顏色區分 (運行中/閒置中/算圖中)
- [ ] **GUI-04**: 可添加/刪除/編輯監控的電腦
- [ ] **GUI-05**: 顯示連接狀態 (已連接/連接中/離線)

### Notion Integration

- [ ] **NOTION-01**: 建立 Notion 資料庫結構 (電腦名稱、狀態、時間戳記、IP)
- [ ] **NOTION-02**: 每次狀態變化自動建立 Notion 頁面記錄
- [ ] **NOTION-03**: 支援 Notion API Token 配置
- [ ] **NOTION-04**: 資料庫 ID 配置與驗證

### Network & Scale

- [ ] **NET-01**: 支援監控 5 台以上內網電腦
- [ ] **NET-02**: 每台電腦獨立 WebSocket 連接
- [ ] **NET-03**: 連接失敗時顯示錯誤訊息

## v2 Requirements

### History & Analytics

- **HIST-01**: 查看單台電腦的歷史狀態記錄
- **HIST-02**: 統計報表 (運行時長、任務數量、失敗率)
- **HIST-03**: 匯出歷史資料為 CSV

### Advanced Features

- **ADV-01**: 自訂狀態通知 (桌面通知/聲音)
- **ADV-02**: 狀態變化規則設定 (特定狀態時發送通知)
- **ADV-03**: 多用戶權限管理

## Out of Scope

| Feature | Reason |
|---------|--------|
| 遠端控制 ComfyUI 執行任務 | 只監控不控制，保持簡單 |
| 資源監控 (GPU/記憶體/溫度) | 第一版只關注三種核心狀態 |
| 日誌分析與複雜報表 | 核心價值是狀態監控，非分析 |
| 雲端訪問 | 純內網環境設計 |
| 手機 App | 桌面應用優先 |
| 自動任務排程 | 非監控工具核心功能 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 1 | ✓ Complete |
| CORE-02 | Phase 1 | ✓ Complete |
| CORE-03 | Phase 1 | ✓ Complete |
| CORE-04 | Phase 2 | Pending |
| CORE-05 | Phase 3 | Pending |
| CORE-06 | Phase 2 | Pending |
| GUI-01 | Phase 2 | Pending |
| GUI-02 | Phase 2 | Pending |
| GUI-03 | Phase 2 | Pending |
| GUI-04 | Phase 2 | Pending |
| GUI-05 | Phase 2 | Pending |
| NOTION-01 | Phase 3 | Pending |
| NOTION-02 | Phase 3 | Pending |
| NOTION-03 | Phase 3 | Pending |
| NOTION-04 | Phase 3 | Pending |
| NET-01 | Phase 1 | ✓ Complete |
| NET-02 | Phase 1 | ✓ Complete |
| NET-03 | Phase 2 | Pending |
| Phase 4-6 | Phase 4-6 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after initial definition*
