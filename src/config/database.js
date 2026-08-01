const { Pool } = require('pg');
require('dotenv').config({ quiet: true });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// IMPORTANTE: pg emite un evento 'error' cuando un cliente inactivo del
// pool falla (ej. la DB se cae un instante, se resetea la conexión, etc.).
// Si nadie escucha ese evento, Node lo trata como excepción no capturada
// y TUMBA TODO EL PROCESO, no solo esa query. Este listener evita que un
// hipo de la base de datos derribe el servidor completo.
pool.on('error', (err) => {
    console.error('[POOL PG] Error inesperado en cliente inactivo:', err);
});

module.exports = pool;