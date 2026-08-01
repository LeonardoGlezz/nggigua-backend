// Siembra la tabla insignia con el set inicial acordado. Idempotente: si
// una insignia con el mismo nombre ya existe, la salta.
//
// Uso:  npm run seed:insignias   (desde la carpeta backend)

const pool = require('../src/config/database');

const INSIGNIAS = [
    {
        nombre: 'Explorador Novato',
        descripcion: 'Completaste el Nivel Básico de la aldea Chocholteca.',
        icono_url: '🌱',
        es_oculta: false,
        condicion_tipo: 'nivel_completado',
        condicion_valor: 1,
    },
    {
        nombre: 'Explorador Intermedio',
        descripcion: 'Completaste el Nivel Intermedio.',
        icono_url: '🌿',
        es_oculta: false,
        condicion_tipo: 'nivel_completado',
        condicion_valor: 2,
    },
    {
        nombre: 'Explorador Chocholteca',
        descripcion: 'Completaste el Nivel Avanzado — ¡dominas el camino!',
        icono_url: '🏆',
        es_oculta: false,
        condicion_tipo: 'nivel_completado',
        condicion_valor: 3,
    },
    {
        nombre: 'Racha de Fuego',
        descripcion: 'Practicaste 7 días seguidos.',
        icono_url: '🔥',
        es_oculta: false,
        condicion_tipo: 'racha',
        condicion_valor: 7,
    },
    {
        nombre: 'Explorador Completo',
        descripcion: 'Jugaste los 5 minijuegos al menos una vez.',
        icono_url: '🎮',
        es_oculta: false,
        condicion_tipo: 'juegos_variados',
        condicion_valor: 5,
    },
];

async function seed() {
    for (const ins of INSIGNIAS) {
        const { rows } = await pool.query('SELECT id FROM insignia WHERE nombre = $1', [ins.nombre]);
        if (rows.length > 0) {
            console.log(`↷ ${ins.nombre}: ya existe, se omite`);
            continue;
        }
        await pool.query(
            `INSERT INTO insignia (nombre, descripcion, icono_url, es_oculta, condicion_tipo, condicion_valor)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [ins.nombre, ins.descripcion, ins.icono_url, ins.es_oculta, ins.condicion_tipo, ins.condicion_valor]
        );
        console.log(`✓ ${ins.nombre} sembrada`);
    }
    await pool.end();
    console.log('Listo.');
}

seed().catch(async (err) => {
    console.error('Error sembrando insignias:', err);
    await pool.end();
    process.exit(1);
});
