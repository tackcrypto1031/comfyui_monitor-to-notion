# Plan: Phase 5 - 測試與除錯

**Phase Goal:** 完整測試確保穩定性，修復所有已知問題

**Success Criteria:**
1. 所有 v1 需求測試通過
2. 無嚴重 (Critical/Major) bug
3. 用戶驗收測試通過
4. 效能指標達標

---

## Task 5.1: 單元測試補充

**Goal:** 為核心服務建立完整的單元測試

**Tasks:**
- [ ] ConfigStore 單元測試
- [ ] WebSocketManager 單元測試
- [ ] StatusEngine 單元測試
- [ ] NotionClient 單元測試
- [ ] RetryStrategy 單元測試
- [ ] Throttle 單元測試
- [ ] EventBus 單元測試

**Test Coverage Targets:**
- Services: >80%
- Utils: >90%
- Components: >60%

**Acceptance Criteria:**
- 所有測試通過
- 覆蓋率達標
- 邊界條件測試完整

**Files:**
- `tests/unit/*.test.ts`

---

## Task 5.2: 整合測試

**Goal:** 測試系統整合功能

**Tasks:**
- [ ] WebSocket 連接整合測試
- [ ] IPC 通訊整合測試
- [ ] Notion 記錄整合測試
- [ ] 狀態更新流程測試
- [ ] 多機器場景測試

**Integration Scenarios:**
1. 添加機器 → 連接 → 狀態更新 → Notion 記錄
2. 斷線 → 重連 → 狀態恢復
3. 多機器同時狀態變化
4. Notion API 錯誤處理

**Acceptance Criteria:**
- 整合流程順暢
- 錯誤處理正確
- 資料一致性保證

**Files:**
- `tests/integration/*.test.ts`

---

## Task 5.3: E2E 測試

**Goal:** 端到端用戶場景測試

**Tasks:**
- [ ] 用戶添加機器流程
- [ ] 用戶配置 Notion 流程
- [ ] 狀態監控流程
- [ ] 錯誤處理流程
- [ ] 長時間運行測試

**E2E Scenarios:**
1. **新用戶設置**: 安裝 → 添加機器 → 配置 Notion → 開始監控
2. **日常使用**: 查看狀態 → 添加/刪除機器 → 查看 Notion 記錄
3. **異常處理**: 網路斷開 → 自動重連 → 恢復監控

**Acceptance Criteria:**
- 用戶流程完整
- UI 互動正確
- 資料持久化正常

**Files:**
- `tests/e2e/*.test.ts`

---

## Task 5.4: 效能測試

**Goal:** 驗證效能指標達標

**Tasks:**
- [ ] 記憶體使用測試
- [ ] CPU 使用測試
- [ ] 連接數壓力測試
- [ ] 狀態更新延遲測試
- [ ] Notion API 速率限制測試

**Performance Tests:**
| Test | Target | Measurement |
|------|--------|-------------|
| Memory (10 machines) | <500MB | Heap snapshot |
| CPU (idle) | <5% | Process monitor |
| CPU (active) | <20% | Process monitor |
| Status latency | <500ms | Timestamp delta |
| Max connections | 20+ | Connection count |
| Reconnect time | <30s | Time to connected |

**Acceptance Criteria:**
- 所有指標達標
- 無效能退化
- 資源使用合理

**Files:**
- `tests/performance/*.test.ts`
- `docs/performance-report.md`

---

## Task 5.5: Bug 修復

**Goal:** 修復測試中發現的問題

**Tasks:**
- [ ] 建立 Bug 追蹤清單
- [ ] 優先級分類 (Critical/Major/Minor)
- [ ] 修復 Critical bugs
- [ ] 修復 Major bugs
- [ ] 驗證修復效果

**Bug Categories:**
- **Critical**: 崩潰、資料遺失、安全漏洞
- **Major**: 功能失效、效能問題
- **Minor**: UI 問題、小錯誤

**Acceptance Criteria:**
- 無 Critical bugs
- 無 Major bugs
- Minor bugs <10

**Files:**
- `docs/bug-tracker.md`

---

## Task 5.6: 用戶驗收測試 (UAT)

**Goal:** 用戶驗證功能符合需求

**Tasks:**
- [ ] 準備 UAT 環境
- [ ] 建立 UAT 測試案例
- [ ] 執行 UAT 測試
- [ ] 收集用戶反馈
- [ ] 修復 UAT 發現問題

**UAT Checklist:**
- [ ] 可以添加/刪除機器
- [ ] 狀態顯示正確
- [ ] Notion 記錄準確
- [ ] 重連功能正常
- [ ] 設定功能完整
- [ ] UI 美觀易用

**Acceptance Criteria:**
- 所有 UAT 案例通過
- 用戶滿意度 >80%
- 無阻礙性問題

**Files:**
- `docs/uat-results.md`

---

## Task 5.7: 文件完善

**Goal:** 完善所有專案文件

**Tasks:**
- [ ] README.md 更新
- [ ] 安裝指南
- [ ] 使用手冊
- [ ] API 文件
- [ ] 故障排除指南
- [ ] 發布說明

**Documentation:**
- README.md: 專案介紹、快速開始
- INSTALL.md: 詳細安裝步驟
- USER_GUIDE.md: 功能使用說明
- TROUBLESHOOTING.md: 常見問題解答
- CHANGELOG.md: 版本變更記錄

**Acceptance Criteria:**
- 文件完整
- 步驟清晰
- 範例正確

**Files:**
- `README.md`
- `docs/*.md`

---

## Dependencies

```
Task 5.1 (單元測試)
    ↓
Task 5.2 (整合測試)
    ↓
Task 5.3 (E2E 測試) ──→ Task 5.4 (效能測試)
    ↓                        ↓
Task 5.5 (Bug 修復) ←── Task 5.6 (UAT)
    ↓
Task 5.7 (文件完善)
```

## Test Pyramid

```
        /\
       /  \
      / E2E\
     /------\
    /Integration\
   /--------------\
  /   Unit Tests   \
 /------------------\
```

## Quality Gates

| Gate | Criteria | Status |
|------|----------|--------|
| Unit Tests | >80% coverage | ⚪ |
| Integration Tests | All pass | ⚪ |
| E2E Tests | All pass | ⚪ |
| Performance | All targets met | ⚪ |
| Critical Bugs | 0 | ⚪ |
| Major Bugs | 0 | ⚪ |
| UAT | Pass | ⚪ |

## Exit Criteria

Phase 5 is complete when:
- [ ] All unit tests pass with >80% coverage
- [ ] All integration tests pass
- [ ] All E2E scenarios pass
- [ ] All performance targets met
- [ ] Zero critical bugs
- [ ] Zero major bugs
- [ ] UAT passed
- [ ] Documentation complete

---
*Plan created: 2026-03-16*
*Ready for execution*
