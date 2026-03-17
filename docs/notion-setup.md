# Notion 設置指南

本指南將協助您完成 Notion 整合的配置，讓 ComfyUI Monitor 自動記錄狀態變化到 Notion 資料庫。

---

## 目錄

1. [建立 Notion Integration](#建立-notion-integration)
2. [建立資料庫](#建立資料庫)
3. [連接 Integration](#連接-integration)
4. [配置應用](#配置應用)
5. [資料庫模板](#資料庫模板)
6. [常見問題](#常見問題)

---

## 步驟 1: 建立 Notion Integration

### 1.1 前往 Integration 頁面

開啟瀏覽器前往：[https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)

### 1.2 建立新的 Integration

1. 點擊 **"+ New integration"** 按鈕
2. 填寫 Integration 資訊：
   ```
   Name: ComfyUI Monitor
   Logo: (可選) 上傳應用圖示
   Associated workspace: 選擇您的工作區
   ```
3. 點擊 **"Submit"**

### 1.3 複製 Token

1. 建立成功後，點擊 **"Copy"** 按鈕複製 **Internal Integration Token**
2. Token 格式：`secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
3. **重要**: 妥善保管 Token，不要分享給他人

---

## 步驟 2: 建立資料庫

### 方法一: 使用模板 (推薦)

1. 下載資料庫模板檔案：[notion-database-template.json](../templates/notion-database-template.json)
2. 在 Notion 中建立新頁面
3. 選擇「Database」→「Table view」
4. 按照模板建立欄位

### 方法二: 手動建立

#### 2.1 建立資料庫

1. 在 Notion 中建立新頁面
2. 選擇 **「Database」** → **「Table view」**
3. 命名為「ComfyUI 監控記錄」

#### 2.2 建立欄位

建立以下欄位：

| 欄位名稱 | 類型 | 說明 |
|----------|------|------|
| **機器名稱** | Title | 機器名稱 (主欄位) |
| **狀態** | Select | 閒置/運行/算圖 |
| **IP 位置** | Rich text | IP:Port |
| **時間戳記** | Date | 狀態變化時間 |
| **連接狀態** | Select | 已連接/未連接/錯誤 |
| **前狀態** | Select | 之前的狀態 |

#### 2.3 配置 Select 選項

**狀態** 欄位選項：
- `idle` (綠色)
- `running` (黃色)
- `generating` (藍色)

**連接狀態** 欄位選項：
- `connected` (綠色)
- `disconnected` (灰色)
- `error` (紅色)

**前狀態** 欄位選項：
- `idle` (綠色)
- `running` (黃色)
- `generating` (藍色)

---

## 步驟 3: 連接 Integration

### 3.1 分享資料庫給 Integration

1. 開啟剛建立的資料庫
2. 點擊右上角的 **「···」** (More) 按鈕
3. 選擇 **「Connect to」**
4. 選擇 **「ComfyUI Monitor」** (您剛建立的 Integration)
5. 點擊 **「Confirm」**

### 3.2 獲取資料庫 ID

1. 在資料庫頁面，點擊 **「···」** → **「Copy link」**
2. 連結格式：
   ```
   https://www.notion.so/your-workspace/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=...
   ```
3. 複製 **32 字元的 ID** (不包含破折號)
   - 例如：`xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 步驟 4: 配置應用

### 4.1 開啟設定

1. 啟動 ComfyUI Monitor
2. 點擊右上角 **「⚙️ 設定」**

### 4.2 填寫配置

在 **Notion 整合** 頁籤：

```
Notion Integration Token: secret_xxxxx...
資料庫 ID: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4.3 測試連接

1. 點擊 **「測試連接」** 按鈕
2. 成功顯示：**「✓ 連接成功」**
3. 失敗顯示錯誤訊息，請檢查：
   - Token 是否正確
   - 資料庫 ID 是否正確
   - Integration 是否有資料庫權限

### 4.4 儲存配置

1. 點擊 **「儲存配置」**
2. Token 將加密儲存到本機
3. 狀態變化將自動記錄到 Notion

---

## 資料庫模板

### JSON 模板

```json
{
  "title": "ComfyUI 監控記錄",
  "properties": {
    "機器名稱": {
      "type": "title"
    },
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
    "IP 位置": {
      "type": "rich_text"
    },
    "時間戳記": {
      "type": "date"
    },
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

---

## 常見問題

### Q1: 測試連接失敗，顯示「Token 無效」

**原因**: Token 錯誤或已過期

**解決方案**:
1. 確認 Token 完整複製 (包含 `secret_` 前綴)
2. 在 Notion Integrations 頁面重新複製 Token
3. 確認 Integration 處於 Active 狀態

### Q2: 顯示「無權限訪問此資料庫」

**原因**: Integration 未連接資料庫

**解決方案**:
1. 開啟資料庫
2. 點擊「···」→「Connect to」
3. 選擇您的 Integration
4. 重新測試連接

### Q3: 顯示「資料庫不存在」

**原因**: 資料庫 ID 錯誤

**解決方案**:
1. 確認複製的是正確的 32 字元 ID
2. 從資料庫連結重新複製 ID
3. 確認資料庫未被刪除

### Q4: 狀態變化沒有記錄到 Notion

**原因**: 
- Notion API 速率限制
- 網路問題
- 配置未正確儲存

**解決方案**:
1. 檢查 Notion 配置是否正確儲存
2. 查看應用日誌確認錯誤訊息
3. 等待幾分鐘後重試 (速率限制)
4. 檢查網路連接

### Q5: Notion 記錄格式不正確

**原因**: 資料庫欄位名稱不匹配

**解決方案**:
1. 確認欄位名稱完全一致 (包含大小寫)
2. 確認 Select 選項名稱正確
3. 重新建立資料庫並使用模板

---

## 進階使用

### 查看歷史記錄

在 Notion 資料庫中：
1. 使用篩選功能查看特定機器的記錄
2. 按時間排序查看最新狀態
3. 按狀態篩選查看特定狀態變化

### 匯出資料

1. 點擊資料庫右上角「···」
2. 選擇「Export」
3. 選擇格式：CSV 或 Excel
4. 下載備份

### 建立儀表板

1. 建立新頁面
2. 插入資料庫視圖
3. 建立不同篩選視圖：
   - 今日記錄
   - 特定機器
   - 錯誤狀態

---

## 隱私與安全

### Token 儲存

- Token 使用 AES-256 加密儲存
- 僅儲存於本機
- 不會上傳到任何伺服器

### 資料隱私

- 所有記錄儲存於您的 Notion 工作區
- 開發者無法訪問您的記錄
- 可隨時清除配置並刪除記錄

---

## 下一步

配置完成後：
- 狀態變化將自動記錄
- 可在 Notion 中查看完整歷史
- 可匯出資料進行分析

參考文件：
- [使用手冊](user-guide.md) - 完整功能說明
- [故障排除](troubleshooting.md) - 常見問題解答

---

*Last updated: 2026-03-16*
