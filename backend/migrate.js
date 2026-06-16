// ============================================================================
// NatuDai ERP — migrate.js
// Script de migración idempotente para la base de datos.
// Ejecutar con: node migrate.js
// Usa las mismas credenciales del .env que el servidor backend.
// ============================================================================
require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'natudai',
    port: Number(process.env.DB_PORT) || 3306,
  });

  console.log('\n🔄  NatuDai — Ejecutando migraciones...\n');

  const migrations = [
    // ── MAQUINA: columnas de capacidad y descripción ──
    {
      name: 'maquina.descripcion',
      check: `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
              WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='MAQUINA' AND COLUMN_NAME='descripcion'`,
      sql: `ALTER TABLE MAQUINA ADD COLUMN descripcion TEXT DEFAULT NULL
            COMMENT 'Descripción de la máquina' AFTER nombre_maquina`,
    },
    {
      name: 'maquina.capacidad_por_turno',
      check: `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
              WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='MAQUINA' AND COLUMN_NAME='capacidad_por_turno'`,
      sql: `ALTER TABLE MAQUINA ADD COLUMN capacidad_por_turno DECIMAL(10,2) DEFAULT NULL
            COMMENT 'Unidades que procesa por turno' AFTER estado_actual`,
    },
    {
      name: 'maquina.tiempo_por_unidad_min',
      check: `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
              WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='MAQUINA' AND COLUMN_NAME='tiempo_por_unidad_min'`,
      sql: `ALTER TABLE MAQUINA ADD COLUMN tiempo_por_unidad_min DECIMAL(10,2) DEFAULT NULL
            COMMENT 'Minutos requeridos por unidad' AFTER capacidad_por_turno`,
    },

    // ── PRODUCTO: stock_minimo ──
    {
      name: 'producto.stock_minimo',
      check: `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
              WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='PRODUCTO' AND COLUMN_NAME='stock_minimo'`,
      sql: `ALTER TABLE PRODUCTO ADD COLUMN stock_minimo DECIMAL(10,2) NOT NULL DEFAULT 0.00
            AFTER stock_actual`,
    },

    // ── PEDIDO: comentarios ──
    {
      name: 'pedido.comentarios',
      check: `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
              WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='PEDIDO' AND COLUMN_NAME='comentarios'`,
      sql: `ALTER TABLE PEDIDO ADD COLUMN comentarios TEXT DEFAULT NULL
            COMMENT 'Observaciones o notas sobre el pedido' AFTER total_pagar`,
    },
  ];

  for (const m of migrations) {
    try {
      const [rows] = await pool.query(m.check);
      const count = rows[0].cnt;
      if (count > 0) {
        console.log(`  ⏭️  ${m.name} — ya existe, se omite`);
      } else {
        await pool.query(m.sql);
        console.log(`  ✅  ${m.name} — columna creada`);
      }
    } catch (err) {
      console.error(`  ❌  ${m.name} — ERROR: ${err.message}`);
    }
  }

  // ── Actualizar permisos_json de roles (quitar '/' y agregar permisos faltantes) ──
  console.log('\n🔄  Actualizando permisos de roles...');
  try {
    const [roles] = await pool.query('SELECT id_rol, permisos_json FROM ROL');
    for (const rol of roles) {
      let permisos = typeof rol.permisos_json === 'string'
        ? JSON.parse(rol.permisos_json)
        : rol.permisos_json;

      // Quitar '/' inicial
      permisos = permisos.map((p) => p.replace(/^\//, ''));

      // Mapear 'produccion' → 'supply' si existe
      permisos = permisos.map((p) => p === 'produccion' ? 'supply' : p);

      const json = JSON.stringify(permisos);
      await pool.query('UPDATE ROL SET permisos_json=? WHERE id_rol=?', [json, rol.id_rol]);
      console.log(`  ✅  Rol ${rol.id_rol}: ${json}`);
    }
  } catch (err) {
    console.error(`  ❌  Error actualizando permisos: ${err.message}`);
  }

  await pool.end();
  console.log('\n✅  Migraciones completadas.\n');
}

run().catch((err) => {
  console.error('❌  Error fatal:', err.message);
  process.exit(1);
});
