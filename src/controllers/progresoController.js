const pool = require('../config/database');
const { ApiError } = require('../middlewares/errorHandler');
const { calcularNuevaRacha } = require('../utils/racha');
const { revisarYAsignarInsignias } = require('../services/insigniasService');

// Toda cuenta debería tener un perfil_usuario (se crea junto en el
// registro), pero si por algún motivo no existe, antes esto tronaba con
// "Cannot read properties of undefined (reading 'id')" en vez de avisar
// con un mensaje claro.
const obtenerPerfilId = async (cuenta_id) => {
    const perfilResult = await pool.query(
        'SELECT id FROM perfil_usuario WHERE cuenta_id = $1',
        [cuenta_id]
    );
    if (perfilResult.rows.length === 0) {
        throw new ApiError(404, 'Perfil no encontrado para esta cuenta');
    }
    return perfilResult.rows[0].id;
};

// Actualiza racha_actual según las reglas en utils/racha.js y refresca
// ultima_conexion a este momento. Se llama cada vez que el usuario
// completa una actividad (es decir, cada vez que de verdad practicó).
const actualizarRachaPerfil = async (perfil_id) => {
    const { rows } = await pool.query(
        'SELECT racha_actual, ultima_conexion FROM perfil_usuario WHERE id = $1',
        [perfil_id]
    );
    if (rows.length === 0) return null;

    const { racha_actual, ultima_conexion } = rows[0];
    const nuevaRacha = calcularNuevaRacha(racha_actual, ultima_conexion);

    await pool.query(
        'UPDATE perfil_usuario SET racha_actual = $1, ultima_conexion = NOW() WHERE id = $2',
        [nuevaRacha, perfil_id]
    );

    return nuevaRacha;
};

const guardarProgreso = async (req, res) => {
    const { actividad_id, puntaje } = req.body;

    if (actividad_id === undefined || puntaje === undefined) {
        throw new ApiError(400, 'actividad_id y puntaje son requeridos.');
    }
    // Nota: esto es un tope de cordura, NO anti-trampas real — la API
    // confía en el puntaje que manda el cliente porque el cálculo del
    // juego vive en el frontend. El puntaje legítimo más alto entre los
    // 5 juegos (Empareja Columnas, nivel avanzado, racha perfecta) ronda
    // los 800 pts, así que 2000 da margen sin dejar pasar valores
    // absurdos como puntaje: 999999999.
    if (typeof puntaje !== 'number' || !Number.isFinite(puntaje) || puntaje < 0 || puntaje > 2000) {
        throw new ApiError(400, 'puntaje inválido.');
    }

    const cuenta_id = req.usuario.id;
    const perfil_id = await obtenerPerfilId(cuenta_id);

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
        } else {
            // Aunque no supere el mejor puntaje, sí fue un intento más.
            await pool.query(
                'UPDATE progreso_usuario SET intentos = intentos + 1, ultima_vez = NOW() WHERE perfil_id = $1 AND actividad_id = $2',
                [perfil_id, actividad_id]
            );
        }
    } else {
        await pool.query(
            'INSERT INTO progreso_usuario (perfil_id, actividad_id, mejor_puntaje, intentos, completado) VALUES ($1, $2, $3, 1, true)',
            [perfil_id, actividad_id, puntaje]
        );
    }

    const racha_actual = await actualizarRachaPerfil(perfil_id);
    const insignias_nuevas = await revisarYAsignarInsignias(perfil_id, racha_actual);

    res.json({ mensaje: 'Progreso guardado', racha_actual, insignias_nuevas });
};

const obtenerProgreso = async (req, res) => {
    const cuenta_id = req.usuario.id;
    const perfil_id = await obtenerPerfilId(cuenta_id);

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
