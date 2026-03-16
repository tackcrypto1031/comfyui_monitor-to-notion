# Plan: Phase 4 - 連接管理優化

**Phase Goal:** 優化多機器連接管理，提升穩定性與效能

**Success Criteria:**
1. 同時監控 10+ 台電腦時 CPU/記憶體使用合理
2. WebSocket 重連邏輯完善 (指數退避)
3. 記憶體洩漏測試通過
4. 長時間運行穩定性測試 (24 小時+)

---

## Task 4.1: 效能分析與基準測試

**Goal:** 建立效能基準，識別瓶頸

**Tasks:**
- [ ] 建立效能測試腳本
- [ ] 測量單機連接資源使用
- [ ] 測量 5 機、10 機、20 機資源使用
- [ ] 記錄 WebSocket 連接延遲
- [ ] 記錄狀態更新延遲
- [ ] 建立基準報告

**Metrics:**
- CPU 使用率 (%)
- 記憶體使用 (MB)
- WebSocket 連接時間 (ms)
- 狀態更新延遲 (ms)
- 網路流量 (KB/s)

**Acceptance Criteria:**
- 基準測試可重複執行
- 數據記錄完整
- 瓶頸識別清晰

**Files:**
- `tests/performance-benchmark.ts`
- `docs/performance-baseline.md`

---

## Task 4.2: WebSocket 連接池優化

**Goal:** 實作連接池管理，減少資源消耗

**Tasks:**
- [ ] 分析現有連接管理邏輯
- [ ] 實作連接池 (Connection Pool)
- [ ] 限制最大同時連接數
- [ ] 實作空閒連接超時
- [ ] 優化連接建立/銷毀流程
- [ ] 添加連接健康檢查

**Pool Configuration:**
```typescript
interface ConnectionPoolConfig {
  maxConnections: number;        // 最大連接數 (default: 20)
  idleTimeout: number;           // 空閒超時 (ms, default: 300000)
  healthCheckInterval: number;   // 健康檢查間隔 (ms, default: 60000)
  reconnectBaseDelay: number;    // 重連基礎延遲 (ms, default: 1000)
  reconnectMaxDelay: number;     // 重連最大延遲 (ms, default: 30000)
}
```

**Acceptance Criteria:**
- 連接數可控
- 資源使用降低
- 連接復用有效

**Files:**
- `src/services/ConnectionPool.ts`
- `src/services/WebSocketManager.ts` (update)

---

## Task 4.3: 記憶體管理優化

**Goal:** 識別並修復記憶體洩漏

**Tasks:**
- [ ] 使用 heap snapshot 分析記憶體
- [ ] 識別記憶體洩漏源
- [ ] 修復事件監聽器洩漏
- [ ] 修復閉包引用洩漏
- [ ] 優化大型物件生命週期
- [ ] 實作記憶體監控

**Common Leak Sources:**
- EventBus 監聽器未移除
- WebSocket 回調引用
- 定時器未清除
- 閉包中的大物件引用

**Acceptance Criteria:**
- 記憶體使用穩定
- 無明顯洩漏
- 長時間運行不崩潰

**Files:**
- `src/services/EventBus.ts` (update)
- `src/services/NotionLogger.ts` (update)
- `src/utils/MemoryMonitor.ts` (new)

---

## Task 4.4: 重連邏輯優化

**Goal:** 完善 WebSocket 重連機制

**Tasks:**
- [ ] 實作指數退避 (Exponential Backoff)
- [ ] 添加抖動 (Jitter) 避免同時重連
- [ ] 實作重連次數限制
- [ ] 區分錯誤類型 (可重連/不可重連)
- [ ] 添加重連進度通知
- [ ] 優化重連日誌

**Backoff Strategy:**
```typescript
function calculateDelay(attempt: number): number {
  const baseDelay = 1000;  // 1 second
  const maxDelay = 30000;  // 30 seconds
  const jitter = Math.random() * 0.3;  // 30% jitter
  
  const exponentialDelay = Math.min(
    baseDelay * Math.pow(2, attempt),
    maxDelay
  );
  
  return exponentialDelay * (1 + jitter);
}
```

**Acceptance Criteria:**
- 重連策略有效
- 避免雪崩效應
- 錯誤處理完善

**Files:**
- `src/services/WebSocketManager.ts` (update)
- `src/utils/RetryStrategy.ts` (new)

---

## Task 4.5: 狀態更新批次處理

**Goal:** 優化狀態更新頻率，減少資源消耗

**Tasks:**
- [ ] 實作狀態更新節流 (Throttle)
- [ ] 實作狀態更新去重
- [ ] 批次發送 IPC 通知
- [ ] 優化 Notion 記錄佇列
- [ ] 添加更新優先級

**Throttle Configuration:**
```typescript
interface ThrottleConfig {
  statusUpdateInterval: number;  // 狀態更新間隔 (ms, default: 500)
  ipcBatchSize: number;          // IPC 批次大小 (default: 10)
  ipcBatchDelay: number;         // IPC 批次延遲 (ms, default: 100)
}
```

**Acceptance Criteria:**
- 更新頻率合理
- UI 更新流暢
- 資源消耗降低

**Files:**
- `src/services/StatusEngine.ts` (update)
- `src/utils/Throttle.ts` (new)

---

## Task 4.6: 穩定性測試

**Goal:** 驗證優化後的穩定性

**Tasks:**
- [ ] 建立長時間運行測試
- [ ] 測試 24 小時穩定性
- [ ] 測試網路中斷恢復
- [ ] 測試高負載場景
- [ ] 測試異常恢復
- [ ] 記錄測試結果

**Test Scenarios:**
1. **24 小時運行**: 監控 10 台機器，運行 24 小時
2. **網路中斷**: 模擬網路斷開/恢復
3. **高負載**: 同時 20 台機器頻繁狀態變化
4. **異常恢復**: 模擬 ComfyUI 崩潰/重啟

**Acceptance Criteria:**
- 24 小時無崩潰
- 記憶體使用穩定 (<500MB)
- CPU 使用合理 (<20%)
- 狀態更新準確率 100%

**Files:**
- `tests/stability-test.ts`
- `docs/stability-report.md`

---

## Task 4.7: 監控與日誌優化

**Goal:** 完善監控與日誌系統

**Tasks:**
- [ ] 添加效能指標收集
- [ ] 實作日誌輪轉 (Log Rotation)
- [ ] 添加錯誤追蹤
- [ ] 實作健康檢查端點
- [ ] 優化日誌級別管理

**Metrics to Track:**
- 活躍連接數
- 記憶體使用
- CPU 使用
- 狀態更新延遲
- Notion 佇列長度
- 錯誤數量

**Acceptance Criteria:**
- 監控數據完整
- 日誌大小可控
- 問題易於診斷

**Files:**
- `src/utils/MetricsCollector.ts` (new)
- `src/utils/Logger.ts` (update)

---

## Dependencies

```
Task 4.1 (效能基準)
    ↓
Task 4.2 (連接池) ──→ Task 4.3 (記憶體)
    ↓                        ↓
Task 4.4 (重連優化) ←── Task 4.5 (批次處理)
    ↓
Task 4.6 (穩定性測試)
    ↓
Task 4.7 (監控日誌)
```

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Max Machines | 20+ | 5+ |
| Memory Usage | <500MB | TBD |
| CPU Usage | <20% | TBD |
| Status Update Latency | <500ms | <1s |
| Reconnect Time | <30s | TBD |
| Uptime | 24h+ | TBD |

## Optimization Checklist

- [ ] Connection pooling implemented
- [ ] Memory leaks fixed
- [ ] Exponential backoff with jitter
- [ ] Status update throttling
- [ ] IPC batching
- [ ] Log rotation
- [ ] Health monitoring
- [ ] 24h stability test passed

---
*Plan created: 2026-03-16*
*Ready for execution*
