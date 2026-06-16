// routes/produccion.routes.js
// GET   /api/produccion/maquinas           — Listar máquinas
// POST  /api/produccion/maquinas           — Crear máquina
// PUT   /api/produccion/maquinas/:id       — Actualizar máquina
// DELETE /api/produccion/maquinas/:id      — Eliminar máquina
// PATCH /api/produccion/maquinas/:id/status — Cambiar estado de máquina
// GET   /api/produccion/lotes              — Listar lotes
// POST  /api/produccion/lotes              — Crear lote
// PATCH /api/produccion/lotes/:id/status   — Cambiar estado del lote
const router       = require('express').Router();
const pool         = require('../db/pool');
const auth         = require('../middleware/auth');
const checkPermiso = require('../middleware/checkPermiso');

const permiso = checkPermiso('supply');

const ESTADOS_LOTE = ['En Proceso', 'Completado', 'Cancelado'];
const ESTADOS_MAQUINA = ['Operativa', 'En Mantenimiento', 'Fuera de Servicio'];

// ═══════════════════════════════════════════════════════════════════════════════
// MÁQUINAS — CRUD completo
// ═══════════════════════════════════════════════════════════════════════════════

// ── GET /api/produccion/maquinas ──────────────────────────────────────────────
router.get('/maquinas', auth, permiso, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_maquina, nombre_maquina, descripcion, estado_actual,
              capacidad_por_turno, tiempo_por_unidad_min
       FROM MAQUINA ORDER BY nombre_maquina ASC`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener máquinas.' });
  }
});

// ── POST /api/produccion/maquinas ─────────────────────────────────────────────
router.post('/maquinas', auth, permiso, async (req, res) => {
  const { nombre_maquina, descripcion, estado_actual, capacidad_por_turno, tiempo_por_unidad_min } = req.body;
  if (!nombre_maquina)
    return res.status(400).json({ error: 'nombre_maquina es obligatorio.' });
  try {
    const id_maquina = 'maq-' + Date.now();
    await pool.query(
      `INSERT INTO MAQUINA
         (id_maquina, nombre_maquina, descripcion, estado_actual,
          capacidad_por_turno, tiempo_por_unidad_min)
       VALUES (?,?,?,?,?,?)`,
      [id_maquina, nombre_maquina,
       descripcion || null,
       estado_actual || 'Operativa',
       capacidad_por_turno || null,
       tiempo_por_unidad_min || null]
    );
    res.status(201).json({ mensaje: 'Máquina creada.', id_maquina });
  } catch {
    res.status(500).json({ error: 'Error al crear la máquina.' });
  }
});

// ── PUT /api/produccion/maquinas/:id ──────────────────────────────────────────
router.put('/maquinas/:id', auth, permiso, async (req, res) => {
  const { nombre_maquina, descripcion, estado_actual, capacidad_por_turno, tiempo_por_unidad_min } = req.body;
  try {
    const [r] = await pool.query(
      `UPDATE MAQUINA
       SET nombre_maquina=?, descripcion=?, estado_actual=?,
           capacidad_por_turno=?, tiempo_por_unidad_min=?
       WHERE id_maquina=?`,
      [nombre_maquina, descripcion || null, estado_actual,
       capacidad_por_turno || null, tiempo_por_unidad_min || null,
       req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Máquina no encontrada.' });
    res.json({ mensaje: 'Máquina actualizada.' });
  } catch {
    res.status(500).json({ error: 'Error al actualizar la máquina.' });
  }
});

// ── PATCH /api/produccion/maquinas/:id/status ────────────────────────────────
router.patch('/maquinas/:id/status', auth, permiso, async (req, res) => {
  const { estado_actual } = req.body;
  if (!ESTADOS_MAQUINA.includes(estado_actual))
    return res.status(400).json({
      error: `Estado inválido. Opciones: ${ESTADOS_MAQUINA.join(', ')}`
    });
  try {
    const [r] = await pool.query(
      'UPDATE MAQUINA SET estado_actual=? WHERE id_maquina=?',
      [estado_actual, req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Máquina no encontrada.' });
    res.json({ mensaje: `Estado de máquina actualizado a '${estado_actual}'.` });
  } catch {
    res.status(500).json({ error: 'Error al actualizar el estado de la máquina.' });
  }
});

// ── DELETE /api/produccion/maquinas/:id ───────────────────────────────────────
router.delete('/maquinas/:id', auth, permiso, async (req, res) => {
  try {
    // Verificar si hay lotes activos usando esta máquina
    const [lotes] = await pool.query(
      "SELECT id_lote FROM LOTE_PRODUCCION WHERE id_maquina=? AND estado_lote='En Proceso'",
      [req.params.id]
    );
    if (lotes.length > 0)
      return res.status(409).json({
        error: 'No se puede eliminar: hay lotes de producción activos usando esta máquina.'
      });

    const [r] = await pool.query(
      'DELETE FROM MAQUINA WHERE id_maquina=?',
      [req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Máquina no encontrada.' });
    res.json({ mensaje: 'Máquina eliminada.' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar la máquina.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOTES DE PRODUCCIÓN
// ═══════════════════════════════════════════════════════════════════════════════

// ── GET /api/produccion/lotes ─────────────────────────────────────────────────
router.get('/lotes', auth, permiso, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT l.id_lote, l.cantidad_esperada,
              l.fecha_inicio, l.fecha_fin_estimada AS fecha_fin,
              l.estado_lote,
              m.nombre_maquina AS maquina,
              m.capacidad_por_turno,
              m.tiempo_por_unidad_min,
              pr.nombre_producto,
              u.nombre_completo AS operario,
              -- Progreso estimado por tiempo (0-100)
              LEAST(100, GREATEST(0, ROUND(
                TIMESTAMPDIFF(MINUTE, l.fecha_inicio, NOW()) /
                NULLIF(TIMESTAMPDIFF(MINUTE, l.fecha_inicio, l.fecha_fin_estimada), 0) * 100
              ))) AS progreso
       FROM LOTE_PRODUCCION l
       JOIN MAQUINA  m  ON l.id_maquina  = m.id_maquina
       JOIN PRODUCTO pr ON l.id_producto = pr.id_producto
       JOIN USUARIO  u  ON l.id_usuario  = u.id_usuario
       ORDER BY l.fecha_inicio DESC`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener lotes.' });
  }
});

// ── POST /api/produccion/lotes ────────────────────────────────────────────────
router.post('/lotes', auth, permiso, async (req, res) => {
  const { id_maquina, id_producto, cantidad_esperada, fecha_fin_estimada } = req.body;
  if (!id_maquina || !id_producto || !cantidad_esperada)
    return res.status(400).json({
      error: 'id_maquina, id_producto y cantidad_esperada son obligatorios.'
    });
  try {
    const id_lote = 'lote-' + Date.now();

    // Calcular fecha fin estimada automáticamente si no se proporciona
    // tiempo_por_unidad_min = minutos totales para producir capacidad_por_turno unidades
    let fechaFin = fecha_fin_estimada || null;
    if (!fechaFin) {
      const [maqRows] = await pool.query(
        'SELECT tiempo_por_unidad_min, capacidad_por_turno FROM MAQUINA WHERE id_maquina=?',
        [id_maquina]
      );
      if (maqRows.length && maqRows[0].tiempo_por_unidad_min && maqRows[0].capacidad_por_turno) {
        const minPorUnidad = Number(maqRows[0].tiempo_por_unidad_min) / Number(maqRows[0].capacidad_por_turno);
        const minutosTotal = cantidad_esperada * minPorUnidad;
        fechaFin = new Date(Date.now() + minutosTotal * 60000)
          .toISOString().slice(0, 19).replace('T', ' ');
      }
    }

    await pool.query(
      `INSERT INTO LOTE_PRODUCCION
         (id_lote, id_maquina, id_producto, id_usuario,
          cantidad_esperada, fecha_inicio, fecha_fin_estimada, estado_lote)
       VALUES (?,?,?,?,?,NOW(),?,'En Proceso')`,
      [id_lote, id_maquina, id_producto, req.usuario.id,
       cantidad_esperada, fechaFin]
    );
    res.status(201).json({ mensaje: 'Lote de producción creado.', id_lote });
  } catch {
    res.status(500).json({ error: 'Error al crear el lote.' });
  }
});

// ── PATCH /api/produccion/lotes/:id/status ────────────────────────────────────
router.patch('/lotes/:id/status', auth, permiso, async (req, res) => {
  const { estado } = req.body;
  if (!ESTADOS_LOTE.includes(estado))
    return res.status(400).json({
      error: `Estado inválido. Opciones: ${ESTADOS_LOTE.join(', ')}`
    });
  try {
    const [r] = await pool.query(
      'UPDATE LOTE_PRODUCCION SET estado_lote=? WHERE id_lote=?',
      [estado, req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Lote no encontrado.' });
    res.json({ mensaje: `Estado del lote actualizado a '${estado}'.` });
  } catch {
    res.status(500).json({ error: 'Error al actualizar el lote.' });
  }
});

module.exports = router;
