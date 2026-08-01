// Evalúa y otorga insignias. Se llama después de guardar progreso, así
// que solo revisa lo necesario: insignias que el perfil todavía no tiene.
//
// condicion_tipo soportados (definidos por nosotros, la tabla `insignia`
// solo los guarda como texto libre):
//   - 'nivel_completado': condicion_valor = nivel.orden (1, 2 o 3).
//        Se cumple cuando TODAS las actividades de ese nivel están
//        completadas para el perfil.
//   - 'racha': condicion_valor = días de racha necesarios.
//   - 'juegos_variados': condicion_valor = cuántos tipos de minijuego
//        distintos debe haber completado al menos una vez (memorama,
//        ahorcado, atrapa_palabra, empareja, ruleta).

const pool = require('../config/database');

async function obtenerEstadoProgreso(perfil_id) {
    const { rows: completadas } = await pool.query(`
        SELECT a.tipo, n.orden AS nivel_orden
        FROM progreso_usuario p
        JOIN actividad a ON p.actividad_id = a.id
        JOIN nivel n ON a.nivel_id = n.id
        WHERE p.perfil_id = $1 AND p.completado = true
    `, [perfil_id]);

    const { rows: totalesPorNivel } = await pool.query(`
        SELECT n.orden AS nivel_orden, COUNT(*)::int AS total
        FROM actividad a
        JOIN nivel n ON a.nivel_id = n.id
        GROUP BY n.orden
    `);

    const completadasPorNivel = {};
    const tiposCompletados = new Set();
    for (const c of completadas) {
        completadasPorNivel[c.nivel_orden] = (completadasPorNivel[c.nivel_orden] || 0) + 1;
        tiposCompletados.add(c.tipo);
    }

    const totales = {};
    for (const t of totalesPorNivel) totales[t.nivel_orden] = t.total;

    return { completadasPorNivel, totales, tiposCompletados };
}

function cumpleCondicion(insignia, estado, rachaActual) {
    const { condicion_tipo, condicion_valor } = insignia;

    if (condicion_tipo === 'nivel_completado') {
        const total = estado.totales[condicion_valor] || 0;
        const completadas = estado.completadasPorNivel[condicion_valor] || 0;
        return total > 0 && completadas >= total;
    }
    if (condicion_tipo === 'racha') {
        return (rachaActual || 0) >= condicion_valor;
    }
    if (condicion_tipo === 'juegos_variados') {
        return estado.tiposCompletados.size >= condicion_valor;
    }
    return false;
}

// Devuelve el arreglo de insignias recién otorgadas (vacío si ninguna).
async function revisarYAsignarInsignias(perfil_id, rachaActual) {
    const { rows: todasInsignias } = await pool.query('SELECT * FROM insignia');
    if (todasInsignias.length === 0) return [];

    const { rows: yaObtenidas } = await pool.query(
        'SELECT insignia_id FROM perfil_insignia WHERE perfil_id = $1',
        [perfil_id]
    );
    const idsObtenidas = new Set(yaObtenidas.map(r => r.insignia_id));
    const pendientes = todasInsignias.filter(i => !idsObtenidas.has(i.id));
    if (pendientes.length === 0) return [];

    const estado = await obtenerEstadoProgreso(perfil_id);
    const nuevas = [];

    for (const insignia of pendientes) {
        if (cumpleCondicion(insignia, estado, rachaActual)) {
            await pool.query(
                'INSERT INTO perfil_insignia (perfil_id, insignia_id) VALUES ($1, $2)',
                [perfil_id, insignia.id]
            );
            nuevas.push(insignia);
        }
    }
    return nuevas;
}

module.exports = { revisarYAsignarInsignias, cumpleCondicion, obtenerEstadoProgreso };
