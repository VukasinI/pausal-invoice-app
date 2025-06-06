const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const APP_PASSWORD_HASH = process.env.APP_PASSWORD_HASH;

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const login = async (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }
  
  // For now, use simple password check - you can enhance this later
  const correctPassword = 'admin123';
  
  if (password !== correctPassword) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  const token = jwt.sign({ authenticated: true }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
};

const verifySession = (req, res) => {
  res.json({ valid: true });
};

module.exports = {
  verifyToken,
  login,
  verifySession
};