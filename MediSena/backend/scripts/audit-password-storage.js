#!/usr/bin/env node
const { getConnection, getTableName, buildQuery, OUT_FORMAT_OBJECT } = require('../utils/db');

const BCRYPT_RE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

async function main() {
  let conn;
  try {
    conn = await getConnection();
    const query = buildQuery(`SELECT MAIL_USUA, CLAV_USUA FROM ${getTableName('SMA_USUA')}`);
    const result = await conn.execute(query, {}, { outFormat: OUT_FORMAT_OBJECT });
    const rows = result?.rows || [];

    let hashed = 0;
    let plaintextOrUnknown = 0;
    const samples = [];

    for (const row of rows) {
      const hash = row.CLAV_USUA;
      if (typeof hash === 'string' && BCRYPT_RE.test(hash)) {
        hashed++;
      } else {
        plaintextOrUnknown++;
        if (samples.length < 20) {
          samples.push(row.MAIL_USUA);
        }
      }
    }

    console.log('=== Auditoría de almacenamiento de contraseñas ===');
    console.log(`Total usuarios: ${rows.length}`);
    console.log(`Hash bcrypt: ${hashed}`);
    console.log(`No hash / formato legacy: ${plaintextOrUnknown}`);
    if (samples.length > 0) {
      console.log('Muestra de usuarios por migrar (máx 20):');
      samples.forEach((u) => console.log(` - ${u}`));
    }
  } catch (error) {
    console.error('Error en auditoría:', error.message);
    process.exitCode = 1;
  } finally {
    if (conn) await conn.close();
  }
}

main();

