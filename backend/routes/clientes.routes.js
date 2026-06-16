// routes/clientes.routes.js
// GET   /api/clientes       — Listar todos
// POST  /api/clientes       — Crear cliente
// PUT   /api/clientes/:id   — Actualizar cliente
// DELETE /api/clientes/:id  — Eliminar cliente
const router = require('express').Router();
const pool   = require('../db/pool');
const auth   = require('../middleware/auth');

// ── GET /api/clientes ────────────────────────────────────────────────────────
router.get('/', auth, async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM CLIENTE ORDER BY nombre');
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error al obtener clientes.' });
  }
});

// ── POST /api/clientes ───────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  const { id_cliente, nombre, nit, cedula, tipo_cliente, email, nivel_partner } = req.body;
  if (!id_cliente || !nombre)
    return res.status(400).json({ error: 'id_cliente y nombre son obligatorios.' });

  const tipo = tipo_cliente || 'Empresa';

  // Para empresas, NIT es obligatorio; para personas, cédula es obligatoria
  if (tipo === 'Empresa' && !nit)
    return res.status(400).json({ error: 'NIT es obligatorio para clientes tipo Empresa.' });
  if (tipo === 'Persona' && !cedula)
    return res.status(400).json({ error: 'Cédula es obligatoria para clientes tipo Persona.' });
  if (!nit && !cedula)
    return res.status(400).json({ error: 'Debe proporcionar NIT (empresa) o cédula (persona).' });

  // Convertir strings vacíos a null para evitar colisiones con UNIQUE KEY
  const emailVal    = (email && email.trim()) || null;
  const nitVal      = (nit && nit.trim()) || null;
  const cedulaVal   = (cedula && cedula.trim()) || null;
  const nivelVal    = nivel_partner || 'Estándar';

  try {
    await pool.query(
      `INSERT INTO CLIENTE (id_cliente, nombre, cedula, tipo_cliente, nit, email, nivel_partner)
       VALUES (?,?,?,?,?,?,?)`,
      [id_cliente, nombre, cedulaVal, tipo, nitVal, emailVal, nivelVal]
    );
    res.status(201).json({ mensaje: 'Cliente creado.', id_cliente });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Ya existe un cliente con ese NIT, cédula o ID.' });
    res.status(500).json({ error: 'Error al crear el cliente.' });
  }
});

// ── PUT /api/clientes/:id ────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  const { nombre, nit, cedula, tipo_cliente, email, nivel_partner } = req.body;

  // Convertir strings vacíos a null para evitar colisiones con UNIQUE KEY
  const emailVal  = (email && email.trim()) || null;
  const nitVal    = (nit && nit.trim()) || null;
  const cedulaVal = (cedula && cedula.trim()) || null;
  const tipo      = tipo_cliente || 'Empresa';

  try {
    const [r] = await pool.query(
      `UPDATE CLIENTE SET nombre=?, cedula=?, tipo_cliente=?, nit=?, email=?, nivel_partner=? WHERE id_cliente=?`,
      [nombre, cedulaVal, tipo, nitVal, emailVal, nivel_partner, req.params.id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Cliente no encontrado.' });
    res.json({ mensaje: 'Cliente actualizado.' });
  } catch {
    res.status(500).json({ error: 'Error al actualizar el cliente.' });
  }
});

// ── DELETE /api/clientes/:id ─────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const [r] = await pool.query('DELETE FROM CLIENTE WHERE id_cliente = ?', [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ error: 'Cliente no encontrado.' });
    res.json({ mensaje: 'Cliente eliminado.' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar el cliente.' });
  }
});

module.exports = router;
