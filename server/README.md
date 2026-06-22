# Lukibou 會員系統 API

Node.js + Express + MySQL 會員認證後端。

## 前置需求

- XAMPP（MySQL 已啟動）
- Node.js 18+

## 資料庫設定

1. 開啟 phpMyAdmin：`http://localhost/phpmyadmin`
2. 執行 `sql/schema.sql` 建立 `lukibou_db` 與資料表

## 環境變數

```bash
cd server
copy .env.example .env
```

編輯 `.env`：

```env
PORT=4000
CLIENT_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=lukibou_db
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d
```

## 啟動

```bash
npm install
npm run dev
```

API 位址：`http://localhost:4000`

## API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/register` | 會員註冊（bcrypt 雜湊密碼） |
| POST | `/login` | 登入，回傳 JWT |
| GET | `/profile` | 取得個人資料（需 Bearer token） |
| PUT | `/profile` | 更新姓名、電話（需 Bearer token） |
| POST | `/logout` | 登出，刪除 token 記錄 |

### 註冊範例

```json
POST /register
{
  "name": "王小明",
  "email": "user@example.com",
  "password": "password123",
  "phone": "91234567"
}
```

### 登入範例

```json
POST /login
{
  "email": "user@example.com",
  "password": "password123"
}
```

回應含 `token`，後續請求加上：

```
Authorization: Bearer <token>
```
