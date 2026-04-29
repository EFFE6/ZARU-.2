-- ============================================================
-- SCRIPT DE CREACIÓN DE TABLAS PARA BACKEND API MODULAR
-- Sistema: SMA - Sistema de Medicina Asistencial
-- Fecha: 8 de Octubre, 2025
-- Versión: 2.0.0
-- ============================================================

-- ============================================================
-- SECUENCIAS
-- ============================================================

CREATE SEQUENCE sma_beneficiarios_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE sma_contratistas_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE sma_funcionarios_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE sma_medicos_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE sma_ordenes_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE sma_recibos_pago_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE sma_parentescos_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE sma_vigencias_seq START WITH 1 INCREMENT BY 1;

-- ============================================================
-- TABLA: sma_beneficiarios
-- ============================================================

CREATE TABLE sma_beneficiarios (
  id_beneficiario NUMBER PRIMARY KEY,
  numero_identificacion VARCHAR2(20) NOT NULL UNIQUE,
  nombres VARCHAR2(100) NOT NULL,
  apellidos VARCHAR2(100) NOT NULL,
  tipo_documento VARCHAR2(10) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  sexo CHAR(1) NOT NULL,
  parentesco VARCHAR2(50) NOT NULL,
  funcionario VARCHAR2(200) NOT NULL,
  estado VARCHAR2(20) DEFAULT 'ACTIVO' NOT NULL,
  telefono VARCHAR2(20),
  email VARCHAR2(100),
  direccion VARCHAR2(200),
  ciudad VARCHAR2(100),
  departamento VARCHAR2(100),
  eps VARCHAR2(100),
  grupo_sanguineo VARCHAR2(5),
  fecha_afiliacion DATE DEFAULT SYSDATE,
  regional VARCHAR2(10) NOT NULL,
  observaciones VARCHAR2(500),
  fecha_creacion DATE DEFAULT SYSDATE NOT NULL,
  fecha_modificacion DATE DEFAULT SYSDATE NOT NULL,
  CONSTRAINT chk_beneficiario_estado CHECK (estado IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO')),
  CONSTRAINT chk_beneficiario_tipo_doc CHECK (tipo_documento IN ('CC', 'TI', 'RC', 'CE', 'PP')),
  CONSTRAINT chk_beneficiario_sexo CHECK (sexo IN ('M', 'F'))
);

-- Índices
CREATE INDEX idx_beneficiario_identificacion ON sma_beneficiarios(numero_identificacion);
CREATE INDEX idx_beneficiario_estado ON sma_beneficiarios(estado);
CREATE INDEX idx_beneficiario_parentesco ON sma_beneficiarios(parentesco);
CREATE INDEX idx_beneficiario_funcionario ON sma_beneficiarios(funcionario);
CREATE INDEX idx_beneficiario_nombres ON sma_beneficiarios(nombres, apellidos);
CREATE INDEX idx_beneficiario_regional ON sma_beneficiarios(regional);

-- Trigger
CREATE OR REPLACE TRIGGER trg_beneficiarios_update
  BEFORE UPDATE ON sma_beneficiarios
  FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
END;
/

-- ============================================================
-- TABLA: sma_funcionarios
-- ============================================================

CREATE TABLE sma_funcionarios (
  id_funcionario NUMBER PRIMARY KEY,
  numero_identificacion VARCHAR2(20) NOT NULL UNIQUE,
  nombres VARCHAR2(100) NOT NULL,
  apellidos VARCHAR2(100) NOT NULL,
  tipo_documento VARCHAR2(10) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  sexo CHAR(1) NOT NULL,
  estado VARCHAR2(20) DEFAULT 'ACTIVO' NOT NULL,
  cargo VARCHAR2(100) NOT NULL,
  dependencia VARCHAR2(100) NOT NULL,
  regional VARCHAR2(10) NOT NULL,
  telefono VARCHAR2(20),
  email VARCHAR2(100),
  direccion VARCHAR2(200),
  ciudad VARCHAR2(100),
  departamento VARCHAR2(100),
  fecha_ingreso DATE DEFAULT SYSDATE,
  tipo_vinculacion VARCHAR2(50),
  observaciones VARCHAR2(500),
  fecha_creacion DATE DEFAULT SYSDATE NOT NULL,
  fecha_modificacion DATE DEFAULT SYSDATE NOT NULL,
  CONSTRAINT chk_funcionario_estado CHECK (estado IN ('ACTIVO', 'INACTIVO', 'RETIRADO')),
  CONSTRAINT chk_funcionario_tipo_doc CHECK (tipo_documento IN ('CC', 'CE', 'PP')),
  CONSTRAINT chk_funcionario_sexo CHECK (sexo IN ('M', 'F'))
);

-- Índices
CREATE INDEX idx_funcionario_identificacion ON sma_funcionarios(numero_identificacion);
CREATE INDEX idx_funcionario_estado ON sma_funcionarios(estado);
CREATE INDEX idx_funcionario_regional ON sma_funcionarios(regional);
CREATE INDEX idx_funcionario_dependencia ON sma_funcionarios(dependencia);
CREATE INDEX idx_funcionario_nombres ON sma_funcionarios(nombres, apellidos);

-- Trigger
CREATE OR REPLACE TRIGGER trg_funcionarios_update
  BEFORE UPDATE ON sma_funcionarios
  FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
END;
/

-- ============================================================
-- TABLA: sma_medicos
-- ============================================================

CREATE TABLE sma_medicos (
  id_medico NUMBER PRIMARY KEY,
  numero_identificacion VARCHAR2(20) NOT NULL UNIQUE,
  nombres VARCHAR2(100) NOT NULL,
  apellidos VARCHAR2(100) NOT NULL,
  tipo_documento VARCHAR2(10) NOT NULL,
  registro_medico VARCHAR2(50) NOT NULL UNIQUE,
  especialidad VARCHAR2(100) NOT NULL,
  subespecialidad VARCHAR2(100),
  estado VARCHAR2(20) DEFAULT 'ACTIVO' NOT NULL,
  telefono VARCHAR2(20),
  email VARCHAR2(100),
  direccion_consultorio VARCHAR2(200),
  ciudad VARCHAR2(100),
  horarios_atencion VARCHAR2(200),
  tarifa_consulta NUMBER(10,2),
  regional VARCHAR2(10) NOT NULL,
  observaciones VARCHAR2(500),
  fecha_creacion DATE DEFAULT SYSDATE NOT NULL,
  fecha_modificacion DATE DEFAULT SYSDATE NOT NULL,
  CONSTRAINT chk_medico_estado CHECK (estado IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO')),
  CONSTRAINT chk_medico_tipo_doc CHECK (tipo_documento IN ('CC', 'CE', 'PP'))
);

-- Índices
CREATE INDEX idx_medico_registro ON sma_medicos(registro_medico);
CREATE INDEX idx_medico_identificacion ON sma_medicos(numero_identificacion);
CREATE INDEX idx_medico_estado ON sma_medicos(estado);
CREATE INDEX idx_medico_especialidad ON sma_medicos(especialidad);
CREATE INDEX idx_medico_nombres ON sma_medicos(nombres, apellidos);
CREATE INDEX idx_medico_ciudad ON sma_medicos(ciudad);

-- Trigger
CREATE OR REPLACE TRIGGER trg_medicos_update
  BEFORE UPDATE ON sma_medicos
  FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
END;
/

-- ============================================================
-- TABLA: sma_contratistas
-- ============================================================

CREATE TABLE sma_contratistas (
  id_contratista NUMBER PRIMARY KEY,
  numero_identificacion VARCHAR2(20) NOT NULL UNIQUE,
  nombres VARCHAR2(100) NOT NULL,
  apellidos VARCHAR2(100) NOT NULL,
  tipo_documento VARCHAR2(10) NOT NULL,
  estado VARCHAR2(20) DEFAULT 'ACTIVO' NOT NULL,
  tipo_vinculacion VARCHAR2(50) NOT NULL,
  fecha_ingreso DATE NOT NULL,
  regional VARCHAR2(10) NOT NULL,
  cargo VARCHAR2(100) NOT NULL,
  dependencia VARCHAR2(100) NOT NULL,
  telefono VARCHAR2(20) NOT NULL,
  email VARCHAR2(100),
  fecha_creacion DATE DEFAULT SYSDATE NOT NULL,
  fecha_modificacion DATE DEFAULT SYSDATE NOT NULL,
  CONSTRAINT chk_contratista_estado CHECK (estado IN ('ACTIVO', 'INACTIVO', 'RETIRADO')),
  CONSTRAINT chk_tipo_documento CHECK (tipo_documento IN ('CC', 'CE', 'NIT', 'PP')),
  CONSTRAINT chk_tipo_vinculacion CHECK (tipo_vinculacion IN ('A_PRUEBA', 'ESTABLECIMIENTO', 'PRESTACION_SERVICIOS', 'VIGENCIA_FIJA'))
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_contratista_identificacion ON sma_contratistas(numero_identificacion);
CREATE INDEX idx_contratista_estado ON sma_contratistas(estado);
CREATE INDEX idx_contratista_regional ON sma_contratistas(regional);
CREATE INDEX idx_contratista_nombres ON sma_contratistas(nombres, apellidos);

-- Trigger para actualizar fecha_modificacion
CREATE OR REPLACE TRIGGER trg_contratistas_update
  BEFORE UPDATE ON sma_contratistas
  FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
END;
/

-- ============================================================
-- TABLA: sma_ordenes
-- ============================================================

CREATE TABLE sma_ordenes (
  id_orden NUMBER PRIMARY KEY,
  numero_orden VARCHAR2(50) NOT NULL UNIQUE,
  beneficiario VARCHAR2(200) NOT NULL,
  funcionario VARCHAR2(200) NOT NULL,
  medico VARCHAR2(200) NOT NULL,
  especialidad VARCHAR2(100) NOT NULL,
  fecha_orden DATE NOT NULL,
  estado VARCHAR2(20) DEFAULT 'PENDIENTE' NOT NULL,
  tipo_atencion VARCHAR2(50) NOT NULL,
  observaciones VARCHAR2(500),
  valor_total NUMBER(10,2),
  diagnostico VARCHAR2(500),
  fecha_creacion DATE DEFAULT SYSDATE NOT NULL,
  fecha_modificacion DATE DEFAULT SYSDATE NOT NULL,
  CONSTRAINT chk_orden_estado CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA')),
  CONSTRAINT chk_tipo_atencion CHECK (tipo_atencion IN ('CONSULTA', 'CONTROL', 'URGENCIA', 'ESPECIALIZADA'))
);

-- Índices
CREATE INDEX idx_orden_numero ON sma_ordenes(numero_orden);
CREATE INDEX idx_orden_estado ON sma_ordenes(estado);
CREATE INDEX idx_orden_beneficiario ON sma_ordenes(beneficiario);
CREATE INDEX idx_orden_medico ON sma_ordenes(medico);
CREATE INDEX idx_orden_fecha ON sma_ordenes(fecha_orden);

-- Trigger
CREATE OR REPLACE TRIGGER trg_ordenes_update
  BEFORE UPDATE ON sma_ordenes
  FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
END;
/

-- ============================================================
-- TABLA: sma_recibos_pago
-- ============================================================

CREATE TABLE sma_recibos_pago (
  id_recibo NUMBER PRIMARY KEY,
  numero_recibo VARCHAR2(50) NOT NULL UNIQUE,
  funcionario VARCHAR2(200) NOT NULL,
  beneficiario VARCHAR2(200) NOT NULL,
  fecha_pago DATE NOT NULL,
  valor_total NUMBER(10,2) NOT NULL,
  concepto VARCHAR2(200) NOT NULL,
  estado VARCHAR2(20) DEFAULT 'PENDIENTE' NOT NULL,
  tipo_pago VARCHAR2(50) NOT NULL,
  metodo_pago VARCHAR2(50) NOT NULL,
  observaciones VARCHAR2(500),
  referencia VARCHAR2(100),
  regional VARCHAR2(10) NOT NULL,
  fecha_creacion DATE DEFAULT SYSDATE NOT NULL,
  fecha_modificacion DATE DEFAULT SYSDATE NOT NULL,
  CONSTRAINT chk_recibo_estado CHECK (estado IN ('PENDIENTE', 'PAGADO', 'CANCELADO')),
  CONSTRAINT chk_tipo_pago CHECK (tipo_pago IN ('MATERNIDAD_VIGOROSA', 'MATERNO_VIGOROSO', 'PARTICULAR')),
  CONSTRAINT chk_metodo_pago CHECK (metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'TARJETA'))
);

-- Índices
CREATE INDEX idx_recibo_numero ON sma_recibos_pago(numero_recibo);
CREATE INDEX idx_recibo_estado ON sma_recibos_pago(estado);
CREATE INDEX idx_recibo_funcionario ON sma_recibos_pago(funcionario);
CREATE INDEX idx_recibo_fecha ON sma_recibos_pago(fecha_pago);
CREATE INDEX idx_recibo_regional ON sma_recibos_pago(regional);

-- Trigger
CREATE OR REPLACE TRIGGER trg_recibos_pago_update
  BEFORE UPDATE ON sma_recibos_pago
  FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
END;
/

-- ============================================================
-- TABLA: sma_parentescos
-- ============================================================

CREATE TABLE sma_parentescos (
  id_parentesco NUMBER PRIMARY KEY,
  codigo VARCHAR2(20) NOT NULL UNIQUE,
  nombre VARCHAR2(100) NOT NULL,
  descripcion VARCHAR2(200),
  nacional NUMBER(1) DEFAULT 1 NOT NULL,
  activo NUMBER(1) DEFAULT 1 NOT NULL,
  fecha_creacion DATE DEFAULT SYSDATE NOT NULL,
  fecha_modificacion DATE DEFAULT SYSDATE NOT NULL,
  CONSTRAINT chk_parentesco_nacional CHECK (nacional IN (0, 1)),
  CONSTRAINT chk_parentesco_activo CHECK (activo IN (0, 1))
);

-- Índices
CREATE INDEX idx_parentesco_codigo ON sma_parentescos(codigo);
CREATE INDEX idx_parentesco_activo ON sma_parentescos(activo);
CREATE INDEX idx_parentesco_nacional ON sma_parentescos(nacional);

-- Trigger
CREATE OR REPLACE TRIGGER trg_parentescos_update
  BEFORE UPDATE ON sma_parentescos
  FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
END;
/

-- ============================================================
-- TABLA: sma_vigencias
-- ============================================================

CREATE TABLE sma_vigencias (
  id_vigencia NUMBER PRIMARY KEY,
  nombre VARCHAR2(100) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  tipo_vigencia VARCHAR2(50) NOT NULL,
  estado VARCHAR2(20) DEFAULT 'PENDIENTE' NOT NULL,
  descripcion VARCHAR2(500),
  creado_por VARCHAR2(100) NOT NULL,
  fecha_creacion DATE DEFAULT SYSDATE NOT NULL,
  fecha_modificacion DATE DEFAULT SYSDATE NOT NULL,
  CONSTRAINT chk_vigencia_estado CHECK (estado IN ('PENDIENTE', 'ACTIVA', 'INACTIVA')),
  CONSTRAINT chk_tipo_vigencia CHECK (tipo_vigencia IN ('ANUAL', 'SEMESTRAL', 'TRIMESTRAL', 'MENSUAL', 'ESPECIAL')),
  CONSTRAINT chk_vigencia_fechas CHECK (fecha_fin > fecha_inicio)
);

-- Índices
CREATE INDEX idx_vigencia_estado ON sma_vigencias(estado);
CREATE INDEX idx_vigencia_fecha_inicio ON sma_vigencias(fecha_inicio);
CREATE INDEX idx_vigencia_fecha_fin ON sma_vigencias(fecha_fin);

-- Trigger
CREATE OR REPLACE TRIGGER trg_vigencias_update
  BEFORE UPDATE ON sma_vigencias
  FOR EACH ROW
BEGIN
  :NEW.fecha_modificacion := SYSDATE;
END;
/

-- ============================================================
-- DATOS INICIALES - PARENTESCOS
-- ============================================================

INSERT INTO sma_parentescos (id_parentesco, codigo, nombre, descripcion, nacional, activo)
VALUES (sma_parentescos_seq.NEXTVAL, 'TITULAR', 'Titular', 'Funcionario titular', 1, 1);

INSERT INTO sma_parentescos (id_parentesco, codigo, nombre, descripcion, nacional, activo)
VALUES (sma_parentescos_seq.NEXTVAL, 'CONYUGE', 'Cónyuge', 'Cónyuge del funcionario', 1, 1);

INSERT INTO sma_parentescos (id_parentesco, codigo, nombre, descripcion, nacional, activo)
VALUES (sma_parentescos_seq.NEXTVAL, 'HIJO', 'Hijo/a', 'Hijo o hija del funcionario', 1, 1);

INSERT INTO sma_parentescos (id_parentesco, codigo, nombre, descripcion, nacional, activo)
VALUES (sma_parentescos_seq.NEXTVAL, 'PADRE', 'Padre/Madre', 'Padre o madre del funcionario', 1, 1);

INSERT INTO sma_parentescos (id_parentesco, codigo, nombre, descripcion, nacional, activo)
VALUES (sma_parentescos_seq.NEXTVAL, 'HERMANO', 'Hermano/a', 'Hermano o hermana del funcionario', 0, 1);

COMMIT;

-- ============================================================
-- DATOS INICIALES - CONTRATISTAS (Ejemplo)
-- ============================================================

INSERT INTO sma_contratistas (
  id_contratista, numero_identificacion, nombres, apellidos, tipo_documento,
  tipo_vinculacion, fecha_ingreso, regional, cargo, dependencia, telefono, email
) VALUES (
  sma_contratistas_seq.NEXTVAL,
  '80123456',
  'Carlos',
  'Mendoza Silva',
  'CC',
  'ESTABLECIMIENTO',
  TO_DATE('2024-01-15', 'YYYY-MM-DD'),
  '001',
  'Analista TI',
  'TIC',
  '3001234567',
  'carlos.mendoza@sena.edu.co'
);

INSERT INTO sma_contratistas (
  id_contratista, numero_identificacion, nombres, apellidos, tipo_documento,
  tipo_vinculacion, fecha_ingreso, regional, cargo, dependencia, telefono, email
) VALUES (
  sma_contratistas_seq.NEXTVAL,
  '1023456789',
  'María',
  'González Pérez',
  'CC',
  'PRESTACION_SERVICIOS',
  TO_DATE('2023-06-01', 'YYYY-MM-DD'),
  '002',
  'Contadora',
  'FINANCIERA',
  '3109876543',
  'maria.gonzalez@sena.edu.co'
);

COMMIT;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

-- Verificar que las tablas fueron creadas
SELECT 'Tablas creadas exitosamente:' as mensaje FROM DUAL;

SELECT table_name FROM user_tables WHERE table_name LIKE 'SMA_%' ORDER BY table_name;

-- Verificar secuencias
SELECT 'Secuencias creadas exitosamente:' as mensaje FROM DUAL;

SELECT sequence_name FROM user_sequences WHERE sequence_name LIKE 'SMA_%' ORDER BY sequence_name;

-- Contar registros iniciales
SELECT 'Parentescos:', COUNT(*) FROM sma_parentescos;
SELECT 'Contratistas:', COUNT(*) FROM sma_contratistas;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================

COMMIT;

