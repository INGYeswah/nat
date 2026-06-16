// routes/empleados.routes.js
// GET    /api/empleados           — Listar todos
// GET    /api/empleados/:id       — Obtener uno
// POST   /api/empleados           — Crear
// PUT    /api/empleados/:id       — Actualizar
// DELETE /api/empleados/:id       — Desactivar (soft delete)
// PATCH  /api/empleados/:id/toggle— Activar/Desactivar
// GET    /api/empleados/roles     — Listar roles disponibles
// POST   /api/empleados/roles     — Crear rol
// PUT    /api/empleados/roles/:id — Actualizar rol
// DELETE /api/empleados/roles/:id — Eliminar rol
const router       = require('express').Router();
const bcrypt       = require('bcryptjs');
const pool         = require('../db/pool');
const auth         = require('../middleware/auth');
const checkPermiso = require('../middleware/checkPermiso');

// Solo el rol con acceso a 'personal' puede gestionar empleados
const soloAdmin = checkPermiso('personal');

// ═══════════════════════════════════════════════════════════════════════════════
// ROLES — CRUD
// ═══════════════════════════════════════════════════════════════════════════════

// ── GET /api/empleados/roles ──────────────────────────────────────────────────
router.get('/roles', auth, soloAdmin, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_rol, nombre_rol, permisos_json FROM ROL ORDER BY id_rol'
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener roles.' });
  }
});

// ── POST /api/empleados/roles ─────────────────────────────────────────────────
router.post('/roles', auth, soloAdmin, async (req, res) => {
  const { nombre_rol, permisos_json } = req.body;
  if (!nombre_rol || !permisos_json)
    return res.status(400).json({ error: 'nombre_rol y permisos_json son obligatorios.' });
  try {
    const [r] = await pool.query(
      'INSERT INTO ROL (nombre_rol, permisos_json) VALUES (?, ?)',
      [nombre_rol, permisos_json]
    );
    res.status(201).json({ mensaje: 'Rol creado.', id_rol: r.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Ya existe un rol con ese nombre.' });
    res.status(500).json({ error: 'Error al crear el rol.' });
  }
});

// ── PUT /api/empleados/roles/:id ──────────────────────────────────────────────
router.put('/roles/:id', auth, soloAdmin, async (req, res) => {
  const { nombre_rol, permisos_json } = req.body;
  if (!nombre_rol || !permisos_json)
    return res.status(400).json({ error: 'nombre_rol y permisos_json son obligatorios.' });
  try {
    const [r] = await pool.query(
      'UPDATE ROL SET nombre_rol=?, permisos_json=? WHERE id_rol=?',
      [nombre_rol, permisos_json, req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Rol no encontrado.' });
    res.json({ mensaje: 'Rol actualizado.' });
  } catch {
    res.status(500).json({ error: 'Error al actualizar el rol.' });
  }
});

// ── DELETE /api/empleados/roles/:id ───────────────────────────────────────────
router.delete('/roles/:id', auth, soloAdmin, async (req, res) => {
  try {
    // Verificar si hay empleados asignados a este rol
    const [empleados] = await pool.query(
      'SELECT id_usuario FROM USUARIO WHERE id_rol=?',
      [req.params.id]
    );
    if (empleados.length > 0)
      return res.status(409).json({
        error: `No se puede eliminar: hay ${empleados.length} empleado(s) asignados a este rol.`
      });

    const [r] = await pool.query('DELETE FROM ROL WHERE id_rol=?', [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ error: 'Rol no encontrado.' });
    res.json({ mensaje: 'Rol eliminado.' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar el rol.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// EMPLEADOS — CRUD
// ═══════════════════════════════════════════════════════════════════════════════

// ── GET /api/empleados ────────────────────────────────────────────────────────
router.get('/', auth, soloAdmin, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id_usuario, u.cedula, u.nombre_completo,
              u.email, u.estado_activo,
              r.id_rol, r.nombre_rol
       FROM USUARIO u
       JOIN ROL r ON u.id_rol = r.id_rol
       ORDER BY u.nombre_completo ASC`
    );
    res.json(rows.map(u => ({ ...u, estado: u.estado_activo ? 'Activo' : 'Inactivo' })));
  } catch {
    res.status(500).json({ error: 'Error al obtener empleados.' });
  }
});

// ── GET /api/empleados/:id ────────────────────────────────────────────────────
router.get('/:id', auth, soloAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id_usuario, u.cedula, u.nombre_completo,
              u.email, u.estado_activo, r.id_rol, r.nombre_rol
       FROM USUARIO u
       JOIN ROL r ON u.id_rol = r.id_rol
       WHERE u.id_usuario = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Empleado no encontrado.' });
    const u = rows[0];
    res.json({ ...u, estado: u.estado_activo ? 'Activo' : 'Inactivo' });
  } catch {
    res.status(500).json({ error: 'Error al obtener el empleado.' });
  }
});

// ── POST /api/empleados ───────────────────────────────────────────────────────
router.post('/', auth, soloAdmin, async (req, res) => {
  const { nombre_completo, cedula, email, id_rol, password } = req.body;
  if (!nombre_completo || !cedula || !password)
    return res.status(400).json({
      error: 'nombre_completo, cedula y password son obligatorios.'
    });
  try {
    const hash = await bcrypt.hash(password, 10);
    const id   = 'usr-' + Date.now();
    await pool.query(
      `INSERT INTO USUARIO
         (id_usuario, id_rol, nombre_completo, cedula, email, password_hash, estado_activo)
       VALUES (?,?,?,?,?,?,TRUE)`,
      [id, id_rol, nombre_completo, cedula, email || '', hash]
    );
    res.status(201).json({ mensaje: 'Empleado creado.', id_usuario: id });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'La cédula o email ya están registrados.' });
    res.status(500).json({ error: 'Error al crear el empleado.' });
  }
});

// ── PUT /api/empleados/:id ────────────────────────────────────────────────────
router.put('/:id', auth, soloAdmin, async (req, res) => {
  const { nombre_completo, email, id_rol, estado_activo } = req.body;
  try {
    const [r] = await pool.query(
      `UPDATE USUARIO
       SET nombre_completo=?, email=?, id_rol=?, estado_activo=?
       WHERE id_usuario=?`,
      [nombre_completo, email, id_rol, estado_activo, req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Empleado no encontrado.' });
    res.json({ mensaje: 'Empleado actualizado.' });
  } catch {
    res.status(500).json({ error: 'Error al actualizar el empleado.' });
  }
});

// ── PATCH /api/empleados/:id/password — Cambiar contraseña ───────────────────
router.patch('/:id/password', auth, soloAdmin, async (req, res) => {
  const { nueva_password } = req.body;
  if (!nueva_password || nueva_password.length < 4)
    return res.status(400).json({ error: 'La nueva contraseña es obligatoria (mínimo 4 caracteres).' });
  try {
    const hash = await bcrypt.hash(nueva_password, 10);
    const [r] = await pool.query(
      'UPDATE USUARIO SET password_hash=? WHERE id_usuario=?',
      [hash, req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Empleado no encontrado.' });
    res.json({ mensaje: 'Contraseña actualizada correctamente.' });
  } catch {
    res.status(500).json({ error: 'Error al actualizar la contraseña.' });
  }
});

// ── PATCH /api/empleados/:id/toggle — Activar/Desactivar ─────────────────────
router.patch('/:id/toggle', auth, soloAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT estado_activo FROM USUARIO WHERE id_usuario=?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Empleado no encontrado.' });

    const nuevoEstado = !rows[0].estado_activo;
    await pool.query(
      'UPDATE USUARIO SET estado_activo=? WHERE id_usuario=?',
      [nuevoEstado, req.params.id]
    );
    res.json({
      mensaje: `Empleado ${nuevoEstado ? 'activado' : 'desactivado'}.`,
      estado_activo: nuevoEstado
    });
  } catch {
    res.status(500).json({ error: 'Error al cambiar el estado del empleado.' });
  }
});

// ── DELETE /api/empleados/:id — Soft delete ───────────────────────────────────
// No se borra el registro para mantener trazabilidad en pedidos y lotes
router.delete('/:id', auth, soloAdmin, async (req, res) => {
  try {
    const [r] = await pool.query(
      'UPDATE USUARIO SET estado_activo=FALSE WHERE id_usuario=?',
      [req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Empleado no encontrado.' });
    res.json({ mensaje: 'Empleado desactivado.' });
  } catch {
    res.status(500).json({ error: 'Error al desactivar el empleado.' });
  }
});

module.exports = router;
