# 安裝指南

本指南將協助您完成 ComfyUI Monitor 的安裝與配置。

---

## 系統需求

### 最低需求

- **作業系統**: Windows 10 64-bit
- **處理器**: Intel Core i5 或同等
- **記憶體**: 4GB RAM
- **硬碟空間**: 500MB 可用空間
- **Node.js**: 版本 20.x 或更高

### 建議需求

- **作業系統**: Windows 11 64-bit
- **處理器**: Intel Core i7 或同等
- **記憶體**: 8GB RAM
- **網路**: 穩定的內網連接

---

## 步驟 1: 安裝 Node.js

### Windows 安裝

1. 前往 [Node.js 官網](https://nodejs.org/)
2. 下載 **LTS (Long Term Support)** 版本 (Node.js 20.x)
3. 執行下載的安裝檔
4. 按照安裝精靈指示完成安裝
5. 勾選「Automatically install the necessary tools」(如需編譯 native 模組)

### 驗證安裝

開啟命令提示字元或 PowerShell，執行：

```bash
node --version
```

應顯示類似 `v20.11.0` 的版本號。

```bash
npm --version
```

應顯示類似 `10.2.4` 的版本號。

---

## 步驟 2: 取得專案

### 方法一: Git 克隆 (推薦)

```bash
git clone <repository-url>
cd tk_comfyui_notion2
```

### 方法二: 下載 ZIP

1. 在 GitHub 專案頁面點擊 **Code**
2. 選擇 **Download ZIP**
3. 解壓縮到本機目錄
4. 開啟終端進入專案目錄

---

## 步驟 3: 安裝依賴

在專案目錄下執行：

```bash
npm install
```

這將安裝所有必要的依賴套件，包括：
- Electron
- React
- TypeScript
- Vite
- Notion SDK
- 其他工具庫

安裝時間約 1-3 分鐘，取決於網路速度。

### 常見問題

**問題**: `npm install` 失敗，顯示 `EACCES` 錯誤

**解決方案**:
```bash
# Windows: 以管理員身分執行命令提示字元
# 或清除 npm 快取
npm cache clean --force
npm install
```

**問題**: 下載速度過慢

**解決方案**: 使用淘宝鏡像
```bash
npm config set registry https://registry.npmmirror.com
npm install
```

---

## 步驟 4: 環境配置

### 建立環境檔案 (選用)

如需自訂配置，可建立 `.env` 檔案：

```bash
# .env
VITE_DEFAULT_THEME=dark
VITE_LOG_LEVEL=info
```

---

## 步驟 5: 編譯專案

### 開發模式

```bash
npm run build
```

這將：
1. 編譯 TypeScript 為 JavaScript
2. 打包 React 前端
3. 準備 Electron 主進程
4. 輸出到 `dist/` 目錄

編譯成功後應顯示：
```
✓ built in XXXms
```

### 生產模式

```bash
npm run electron:build
```

這將建立可分發的安裝檔 (NSIS for Windows)。

---

## 步驟 6: 運行應用

### 開發模式運行

```bash
npm run electron:dev
```

這將：
1. 啟動 Vite 開發伺服器
2. 自動開啟 Electron 視窗
3. 啟用熱重載 (修改程式碼自動更新)

### 運行生產版本

```bash
# 從 dist 目錄運行
npm start
```

---

## 步驟 7: 首次使用配置

### 添加 ComfyUI 節點

1. 啟動應用後，點擊 **「+ 添加機器」**
2. 輸入：
   - **名稱**: 例如 `ComfyUI-01`
   - **IP**: 例如 `192.168.1.100`
   - **埠號**: 例如 `8188`
3. 點擊 **「添加」**

### 配置 Notion (選用)

1. 點擊 **「⚙️ 設定」**
2. 選擇 **「Notion 整合」** 頁籤
3. 參閱 [Notion 設置指南](notion-setup.md) 完成配置

---

## 疑難排解

### 問題：無法啟動應用

**可能原因**: 依賴未正確安裝

**解決方案**:
```bash
# 刪除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json
npm install
npm run electron:dev
```

### 問題：編譯失敗

**可能原因**: TypeScript 錯誤或依賴版本問題

**解決方案**:
```bash
# 檢查 TypeScript 錯誤
npm run typecheck

# 更新依賴
npm update
npm run build
```

### 問題：無法連接 ComfyUI

**可能原因**: 
- IP/埠號錯誤
- 防火牆阻擋
- ComfyUI 未啟動

**解決方案**:
1. 確認 ComfyUI 正在運行
2. 檢查 IP 和埠號是否正確
3. 暫時關閉防火牆測試
4. 確認 ComfyUI 允許 WebSocket 連接

### 問題：記憶體使用過高

**可能原因**: 監控機器數量過多

**解決方案**:
- 建議最多監控 20 台機器
- 定期重啟應用釋放記憶體
- 檢查是否有記憶體洩漏 (回報 Issue)

---

## 下一步

安裝完成後，請參考：
- [使用手冊](user-guide.md) - 完整功能說明
- [Notion 設置指南](notion-setup.md) - Notion 整合配置
- [故障排除](troubleshooting.md) - 常見問題解答

---

*Last updated: 2026-03-16*
