// routes/pedidos.routes.js
// GET   /api/pedidos              — Listar todos
// GET   /api/pedidos/:id          — Obtener uno
// POST  /api/pedidos              — Crear pedido
// PUT   /api/pedidos/:id          — Actualizar pedido
// PATCH /api/pedidos/:id/status   — Cambiar solo el estado
// PATCH /api/pedidos/:id/cancel   — Cancelar pedido (solo si está Pendiente)
const router       = require('express').Router();
const pool         = require('../db/pool');
const auth         = require('../middleware/auth');
const checkPermiso = require('../middleware/checkPermiso');

const permiso = checkPermiso('pedidos');

const ESTADOS_VALIDOS = ['Pendiente', 'En proceso', 'Enviado', 'Completado', 'Cancelado'];

const SELECT_PEDIDO = `
  SELECT p.id_pedido, c.nombre AS cliente,
         pr.nombre_producto AS producto,
         dp.cantidad, dp.precio_unitario,
         p.total_pagar, p.estado_pedido AS estado, p.fecha_orden,
         p.comentarios
  FROM PEDIDO p
  JOIN CLIENTE c         ON p.id_cliente  = c.id_cliente
  JOIN DETALLE_PEDIDO dp ON dp.id_pedido  = p.id_pedido
  JOIN PRODUCTO pr       ON pr.id_producto = dp.id_producto
`;

// ── GET /api/pedidos ──────────────────────────────────────────────────────────
router.get('/', auth, permiso, async (_req, res) => {
  try {
    const [rows] = await pool.query(SELECT_PEDIDO + ' ORDER BY p.fecha_orden DESC');
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener pedidos.' });
  }
});

// ── GET /api/pedidos/:id ──────────────────────────────────────────────────────
router.get('/:id', auth, permiso, async (req, res) => {
  try {
    const [rows] = await pool.query(
      SELECT_PEDIDO + ' WHERE p.id_pedido = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Pedido no encontrado.' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Error al obtener el pedido.' });
  }
});

// ── POST /api/pedidos ─────────────────────────────────────────────────────────
router.post('/', auth, permiso, async (req, res) => {
  const { id_cliente, id_producto, cantidad, precio_unitario, comentarios } = req.body;
  if (!id_cliente || !id_producto || !cantidad || !precio_unitario)
    return res.status(400).json({
      error: 'id_cliente, id_producto, cantidad y precio_unitario son obligatorios.'
    });

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const total     = cantidad * precio_unitario;
    const id_pedido = 'ped-' + Date.now();

    await conn.query(
      `INSERT INTO PEDIDO (id_pedido, id_cliente, id_usuario, total_pagar, estado_pedido, comentarios)
       VALUES (?,?,?,?,?,'Pendiente',?)`,
      [id_pedido, id_cliente, req.usuario.id, total, comentarios || null]
    );
    await conn.query(
      `INSERT INTO DETALLE_PEDIDO (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
       VALUES (?,?,?,?,?)`,
      [id_pedido, id_producto, cantidad, precio_unitario, total]
    );

    await conn.commit();
    res.status(201).json({ mensaje: 'Pedido creado.', id_pedido });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al crear el pedido.' });
  } finally {
    conn.release();
  }
});

// ── PUT /api/pedidos/:id ──────────────────────────────────────────────────────
router.put('/:id', auth, permiso, async (req, res) => {
  const { estado_pedido, total_pagar, comentarios } = req.body;
  try {
    const [r] = await pool.query(
      'UPDATE PEDIDO SET estado_pedido=?, total_pagar=?, comentarios=? WHERE id_pedido=?',
      [estado_pedido, total_pagar, comentarios !== undefined ? comentarios : undefined, req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Pedido no encontrado.' });
    res.json({ mensaje: 'Pedido actualizado.' });
  } catch {
    res.status(500).json({ error: 'Error al actualizar el pedido.' });
  }
});

// ── PATCH /api/pedidos/:id/status ─────────────────────────────────────────────
router.patch('/:id/status', auth, permiso, async (req, res) => {
  const { estado } = req.body;
  if (!ESTADOS_VALIDOS.includes(estado))
    return res.status(400).json({
      error: `Estado inválido. Opciones: ${ESTADOS_VALIDOS.join(', ')}`
    });
  try {
    const [r] = await pool.query(
      'UPDATE PEDIDO SET estado_pedido=? WHERE id_pedido=?',
      [estado, req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Pedido no encontrado.' });
    res.json({ mensaje: `Estado actualizado a '${estado}'.` });
  } catch {
    res.status(500).json({ error: 'Error al cambiar el estado.' });
  }
});

// ── PATCH /api/pedidos/:id/cancel — Cancelar pedido pendiente ────────────────
router.patch('/:id/cancel', auth, permiso, async (req, res) => {
  const { comentarios } = req.body;
  try {
    // Verificar que el pedido esté en estado Pendiente
    const [rows] = await pool.query(
      'SELECT estado_pedido FROM PEDIDO WHERE id_pedido=?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Pedido no encontrado.' });
    if (rows[0].estado_pedido !== 'Pendiente')
      return res.status(400).json({
        error: `Solo se pueden cancelar pedidos en estado 'Pendiente'. Estado actual: '${rows[0].estado_pedido}'`
      });

    await pool.query(
      'UPDATE PEDIDO SET estado_pedido=?, comentarios=? WHERE id_pedido=?',
      ['Cancelado', comentarios || null, req.params.id]
    );
    res.json({ mensaje: 'Pedido cancelado correctamente.' });
  } catch {
    res.status(500).json({ error: 'Error al cancelar el pedido.' });
  }
});

// ── PATCH /api/pedidos/:id/comentarios — Agregar comentario a pedido ─────────
router.patch('/:id/comentarios', auth, permiso, async (req, res) => {
  const { comentarios } = req.body;
  if (comentarios === undefined)
    return res.status(400).json({ error: 'comentarios es obligatorio.' });
  try {
    const [r] = await pool.query(
      'UPDATE PEDIDO SET comentarios=? WHERE id_pedido=?',
      [comentarios, req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Pedido no encontrado.' });
    res.json({ mensaje: 'Comentario actualizado.' });
  } catch {
    res.status(500).json({ error: 'Error al actualizar el comentario.' });
  }
});

module.exports = router;
