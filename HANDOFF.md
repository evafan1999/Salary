# 專案交接摘要(給新電腦上的 Claude Code)

這份文件是給接手這個專案的 Claude 看的背景說明。請先讀完這份,再開始處理任何請求。

## 專案是什麼

一個薪資/支出追蹤網站,是幫使用者的男友做的——他持澳洲打工度假簽證,同時打好幾份工、要繳房租、有車貸、還有存錢目標。使用者(這個對話的人)本身不太寫程式,是用 Traditional Chinese(繁體中文)溝通的產品負責人角色,習慣提出需求後由 Claude 全權處理「實作 → 驗證 → commit → deploy → 回報」整套流程。

**請務必用繁體中文回覆這個使用者。**

## 技術架構

- **前端**:React + Vite + TypeScript,部署在 Vercel(`https://frontend-one-gamma-54.vercel.app`)
- **後端**:Python + FastAPI + SQLModel,SQLite 存在 Fly.io 的 persistent volume 上,部署在 Fly.io(`https://salary-tracker-api.fly.dev`,app 名稱 `salary-tracker-api`)
- **GitHub**:`https://github.com/evafan1999/Salary.git`,只有一個 `main` branch,直接 push 上去(沒有 PR review 流程)
- 這個 repo 沒有資料庫遷移框架(沒裝 Alembic),`backend/app/db.py` 裡的 `create_db_and_tables()` 只會建立不存在的資料表、不會幫既有資料表加欄位。如果之後要幫某個 model 新增欄位,記得跟著寫一段 `PRAGMA table_info` 檢查 + `ALTER TABLE ... ADD COLUMN` 的輕量自動遷移(參考 `Job.color` 那次的做法),不然正式站舊資料庫不會自動長出新欄位。

## 已建立的工作習慣(很重要,請照做)

1. **每個改動都要走完整套流程**:寫 code → 本機驗證(啟動本機後端 + `mcp__Claude_Browser__preview_start` 開前端 → 實際點過一輪,包含手機版 375px 寬度檢查有沒有跑版)→ 跑後端測試(`cd backend && ./venv/Scripts/python.exe -m pytest -q`,目前應該是 39 passed)→ git add(只加改到的檔案,不要 `git add -A`)→ `git diff --cached | grep -iE "access.?token|secret|api.?key"` 掃過密鑰 → commit(訊息結尾要有 `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`,在 Mac 上可能要記得改成當時實際的模型代稱)→ push → 如果後端有改就 `flyctl deploy -a salary-tracker-api`,前端有改就 `cd frontend && npx vercel --prod --yes` → 最後在正式站(不是本機)用真實資料再驗證一次,通常會建立一筆測試資料、驗證完再刪除。
2. **UI 改動一定要先出視覺草圖給使用者選,不要直接刻**:這是使用者明確要求過很多次的流程。用 `mcp__visualize` 工具(先 `read_me` 載入 `mockup` 或 `chart` 模組)畫出 2-4 種風格選項,附上簡短說明跟我自己的推薦,等使用者選定或說「定案」之後才真的動手改程式碼。過程中使用者常常會一輪一輪微調(例如「窄一點」「間距不用加大」),要有耐心一直重畫直到使用者滿意。
3. **重大/不可逆動作前先問,但一般的 git commit / deploy 不用每次都問**——使用者已經多次確認過整套「做完就 commit + push + deploy」的節奏,不需要每次都停下來問「要不要 commit」,除非是明顯有風險的操作。
4. Vercel 部署第一次常常會失敗,錯誤是 `"Not authorized"`(通常伴隨 npm 自動裝了新版 Vercel CLI 的警告),**直接重試一次就會成功**,這是已知的環境小毛病,不用當成真的錯誤處理。

## 環境上的已知眉角

- 測試用的瀏覽器分頁(`mcp__Claude_Browser__*`)在某些情況下**無法正確 compositing**,`computer` 工具的 screenshot/zoom 動作會 timeout 並回報「the Browser pane is not displayed」。這不只是截圖問題——這個環境的 `requestAnimationFrame` 常常不會準時觸發,這曾經是 Chart.js 畫布空白的真正原因。驗證畫布類的視覺元件時,改用 `javascript_tool` 讀 `canvas.getContext('2d').getImageData()` 的實際像素資料來確認有沒有畫出東西,不要只靠螢幕截圖。畫 Chart.js 圖表記得加 `animation: false` 強制同步繪製。
- `read_console_messages` 這個工具偶爾會一直重複顯示很舊、早就修好的錯誤訊息(像是暫存的緩衝區沒清乾淨),不要只憑它的輸出判斷「還有沒有問題」,要搭配實際功能驗證(DOM 狀態、API 回應)交叉確認。
- React 裡如果把 `new Date()` 或 `startOfMonth(x)` 這類會產生新物件的呼叫直接寫在 render body 裡、又被拿去當某個 `useEffect` 的依賴項,會導致該 effect 每次 render 都重跑。這個專案裡已經修過好幾次這個坑(`DashboardPage.tsx` 的 `today`/`monthStart`/`monthEnd` 都改用 `useState(() => ...)` 或 `useMemo` 穩定下來了),之後新增類似邏輯時要留意。

## 目前完成到哪裡

截至這份交接文件產生時,班表(Shifts)頁面已經做完:編輯功能、依日期分組成每日卡片(含空白日顯示「休假」佔位卡)、依日期/依工作切換檢視、工作顏色標籤(色點,附一個 8 色調色盤 + 依 job id 決定的預設色 fallback)、過期班表用打勾徽章而非透明度來標示(避免顏色失真)、編輯/刪除按鈕改成單色線條圖示(不是 emoji,是手刻的 inline SVG,在 `frontend/src/components/ui/icons.tsx`)。

總覽(Dashboard)頁面也做完:本週收入、當月統計(含當月休假天數的正確計算邏輯,注意分子分母都要用「今天或更早」過濾,不然未來預排的班會讓休假天數算錯)、日均工時柱狀圖(`DailyHoursChart.tsx`,漸層色柱狀圖,含日均參考虛線)。

沒有正在進行中、卡住的工作。使用者最新在討論的是「想把電腦換成 MacBook Air」+「之後想把網站做成 app」,app 的部分還沒決定方向(PWA vs. Capacitor 包裝上架都討論過,使用者選了「先不急著決定」)。

## 本機開發環境重建(Mac 專用)

```bash
git clone https://github.com/evafan1999/Salary.git
cd salary/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # 內容很單純,沒有真的密鑰,照抄就好
cd ../frontend
npm install
cp .env.example .env.local
flyctl auth login          # 部署後端要用,帳號登入跟機器綁定,要重新登入
npx vercel login           # 部署前端要用,同上
```

本機測試資料庫(`backend/dev.db`)不用特別搬,重開機時會自動建立空的,只是本機測試用,跟正式站資料完全無關。
