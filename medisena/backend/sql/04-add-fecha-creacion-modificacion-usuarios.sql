-- ============================================================
-- Agregar columnas FECHA_CREACION y FECHA_MODIFICACION a sma_usua
-- Para mostrar "Fecha de Creación" y "Fecha de Modificación" en detalles de usuario
-- Fecha: 2025-02-20
-- ============================================================

-- PostgreSQL
ALTER TABLE sma.sma_usua ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP;
ALTER TABLE sma.sma_usua ADD COLUMN IF NOT EXISTS fecha_modificacion TIMESTAMP;

-- Opcional: rellenar con la fecha actual para registros existentes (si están NULL)
-- UPDATE sma.sma_usua SET fecha_creacion = CURRENT_TIMESTAMP WHERE fecha_creacion IS NULL;
-- UPDATE sma.sma_usua SET fecha_modificacion = CURRENT_TIMESTAMP WHERE fecha_modificacion IS NULL;

-- Oracle (si aplica)
-- ALTER TABLE SMA_USUA ADD (FECHA_CREACION DATE);
-- ALTER TABLE SMA_USUA ADD (FECHA_MODIFICACION DATE);
