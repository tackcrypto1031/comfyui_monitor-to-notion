# 故障排除指南

本指南提供 ComfyUI Monitor 常見問題的診斷與解決方案。

---

## 目錄

1. [安裝問題](#安裝問題)
2. [連接問題](#連接問題)
3. [Notion 問題](#notion-問題)
4. [效能問題](#效能問題)
5. [UI 問題](#ui-問題)
6. [日誌分析](#日誌分析)

---

## 安裝問題

### 問題：npm install 失敗

**錯誤訊息**: `EACCES: permission denied`

**解決方案**:
```bash
# Windows: 以管理員身分執行命令提示字元
# 清除 npm 快取
npm cache clean --force
npm install
```

**錯誤訊息**: `Cannot find module`

**解決方案**:
```bash
# 刪除 node_modules 重新安裝
rm -rf node_modules package-lock.json
npm install
```

### 問題：編譯失敗

**錯誤訊息**: `TypeScript error`

**解決方案**:
```bash
# 檢查 TypeScript 錯誤
npm run typecheck

# 根據錯誤訊息修復程式碼
# 重新編譯
npm run build
```

**錯誤訊息**: `Vite build failed`

**解決方案**:
```bash
# 清除 dist 目錄
rm -rf dist
npm run build
```

---

## 連接問題

### 問題：無法連接 ComfyUI

**症狀**: 機器卡片顯示「錯誤」或「未連接」

**診斷步驟**:

1. **確認 ComfyUI 正在運行**
   ```bash
   # 在 ComfyUI 機器上檢查程序
   # Windows: 工作管理員
   # Linux: ps aux | grep python
   ```

2. **測試網路連通性**
   ```bash
   # 從本機 ping ComfyUI 機器
   ping 192.168.1.100
   
   # 測試埠號連通性
   telnet 192.168.1.100 8188
   ```

3. **檢查防火牆設定**
   - Windows 防火牆 → 允許 ComfyUI 通過
   - 確認 8188 埠未被阻擋

4. **確認 WebSocket 支援**
   - 秋葉整合包預設支援 WebSocket
   - 官方原版需確認版本 >= 1.0

**解決方案**:
- 重啟 ComfyUI
- 檢查 IP/埠號是否正確
- 暫時關閉防火牆測試
- 確認 ComfyUI 啟動參數包含 WebSocket 支援

### 問題：頻繁重連

**症狀**: 機器狀態在「連接中」和「錯誤」之間切換

**可能原因**:
- 網路不穩定
- ComfyUI 負載過高
- WebSocket 連接數限制

**解決方案**:
1. 檢查網路連線品質
2. 減少同時監控的機器數量
3. 增加重連延遲 (需修改程式碼)
4. 重啟 ComfyUI 釋放資源

### 問題：部分機器無法連接

**症狀**: 某些機器正常，某些無法連接

**診斷**:
1. 確認所有機器 ComfyUI 版本一致
2. 檢查每台機器的防火牆設定
3. 確認網路拓撲 (是否在同一子網)

**解決方案**:
- 統一 ComfyUI 版本
- 逐台檢查防火牆規則
- 確認路由器設定 (如有)

---

## Notion 問題

### 問題：測試連接失敗

**錯誤**: 「Notion Token 無效或已過期」

**解決方案**:
1. 重新複製 Token (包含 `secret_` 前綴)
2. 確認 Integration 處於 Active 狀態
3. 在 Notion Integrations 頁面重新建立 Integration

**錯誤**: 「無權限訪問此資料庫」

**解決方案**:
1. 開啟資料庫
2. 點擊「···」→「Connect to」
3. 選擇您的 Integration
4. 重新測試

**錯誤**: 「資料庫不存在或 ID 錯誤」

**解決方案**:
1. 確認複製正確的 32 字元 ID
2. 從資料庫連結重新複製
3. 確認資料庫未被刪除

### 問題：狀態變化沒有記錄

**可能原因**:
- Notion API 速率限制 (3 requests/second)
- 網路問題
- 配置未正確儲存

**解決方案**:
1. 等待幾分鐘後重試
2. 檢查配置是否已儲存
3. 查看應用日誌確認錯誤
4. 檢查網路連線

### 問題：Notion 記錄格式錯誤

**症狀**: 欄位空白或格式不正確

**解決方案**:
1. 確認資料庫欄位名稱完全一致
2. 確認 Select 選項名稱正確
3. 重新建立資料庫並使用模板

---

## 效能問題

### 問題：記憶體使用過高

**症狀**: 應用記憶體超過 500MB

**診斷**:
```bash
# Windows: 工作管理員 → 詳細資料
# 查看 ComfyUI Monitor 的記憶體使用
```

**解決方案**:
1. 減少監控機器數量 (建議 <20 台)
2. 定期重啟應用
3. 檢查是否有記憶體洩漏 (回報 Issue)
4. 關閉未使用的功能

### 問題：CPU 使用過高

**症狀**: CPU 持續超過 20%

**可能原因**:
- 大量機器同時狀態變化
- WebSocket 重連風暴
- UI 更新過於頻繁

**解決方案**:
1. 檢查狀態列機器數量
2. 確認無頻繁重連
3. 減少狀態更新頻率 (需修改程式碼)
4. 重啟應用

### 問題：狀態更新延遲

**症狀**: 狀態變化超過 1 秒才更新

**診斷**:
1. 檢查網路延遲
2. 確認 WebSocket 連接正常
3. 查看日誌確認消息接收時間

**解決方案**:
1. 優化網路環境
2. 減少同時連接數
3. 重啟應用

---

## UI 問題

### 問題：介面卡頓

**症狀**: 點擊按鈕反應慢

**解決方案**:
1. 減少監控機器數量
2. 關閉開發者工具 (如開啟)
3. 重啟應用

### 問題：狀態顏色不正確

**症狀**: 狀態與顏色不符

**解決方案**:
1. 重新整理頁面
2. 檢查 ComfyUI WebSocket 消息
3. 重啟應用

### 問題：對話框無法關閉

**症狀**: 點擊關閉按鈕無反應

**解決方案**:
1. 點擊對話框外部區域
2. 按 ESC 鍵
3. 重啟應用

---

## 日誌分析

### 開啟日誌

開發模式下，日誌輸出到：
- **主進程**: Electron 終端視窗
- **渲染進程**: 瀏覽器開發者工具 Console

### 查看日誌

1. **開發模式**:
   - 主進程日誌直接顯示在終端
   - 渲染進程按 `Ctrl+Shift+I` 開啟 DevTools

2. **生產模式**:
   - 日誌檔案位置：`%APPDATA%/comfyui-monitor/logs/`

### 常見日誌訊息

**正常連接**:
```
[INFO] Connecting to ComfyUI { machineId: "xxx", ip: "192.168.1.100", port: 8188 }
[INFO] WebSocket connected { machineId: "xxx" }
```

**連接失敗**:
```
[ERROR] WebSocket error { machineId: "xxx", error: "ECONNREFUSED" }
[INFO] Scheduling reconnect { machineId: "xxx", attempt: 1, delay: 1000 }
```

**Notion 記錄**:
```
[INFO] Notion logger initialized
[INFO] Status changed { machineId: "xxx", from: "idle", to: "running" }
[INFO] Queuing status change for Notion { machine: "ComfyUI-01" }
```

**錯誤日誌**:
```
[ERROR] Failed to create Notion record { error: "rate_limited" }
[ERROR] Max reconnect attempts reached { machineId: "xxx" }
```

### 調整日誌級別

在 `.env` 檔案中設定：
```
VITE_LOG_LEVEL=debug  # debug, info, warn, error
```

---

## 回報問題

### 準備資訊

回報 Issue 時請包含：

1. **系統資訊**
   - 作業系統版本
   - Node.js 版本
   - 應用版本

2. **問題描述**
   - 問題現象
   - 重現步驟
   - 預期行為

3. **日誌**
   - 相關錯誤訊息
   - 時間戳記

4. **環境**
   - ComfyUI 版本
   - 監控機器數量
   - 網路環境

### 回報管道

- **GitHub Issues**: [<repository-url>/issues](<repository-url>/issues)
- **電子郵件**: <your-email@example.com>

---

## 緊急處理

### 應用無回應

1. 工作管理員結束程序
2. 刪除暫存檔案：
   ```bash
   # Windows
   %APPDATA%\comfyui-monitor\
   
   # 或專案目錄
   rm -rf .planning/node_modules
   ```
3. 重新啟動應用

### 資料遺失

1. 檢查 `.planning/` 目錄是否有備份
2. 從 Notion 匯出記錄
3. 重新添加機器配置

---

## 預防措施

### 定期維護

1. **每週**:
   - 檢查所有機器連接狀態
   - 查看 Notion 記錄是否完整

2. **每月**:
   - 更新應用到最新版本
   - 清理暫存檔案
   - 備份 Notion 記錄

3. **每季**:
   - 檢查系統資源使用
   - 評估是否需要擴充容量

### 最佳實踐

1. **監控數量**: 建議 <20 台機器
2. **網路環境**: 確保穩定內網連接
3. **資源配置**: 預留足夠記憶體和 CPU
4. **備份策略**: 定期匯出 Notion 記錄

---

*Last updated: 2026-03-16*
