// routes/auth.routes.js
// POST /api/auth/login   — Iniciar sesión
// POST /api/auth/logout  — Cerrar sesión
// GET  /api/auth/profile — Perfil del usuario activo
const router     = require('express').Router();
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const pool       = require('../db/pool');
const auth       = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'NatuDai_Super_Secret_Key_2026';

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { cedula, password } = req.body;
  if (!cedula || !password)
    return res.status(400).json({ error: 'Cédula y contraseña son obligatorias.' });

  try {
    const [rows] = await pool.query(
      `SELECT u.id_usuario, u.nombre_completo, u.cedula,
              u.password_hash, u.estado_activo,
              r.nombre_rol, r.permisos_json
       FROM USUARIO u
       JOIN ROL r ON u.id_rol = r.id_rol
       WHERE u.cedula = ? AND u.estado_activo = TRUE`,
      [cedula]
    );

    if (!rows.length)
      return res.status(404).json({ error: 'Usuario no encontrado o inactivo.' });

    const usuario = rows[0];
    const ok = await bcrypt.compare(password, usuario.password_hash);
    if (!ok) return res.status(401).json({ error: 'Contraseña incorrecta.' });

    const permisos = typeof usuario.permisos_json === 'string'
      ? JSON.parse(usuario.permisos_json)
      : usuario.permisos_json;

    const token = jwt.sign(
      {
        id:     usuario.id_usuario,
        cedula: usuario.cedula,
        rol:    usuario.nombre_rol,
        nombre: usuario.nombre_completo,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        nombre:   usuario.nombre_completo,
        rol:      usuario.nombre_rol,
        permisos, // array de rutas accesibles: ["dashboard","inventario",...]
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
// JWT es stateless — el cliente elimina el token. Este endpoint confirma la acción.
router.post('/logout', auth, (_req, res) => {
  res.json({ mensaje: 'Sesión cerrada. Elimina el token del cliente.' });
});

// ── GET /api/auth/profile ─────────────────────────────────────────────────────
router.get('/profile', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id_usuario, u.nombre_completo, u.cedula, u.email,
              r.nombre_rol, r.permisos_json
       FROM USUARIO u
       JOIN ROL r ON u.id_rol = r.id_rol
       WHERE u.id_usuario = ?`,
      [req.usuario.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const u = rows[0];
    res.json({
      id_usuario:      u.id_usuario,
      nombre_completo: u.nombre_completo,
      cedula:          u.cedula,
      email:           u.email,
      rol:             u.nombre_rol,
      permisos:        typeof u.permisos_json === 'string'
                         ? JSON.parse(u.permisos_json)
                         : u.permisos_json,
    });
  } catch {
    res.status(500).json({ error: 'Error al obtener el perfil.' });
  }
});

module.exports = router;
