# Roadmap: ComfyUI 內網監控工具

**Created:** 2026-03-16
**Core Value:** 即時、準確地監控內網多台 ComfyUI 電腦的狀態變化，並自動記錄到 Notion 形成可追溯的運行歷史。

## Overview

**6 phases** | **18 requirements mapped** | All v1 requirements covered ✓

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | WebSocket 連接基礎 | 建立與 ComfyUI 的 WebSocket 連接基礎架構 | CORE-01, CORE-02, CORE-03, NET-01, NET-02 | 5 項 |
| 2 | GUI 介面與狀態顯示 | 完成 Electron 桌面應用介面與即時狀態更新 | CORE-04, CORE-06, GUI-01, GUI-02, GUI-03, GUI-04, GUI-05, NET-03 | 8 項 |
| 3 | Notion 整合 | 完成 Notion API 串接與自動記錄 | CORE-05, NOTION-01, NOTION-02, NOTION-03, NOTION-04 | 5 項 |
| 4 | 連接管理優化 | 優化多機器連接管理與錯誤處理 | - | 優化階段 |
| 5 | 測試與除錯 | 完整測試與穩定性優化 | - | 測試階段 |
| 6 | 文件與發布 | 使用文件與發布準備 | - | 發布階段 |

## Phase Details

### Phase 1: WebSocket 連接基礎

**Goal:** 建立與多台 ComfyUI 的 WebSocket 連接能力，能正確識別三種狀態

**Requirements:**
- CORE-01: 工具可以添加多台內網 ComfyUI 電腦 (IP+ 埠號)
- CORE-02: 通過 WebSocket 連接遠端 ComfyUI 並接收即時狀態推送
- CORE-03: 識別三種狀態：運行中 (Running)、閒置中 (Idle)、算圖中 (Generating)
- NET-01: 支援監控 5 台以上內網電腦
- NET-02: 每台電腦獨立 WebSocket 連接

**Success Criteria:**
1. 可以添加至少 5 台電腦的 IP+ 埠號配置
2. 成功建立 WebSocket 連接到 ComfyUI
3. 正確解析 WebSocket 訊息並識別三種狀態
4. 同時維持 5 個以上 WebSocket 連接不崩潰
5. 狀態識別準確率 100%

**Deliverables:**
- WebSocket 連接管理器模組
- ComfyUI 狀態解析器
- 機器配置儲存系統
- 基礎日誌輸出

---

### Phase 2: GUI 介面與狀態顯示

**Goal:** 完成 Electron 桌面應用，即時顯示所有監控電腦的狀態

**Requirements:**
- CORE-04: 狀態變化時即時更新本地 GUI 介面顯示
- CORE-06: WebSocket 斷線後自動重連
- GUI-01: Electron 桌面應用顯示所有監控電腦的狀態列表
- GUI-02: 每台電腦顯示：IP 位置、當前狀態、最後更新時間
- GUI-03: 狀態以不同顏色區分 (運行中/閒置中/算圖中)
- GUI-04: 可添加/刪除/編輯監控的電腦
- GUI-05: 顯示連接狀態 (已連接/連接中/離線)
- NET-03: 連接失敗時顯示錯誤訊息

**Success Criteria:**
1. Electron 應用正常啟動並顯示主介面
2. 狀態列表即時更新 (延遲<1 秒)
3. 三種狀態以不同顏色清晰區分
4. 用戶可以添加/刪除/編輯監控電腦
5. 斷線後自動重連並顯示連接狀態
6. 連接失敗時顯示明確錯誤訊息

**Deliverables:**
- Electron 主應用程式
- React/Vue 前端介面
- 狀態管理系統
- 自動重連邏輯
- 錯誤處理與提示

---

### Phase 3: Notion 整合

**Goal:** 完成 Notion API 串接，狀態變化時自動記錄到 Notion 資料庫

**Requirements:**
- CORE-05: 狀態變化時自動呼叫 Notion API 更新資料庫記錄
- NOTION-01: 建立 Notion 資料庫結構 (電腦名稱、狀態、時間戳記、IP)
- NOTION-02: 每次狀態變化自動建立 Notion 頁面記錄
- NOTION-03: 支援 Notion API Token 配置
- NOTION-04: 資料庫 ID 配置與驗證

**Success Criteria:**
1. 用戶可配置 Notion API Token 和資料庫 ID
2. 成功連接 Notion API 並驗證權限
3. 狀態變化時自動建立 Notion 頁面
4. Notion 記錄包含：電腦名稱、狀態、時間戳記、IP
5. API 錯誤處理完善 (rate limit、權限不足等)

**Deliverables:**
- Notion API 整合模組
- 資料庫結構模板
- API Token 管理系統
- 狀態變化觸發記錄邏輯
- API 錯誤處理

---

### Phase 4: 連接管理優化

**Goal:** 優化多機器連接管理，提升穩定性與效能

**Requirements:**
- 優化階段 (無新增需求)

**Success Criteria:**
1. 同時監控 10+ 台電腦時 CPU/記憶體使用合理
2. WebSocket 重連邏輯完善 (指數退避)
3. 記憶體洩漏測試通過
4. 長時間運行穩定性測試 (24 小時+)

**Deliverables:**
- 連接池優化
- 記憶體管理優化
- 重連策略優化
- 效能監控日誌

---

### Phase 5: 測試與除錯

**Goal:** 完整測試確保穩定性，修復所有已知問題

**Requirements:**
- 測試階段 (無新增需求)

**Success Criteria:**
1. 所有 v1 需求測試通過
2. 無嚴重 (Critical/Major) bug
3. 用戶驗收測試通過
4. 效能指標達標

**Deliverables:**
- 測試報告
- Bug 修復清單
- 穩定性改進

---

### Phase 6: 文件與發布

**Goal:** 完成使用文件與發布準備

**Requirements:**
- 發布階段 (無新增需求)

**Success Criteria:**
1. 使用文件完整 (安裝、配置、使用教學)
2. Notion 資料庫設置教學
3. 常見問題解答 (FAQ)
4. 發布版本打包完成

**Deliverables:**
- 使用文件 (README.md)
- Notion 資料庫模板
- 安裝腳本
- 發布包

---

## Dependencies

```
Phase 1 (WebSocket 基礎)
    ↓
Phase 2 (GUI 介面) ───→ Phase 3 (Notion 整合)
    ↓
Phase 4 (優化)
    ↓
Phase 5 (測試)
    ↓
Phase 6 (發布)
```

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| 秋葉整合包 WebSocket API 不相容 | High | Phase 1 優先驗證 API 相容性 |
| Notion API rate limit | Medium | 實作請求排隊與重試機制 |
| Electron 體積過大 | Low | 使用 Tree Shaking 優化打包 |
| 多連接穩定性問題 | Medium | Phase 4 專注優化 |

---
*Roadmap created: 2026-03-16*
*Last updated: 2026-03-16 after initial definition*
