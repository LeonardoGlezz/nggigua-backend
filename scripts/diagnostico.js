// Script temporal de diagnóstico: muestra exactamente a qué base de datos,
// esquema y usuario se está conectando Node (con el mismo pool que usan los
// seeds y la API real), y qué tablas ve en el esquema "public".
//
// Uso:  node scripts/diagnostico.js   (con DATABASE_URL ya seteado en la terminal)

require('dotenv').config({ quiet: true });
const pool = require('../src/config/database');

(async () => {
    try {
        console.log('DATABASE_URL detectada por Node:', process.env.DATABASE_URL ? 'sí' : 'NO (está usando variables locales)');

        const r = await pool.query(`
            SELECT
                current_database() AS base,
                current_schema() AS esquema_actual,
                current_user AS usuario,
                inet_server_addr() AS ip_servidor,
                (SELECT string_agg(table_name, ', ')
                 FROM information_schema.tables
                 WHERE table_schema = 'public') AS tablas_en_public
        `);
        console.log('--- Resultado ---');
        console.table(r.rows);
    } catch (err) {
        console.error('Error en diagnóstico:', err.message);
    } finally {
        await pool.end();
    }
})();
