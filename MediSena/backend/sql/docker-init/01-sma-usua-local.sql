-- Bootstrap mínimo para login local (PostgreSQL, esquema medisena).
-- Se ejecuta automáticamente solo en la primera creación del volumen de datos
-- (docker-entrypoint-initdb.d). Si el volumen ya existía vacío, aplicar a mano:
--   podman exec -i medisena-postgres psql -U medisena -d medisena < backend/sql/docker-init/01-sma-usua-local.sql

CREATE SCHEMA IF NOT EXISTS medisena;

CREATE TABLE IF NOT EXISTS medisena.sma_usua (
  mail_usua VARCHAR(255) PRIMARY KEY,
  clav_usua TEXT NOT NULL,
  rol_usua VARCHAR(50) DEFAULT 'USER',
  nomb_usua VARCHAR(255),
  cod_regi_usua VARCHAR(20),
  cod_depe_usua VARCHAR(20),
  cod_tipo_usua VARCHAR(10),
  estado_usua VARCHAR(10) DEFAULT '1',
  extension_usua VARCHAR(40)
);

INSERT INTO medisena.sma_usua (mail_usua, clav_usua, rol_usua, nomb_usua, cod_regi_usua, cod_depe_usua, cod_tipo_usua, estado_usua)
VALUES ('admin@g.com', 'admin', 'ADMIN', 'Administrador', '01', '1000', 'T', '1')
ON CONFLICT (mail_usua) DO NOTHING;
