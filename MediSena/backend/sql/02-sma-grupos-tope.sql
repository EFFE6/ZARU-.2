-- ============================================================
-- TABLA: sma_grupos_tope (Legacy: sma_grupos_tope.jsp)
-- Grupos de topes máximos por vigencia y categoría
-- Compatible con estructura Oracle SMA_GRUPOS_TOPE
-- ============================================================

-- Crear schema si no existe
CREATE SCHEMA IF NOT EXISTS sma;

-- Tabla grupos tope
CREATE TABLE IF NOT EXISTS sma.sma_grupos_tope (
  cod_grupo_tope VARCHAR(20) NOT NULL,
  nomb_grupo_tope VARCHAR(200) NOT NULL,
  cod_resolucion_grupo VARCHAR(50),
  vigencia_grupo INTEGER NOT NULL,
  cod_nivel_tope INTEGER DEFAULT 1,
  valor_normal_cat_a NUMERIC(12,2) DEFAULT 0,
  valor_normal_cat_b NUMERIC(12,2) DEFAULT 0,
  valor_normal_cat_c NUMERIC(12,2) DEFAULT 0,
  valor_normal_cat_d NUMERIC(12,2) DEFAULT 0,
  valor_especial_cat_a NUMERIC(12,2) DEFAULT 0,
  valor_especial_cat_b NUMERIC(12,2) DEFAULT 0,
  valor_especial_cat_c NUMERIC(12,2) DEFAULT 0,
  valor_especial_cat_d NUMERIC(12,2) DEFAULT 0,
  PRIMARY KEY (cod_grupo_tope, vigencia_grupo)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_grupos_tope_vigencia ON sma.sma_grupos_tope(vigencia_grupo DESC);
CREATE INDEX IF NOT EXISTS idx_grupos_tope_nombre ON sma.sma_grupos_tope(nomb_grupo_tope);

-- La tabla puede existir con estructura legacy (cod_grupo, nomb_grupo, valor_*_grupo, etc.)
-- El backend mapea ambos formatos. No insertar si la estructura es diferente.
