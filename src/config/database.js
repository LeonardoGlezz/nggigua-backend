const { Pool } = require('pg');
require('dotenv').config({ quiet: true });

// En producción (Render + Neon) se usa una sola cadena de conexión
// (DATABASE_URL) que ya incluye usuario, contraseña, host y base de datos,
// y que exige SSL. En desarrollo local seguimos usando las variables
// sueltas DB_HOST/DB_PORT/etc., como siempre, para no romper nada.
const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    })
    : new Pool({
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

// Algunos proveedores (Neon incluido) configuran el rol de conexión con un
// search_path vacío por seguridad. Como todo el código de este proyecto usa
// nombres de tabla sin prefijo de esquema (FROM cuenta, INSERT INTO
// perfil_usuario, etc.), sin esto cada query fallaría con "relation ... does
// not exist" aunque las tablas sí existan en el esquema public.
//
// NOTA: se probó mandarlo como parámetro de arranque de conexión
// (options: '-c search_path=public'), que es la forma "más limpia" y sin
// condición de carrera, pero el endpoint pooler de Neon lo rechaza
// ("unsupported startup parameter"). Por eso se hace aquí, en el evento
// 'connect' de cada cliente nuevo del pool. Node muestra un warning de
// "deprecated" por esto (dos queries casi simultáneas en el mismo cliente),
// pero es inofensivo: la conexión procesa las queries en el orden en que
// se enviaron, así que el SET siempre se aplica antes que cualquier query
// real. Confirmado funcionando en Neon.
pool.on('connect', (client) => {
    client.query('SET search_path TO public').catch((err) => {
        console.error('[POOL PG] No se pudo fijar search_path:', err.message);
    });
});

module.exports = pool;