// ==============================================================================
// NatuDai ERP — server.js
// Solo arranca el servidor y monta las rutas.
// Toda la lógica está en /routes, /middleware y /db
// ==============================================================================
const dotenv = require('dotenv').config(); 
const express = require('express');
const cors    = require('cors');
const app     = express();
const PORT    = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── Vista raíz ────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.send(`
    <html><body style="font-family:sans-serif;padding:40px;background:#f8fafc;text-align:center">
      <h1 style="color:#059669">🚀 NatuDai ERP — Servidor en línea</h1>
      <p style="color:#475569">Puerto ${PORT} · Base de datos: natudai</p>
      <a href="/api/setup-passwords"
         style="background:#2563eb;color:white;padding:10px 20px;border-radius:6px;
                text-decoration:none;display:inline-block;margin-top:16px">
        Configurar contraseñas (solo primera vez)
      </a>
    </body></html>
  `);
});

// ── Setup inicial: encriptar contraseñas ──────────────────────────────────────
// Ejecutar una sola vez desde el navegador: http://localhost:3000/api/setup-passwords
const bcrypt = require('bcryptjs');
const pool   = require('./db/pool');

app.get('/api/setup-passwords', async (_req, res) => {
  try {
    const hashAdmin  = await bcrypt.hash('admin123',  10);
    const hashSupply = await bcrypt.hash('supply123', 10);
    await pool.query("UPDATE USUARIO SET password_hash=? WHERE cedula='10102020'", [hashAdmin]);
    await pool.query("UPDATE USUARIO SET password_hash=? WHERE cedula='20203030'", [hashSupply]);
    res.send(`
      <h2 style="color:green;font-family:sans-serif;padding:40px">
        ✅ Contraseñas configuradas correctamente.<br><br>
        Admin → cédula: <b>10102020</b> / contraseña: <b>admin123</b><br>
        Supply → cédula: <b>20203030</b> / contraseña: <b>supply123</b>
      </h2>
    `);
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

// ── Rutas por módulo ──────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth.routes'));
app.use('/api/clientes',   require('./routes/clientes.routes'));
app.use('/api/productos',  require('./routes/productos.routes'));
app.use('/api/ventas',     require('./routes/ventas.routes'));
app.use('/api/pedidos',    require('./routes/pedidos.routes'));
app.use('/api/empleados',  require('./routes/empleados.routes'));
app.use('/api/produccion', require('./routes/produccion.routes'));
app.use('/api/dashboard',  require('./routes/dashboard.routes'));

// ── Manejo de rutas no encontradas ───────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

// ── Arranque ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n=============================================================');
  console.log(`🚀  NatuDai ERP activo en: http://localhost:${PORT}`);
  console.log(`🛡️   RBAC por permisos_json · JWT 8h`);
  console.log('=============================================================\n');
});
