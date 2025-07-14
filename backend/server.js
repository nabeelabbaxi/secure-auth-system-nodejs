process.env.TZ = 'Asia/Riyadh'; // Set Riyadh timezone

const fs = require('fs');
const https = require('https');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const { generateAccessToken, generateRefreshToken } = require('./auth');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: 'https://127.0.0.1:5500',
  credentials: true
}));

let refreshTokens = new Set();

const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'None',
  maxAge: 20 * 1000
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'None',
  maxAge: 60 * 1000
};

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.add(refreshToken);

    const now = new Date();
    res.cookie('access_token', accessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({
      message: 'Login successful',
      accessExpiresAt: new Date(now.getTime() + 20 * 1000).toISOString(),
      refreshExpiresAt: new Date(now.getTime() + 60 * 1000).toISOString()
    });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/refresh', (req, res) => {
  const token = req.cookies.refresh_token;
  if (!token || !refreshTokens.has(token)) {
    return res.status(403).json({ error: 'Invalid refresh token' });
  }

  jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token expired' });

    const newAccessToken = generateAccessToken(user);
    const now = new Date();

    res.cookie('access_token', newAccessToken, ACCESS_COOKIE_OPTIONS);
    res.json({
      message: 'Refreshed',
      accessExpiresAt: new Date(now.getTime() + 20 * 1000).toISOString()
    });
  });
});

app.post('/logout', (req, res) => {
  refreshTokens.delete(req.cookies.refresh_token);
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.json({ message: 'Logged out' });
});

function authenticate(req, res, next) {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalid or expired' });
    req.user = user;
    next();
  });
}

app.get('/products', authenticate, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM products');
  res.json(rows);
});

app.post('/products', authenticate, async (req, res) => {
  const { name, price } = req.body;
  await pool.query('INSERT INTO products (name, price) VALUES (?, ?)', [name, price]);
  res.json({ message: 'Product added' });
});

app.delete('/products/:id', authenticate, async (req, res) => {
  await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ message: 'Deleted' });
});

https.createServer({
  key: fs.readFileSync('../certs/key.pem'),
  cert: fs.readFileSync('../certs/cert.pem')
}, app).listen(3007, () => {
  console.log('✅ HTTPS backend running on https://localhost:3007');
});
