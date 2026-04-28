/**
 * Script para revisar esquema y datos en PostgreSQL
 * Ejecutar: node check-db.js
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5433,
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local',
  database: process.env.MEDISENA_DB || process.env.POSTGRES_DB || 'medisena'
});

async function main() {
  let client;
  try {
    client = await pool.connect();
    console.log('--- Conexión PostgreSQL OK ---\n');

    // 1. Esquemas existentes (todo en medisena)
    const schemas = await client.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('medisena', 'public') ORDER BY 1`
    );
    console.log('1. Esquemas encontrados:', schemas.rows.map(r => r.schema_name).join(', '));

    // 2. ¿Existe medisena.sma_recibos_pago?
    const reciboPago = await client.query(`
      SELECT table_schema, table_name FROM information_schema.tables 
      WHERE table_schema = 'medisena' AND table_name = 'sma_recibos_pago'
    `);
    console.log('\n2. Tabla sma_recibos_pago:', reciboPago.rows.length ? reciboPago.rows[0].table_schema + '.' + reciboPago.rows[0].table_name : 'NO EXISTE');

    // 3. Tablas relacionadas con excedentes/recibos (esquema medisena)
    const tablasRel = ['sma_recibos_caja', 'sma_rep_excedentes_det_todos', 'sma_rep_excedentes_enc_todos', 'sma_reporte_excedentes_todos'];
    for (const t of tablasRel) {
      const ex = await client.query(`
        SELECT table_schema, table_name FROM information_schema.tables 
        WHERE table_schema = 'medisena' AND table_name = $1
      `, [t]);
      if (ex.rows.length > 0) {
        const cols = await client.query(`
          SELECT column_name, data_type FROM information_schema.columns 
          WHERE table_schema = 'medisena' AND table_name = $1 ORDER BY ordinal_position
        `, [t]);
        const count = await client.query(`SELECT COUNT(*) as n FROM medisena.${t}`);
        console.log(`\n3. ${t}: existe, ${cols.rows.length} columnas, ${count.rows[0].n} registros`);
        cols.rows.slice(0, 12).forEach(r => console.log('   -', r.column_name, '(' + r.data_type + ')'));
        if (cols.rows.length > 12) console.log('   ...');
      } else {
        console.log(`\n3. ${t}: no existe`);
      }
    }

    // 4. Muestra de sma_rep_excedentes_enc_todos si tiene datos
    try {
      const sample = await client.query('SELECT * FROM medisena.sma_rep_excedentes_enc_todos LIMIT 1');
      if (sample.rows.length > 0) {
        console.log('\n4. Muestra sma_rep_excedentes_enc_todos (1 fila):');
        console.log(JSON.stringify(sample.rows[0], null, 2));
      }
    } catch (e) {
      console.log('\n4. Error leyendo muestra:', e.message);
    }

    // 5. sma_recibos_caja muestra si tiene datos
    try {
      const caja = await client.query('SELECT COUNT(*) as n FROM medisena.sma_recibos_caja');
      console.log('\n5. sma_recibos_caja registros:', caja.rows[0].n);
      if (parseInt(caja.rows[0].n, 10) > 0) {
        const s = await client.query('SELECT * FROM medisena.sma_recibos_caja LIMIT 1');
        console.log('   Columnas:', Object.keys(s.rows[0]).join(', '));
      }
    } catch (e) {
      console.log('\n5. Error sma_recibos_caja:', e.message);
    }
  } catch (err) {
    console.error('Error:', err.message);
    if (err.code) console.error('Código:', err.code);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

main();
