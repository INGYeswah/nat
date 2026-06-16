// db/pool.js — Conexión compartida a MariaDB
// Importar en cualquier ruta: const pool = require('../db/pool');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || '127.0.0.1',
  port:               process.env.DB_PORT     || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '123456',
  database:           process.env.DB_NAME     || 'natudai',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
});

module.exports = pool;
