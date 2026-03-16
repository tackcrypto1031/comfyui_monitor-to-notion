# Plan: Phase 3 - Notion 整合

**Phase Goal:** 完成 Notion API 串接，狀態變化時自動記錄到 Notion 資料庫

**Success Criteria:**
1. 用戶可配置 Notion API Token 和資料庫 ID
2. 成功連接 Notion API 並驗證權限
3. 狀態變化時自動建立 Notion 頁面
4. Notion 記錄包含：電腦名稱、狀態、時間戳記、IP
5. API 錯誤處理完善 (rate limit、權限不足等)

---

## Task 3.1: Notion API 客戶端

**Goal:** 建立 Notion API 封裝客戶端

**Tasks:**
- [ ] 安裝 @notionhq/client 套件
- [ ] 建立 NotionClient 類別
- [ ] 實作 init(token, databaseId) 方法
- [ ] 實作 testConnection() 驗證方法
- [ ] 實作 createPage(properties) 方法
- [ ] 實作 updatePage(pageId, properties) 方法
- [ ] 實作 queryDatabase(filter) 方法
- [ ] 錯誤處理與重試邏輯

**Notion API Properties:**
```typescript
interface NotionPageProperties {
  '機器名稱': { title: [{ text: { content: string } }] };
  '狀態': { select: { name: 'idle' | 'running' | 'generating' } };
  'IP 位置': { rich_text: [{ text: { content: string } }] };
  '時間戳記': { date: { start: string } };
  '連接狀態': { select: { name: 'connected' | 'disconnected' | 'error' } };
}
```

**Acceptance Criteria:**
- API 客戶端初始化成功
- 連接測試通過
- CRUD 操作正常
- 錯誤處理完善

**Files:**
- `src/services/NotionClient.ts`

---

## Task 3.2: 配置管理 (Notion)

**Goal:** 實作 Notion 配置的儲存與管理

**Tasks:**
- [ ] 擴展 ConfigStore 支援 Notion 配置
- [ ] 實作 setNotionConfig(token, databaseId) 方法
- [ ] 實作 getNotionConfig() 方法
- [ ] 實作 validateNotionConfig() 驗證方法
- [ ] 配置持久化 (加密儲存 token)
- [ ] IPC 通道暴露配置方法

**Config Structure:**
```typescript
interface NotionConfig {
  token: string;
  databaseId: string;
  validated: boolean;
  lastValidated?: number;
}
```

**Acceptance Criteria:**
- 配置安全儲存
- 驗證邏輯正確
- 配置可讀取/更新

**Files:**
- `src/services/ConfigStore.ts` (update)
- `src/shared/ipc-types.ts` (update)

---

## Task 3.3: 狀態變化記錄器

**Goal:** 實作狀態變化時自動記錄到 Notion

**Tasks:**
- [ ] 建立 NotionLogger 類別
- [ ] 訂閱 machine:status-change 事件
- [ ] 實作 logStatusChange(machine, previousStatus, newStatus) 方法
- [ ] 建立 Notion 頁面結構
- [ ] 實作批次記錄 (避免 rate limit)
- [ ] 失敗重試機制

**Page Content:**
```typescript
{
  parent: { database_id: databaseId },
  properties: {
    '機器名稱': { title: [{ text: { content: machine.name } }] },
    '狀態': { select: { name: newStatus } },
    'IP 位置': { rich_text: [{ text: { content: `${machine.ip}:${machine.port}` } }] },
    '時間戳記': { date: { start: new Date().toISOString() } },
    '連接狀態': { select: { name: machine.connectionStatus } },
    '前狀態': { select: { name: previousStatus } },
  }
}
```

**Acceptance Criteria:**
- 狀態變化即時記錄
- Notion 頁面正確建立
- 屬性映射正確
- 無重複記錄

**Files:**
- `src/services/NotionLogger.ts`

---

## Task 3.4: Notion 配置 GUI

**Goal:** 建立 Notion 配置的 GUI 介面

**Tasks:**
- [ ] 建立 Settings 頁面/對話框
- [ ] 實作 Notion 配置表單
- [ ] Token 輸入框 (密碼類型)
- [ ] Database ID 輸入框
- [ ] 驗證按鈕與狀態顯示
- [ ] 儲存/取消按鈕

**UI Components:**
- SettingsModal.tsx
- NotionConfigForm.tsx
- ConnectionStatusIndicator.tsx

**Acceptance Criteria:**
- 表單驗證完整
- 驗證流程清晰
- 錯誤提示明確
- 用戶體驗流暢

**Files:**
- `src/renderer/components/SettingsModal.tsx`
- `src/renderer/components/NotionConfigForm.tsx`

---

## Task 3.5: Notion 資料庫模板

**Goal:** 提供 Notion 資料庫結構模板與設置教學

**Tasks:**
- [ ] 建立資料庫模板文件
- [ ] 定義屬性結構
- [ ] 建立設置教學文件
- [ ] 提供一鍵複製連結
- [ ] 建立範例頁面

**Database Properties:**
| 屬性名稱 | 類型 | 說明 |
|----------|------|------|
| 機器名稱 | Title | 機器名稱 |
| 狀態 | Select | idle/running/generating |
| IP 位置 | Rich Text | IP:Port |
| 時間戳記 | Date | 狀態變化時間 |
| 連接狀態 | Select | connected/disconnected/error |
| 前狀態 | Select | 之前的狀態 |

**Acceptance Criteria:**
- 模板文件完整
- 設置步驟清晰
- 用戶可快速建立資料庫

**Files:**
- `docs/notion-setup.md`
- `templates/notion-database-template.json`

---

## Task 3.6: API 錯誤處理

**Goal:** 實作完善的 Notion API 錯誤處理

**Tasks:**
- [ ] 實作 rate limit 處理 (429)
- [ ] 實作權限錯誤處理 (403)
- [ ] 實作無效 Token 處理 (401)
- [ ] 實作資料庫不存在處理 (404)
- [ ] 實作重試邏輯 (exponential backoff)
- [ ] 錯誤通知系統

**Error Types:**
- `NOTION_INVALID_TOKEN`: Token 無效
- `NOTION_NO_ACCESS`: 無資料庫權限
- `NOTION_NOT_FOUND`: 資料庫不存在
- `NOTION_RATE_LIMIT`: 達到速率限制
- `NOTION_NETWORK_ERROR`: 網路錯誤

**Acceptance Criteria:**
- 錯誤類型明確
- 錯誤提示友善
- 自動重試有效
- 用戶可手動修正

**Files:**
- `src/services/NotionClient.ts` (update)
- `src/utils/errors.ts`

---

## Task 3.7: 整合測試 (Notion)

**Goal:** 驗證 Notion 整合功能正常運作

**Tasks:**
- [ ] 建立 Notion 測試腳本
- [ ] 測試 API 連接
- [ ] 測試頁面建立
- [ ] 測試屬性映射
- [ ] 測試錯誤處理
- [ ] 測試 rate limit 處理

**Acceptance Criteria:**
- 所有測試通過
- API 操作正常
- 錯誤處理正確
- 效能符合要求

**Files:**
- `tests/notion-integration.test.ts`

---

## Dependencies

```
Task 3.1 (Notion API 客戶端)
    ↓
Task 3.2 (配置管理) ──→ Task 3.3 (狀態記錄器)
    ↓                        ↓
Task 3.4 (配置 GUI) ←── Task 3.5 (資料庫模板)
    ↓
Task 3.6 (錯誤處理)
    ↓
Task 3.7 (整合測試)
```

## Files Structure (Phase 3)

```
src/
├── main/
│   ├── main.ts (update)
│   ├── preload.ts (update)
│   └── ipc.ts (update)
├── renderer/
│   ├── components/
│   │   ├── App.tsx (update)
│   │   ├── SettingsModal.tsx         # NEW
│   │   └── NotionConfigForm.tsx      # NEW
│   └── styles/
│       └── index.css (update)
├── services/
│   ├── ConfigStore.ts (update)
│   ├── NotionClient.ts               # NEW
│   └── NotionLogger.ts               # NEW
├── shared/
│   └── ipc-types.ts (update)
├── utils/
│   └── errors.ts                     # NEW
└── types/
    └── MachineConfig.ts (update)

docs/
└── notion-setup.md                   # NEW

templates/
└── notion-database-template.json     # NEW

tests/
└── notion-integration.test.ts        # NEW
```

## Tech Stack Additions (Phase 3)

- **Notion SDK**: @notionhq/client
- **Encryption**: crypto (Node.js built-in) for token storage
- **HTTP**: Built-in fetch (Node 18+)

## Notion Database Schema

```json
{
  "title": "ComfyUI 監控記錄",
  "properties": {
    "機器名稱": { "type": "title" },
    "狀態": { 
      "type": "select",
      "select": {
        "options": [
          { "name": "idle", "color": "green" },
          { "name": "running", "color": "yellow" },
          { "name": "generating", "color": "blue" }
        ]
      }
    },
    "IP 位置": { "type": "rich_text" },
    "時間戳記": { "type": "date" },
    "連接狀態": {
      "type": "select",
      "select": {
        "options": [
          { "name": "connected", "color": "green" },
          { "name": "disconnected", "color": "gray" },
          { "name": "error", "color": "red" }
        ]
      }
    },
    "前狀態": {
      "type": "select",
      "select": {
        "options": [
          { "name": "idle", "color": "green" },
          { "name": "running", "color": "yellow" },
          { "name": "generating", "color": "blue" }
        ]
      }
    }
  }
}
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Notion API rate limit | Medium | 實作批次處理 + 排隊機制 |
| Token 洩漏 | High | 加密儲存 + 不輸出日誌 |
| 資料庫結構變更 | Medium | 版本檢測 + 相容性處理 |
| 網路不穩定 | Medium | 重試機制 + 離線緩存 |
| API 權限不足 | High | 驗證流程 + 明確錯誤提示 |

## Integration Flow

```
狀態變化 (StatusEngine)
    ↓
EventBus 發送事件
    ↓
NotionLogger 監聽事件
    ↓
NotionClient 建立頁面
    ↓
Notion 資料庫
    ↓
用戶可查看記錄
```

## Rate Limit Handling

Notion API limits:
- 3 requests/second
- 100 requests/minute (approximately)

Strategy:
1. Queue status changes
2. Batch process every 1-2 seconds
3. Exponential backoff on 429
4. Priority queue (error states first)

---
*Plan created: 2026-03-16*
*Ready for execution*
