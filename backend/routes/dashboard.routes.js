// routes/dashboard.routes.js
// GET /api/dashboard/kpis   — Métricas principales
// GET /api/alertas          — Productos bajo stock mínimo
// GET /api/alertas/:id      — Detalle de alerta de un producto
const router       = require('express').Router();
const pool         = require('../db/pool');
const auth         = require('../middleware/auth');
const checkPermiso = require('../middleware/checkPermiso');

const permiso = checkPermiso('dashboard');

// ── GET /api/dashboard/kpis ───────────────────────────────────────────────────
router.get('/kpis', auth, permiso, async (_req, res) => {
  try {
    // Todas las consultas en paralelo para máxima velocidad
    const [[prod], [ing], [ped], [lot], [emp]] = await Promise.all([
      pool.query(
        'SELECT COUNT(*) AS stock_critico FROM PRODUCTO WHERE stock_actual <= stock_minimo'
      ),
      pool.query(
        "SELECT COALESCE(SUM(total_pagar),0) AS ingresos_totales FROM PEDIDO WHERE estado_pedido='Completado'"
      ),
      pool.query(
        "SELECT COUNT(*) AS pedidos_activos FROM PEDIDO WHERE estado_pedido NOT IN ('Completado','Cancelado')"
      ),
      pool.query(
        "SELECT COUNT(*) AS lotes_activos FROM LOTE_PRODUCCION WHERE estado_lote='En Proceso'"
      ),
      pool.query(
        'SELECT COUNT(*) AS empleados_activos FROM USUARIO WHERE estado_activo=TRUE'
      ),
    ]);

    res.json({
      stock_critico:     prod[0].stock_critico,
      ingresos_totales:  ing[0].ingresos_totales,
      pedidos_activos:   ped[0].pedidos_activos,
      lotes_activos:     lot[0].lotes_activos,
      empleados_activos: emp[0].empleados_activos,
    });
  } catch {
    res.status(500).json({ error: 'Error al calcular KPIs.' });
  }
});

// ── GET /api/alertas ──────────────────────────────────────────────────────────
router.get('/alertas', auth, permiso, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_producto, nombre_producto,
              stock_actual, stock_minimo,
              (stock_minimo - stock_actual) AS unidades_faltantes
       FROM PRODUCTO
       WHERE stock_actual <= stock_minimo
       ORDER BY unidades_faltantes DESC`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener alertas.' });
  }
});

// ── GET /api/alertas/:id ──────────────────────────────────────────────────────
router.get('/alertas/:id', auth, permiso, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_producto, nombre_producto,
              stock_actual, stock_minimo,
              (stock_minimo - stock_actual) AS unidades_faltantes
       FROM PRODUCTO
       WHERE id_producto = ? AND stock_actual <= stock_minimo`,
      [req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Producto sin alerta activa o no encontrado.' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Error al obtener la alerta.' });
  }
});

module.exports = router;
