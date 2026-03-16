# Masu TodoList

一個**純前端、低維護成本**的 TodoList 小專案。

這個版本刻意保持簡單：
- 不接後端
- 不接資料庫
- 不做登入
- 優先確保**好理解、好修改、好部署**

本專案可直接本地打開，也適合部署到 **GitHub Pages**，讓其他裝置用網址開啟。

---

## 功能

- 新增任務
- 勾選完成 / 取消完成
- 刪除任務
- 篩選：全部 / 進行中 / 已完成
- 使用 `localStorage` 儲存資料（重新整理後不消失）

---

## 技術選擇

本專案故意使用**最小技術組合**：

- `HTML`
- `CSS`
- `JavaScript`
- `localStorage`

原因很簡單：

1. **容易理解**：沒有框架包袱。
2. **容易維護**：檔案少，結構直觀。
3. **容易部署**：任何能放靜態檔案的平台都能跑。
4. **適合 AI 協作**：AI 好生成，你也比較看得懂改動。

---

## 專案結構

```text
todolist/
├── index.html
└── README.md
```

目前只有一個主要頁面，先把功能做實，再決定要不要擴充。

---

## 如何本地打開

### 方法 1：直接打開

在 macOS Finder 中進入：

```text
/Users/gaoshikeji/.openclaw/workspace/todolist/
```

然後雙擊：

```text
index.html
```

---

## 如何部署到 GitHub Pages

### 1. 建立 GitHub Repository

例如命名為：

```text
masu-todolist
```

### 2. 把專案推上 GitHub

如果你已經有 git / GitHub 基本設定，大致流程會是：

```bash
git init
git add .
git commit -m "feat: initial todolist"
git branch -M main
git remote add origin <你的 repo URL>
git push -u origin main
```

### 3. 開啟 GitHub Pages

在 GitHub 專案頁：

- 進入 `Settings`
- 找到 `Pages`
- Source 選：`Deploy from a branch`
- Branch 選：`main`
- Folder 選：`/ (root)`

之後 GitHub 會給你一個網址，你就能用其他裝置直接打開。

---

## 維護建議

如果未來要擴充，建議順序如下：

1. 加入任務建立日期
2. 加入優先級
3. 加入簡單搜尋
4. 再考慮改成 React / Vue
5. 最後才考慮後端與帳號系統

**不要一開始就上大框架。**
先把功能做穩，維護才不會痛苦。

---

## 關於 AI 參與

這個專案可以**不避諱地說是由 AI 協助撰寫**。

但這裡的原則不是「讓 AI 一次噴出很大的系統」，而是：

- 先做最小可用版本（MVP）
- 保持結構簡單
- 讓人類能看懂、能接手、能修改

換句話說，AI 是加速器，不是把維護責任整包炸給未來的你。

---

## 下一步

如果你之後想繼續升級，可以往這些方向走：

- 加入深色/淺色主題切換
- 支援手機排版優化
- 增加拖曳排序
- 改成 React 版本
- 串接雲端儲存

但目前這個版本的目標只有一個：

> **先完成一個真的能用、真的能維護的 TodoList。**
