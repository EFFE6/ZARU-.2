/**
 * Script: create-dev-user.js
 * 
 * Crea (o actualiza) un usuario de desarrollo en la base de datos local.
 * Uso: node scripts/create-dev-user.js
 * 
 * Credenciales creadas:
 *   Usuario: dev@medisena.local
 *   Contraseña: Dev12345!
 */
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const DB_NAME = process.env.MEDISENA_DB || process.env.POSTGRES_DB || 'medisena';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local',
  database: DB_NAME,
});

const DEV_USER = {
  email: 'dev@medisena.local',
  password: 'Dev12345!',
  nombre: 'Desarrollador Local',
  rol: 'ADMIN',
  estado: '1',
  tipoUsuario: 'ADMIN',
};

async function run() {
  const client = await pool.connect();
  try {
    console.log('🔌 Conectando a PostgreSQL...');
    console.log(`   Base de datos: ${DB_NAME} en ${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5433}`);

    // Verificar que existe la tabla
    const tableCheck = await client.query(`
      SELECT COUNT(*)::int AS total
      FROM information_schema.tables
      WHERE table_schema = 'medisena' AND table_name = 'sma_usua'
    `);
    
    if (!tableCheck.rows[0]?.total) {
      console.error('❌ La tabla medisena.sma_usua no existe.');
      console.error('   Asegúrate de haber corrido las migraciones primero.');
      process.exit(1);
    }

    // Hashear la contraseña
    const passwordHash = await bcrypt.hash(DEV_USER.password, 12);
    console.log('🔐 Contraseña hasheada con bcrypt (salt=12).');

    // Verificar si el usuario ya existe
    const existing = await client.query(
      `SELECT mail_usua FROM medisena.sma_usua WHERE LOWER(mail_usua) = LOWER($1)`,
      [DEV_USER.email]
    );

    if (existing.rows.length > 0) {
      // Actualizar usuario existente
      await client.query(
        `UPDATE medisena.sma_usua
         SET clav_usua = $1,
             rol_usua  = $2,
             estado_usua = $3,
             nomb_usua = $4
         WHERE LOWER(mail_usua) = LOWER($5)`,
        [passwordHash, DEV_USER.rol, DEV_USER.estado, DEV_USER.nombre, DEV_USER.email]
      );
      console.log('✅ Usuario de desarrollo actualizado.');
    } else {
      // Insertar nuevo usuario
      // Intentar con campos mínimos; ignorar campos que no existen
      const columns = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'medisena' AND table_name = 'sma_usua'
        ORDER BY ordinal_position
      `);
      const colNames = columns.rows.map(r => r.column_name.toLowerCase());
      console.log('   Columnas disponibles:', colNames.join(', '));

      // Construir INSERT dinámico con los campos que existan
      const fieldsToInsert = {};
      if (colNames.includes('mail_usua'))   fieldsToInsert['mail_usua']   = DEV_USER.email;
      if (colNames.includes('clav_usua'))   fieldsToInsert['clav_usua']   = passwordHash;
      if (colNames.includes('rol_usua'))    fieldsToInsert['rol_usua']    = DEV_USER.rol;
      if (colNames.includes('estado_usua')) fieldsToInsert['estado_usua'] = DEV_USER.estado;
      if (colNames.includes('nomb_usua'))   fieldsToInsert['nomb_usua']   = DEV_USER.nombre;
      if (colNames.includes('cod_tipo_usua')) fieldsToInsert['cod_tipo_usua'] = DEV_USER.tipoUsuario;

      const keys   = Object.keys(fieldsToInsert);
      const values = Object.values(fieldsToInsert);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

      await client.query(
        `INSERT INTO medisena.sma_usua (${keys.join(', ')}) VALUES (${placeholders})`,
        values
      );
      console.log('✅ Usuario de desarrollo creado.');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Credenciales de acceso al frontend:');
    console.log(`   Usuario:    ${DEV_USER.email}`);
    console.log(`   Contraseña: ${DEV_USER.password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('   No se pudo conectar a PostgreSQL. ¿Está corriendo?');
      console.error(`   Host: ${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5433}`);
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
