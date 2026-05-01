#!/usr/bin/env node
/**
 * Valida conexión a Oracle SPU: muestra la config cargada e intenta conectar.
 * Uso: node check-oracle-spu-connection.js
 *     o: npm run check:spu
 */

const path = require('path');
const root = path.join(__dirname, '../..');
['.env', 'config-puertos-libres.env'].forEach(f => {
  const fullPath = path.join(root, f);
  require('dotenv').config({ path: fullPath });
});

const spuHost = process.env.ORACLE_SPU_HOST || '';
const spuPort = process.env.ORACLE_SPU_PORT || '1521';
const spuService = process.env.ORACLE_SPU_SERVICE_NAME || '';
const spuConnectString = (spuHost && spuService)
  ? `${spuHost}:${spuPort}/${spuService}`
  : (process.env.ORACLE_SPU_CONNECT_STRING || '');

const user = process.env.ORACLE_SPU_USER || 'SPUSMA';
const pass = process.env.ORACLE_SPU_PASS || process.env.ORACLE_SPU_PASSWORD || '';

console.log('=== Validación conexión Oracle SPU ===\n');
console.log('Variables cargadas (desde proyecto raíz):');
console.log('  ORACLE_SPU_HOST:', spuHost || '(no definido)');
console.log('  ORACLE_SPU_PORT:', spuPort);
console.log('  ORACLE_SPU_SERVICE_NAME:', spuService || '(no definido)');
console.log('  ORACLE_SPU_USER:', user);
console.log('  ORACLE_SPU_PASS:', pass ? '***' + pass.slice(-2) : '(no definido)');
console.log('  ORACLE_SPU_CONNECT_STRING (env):', process.env.ORACLE_SPU_CONNECT_STRING ? '(definido)' : '(no definido)');
console.log('');
console.log('Connect string que usará oracledb:', spuConnectString || '(vacío - revisar HOST y SERVICE_NAME)');
console.log('');

if (!spuConnectString) {
  console.error('ERROR: No se puede construir connect string. Defina ORACLE_SPU_HOST y ORACLE_SPU_SERVICE_NAME (o ORACLE_SPU_CONNECT_STRING).');
  process.exit(1);
}
if (!pass) {
  console.error('ERROR: ORACLE_SPU_PASS no definido.');
  process.exit(1);
}

const oracledb = require('oracledb');
const config = {
  user,
  password: pass,
  connectString: spuConnectString,
  poolMin: 0,
  poolMax: 1
};

async function test() {
  let conn;
  try {
    try {
      oracledb.initOracleClient();
    } catch (e) {
      if (!e.message.includes('already been called')) { /* ignore */ }
    }
    console.log('Intentando conectar a Oracle SPU...');
    conn = await oracledb.getConnection(config);
    const r = await conn.execute('SELECT 1 AS n FROM DUAL');
    console.log('  OK Conectado. SELECT 1 FROM DUAL =', r.rows[0][0]);
    const r2 = await conn.execute(
      "SELECT COUNT(*) AS n FROM ALL_TABLES WHERE OWNER = :owner",
      { owner: process.env.ORACLE_SPU_SCHEMA || 'SPUSMA' }
    );
    console.log('  Tablas en schema SPUSMA:', r2.rows[0][0]);
    console.log('\n=== Conexión Oracle SPU válida ===');
  } catch (err) {
    console.error('\nError al conectar:', err.message);
    console.error('Código:', err.code || '-');
    if (err.errorNum) console.error('Oracle errorNum:', err.errorNum);
    process.exit(1);
  } finally {
    if (conn) try { await conn.close(); } catch (e) {}
  }
}

test();
