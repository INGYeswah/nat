-- Migration: Actualizar permisos de roles para incluir todas las rutas
-- Ejecutar después de tener la base de datos creada

USE `natudai`;

-- Administrador: acceso total
UPDATE `rol` SET `permisos_json` = '["/dashboard", "/inventario", "/produccion", "/ventas", "/pedidos", "/personal"]' WHERE `id_rol` = 1;

-- Supply Chain: inventario, producción y pedidos
UPDATE `rol` SET `permisos_json` = '["/dashboard", "/inventario", "/produccion", "/pedidos"]' WHERE `id_rol` = 2;

-- Jefe de Producción: inventario y producción
UPDATE `rol` SET `permisos_json` = '["/dashboard", "/inventario", "/produccion"]' WHERE `id_rol` = 3;

-- Comercial: ventas y pedidos
UPDATE `rol` SET `permisos_json` = '["/dashboard", "/ventas", "/pedidos"]' WHERE `id_rol` = 4;
