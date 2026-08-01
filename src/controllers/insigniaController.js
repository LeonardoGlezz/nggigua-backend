const pool = require('../config/database');
const { ApiError } = require('../middlewares/errorHandler');

// Todas las insignias, con `obtenida` y `fecha_obtenida` según el perfil
// que hace la consulta. Las insignias marcadas es_oculta que aún no se
// han ganado no revelan nombre/descripción (para no arruinar la sorpresa).
const listarInsignias = async (req, res) => {
    const cuenta_id = req.usuario.id;

    const perfilResult = await pool.query(
        'SELECT id FROM perfil_usuario WHERE cuenta_id = $1',
        [cuenta_id]
    );
    if (perfilResult.rows.length === 0) {
        throw new ApiError(404, 'Perfil no encontrado para esta cuenta');
    }
    const perfil_id = perfilResult.rows[0].id;

    const resultado = await pool.query(`
        SELECT i.*, pi.fecha_obtenida
        FROM insignia i
        LEFT JOIN perfil_insignia pi ON pi.insignia_id = i.id AND pi.perfil_id = $1
        ORDER BY i.condicion_tipo, i.condicion_valor
    `, [perfil_id]);

    const insignias = resultado.rows.map(r => {
        const obtenida = r.fecha_obtenida !== null;
        if (r.es_oculta && !obtenida) {
            return { id: r.id, es_oculta: true, obtenida: false };
        }
        return {
            id: r.id,
            nombre: r.nombre,
            descripcion: r.descripcion,
            icono_url: r.icono_url,
            es_oculta: r.es_oculta,
            obtenida,
            fecha_obtenida: r.fecha_obtenida,
        };
    });

    res.json(insignias);
};

module.exports = { listarInsignias };
