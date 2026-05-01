#!/usr/bin/env node
/**
 * Consulta el tamaño actual de las bases Oracle que se migran (SPU y SMA).
 * Uso: node db-size-oracle.js
 */

const path = require('path');
const root = path.join(__dirname, '../..');
['.env', 'config-puertos-libres.env'].forEach(f => {
  require('dotenv').config({ path: path.join(root, f) });
});
const oracledb = require('oracledb');

function bytesToMB(bytes) {
  if (bytes == null) return null;
  return (bytes / (1024 * 1024)).toFixed(2);
}

async function getSize(conn, schema) {
  try {
    const r = await conn.execute(
      `SELECT SUM(bytes) AS total_bytes, COUNT(*) AS segments
       FROM all_segments WHERE owner = :owner`,
      { owner: schema },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const row = r.rows[0];
    return { bytes: row.TOTAL_BYTES, segments: row.SEGMENTS };
  } catch (e) {
    try {
      const r = await conn.execute(
        `SELECT SUM(bytes) AS total_bytes FROM user_segments`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const row = r.rows[0];
      return { bytes: row.TOTAL_BYTES, segments: null };
    } catch (e2) {
      return { bytes: null, segments: null, error: e.message };
    }
  }
}

async function run() {
  console.log('=== Tamaño de bases Oracle a migrar ===\n');

  // SPU
  const spuHost = process.env.ORACLE_SPU_HOST || '';
  const spuPort = process.env.ORACLE_SPU_PORT || '1521';
  const spuService = process.env.ORACLE_SPU_SERVICE_NAME || '';
  const spuConnect = (spuHost && spuService)
    ? `${spuHost}:${spuPort}/${spuService}`
    : process.env.ORACLE_SPU_CONNECT_STRING || '';

  if (spuConnect && process.env.ORACLE_SPU_PASS) {
    try {
      try { oracledb.initOracleClient(); } catch (e) {}
      const conn = await oracledb.getConnection({
        user: process.env.ORACLE_SPU_USER || 'SPUSMA',
        password: process.env.ORACLE_SPU_PASS,
        connectString: spuConnect
      });
      const spu = await getSize(conn, 'SPUSMA');
      await conn.close();
      console.log('SPU (schema SPUSMA):');
      console.log('  Tamaño:', spu.bytes != null ? bytesToMB(spu.bytes) + ' MB' : 'N/A', spu.error ? '(' + spu.error + ')' : '');
      if (spu.segments != null) console.log('  Segmentos:', spu.segments);
      console.log('');
    } catch (err) {
      console.log('SPU: No se pudo conectar -', err.message);
      console.log('');
    }
  } else {
    console.log('SPU: Sin config (ORACLE_SPU_HOST + SERVICE_NAME + PASS)\n');
  }

  // SMA (MediSENA)
  const smaConnect = process.env.ORACLE_CONNECT_STRING || process.env.ORACLE_URL ||
    (process.env.ORACLE_PROD_HOST && process.env.ORACLE_PROD_SERVICE_NAME
      ? `${process.env.ORACLE_PROD_HOST}:${process.env.ORACLE_PROD_PORT || 1521}/${process.env.ORACLE_PROD_SERVICE_NAME}`
      : '');

  if (smaConnect && (process.env.ORACLE_PASS || process.env.ORACLE_PASSWORD)) {
    try {
      const conn = await oracledb.getConnection({
        user: process.env.ORACLE_USER || process.env.ORACLE_USERNAME || 'sma',
        password: process.env.ORACLE_PASS || process.env.ORACLE_PASSWORD,
        connectString: smaConnect
      });
      const sma = await getSize(conn, 'SMA');
      await conn.close();
      console.log('SMA / MediSENA (schema SMA):');
      console.log('  Tamaño:', sma.bytes != null ? bytesToMB(sma.bytes) + ' MB' : 'N/A', sma.error ? '(' + sma.error + ')' : '');
      if (sma.segments != null) console.log('  Segmentos:', sma.segments);
      console.log('');
    } catch (err) {
      console.log('SMA: No se pudo conectar -', err.message);
      console.log('');
    }
  } else {
    console.log('SMA: Sin config (ORACLE_CONNECT_STRING + ORACLE_PASS)\n');
  }

  console.log('=== Fin ===');
}

run().catch(e => { console.error(e); process.exit(1); });
