# ComfyUI 內網監控工具

## What This Is

一個 Electron 桌面應用程式，用於監控內網中多台運行秋葉整合包的 ComfyUI 電腦的運行狀態 (運行中/閒置中/算圖中),並通過 WebSocket 即時接收狀態變化，自動同步到 Notion 資料庫中。

## Core Value

即時、準確地監控內網多台 ComfyUI 電腦的狀態變化，並自動記錄到 Notion 形成可追溯的運行歷史。

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **CORE-01**: 工具可以添加多台內網 ComfyUI 電腦 (IP+ 埠號)
- [ ] **CORE-02**: 通過 WebSocket 連接遠端 ComfyUI 並接收即時狀態推送
- [ ] **CORE-03**: 識別三種狀態：運行中 (Running)、閒置中 (Idle)、算圖中 (Generating)
- [ ] **CORE-04**: 狀態變化時即時更新本地 GUI 介面顯示
- [ ] **CORE-05**: 狀態變化時自動呼叫 Notion API 更新資料庫記錄
- [ ] **GUI-01**: Electron 桌面應用顯示所有監控電腦的狀態列表
- [ ] **GUI-02**: 每台電腦顯示：IP 位置、當前狀態、最後更新時間
- [ ] **GUI-03**: 狀態以不同顏色區分 (運行中/閒置中/算圖中)
- [ ] **NOTION-01**: 建立 Notion 資料庫結構 (電腦名稱、狀態、時間戳記、IP)
- [ ] **NOTION-02**: 每次狀態變化自動建立 Notion 頁面記錄
- [ ] **NET-01**: 支援監控 5 台以上內網電腦
- [ ] **NET-02**: WebSocket 斷線自動重連機制

### Out of Scope

- 遠端控制 ComfyUI 執行任務 — 只監控不控制
- 資源監控 (GPU/記憶體) — 只關注三種狀態
- 日誌分析與報表 — 第一版不做複雜分析
- 雲端訪問 — 純內網環境

## Context

用戶使用秋葉 ComfyUI 整合包在內網多台 Windows 電腦上運行，需要一個本地工具來集中監控這些電腦的運行狀態。

技術環境:
- 遠端：Windows + 秋葉 ComfyUI 整合包
- 本地：Electron 桌面應用
- 通訊：WebSocket 即時推送
- 記錄：Notion API 自動同步

## Constraints

- **Tech stack**: Electron + WebSocket + Notion API
- **Network**: 純內網環境，無法訪問外部服務 (除 Notion API)
- **Scale**: 需支援 5 台以上電腦同時監控
- **ComfyUI**: 秋葉整合包，需確認其 WebSocket API 相容性

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Electron GUI | 跨平台、開發快速、用戶熟悉 | — Pending |
| WebSocket | 即時推送狀態變化，避免輪詢延遲 | — Pending |
| Notion 資料庫 | 用戶現有工作流程使用 Notion | — Pending |
| 狀態簡化 | 只監控三種核心狀態，不做資源監控 | — Pending |

---
*Last updated: 2026-03-16 after initialization*
