-- ============================================================
-- Agregar columna FECHA_ULTIMO_ACCESO a sma_usua
-- Para mostrar "Último Acceso" en la lista de usuarios
-- Fecha: 2025-02-18
-- ============================================================

-- PostgreSQL
ALTER TABLE sma.sma_usua ADD COLUMN IF NOT EXISTS fecha_ultimo_acceso TIMESTAMP;

-- Oracle (si aplica)
-- ALTER TABLE SMA_USUA ADD (FECHA_ULTIMO_ACCESO DATE);
