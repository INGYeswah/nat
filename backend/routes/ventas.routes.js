// routes/ventas.routes.js
// GET    /api/ventas       — Listar todas
// GET    /api/ventas/:id   — Obtener una
// POST   /api/ventas       — Registrar (transacción ACID)
// DELETE /api/ventas/:id   — Eliminar
const router       = require('express').Router();
const pool         = require('../db/pool');
const auth         = require('../middleware/auth');
const checkPermiso = require('../middleware/checkPermiso');

const permiso = checkPermiso('ventas');

const SELECT_VENTA = `
  SELECT p.id_pedido, c.nombre AS cliente,
         pr.nombre_producto AS producto,
         dp.cantidad, dp.precio_unitario,
         p.total_pagar, p.estado_pedido, p.fecha_orden
  FROM PEDIDO p
  JOIN CLIENTE c         ON p.id_cliente  = c.id_cliente
  JOIN DETALLE_PEDIDO dp ON dp.id_pedido  = p.id_pedido
  JOIN PRODUCTO pr       ON pr.id_producto = dp.id_producto
`;

// ── GET /api/ventas ───────────────────────────────────────────────────────────
router.get('/', auth, permiso, async (_req, res) => {
  try {
    const [rows] = await pool.query(SELECT_VENTA + ' ORDER BY p.fecha_orden DESC');
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener ventas.' });
  }
});

// ── GET /api/ventas/:id ───────────────────────────────────────────────────────
router.get('/:id', auth, permiso, async (req, res) => {
  try {
    const [rows] = await pool.query(
      SELECT_VENTA + ' WHERE p.id_pedido = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Venta no encontrada.' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Error al obtener la venta.' });
  }
});

// ── POST /api/ventas ──────────────────────────────────────────────────────────
router.post('/', auth, permiso, async (req, res) => {
  const { id_cliente, id_producto, cantidad, precio_unitario } = req.body;
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
      `INSERT INTO PEDIDO (id_pedido, id_cliente, id_usuario, total_pagar, estado_pedido)
       VALUES (?,?,?,?,'Completado')`,
      [id_pedido, id_cliente, req.usuario.id, total]
    );
    await conn.query(
      `INSERT INTO DETALLE_PEDIDO (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
       VALUES (?,?,?,?,?)`,
      [id_pedido, id_producto, cantidad, precio_unitario, total]
    );
    // Descontar del inventario automáticamente
    await conn.query(
      'UPDATE PRODUCTO SET stock_actual = stock_actual - ? WHERE id_producto = ?',
      [cantidad, id_producto]
    );

    await conn.commit();
    res.status(201).json({ mensaje: 'Venta registrada con éxito.', id_pedido });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al registrar la venta.' });
  } finally {
    conn.release();
  }
});

// ── DELETE /api/ventas/:id ────────────────────────────────────────────────────
router.delete('/:id', auth, permiso, async (req, res) => {
  try {
    const [r] = await pool.query(
      'DELETE FROM PEDIDO WHERE id_pedido = ?',
      [req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Venta no encontrada.' });
    res.json({ mensaje: 'Venta eliminada.' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar la venta.' });
  }
});

module.exports = router;
