# Plan: Phase 1 - WebSocket 連接基礎

**Phase Goal:** 建立與多台 ComfyUI 的 WebSocket 連接能力，能正確識別三種狀態

**Success Criteria:**
1. 可以添加至少 5 台電腦的 IP+ 埠號配置
2. 成功建立 WebSocket 連接到 ComfyUI
3. 正確解析 WebSocket 訊息並識別三種狀態
4. 同時維持 5 個以上 WebSocket 連接不崩潰
5. 狀態識別準確率 100%

---

## Task 1.1: 專案初始化

**Goal:** 建立 Electron 專案基礎結構

**Tasks:**
- [ ] 使用 npm init 建立專案
- [ ] 安裝 Electron 依賴
- [ ] 建立基礎目錄結構 (src/main, src/renderer, src/services)
- [ ] 建立 package.json  scripts
- [ ] 建立 .gitignore

**Acceptance Criteria:**
- `npm install` 成功
- `npm start` 啟動空白 Electron 視窗
- 目錄結構清晰

---

## Task 1.2: 機器配置管理模組

**Goal:** 建立機器配置的儲存與管理系統 (CORE-01, NET-01)

**Tasks:**
- [ ] 建立 MachineConfig 類型定義 (id, name, ip, port, status, lastUpdate)
- [ ] 建立 ConfigStore 類別 (JSON 檔案儲存)
- [ ] 實作 addMachine(), removeMachine(), updateMachine(), getMachines()
- [ ] 支援至少 5 台機器配置
- [ ] 建立預設配置模板

**Acceptance Criteria:**
- 可以添加/刪除/修改機器配置
- 配置持久化儲存到 JSON 檔案
- 重啟後配置不遺失
- 支援 5+ 台機器

**Files:**
- `src/services/ConfigStore.ts`
- `src/types/MachineConfig.ts`

---

## Task 1.3: WebSocket 連接管理器

**Goal:** 實作與多台 ComfyUI 的 WebSocket 連接 (CORE-02, NET-02)

**Tasks:**
- [ ] 建立 WebSocketManager 類別
- [ ] 實作 connect(machineId, ip, port) 方法
- [ ] 實作 disconnect(machineId) 方法
- [ ] 實作 reconnect() 自動重連邏輯
- [ ] 維護連接狀態 (connecting, connected, disconnected, error)
- [ ] 每台機器獨立 WebSocket 實例
- [ ] 心跳檢測機制 (每 30 秒 ping)

**ComfyUI WebSocket Protocol:**
- URL: `ws://{ip}:{port}/ws?clientId={uniqueId}`
- 消息類型：execution_start, executing, executed, status, progress, execution_success, execution_error
- 使用 status 消息的 queue_remaining 判斷隊列狀態

**Acceptance Criteria:**
- 成功連接到 ComfyUI WebSocket
- 維持 5+ 個同時連接
- 斷線後自動重連 (指數退避：1s, 2s, 4s, 8s, 16s, 30s)
- 連接狀態可查詢

**Files:**
- `src/services/WebSocketManager.ts`
- `src/types/ConnectionStatus.ts`

---

## Task 1.4: 狀態識別引擎

**Goal:** 根據 WebSocket 消息識別三種狀態 (CORE-03)

**Tasks:**
- [ ] 建立 StatusEngine 類別
- [ ] 監聽 status 消息 (queue_remaining)
- [ ] 監聽 executing 消息 (當前執行節點)
- [ ] 定義狀態判斷邏輯:
  - **Idle (閒置中)**: queue_remaining = 0 且無 executing 節點
  - **Running (運行中)**: queue_remaining > 0 或有 executing 節點
  - **Generating (算圖中)**: executing 節點正在執行且 progress > 0
- [ ] 狀態變化時發送事件通知
- [ ] 狀態歷史記錄 (用於調試)

**State Machine:**
```
Idle ──(queue_remaining > 0)──> Running
Running ──(executing + progress)──> Generating
Generating ──(execution_success)──> Running
Running ──(queue_remaining = 0)──> Idle
```

**Acceptance Criteria:**
- 三種狀態識別準確
- 狀態變化即時 (<100ms)
- 無誤判 (Idle 不會顯示為 Running)
- 狀態變化事件可被訂閱

**Files:**
- `src/services/StatusEngine.ts`
- `src/types/MachineStatus.ts`

---

## Task 1.5: 事件匯流排系統

**Goal:** 建立內部事件通訊機制

**Tasks:**
- [ ] 建立 EventBus 類別
- [ ] 實作 on(event, handler), emit(event, data), off(event, handler)
- [ ] 定義事件類型:
  - `machine:status-change` - 狀態變化
  - `machine:connected` - 連接成功
  - `machine:disconnected` - 連接斷開
  - `machine:error` - 連接錯誤
  - `config:updated` - 配置更新
- [ ] 類型安全的事件定義

**Acceptance Criteria:**
- 事件訂閱/發布正常
- 無記憶體洩漏 (off 後釋放)
- 事件參數類型正確

**Files:**
- `src/services/EventBus.ts`
- `src/types/Events.ts`

---

## Task 1.6: 基礎日誌與調試

**Goal:** 建立日誌系統用於調試

**Tasks:**
- [ ] 建立 Logger 類別
- [ ] 實作 debug, info, warn, error 等級
- [ ] WebSocket 消息收發日誌
- [ ] 狀態變化日誌
- [ ] 日誌輸出到控制台
- [ ] 可選日誌級別配置

**Acceptance Criteria:**
- 日誌清晰可讀
- 包含時間戳記
- 可追蹤 WebSocket 消息流
- 可調整日誌級別

**Files:**
- `src/utils/Logger.ts`

---

## Task 1.7: 整合測試

**Goal:** 驗證所有模組整合運作

**Tasks:**
- [ ] 建立測試腳本
- [ ] 模擬 5 台機器連接
- [ ] 驗證狀態識別準確性
- [ ] 測試斷線重連
- [ ] 測試長時間運行穩定性 (10 分鐘)
- [ ] 記憶體使用監控

**Acceptance Criteria:**
- 5 台機器同時連接穩定
- 狀態識別 100% 準確
- 斷線後 30 秒內重連
- 無記憶體洩漏

**Files:**
- `tests/websocket-integration.test.ts`

---

## Dependencies

```
Task 1.1 (專案初始化)
    ↓
Task 1.2 (配置管理) ──→ Task 1.3 (WebSocket 連接)
    ↓                        ↓
Task 1.5 (事件匯流排) ←── Task 1.4 (狀態識別)
    ↓
Task 1.6 (日誌系統)
    ↓
Task 1.7 (整合測試)
```

## Files Structure

```
src/
├── main/
│   └── main.ts              # Electron main process
├── renderer/
│   └── (Phase 2)            # GUI in Phase 2
├── services/
│   ├── ConfigStore.ts       # Task 1.2
│   ├── WebSocketManager.ts  # Task 1.3
│   ├── StatusEngine.ts      # Task 1.4
│   └── EventBus.ts          # Task 1.5
├── types/
│   ├── MachineConfig.ts     # Task 1.2
│   ├── MachineStatus.ts     # Task 1.4
│   ├── ConnectionStatus.ts  # Task 1.3
│   └── Events.ts            # Task 1.5
└── utils/
    └── Logger.ts            # Task 1.6

tests/
└── websocket-integration.test.ts  # Task 1.7
```

## Tech Stack

- **Runtime**: Node.js 20.x
- **Framework**: Electron 28.x
- **Language**: TypeScript 5.x
- **Build**: Vite + esbuild
- **WebSocket**: ws (npm package)
- **Testing**: Vitest

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| 秋葉整合包 WebSocket URL 不同 | High | Task 1.3 優先測試實際連接 |
| 狀態判斷邏輯不準確 | High | Task 1.7 充分測試驗證 |
| 多連接記憶體洩漏 | Medium | Task 1.7 記憶體監控 |
| 重連邏輯過於積極 | Medium | 實作指數退避 |

---
*Plan created: 2026-03-16*
*Ready for execution*
