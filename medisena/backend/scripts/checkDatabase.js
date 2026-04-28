/**
 * Verifica conectividad a PostgreSQL con la misma configuración que utils/pg.js.
 * Uso (desde carpeta backend):
 *   node -r dotenv/config scripts/checkDatabase.js dotenv_config_path=C:/ruta/deploy/env/backend.env
 */
'use strict';

const { Pool } = require('pg');

const DB_NAME = process.env.MEDISENA_DB || process.env.POSTGRES_DB || 'medisena';

async function main() {
  const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.POSTGRES_PORT || 5433),
    user: process.env.POSTGRES_USER || 'medisena',
    password: process.env.POSTGRES_PASSWORD || 'medisena_local',
    database: DB_NAME,
    max: 1,
    connectionTimeoutMillis: 10000,
  });

  try {
    const info = await pool.query(
      'SELECT current_database() AS db, current_user AS usr'
    );
    const row = info.rows[0];
    console.log('[OK] Postgres responde:', { db: row.db, usr: row.usr });

    const tab = await pool.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'medisena' AND table_name = 'sma_usua'
      ) AS sma_usua_exists`
    );
    console.log(
      tab.rows[0].sma_usua_exists
        ? '[OK] Tabla medisena.sma_usua existe.'
        : '[AVISO] Tabla medisena.sma_usua no existe (revisa migraciones/seed).'
    );

    process.exitCode = 0;
  } catch (e) {
    console.error('[ERROR] No se pudo conectar a Postgres:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
