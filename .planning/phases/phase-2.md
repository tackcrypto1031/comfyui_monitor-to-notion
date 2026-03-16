# Plan: Phase 2 - GUI 介面與狀態顯示

**Phase Goal:** 完成 Electron 桌面應用，即時顯示所有監控電腦的狀態

**Success Criteria:**
1. Electron 應用正常啟動並顯示主介面
2. 狀態列表即時更新 (延遲<1 秒)
3. 三種狀態以不同顏色清晰區分
4. 用戶可以添加/刪除/編輯監控電腦
5. 斷線後自動重連並顯示連接狀態
6. 連接失敗時顯示明確錯誤訊息

---

## Task 2.1: IPC 通訊橋接

**Goal:** 建立 Main 與 Renderer 進程間的通訊機制

**Tasks:**
- [ ] 定義 IPC 通道常數
- [ ] 實作 Main 到 Renderer 的狀態推送
- [ ] 實作 Renderer 到 Main 的操作請求
- [ ] 建立類型安全的 IPC 介面
- [ ] 實作 preload.ts 中的 contextBridge

**IPC Channels:**
- `machines:get` - 獲取所有機器列表
- `machines:add` - 添加機器
- `machines:remove` - 刪除機器
- `machines:update` - 更新機器
- `machines:status-update` - 狀態變化推送 (Main → Renderer)
- `machines:connect` - 連接機器
- `machines:disconnect` - 斷開機器

**Acceptance Criteria:**
- IPC 通道定義完整
- 雙向通訊正常
- 類型安全 (TypeScript)
- 無安全漏洞 (contextIsolation enabled)

**Files:**
- `src/main/ipc.ts` (new)
- `src/shared/ipc-types.ts` (new)
- Update `src/main/preload.ts`

---

## Task 2.2: 狀態管理 (Renderer)

**Goal:** 建立前端狀態管理系統

**Tasks:**
- [ ] 建立 MachineStore 類別 (frontend state)
- [ ] 實作機器列表的增刪改查
- [ ] 訂閱 IPC 狀態更新事件
- [ ] 實作狀態變化回調
- [ ] 建立 React 相容的 hooks

**State Structure:**
```typescript
interface MachineState {
  id: string;
  name: string;
  ip: string;
  port: number;
  status: 'idle' | 'running' | 'generating';
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastUpdate?: number;
  errorMessage?: string;
}
```

**Acceptance Criteria:**
- 狀態變化即時反映 (<100ms)
- 支援響應式更新
- 記憶體洩漏防護

**Files:**
- `src/renderer/store/MachineStore.ts`
- `src/renderer/hooks/useMachines.ts`

---

## Task 2.3: 主介面佈局

**Goal:** 建立應用主介面結構

**Tasks:**
- [ ] 建立 App 組件結構
- [ ] 實作 Header (標題 + 全局操作)
- [ ] 實作 MachineList (機器列表)
- [ ] 實作 MachineCard (單個機器卡片)
- [ ] 實作 StatusBar (底部狀態列)
- [ ] 建立 CSS 樣式系統

**Layout:**
```
┌─────────────────────────────────────────┐
│ Header                                  │
│ ComfyUI Monitor [+ Add Machine]         │
├─────────────────────────────────────────┤
│ Machine List                            │
│ ┌─────────────────────────────────┐     │
│ │ Machine 1  [Status] [Actions]   │     │
│ │ 192.168.1.100:8188  Last: 2s    │     │
│ ├─────────────────────────────────┤     │
│ │ Machine 2  [Status] [Actions]   │     │
│ │ 192.168.1.101:8188  Last: 5s    │     │
│ └─────────────────────────────────┘     │
├─────────────────────────────────────────┤
│ Status Bar: 3 machines | 2 connected    │
└─────────────────────────────────────────┘
```

**Acceptance Criteria:**
- 響應式佈局
- 清晰的視覺層級
- 流暢的滾動體驗

**Files:**
- `src/renderer/components/App.tsx`
- `src/renderer/components/Header.tsx`
- `src/renderer/components/MachineList.tsx`
- `src/renderer/components/MachineCard.tsx`
- `src/renderer/components/StatusBar.tsx`
- `src/renderer/styles/index.css`

---

## Task 2.4: 狀態視覺化

**Goal:** 實作三種狀態的顏色區分與圖示

**Tasks:**
- [ ] 定義狀態顏色系統
- [ ] 實作狀態徽章 (Status Badge)
- [ ] 實作狀態圖示
- [ ] 添加狀態變化動畫
- [ ] 實作連接狀態指示器

**Color System:**
- **Idle (閒置中)**: 🟢 Green (#22c55e)
- **Running (運行中)**: 🟡 Yellow (#eab308)
- **Generating (算圖中)**: 🔵 Blue (#3b82f6)
- **Disconnected (離線)**: ⚫ Gray (#6b7280)
- **Error (錯誤)**: 🔴 Red (#ef4444)

**Acceptance Criteria:**
- 狀態顏色清晰可辨
- 色盲友善 (不只靠顏色)
- 狀態變化有視覺反馈
- 圖示語意明確

**Files:**
- `src/renderer/components/StatusBadge.tsx`
- `src/renderer/components/ConnectionIndicator.tsx`
- `src/renderer/styles/status.css`

---

## Task 2.5: 添加/編輯機器對話框

**Goal:** 實作機器配置的 GUI 介面

**Tasks:**
- [ ] 實作 Modal 組件
- [ ] 實作表單驗證
- [ ] 添加機器表單 (名稱、IP、埠號)
- [ ] 編輯機器表單
- [ ] 刪除確認對話框
- [ ] 表單錯誤提示

**Form Fields:**
- Name (必填，1-50 字元)
- IP Address (必填，IPv4 格式驗證)
- Port (必填，1-65535)

**Acceptance Criteria:**
- 表單驗證完整
- 錯誤提示清晰
- 操作流暢
- 無縫整合現有配置系統

**Files:**
- `src/renderer/components/Modal.tsx`
- `src/renderer/components/MachineForm.tsx`
- `src/renderer/components/ConfirmDialog.tsx`

---

## Task 2.6: 自動重連視覺反馈

**Goal:** 實作連接狀態的即時顯示與重連進度

**Tasks:**
- [ ] 監聽連接狀態變化事件
- [ ] 實作重連倒數顯示
- [ ] 實作連接進度指示器
- [ ] 錯誤訊息氣泡提示
- [ ] 手動重連按鈕

**Connection States:**
- `disconnected` - 灰色，顯示「未連接」
- `connecting` - 黃色，顯示「連接中...」+ 旋轉圖示
- `connected` - 綠色，顯示「已連接」
- `error` - 紅色，顯示錯誤訊息 + 重連按鈕

**Acceptance Criteria:**
- 連接狀態即時更新
- 重連進度可見
- 錯誤訊息明確
- 用戶可手動觸發重連

**Files:**
- `src/renderer/components/ReconnectIndicator.tsx`
- `src/renderer/components/Toast.tsx`

---

## Task 2.7: 整合測試 (GUI)

**Goal:** 驗證 GUI 功能正常運作

**Tasks:**
- [ ] 建立 GUI 測試腳本
- [ ] 測試機器列表渲染
- [ ] 測試狀態變化更新
- [ ] 測試添加/刪除機器
- [ ] 測試連接/斷開功能
- [ ] 視覺回歸測試

**Acceptance Criteria:**
- 所有 GUI 組件渲染正確
- 狀態更新延遲 <1 秒
- 用戶操作流程順暢
- 無明顯 UI bug

**Files:**
- `tests/gui-integration.test.ts`

---

## Dependencies

```
Task 2.1 (IPC 通訊)
    ↓
Task 2.2 (狀態管理)
    ↓
Task 2.3 (主介面) ──→ Task 2.4 (狀態視覺化)
    ↓                        ↓
Task 2.5 (表單對話框) ←── Task 2.6 (重連反馈)
    ↓
Task 2.7 (GUI 測試)
```

## Files Structure (Phase 2)

```
src/
├── main/
│   ├── main.ts
│   ├── preload.ts
│   └── ipc.ts                 # NEW
├── renderer/
│   ├── index.html
│   ├── main.tsx               # NEW (React entry)
│   ├── components/
│   │   ├── App.tsx            # NEW
│   │   ├── Header.tsx         # NEW
│   │   ├── MachineList.tsx    # NEW
│   │   ├── MachineCard.tsx    # NEW
│   │   ├── StatusBar.tsx      # NEW
│   │   ├── StatusBadge.tsx    # NEW
│   │   ├── ConnectionIndicator.tsx  # NEW
│   │   ├── Modal.tsx          # NEW
│   │   ├── MachineForm.tsx    # NEW
│   │   ├── ConfirmDialog.tsx  # NEW
│   │   ├── ReconnectIndicator.tsx  # NEW
│   │   └── Toast.tsx          # NEW
│   ├── store/
│   │   └── MachineStore.ts    # NEW
│   ├── hooks/
│   │   └── useMachines.ts     # NEW
│   └── styles/
│       ├── index.css          # NEW
│       └── status.css         # NEW
├── shared/
│   └── ipc-types.ts           # NEW
├── services/
│   ├── ConfigStore.ts
│   ├── WebSocketManager.ts
│   ├── StatusEngine.ts
│   └── EventBus.ts
├── types/
│   └── MachineConfig.ts
└── utils/
    └── Logger.ts

tests/
├── websocket-integration.test.ts
└── gui-integration.test.ts    # NEW
```

## Tech Stack Additions (Phase 2)

- **UI Framework**: React 18.x
- **Styling**: CSS Modules / Tailwind CSS
- **State Management**: Custom store + React hooks
- **Build**: Vite (already configured)
- **Testing**: @testing-library/react + jsdom

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| React 學習曲線 | Medium | 使用簡單 hooks 模式，避免複雜 state |
| IPC 通訊延遲 | Medium | 使用事件驅動，避免輪詢 |
| 狀態同步問題 | High | 單一資料來源 (ConfigStore) |
| CSS 樣式衝突 | Low | 使用 CSS Modules 或 BEM 命名 |
| 記憶體洩漏 | Medium | useEffect cleanup，事件監聽移除 |

## Design Principles

1. **即時性**: 狀態變化 <1 秒反映到 UI
2. **清晰性**: 狀態顏色、圖示語意明確
3. **響應性**: 用戶操作立即反馈
4. **穩定性**: 錯誤處理完善，不崩潰
5. **簡潔性**: 介面簡潔，功能聚焦

---
*Plan created: 2026-03-16*
*Ready for execution*
