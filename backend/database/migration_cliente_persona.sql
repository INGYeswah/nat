-- Migration: Add support for individual customers (personas) with cédula
-- Makes NIT nullable and adds cédula + tipo_cliente columns

ALTER TABLE `cliente`
  ADD COLUMN `cedula` varchar(20) DEFAULT NULL AFTER `nombre`,
  ADD COLUMN `tipo_cliente` varchar(20) NOT NULL DEFAULT 'Empresa' AFTER `cedula`,
  DROP INDEX `nit`,
  MODIFY COLUMN `nit` varchar(50) DEFAULT NULL;

-- Add unique constraint on cédula for individuals
ALTER TABLE `cliente` ADD UNIQUE KEY `cedula` (`cedula`);

-- Add unique constraint back on nit (nullable, only for non-null values)
ALTER TABLE `cliente` ADD UNIQUE KEY `nit` (`nit`);
