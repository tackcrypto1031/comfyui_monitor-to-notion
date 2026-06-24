# 安裝指南

本指南說明如何安裝與啟動 ComfyUI Monitor Web 版。

---

## 系統需求

### 原始碼啟動

- **作業系統**: Windows 10 / 11 64-bit
- **Node.js**: 20.x 或更高
- **網路**: 可連到內網 ComfyUI 節點

### 便攜包啟動

- **作業系統**: Windows 10 / 11 64-bit
- **Node.js**: 不需要預先安裝
- **網路**: 可連到內網 ComfyUI 節點

---

## 方法一：原始碼啟動

### 1. 安裝 Node.js

1. 前往 [Node.js 官網](https://nodejs.org/)
2. 下載 LTS 版本
3. 安裝後在 PowerShell 驗證：

```bash
node --version
npm --version
```

### 2. 取得專案並安裝依賴

```bash
git clone <repository-url>
cd comfyui_monitor-to-notion
npm ci
```

### 3. 建置與啟動

```bash
npm run build:web
npm run start:web
```

啟動後在主機開啟：

```text
http://127.0.0.1:7890/
```

也可以直接執行根目錄的 `start.bat`，它會安裝依賴、建置並啟動 Web Server。

根目錄的 `run.bat` 只是相容捷徑，會轉交給 `start.bat`。便攜包裡的 `run.bat` 才是免安裝 Node.js 的啟動器。

---

## 方法二：建立 Windows 便攜包

在有 Node.js 的開發主機執行：

```bash
npm run package:portable
```

輸出檔案：

```text
release/comfyui-monitor-portable.zip
```

把 zip 解壓到目標主機後，執行裡面的 `run.bat` 即可啟動。便攜包內含 `node.exe`、建置後的前端、server 和 production 依賴。

---

## 內網監聽

預設只有本機可以開啟工具。需要讓其他內網裝置查看時：

1. 在主機開啟 `http://127.0.0.1:7890/`
2. 點擊 **「開啟監聽」**
3. 複製畫面顯示的 `http://<本機IP>:7890/`
4. 其他內網裝置用瀏覽器開啟該網址

內網裝置 v1 只可查看狀態；新增/刪除機器、連線控制、Notion 設定和監聽開關只允許本機操作。

---

## 首次使用

### 添加 ComfyUI 節點

1. 點擊 **「添加機器」**
2. 輸入：
   - **名稱**: 例如 `ComfyUI-01`
   - **IP**: 例如 `192.168.1.100`
   - **埠號**: 例如 `8188`
3. 點擊 **「添加」**

### 配置 Notion

1. 點擊 **「設定」**
2. 選擇 **「Notion 整合」**
3. 參閱 [Notion 設置指南](notion-setup.md) 完成配置

---

## 疑難排解

### 無法啟動

```bash
npm ci
npm run build:web
npm run start:web
```

### 無法從其他主機連線

1. 確認主機畫面已開啟監聽
2. 確認使用的是畫面顯示的內網 URL
3. 檢查 Windows 防火牆是否允許 Node.js 接受連線
4. 確認兩台主機在同一內網或路由可達

### 無法連接 ComfyUI

1. 確認 ComfyUI 正在運行
2. 檢查 IP 和埠號是否正確
3. 確認 ComfyUI 主機防火牆允許該埠
4. 確認 ComfyUI 允許 WebSocket 連接

---

*Last updated: 2026-06-24*
