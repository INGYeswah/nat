// middleware/auth.js — Verifica que el JWT sea válido
const jwt        = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'NatuDai_Super_Secret_Key_2026';

const auth = (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header) return res.status(403).json({ error: 'Token no proporcionado.' });
  try {
    req.usuario = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

module.exports = auth;
