#!/usr/bin/env node
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const c = new Client({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local',
  database: process.env.MEDISENA_DB || process.env.POSTGRES_DB || 'medisena'
});
c.connect()
  .then(() => c.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'medisena' AND table_type = 'BASE TABLE' AND table_name LIKE 't_%' ORDER BY 1"))
  .then(r => {
    const names = (r.rows || []).map(x => x.table_name);
    console.log('t_* en medisena:', names.length);
    for (const n of ['t_regional', 't_itemsubgrutopes', 't_ordenes', 't_detorden']) {
      console.log('  ', n, names.includes(n) ? 'Sí' : 'No');
    }
    return c.end();
  })
  .catch(e => { console.error(e.message); c.end(); });
