// middleware/checkPermiso.js — RBAC por permisos_json del ROL
// Los permisos en BD se guardan como rutas: ["/dashboard", "/inventario", ...]
// El middleware recibe el nombre del módulo: "dashboard", "inventario", ...
// Se normaliza para que la comparación funcione correctamente.
const pool = require('../db/pool');

const checkPermiso = (ruta) => async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.permisos_json FROM USUARIO u
       JOIN ROL r ON u.id_rol = r.id_rol
       WHERE u.id_usuario = ?`,
      [req.usuario.id]
    );
    if (!rows.length)
      return res.status(403).json({ error: 'Usuario no encontrado.' });

    // mysql2 puede devolver permisos_json como string o array según la versión
    const permisosRaw = typeof rows[0].permisos_json === 'string'
      ? JSON.parse(rows[0].permisos_json)
      : rows[0].permisos_json;

    // Normalizar: quitar "/" inicial para comparar con el nombre del módulo
    const permisos = permisosRaw.map(p => p.replace(/^\//, ''));

    if (!permisos.includes(ruta))
      return res.status(403).json({ error: `Sin acceso al módulo '${ruta}'.` });

    next();
  } catch {
    res.status(500).json({ error: 'Error al verificar permisos.' });
  }
};

module.exports = checkPermiso;
