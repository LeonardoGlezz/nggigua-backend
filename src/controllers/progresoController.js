const pool = require('../config/database');

const guardarProgreso = async (req, res) => {
    const { actividad_id, puntaje } = req.body;
    const cuenta_id = req.usuario.id;
const perfilResult = await pool.query(
    'SELECT id FROM perfil_usuario WHERE cuenta_id = $1',
    [cuenta_id]
);
const perfil_id = perfilResult.rows[0].id;

    const existente = await pool.query(
        'SELECT * FROM progreso_usuario WHERE perfil_id = $1 AND actividad_id = $2',
        [perfil_id, actividad_id]
    );

    if (existente.rows.length > 0) {
        if (puntaje > existente.rows[0].mejor_puntaje) {
            await pool.query(
                'UPDATE progreso_usuario SET mejor_puntaje = $1, intentos = intentos + 1, ultima_vez = NOW() WHERE perfil_id = $2 AND actividad_id = $3',
                [puntaje, perfil_id, actividad_id]
            );
        }
    } else {
        await pool.query(
            'INSERT INTO progreso_usuario (perfil_id, actividad_id, mejor_puntaje, intentos, completado) VALUES ($1, $2, $3, 1, true)',
            [perfil_id, actividad_id, puntaje]
        );
    }

    res.json({ mensaje: 'Progreso guardado' });
};

const obtenerProgreso = async (req, res) => {
    const cuenta_id = req.usuario.id;

    const perfilResult = await pool.query(
        'SELECT id FROM perfil_usuario WHERE cuenta_id = $1',
        [cuenta_id]
    );

    const perfil_id = perfilResult.rows[0].id;

    const resultado = await pool.query(
        'SELECT * FROM progreso_usuario WHERE perfil_id = $1',
        [perfil_id]
    );

    res.json(resultado.rows);
};

const getRanking = async (req, res) => {
    const resultado = await pool.query(`
        SELECT 
            pu.nombre as alias,
            p.mejor_puntaje as puntaje,
            p.intentos
        FROM progreso_usuario p
        JOIN perfil_usuario pu ON p.perfil_id = pu.id
        JOIN actividad a ON p.actividad_id = a.id
        WHERE a.tipo = 'memorama'
        ORDER BY p.mejor_puntaje DESC
        LIMIT 5
    `);
    res.json(resultado.rows);
};

module.exports = { guardarProgreso, obtenerProgreso, getRanking };
