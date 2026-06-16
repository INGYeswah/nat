-- --------------------------------------------------------
-- NatuDai ERP — schema.sql corregido y consolidado
-- Base: dump de HeidiSQL (MariaDB 12.3.2)
-- Correcciones aplicadas:
--   1. Tabla `maquina`: agregadas descripcion, capacidad_por_turno,
--      tiempo_por_unidad_min (requeridas por el INSERT existente)
--   2. Tabla `producto`: agregada columna stock_minimo (requerida por
--      dashboard.routes.js y productos.routes.js)
--   3. Tabla `producto`: agregado el producto 'prod-bentonita-nat' que
--      bom_receta ya referenciaba pero no existía (violaba FK)
--   4. Tabla `rol`: permisos_json corregido — sin '/', nombres alineados
--      con checkPermiso() del backend, y se agregan 'pedidos' y 'personal'
--      que faltaban en TODOS los roles (causaba 403 en todas las rutas)
--   5. Tabla `usuario`: password_hash reemplazado por hashes bcrypt reales
--      (admin123 / supply123) — ya no requiere /api/setup-passwords
--   6. Tabla `cliente`: se agrega 1 registro de ejemplo para poder probar
--      POST /api/ventas y POST /api/pedidos (FK obligatoria)
--   7. Tabla `pedido`: agregada columna comentarios para observaciones
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE IF NOT EXISTS `natudai` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `natudai`;

-- Limpieza para poder re-ejecutar este script sin conflictos
DROP TABLE IF EXISTS `bom_receta`;
DROP TABLE IF EXISTS `detalle_pedido`;
DROP TABLE IF EXISTS `lote_produccion`;
DROP TABLE IF EXISTS `pedido`;
DROP TABLE IF EXISTS `materia_prima`;
DROP TABLE IF EXISTS `producto`;
DROP TABLE IF EXISTS `maquina`;
DROP TABLE IF EXISTS `cliente`;
DROP TABLE IF EXISTS `usuario`;
DROP TABLE IF EXISTS `proveedor`;
DROP TABLE IF EXISTS `rol`;

-- =============================================================================
-- 1. ROL  (sin dependencias)
-- FIX #4: permisos_json sin '/', alineado a checkPermiso() del backend.
--   Rutas canónicas: dashboard | inventario | ventas | pedidos | supply | personal
-- =============================================================================
CREATE TABLE `rol` (
  `id_rol` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_rol` varchar(50) NOT NULL,
  `permisos_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL
    COMMENT 'Rutas accesibles. Ej: ["dashboard","inventario"]'
    CHECK (json_valid(`permisos_json`)),
  PRIMARY KEY (`id_rol`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `rol` (`id_rol`, `nombre_rol`, `permisos_json`) VALUES
        (1, 'Administrador',     '["dashboard","inventario","ventas","pedidos","supply","personal"]'),
        (2, 'Supply Chain',      '["dashboard","inventario","ventas","supply"]'),
        (3, 'Jefe de Producción','["dashboard","inventario","supply"]'),
        (4, 'Comercial',         '["dashboard","ventas","pedidos"]');

-- =============================================================================
-- 2. PROVEEDOR  (sin dependencias)
-- =============================================================================
CREATE TABLE `proveedor` (
  `id_proveedor` varchar(36) NOT NULL,
  `razon_social` varchar(150) NOT NULL,
  `nit` varchar(50) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id_proveedor`),
  UNIQUE KEY `nit` (`nit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `proveedor` (`id_proveedor`, `razon_social`, `nit`, `telefono`) VALUES
        ('prov-agrovalle', 'AgroValle S.A.S.', '900.123.456-1', '311-555-0192');

-- =============================================================================
-- 3. USUARIO  (depende de ROL)
-- FIX #5: password_hash = bcrypt real de 'admin123' / 'supply123' (salt 10)
-- =============================================================================
CREATE TABLE `usuario` (
  `id_usuario` varchar(36) NOT NULL,
  `id_rol` int(11) NOT NULL,
  `nombre_completo` varchar(100) NOT NULL,
  `cedula` varchar(20) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `estado_activo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `cedula` (`cedula`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_user_rol` (`id_rol`),
  CONSTRAINT `fk_user_rol` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `usuario` (`id_usuario`, `id_rol`, `nombre_completo`, `cedula`, `email`, `password_hash`, `estado_activo`) VALUES
        ('usr-admin-01',  1, 'Jefferson Acosta (CEO)',  '10102020', 'ceo@natudai.com',   '$2b$10$CmDvovDSN7sk/brY29vEOOLRukgobSELRREpuz1TMUoydMYiJZUaG', 1),
        ('usr-supply-01', 2, 'Marta Gómez (Logística)', '20203030', 'supply@natudai.com','$2b$10$6TOcLSrXupT24MyjHP1zh.H6HiQ/4GIsmkr0czdjOS91ATIZYzLoi', 1);
-- Credenciales: 10102020/admin123  ·  20203030/supply123

-- =============================================================================
-- 4. CLIENTE  (sin dependencias)
-- FIX #6: se agrega 1 registro para poder probar POST /api/ventas y /pedidos
-- =============================================================================
CREATE TABLE `cliente` (
  `id_cliente` varchar(36) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `nit` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `nivel_partner` varchar(50) DEFAULT 'Estándar',
  PRIMARY KEY (`id_cliente`),
  UNIQUE KEY `nit` (`nit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `cliente` (`id_cliente`, `nombre`, `nit`, `email`, `nivel_partner`) VALUES
        ('cli-cosmeticos-sa', 'Cosméticos Naturales S.A.S.', '900.555.123-4', 'compras@cosmeticosnaturales.com', 'Gold');

-- =============================================================================
-- 5. MAQUINA  (sin dependencias)
-- FIX #1: agregadas descripcion, capacidad_por_turno, tiempo_por_unidad_min
-- capacidad_por_turno: unidades que procesa por turno de trabajo
-- tiempo_por_unidad_min: minutos que tarda en procesar 1 unidad
-- =============================================================================
CREATE TABLE `maquina` (
  `id_maquina` varchar(36) NOT NULL,
  `nombre_maquina` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `estado_actual` varchar(50) DEFAULT 'Operativa',
  `capacidad_por_turno` decimal(10,2) DEFAULT NULL COMMENT 'Unidades que procesa por turno',
  `tiempo_por_unidad_min` decimal(10,2) DEFAULT NULL COMMENT 'Minutos requeridos por unidad',
  PRIMARY KEY (`id_maquina`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `maquina` (`id_maquina`, `nombre_maquina`, `descripcion`, `estado_actual`, `capacidad_por_turno`, `tiempo_por_unidad_min`) VALUES
        ('maq-deshid-01', 'Deshidratadora Industrial T-100', 'Deshidratadora industrial para frutas y verduras, capacidad alta', 'Operativa', 500.00, 15.00);

-- =============================================================================
-- 6. PRODUCTO  (sin dependencias)
-- FIX #2: agregada columna stock_minimo
-- FIX #3: agregado 'prod-bentonita-nat' (referenciado por bom_receta)
-- =============================================================================
CREATE TABLE `producto` (
  `id_producto` varchar(36) NOT NULL,
  `nombre_producto` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `stock_actual` decimal(10,2) DEFAULT 0.00,
  `stock_minimo` decimal(10,2) NOT NULL DEFAULT 0.00,
  `precio_venta` decimal(10,2) NOT NULL,
  `unidad_medida` varchar(20) NOT NULL,
  PRIMARY KEY (`id_producto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `producto` (`id_producto`, `nombre_producto`, `descripcion`, `stock_actual`, `stock_minimo`, `precio_venta`, `unidad_medida`) VALUES
        ('prod-fresa-deshid',  'Fresa Deshidratada Premium',  'Fresa deshidratada natural en empaque aluminizado de 250g', 0.00, 20.00, 24000.00, 'Und'),
        ('prod-bentonita-nat', 'Mascarilla de Bentonita Natural', 'Mascarilla facial 100% bentonita natural, empaque de 100g', 0.00, 30.00, 18000.00, 'Und');

-- =============================================================================
-- 7. MATERIA_PRIMA  (depende de PROVEEDOR)
-- =============================================================================
CREATE TABLE `materia_prima` (
  `id_mp` varchar(36) NOT NULL,
  `id_proveedor` varchar(36) NOT NULL,
  `nombre_mp` varchar(100) NOT NULL,
  `stock_actual` decimal(10,2) DEFAULT 0.00,
  `stock_minimo` decimal(10,2) NOT NULL,
  `costo_unitario` decimal(10,2) NOT NULL,
  `unidad_medida` varchar(20) NOT NULL,
  PRIMARY KEY (`id_mp`),
  KEY `fk_mp_proveedor` (`id_proveedor`),
  CONSTRAINT `fk_mp_proveedor` FOREIGN KEY (`id_proveedor`) REFERENCES `proveedor` (`id_proveedor`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `materia_prima` (`id_mp`, `id_proveedor`, `nombre_mp`, `stock_actual`, `stock_minimo`, `costo_unitario`, `unidad_medida`) VALUES
        ('mp-bentonita-nat', 'prov-agrovalle', 'Bentonita Natural', 200.00, 50.00,  800.00, 'Kg'),
        ('mp-fresa-fresca',  'prov-agrovalle', 'Fresa Fresca',      500.00, 100.00, 1500.00, 'Kg');

-- =============================================================================
-- 8. BOM_RECETA  (depende de PRODUCTO y MATERIA_PRIMA)
-- FIX #3: ahora 'prod-bentonita-nat' existe en PRODUCTO -> FK válida
-- =============================================================================
CREATE TABLE `bom_receta` (
  `id_producto` varchar(36) NOT NULL,
  `id_mp` varchar(36) NOT NULL,
  `cantidad_necesaria` decimal(10,4) NOT NULL,
  PRIMARY KEY (`id_producto`,`id_mp`),
  KEY `fk_bom_mp` (`id_mp`),
  CONSTRAINT `fk_bom_mp` FOREIGN KEY (`id_mp`) REFERENCES `materia_prima` (`id_mp`) ON DELETE CASCADE,
  CONSTRAINT `fk_bom_producto` FOREIGN KEY (`id_producto`) REFERENCES `producto` (`id_producto`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `bom_receta` (`id_producto`, `id_mp`, `cantidad_necesaria`) VALUES
        ('prod-bentonita-nat', 'mp-bentonita-nat', 0.0500),
        ('prod-fresa-deshid',  'mp-fresa-fresca',  1.2000);

-- =============================================================================
-- 9. PEDIDO  (depende de CLIENTE y USUARIO)
-- FIX #7: agregada columna comentarios para observaciones y notas
-- =============================================================================
CREATE TABLE `pedido` (
  `id_pedido` varchar(36) NOT NULL,
  `id_cliente` varchar(36) NOT NULL,
  `id_usuario` varchar(36) NOT NULL,
  `fecha_orden` datetime DEFAULT current_timestamp(),
  `estado_pedido` varchar(50) DEFAULT 'Pendiente',
  `total_pagar` decimal(12,2) NOT NULL,
  `comentarios` text DEFAULT NULL COMMENT 'Observaciones o notas sobre el pedido',
  PRIMARY KEY (`id_pedido`),
  KEY `fk_pedido_cliente` (`id_cliente`),
  KEY `fk_pedido_usuario` (`id_usuario`),
  CONSTRAINT `fk_pedido_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id_cliente`),
  CONSTRAINT `fk_pedido_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Sin datos iniciales: se generan al usar POST /api/ventas o /api/pedidos

-- =============================================================================
-- 10. DETALLE_PEDIDO  (depende de PEDIDO y PRODUCTO)
-- =============================================================================
CREATE TABLE `detalle_pedido` (
  `id_pedido` varchar(36) NOT NULL,
  `id_producto` varchar(36) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id_pedido`,`id_producto`),
  KEY `fk_det_producto` (`id_producto`),
  CONSTRAINT `fk_det_pedido` FOREIGN KEY (`id_pedido`) REFERENCES `pedido` (`id_pedido`) ON DELETE CASCADE,
  CONSTRAINT `fk_det_producto` FOREIGN KEY (`id_producto`) REFERENCES `producto` (`id_producto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================================================
-- 11. LOTE_PRODUCCION  (depende de MAQUINA, PRODUCTO y USUARIO)
-- =============================================================================
CREATE TABLE `lote_produccion` (
  `id_lote` varchar(36) NOT NULL,
  `id_maquina` varchar(36) NOT NULL,
  `id_producto` varchar(36) NOT NULL,
  `id_usuario` varchar(36) NOT NULL,
  `cantidad_esperada` decimal(10,2) NOT NULL,
  `fecha_inicio` datetime DEFAULT current_timestamp(),
  `fecha_fin_estimada` datetime DEFAULT NULL,
  `estado_lote` varchar(50) DEFAULT 'En Proceso',
  PRIMARY KEY (`id_lote`),
  KEY `fk_lote_maquina` (`id_maquina`),
  KEY `fk_lote_producto` (`id_producto`),
  KEY `fk_lote_usuario` (`id_usuario`),
  CONSTRAINT `fk_lote_maquina` FOREIGN KEY (`id_maquina`) REFERENCES `maquina` (`id_maquina`),
  CONSTRAINT `fk_lote_producto` FOREIGN KEY (`id_producto`) REFERENCES `producto` (`id_producto`),
  CONSTRAINT `fk_lote_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================================================
-- Restaurar configuración de sesión
-- =============================================================================
/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
