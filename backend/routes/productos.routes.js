// routes/productos.routes.js
// GET    /api/productos        — Listar todos
// GET    /api/productos/:id    — Obtener uno
// POST   /api/productos        — Crear
// PUT    /api/productos/:id    — Actualizar
// DELETE /api/productos/:id    — Eliminar
const router       = require('express').Router();
const pool         = require('../db/pool');
const auth         = require('../middleware/auth');
const checkPermiso = require('../middleware/checkPermiso');

const permiso = checkPermiso('inventario');

// ── GET /api/productos ────────────────────────────────────────────────────────
router.get('/', auth, permiso, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM PRODUCTO ORDER BY nombre_producto ASC'
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener productos.' });
  }
});

// ── GET /api/productos/:id ────────────────────────────────────────────────────
router.get('/:id', auth, permiso, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM PRODUCTO WHERE id_producto = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado.' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Error al obtener el producto.' });
  }
});

// ── POST /api/productos ───────────────────────────────────────────────────────
router.post('/', auth, permiso, async (req, res) => {
  const { nombre_producto, descripcion, precio_venta,
          stock_actual, stock_minimo, unidad_medida } = req.body;

  if (!nombre_producto || !precio_venta)
    return res.status(400).json({ error: 'nombre_producto y precio_venta son obligatorios.' });

  try {
    const id = 'prod-' + Date.now();
    await pool.query(
      `INSERT INTO PRODUCTO
         (id_producto, nombre_producto, descripcion,
          stock_actual, stock_minimo, precio_venta, unidad_medida)
       VALUES (?,?,?,?,?,?,?)`,
      [id, nombre_producto, descripcion || '',
       stock_actual || 0, stock_minimo || 0,
       precio_venta, unidad_medida || 'Und']
    );
    res.status(201).json({ mensaje: 'Producto creado.', id_producto: id });
  } catch {
    res.status(500).json({ error: 'Error al crear el producto.' });
  }
});

// ── PUT /api/productos/:id ────────────────────────────────────────────────────
router.put('/:id', auth, permiso, async (req, res) => {
  const { nombre_producto, descripcion, precio_venta,
          stock_actual, stock_minimo, unidad_medida } = req.body;
  try {
    const [r] = await pool.query(
      `UPDATE PRODUCTO
       SET nombre_producto=?, descripcion=?, precio_venta=?,
           stock_actual=?, stock_minimo=?, unidad_medida=?
       WHERE id_producto=?`,
      [nombre_producto, descripcion, precio_venta,
       stock_actual, stock_minimo, unidad_medida, req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Producto no encontrado.' });
    res.json({ mensaje: 'Producto actualizado.' });
  } catch {
    res.status(500).json({ error: 'Error al actualizar el producto.' });
  }
});

// ── DELETE /api/productos/:id ─────────────────────────────────────────────────
router.delete('/:id', auth, permiso, async (req, res) => {
  try {
    const [r] = await pool.query(
      'DELETE FROM PRODUCTO WHERE id_producto = ?',
      [req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Producto no encontrado.' });
    res.json({ mensaje: 'Producto eliminado.' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar el producto.' });
  }
});

// ── GET /api/productos/materia-prima (extra) ──────────────────────────────────
router.get('/materia-prima/lista', auth, permiso, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.*, p.razon_social AS proveedor
       FROM MATERIA_PRIMA m
       JOIN PROVEEDOR p ON m.id_proveedor = p.id_proveedor
       ORDER BY m.nombre_mp ASC`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener materias primas.' });
  }
});

module.exports = router;
