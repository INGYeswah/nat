-- Migration: Agregar columna stock_minimo a PRODUCTO
-- Ejecutar si la tabla ya existe sin esta columna

USE `natudai`;

ALTER TABLE `producto` ADD COLUMN `stock_minimo` decimal(10,2) DEFAULT 0.00 AFTER `stock_actual`;

-- Actualizar el producto existente con un stock mínimo de referencia
UPDATE `producto` SET `stock_minimo` = 50.00 WHERE `id_producto` = 'prod-fresa-deshid';
