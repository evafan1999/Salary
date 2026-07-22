# 澳洲打工度假薪資/存錢追蹤工具

## 已部署網址

- **前端**: https://frontend-one-gamma-54.vercel.app
- **後端 API**: https://salary-tracker-api.fly.dev

⚠️ **這個網站沒有任何登入/驗證機制,是完全公開的**(這是刻意的決定,換取不用每次輸入存取碼的方便)。只要有人知道網址就能看到/修改裡面的薪水、存款目標等資料。如果之後想加回一層保護,可以參考 git 歷史裡拿掉存取碼之前的版本(commit 訊息會提到 access token / auth gate)。

## 重新部署

**後端**(改了 `backend/` 底下的程式碼後):
```powershell
cd backend
& "$env:USERPROFILE\.fly\bin\flyctl.exe" deploy -a salary-tracker-api
```

**前端**(改了 `frontend/` 底下的程式碼後):
```powershell
cd frontend
npx vercel --prod --yes
```

## 已知限制 / 之後可以擴充的地方

- 沒有稅務計算,「已存金額」只扣房租跟車貸,不扣稅
- 跨午夜的班表整班算開始日的費率,不會在午夜拆兩段算
- 房租沒有「已繳款確認」的紀錄,到期日是用週期公式推算
- Fair Work 費率表的實際數字需要自己去 Fair Work Pay Guide 查詢填入,系統不會自動生成
- 後端沒有用 Alembic 做 migration,之後如果要改資料庫欄位,建議先用 `fly ssh sftp get /data/app.db ./backup.db` 備份,再手動寫遷移 script
- Fly.io 的 machine 設定 `auto_stop_machines = true`,閒置一段時間後會睡眠,下次開啟網站時第一個請求可能要等幾秒鐘喚醒
