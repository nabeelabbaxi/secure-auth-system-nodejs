// auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const ACCESS_EXPIRE = '20s';
const REFRESH_EXPIRE = '60s';

const generateAccessToken = (user) => {
  return jwt.sign({ id: user.id, username: user.username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_EXPIRE });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id, username: user.username }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_EXPIRE });
};

module.exports = { generateAccessToken, generateRefreshToken };
