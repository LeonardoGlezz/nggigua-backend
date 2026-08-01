// Siembra item_actividad con el vocabulario Nggigua, respetando la
// progresión por nivel (Básico=6 palabras, Intermedio=10, Avanzado=20).
// Es idempotente: si una actividad ya tiene items, la salta.
//
// Uso:  npm run seed   (desde la carpeta backend)

const pool = require('../src/config/database');

// Mismo vocabulario que ya vivía hardcodeado en los 5 juegos del frontend,
// ahora en un solo lugar. "categoria" es la que usa Ruleta de Categorías.
const VOCABULARIO = [
    { palabra: 'kunia', traduccion: 'Perro', emoji: '🐕', categoria: 'animal' },
    { palabra: 'kumichin', traduccion: 'Gato', emoji: '🐱', categoria: 'animal' },
    { palabra: 'nua', traduccion: 'Maíz', emoji: '🌽', categoria: 'naturaleza' },
    { palabra: 'jinda', traduccion: 'Agua', emoji: '💧', categoria: 'hogar' },
    { palabra: 'nchia', traduccion: 'Casa', emoji: '🏠', categoria: 'hogar' },
    { palabra: 'tsjo', traduccion: 'Flor', emoji: '🌸', categoria: 'naturaleza' },
    { palabra: 'kuchia', traduccion: 'Gallina', emoji: '🐔', categoria: 'animal' },
    { palabra: 'kunxin', traduccion: 'Caballo', emoji: '🐴', categoria: 'animal' },
    { palabra: 'nthaa', traduccion: 'Árbol', emoji: '🌳', categoria: 'naturaleza' },
    { palabra: 'nunthe', traduccion: 'Tierra', emoji: '🌍', categoria: 'naturaleza' },
    { palabra: 'ndaxra', traduccion: 'Comida', emoji: '🍲', categoria: 'hogar' },
    { palabra: 'nio', traduccion: 'Tortilla', emoji: '🫓', categoria: 'hogar' },
    { palabra: 'raa', traduccion: 'Mano', emoji: '✋', categoria: 'cuerpo' },
    { palabra: 'kon', traduccion: 'Ojo', emoji: '👁️', categoria: 'cuerpo' },
    { palabra: 'ruthee', traduccion: 'Pie', emoji: '🦶', categoria: 'cuerpo' },
    { palabra: 'anseen', traduccion: 'Corazón', emoji: '❤️', categoria: 'cuerpo' },
    { palabra: 'nchrii', traduccion: 'Mujer', emoji: '👩', categoria: 'persona' },
    { palabra: 'tathiita', traduccion: 'Hombre', emoji: '👨', categoria: 'persona' },
    { palabra: 'kane', traduccion: 'Tallo', emoji: '🌿', categoria: 'naturaleza' },
    { palabra: 'chi', traduccion: 'Olla', emoji: '🫙', categoria: 'hogar' },
];

// orden del nivel (nivel.orden) -> cuántas palabras de VOCABULARIO usar
const TAMANIO_POR_NIVEL = { 1: 6, 2: 10, 3: 20 };

async function seed() {
    const { rows: actividades } = await pool.query(`
        SELECT a.id, a.tipo, a.nombre, n.nombre AS nivel_nombre, n.orden AS nivel_orden
        FROM actividad a
        JOIN nivel n ON a.nivel_id = n.id
        ORDER BY n.orden, a.orden
    `);

    if (actividades.length === 0) {
        console.log('No hay actividades en la BD todavía. Nada que sembrar.');
        await pool.end();
        return;
    }

    for (const act of actividades) {
        const { rows: existentes } = await pool.query(
            'SELECT COUNT(*) FROM item_actividad WHERE actividad_id = $1',
            [act.id]
        );
        if (Number(existentes[0].count) > 0) {
            console.log(`↷ ${act.nivel_nombre} / ${act.tipo}: ya tiene items, se omite`);
            continue;
        }

        const cantidad = TAMANIO_POR_NIVEL[act.nivel_orden] || VOCABULARIO.length;
        const palabras = VOCABULARIO.slice(0, cantidad);

        for (let i = 0; i < palabras.length; i++) {
            const p = palabras[i];
            await pool.query(
                `INSERT INTO item_actividad (actividad_id, orden, contenido, respuesta_correcta, puntos_base)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    act.id,
                    i + 1,
                    JSON.stringify({ emoji: p.emoji, traduccion: p.traduccion, categoria: p.categoria }),
                    p.palabra,
                    10,
                ]
            );
        }
        console.log(`✓ ${act.nivel_nombre} / ${act.tipo}: ${palabras.length} items sembrados`);
    }

    await pool.end();
    console.log('Listo.');
}

seed().catch(async (err) => {
    console.error('Error sembrando vocabulario:', err);
    await pool.end();
    process.exit(1);
});
