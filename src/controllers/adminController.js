const pool = require('../config/database');
const { ApiError } = require('../middlewares/errorHandler');

// ===================== Usuarios =====================

const listarUsuarios = async (req, res) => {
    const resultado = await pool.query(`
        SELECT
            c.id, c.correo, c.rol, c.cuenta_activa, c.creado_en,
            pu.id as perfil_id, pu.nombre, pu.tipo_perfil, pu.racha_actual, pu.ultima_conexion,
            COUNT(pr.id) FILTER (WHERE pr.completado) as actividades_completadas,
            COALESCE(SUM(pr.mejor_puntaje), 0) as puntos_totales
        FROM cuenta c
        LEFT JOIN perfil_usuario pu ON pu.cuenta_id = c.id
        LEFT JOIN progreso_usuario pr ON pr.perfil_id = pu.id
        GROUP BY c.id, pu.id
        ORDER BY c.creado_en DESC
    `);
    res.json(resultado.rows);
};

const obtenerUsuario = async (req, res) => {
    const { id } = req.params;

    const cuenta = await pool.query(
        `SELECT c.id, c.correo, c.rol, c.cuenta_activa, c.creado_en,
                pu.id as perfil_id, pu.nombre, pu.tipo_perfil, pu.racha_actual, pu.ultima_conexion
         FROM cuenta c
         LEFT JOIN perfil_usuario pu ON pu.cuenta_id = c.id
         WHERE c.id = $1`,
        [id]
    );

    if (cuenta.rows.length === 0) {
        throw new ApiError(404, 'Usuario no encontrado.');
    }

    const perfilId = cuenta.rows[0].perfil_id;
    const progreso = perfilId
        ? (await pool.query(
            `SELECT a.nombre as actividad, pr.completado, pr.mejor_puntaje, pr.intentos, pr.ultima_vez
             FROM progreso_usuario pr
             JOIN actividad a ON a.id = pr.actividad_id
             WHERE pr.perfil_id = $1
             ORDER BY pr.ultima_vez DESC`,
            [perfilId]
        )).rows
        : [];

    res.json({ ...cuenta.rows[0], progreso });
};

const TIPOS_PERFIL_VALIDOS = ['Niño', 'Joven', 'Adulto'];
const ROLES_VALIDOS = ['USUARIO', 'ADMIN'];

const actualizarUsuario = async (req, res) => {
    const { id } = req.params;
    const { correo, rol, cuenta_activa, nombre, tipo_perfil } = req.body;

    if (rol !== undefined && !ROLES_VALIDOS.includes(rol)) {
        throw new ApiError(400, 'Rol inválido.');
    }
    if (tipo_perfil !== undefined && !TIPOS_PERFIL_VALIDOS.includes(tipo_perfil)) {
        throw new ApiError(400, 'Tipo de perfil inválido.');
    }

    const cuentaExiste = await pool.query('SELECT id FROM cuenta WHERE id = $1', [id]);
    if (cuentaExiste.rows.length === 0) {
        throw new ApiError(404, 'Usuario no encontrado.');
    }

    if (correo !== undefined || rol !== undefined || cuenta_activa !== undefined) {
        await pool.query(
            `UPDATE cuenta SET
                correo = COALESCE($1, correo),
                rol = COALESCE($2, rol),
                cuenta_activa = COALESCE($3, cuenta_activa)
             WHERE id = $4`,
            [correo ?? null, rol ?? null, cuenta_activa ?? null, id]
        );
    }

    if (nombre !== undefined || tipo_perfil !== undefined) {
        await pool.query(
            `UPDATE perfil_usuario SET
                nombre = COALESCE($1, nombre),
                tipo_perfil = COALESCE($2, tipo_perfil)
             WHERE cuenta_id = $3`,
            [nombre ?? null, tipo_perfil ?? null, id]
        );
    }

    res.json({ mensaje: 'Usuario actualizado correctamente.' });
};

const eliminarUsuario = async (req, res) => {
    const { id } = req.params;

    // No se permite que un admin se borre a sí mismo desde el panel — evita
    // quedarse sin acceso por accidente a media sesión.
    if (id === req.usuario.id) {
        throw new ApiError(400, 'No puedes eliminar tu propia cuenta desde el panel.');
    }

    const cliente = await pool.connect();
    try {
        await cliente.query('BEGIN');

        const perfil = await cliente.query('SELECT id FROM perfil_usuario WHERE cuenta_id = $1', [id]);
        if (perfil.rows.length > 0) {
            const perfilId = perfil.rows[0].id;
            await cliente.query('DELETE FROM perfil_insignia WHERE perfil_id = $1', [perfilId]);
            await cliente.query('DELETE FROM progreso_usuario WHERE perfil_id = $1', [perfilId]);
            await cliente.query('DELETE FROM perfil_usuario WHERE id = $1', [perfilId]);
        }

        const resultado = await cliente.query('DELETE FROM cuenta WHERE id = $1 RETURNING id', [id]);
        if (resultado.rows.length === 0) {
            throw new ApiError(404, 'Usuario no encontrado.');
        }

        await cliente.query('COMMIT');
    } catch (err) {
        await cliente.query('ROLLBACK');
        throw err;
    } finally {
        cliente.release();
    }

    res.json({ mensaje: 'Usuario eliminado correctamente.' });
};

// ===================== Estadísticas =====================

const estadisticas = async (req, res) => {
    const [
        totalUsuarios,
        porTipoPerfil,
        actividadesCompletadas,
        promedioRacha,
        actividadesMasJugadas,
        usuariosRecientes,
    ] = await Promise.all([
        pool.query('SELECT COUNT(*) as total FROM cuenta'),
        pool.query('SELECT tipo_perfil, COUNT(*) as total FROM perfil_usuario GROUP BY tipo_perfil'),
        pool.query('SELECT COUNT(*) as total FROM progreso_usuario WHERE completado'),
        pool.query('SELECT COALESCE(ROUND(AVG(racha_actual), 1), 0) as promedio FROM perfil_usuario'),
        pool.query(`
            SELECT a.nombre, a.tipo, COUNT(pr.id) as veces_jugada
            FROM progreso_usuario pr
            JOIN actividad a ON a.id = pr.actividad_id
            GROUP BY a.id, a.nombre, a.tipo
            ORDER BY veces_jugada DESC
            LIMIT 5
        `),
        pool.query(`SELECT COUNT(*) as total FROM cuenta WHERE creado_en > NOW() - INTERVAL '30 days'`),
    ]);

    res.json({
        total_usuarios: Number(totalUsuarios.rows[0].total),
        usuarios_por_tipo_perfil: porTipoPerfil.rows,
        actividades_completadas: Number(actividadesCompletadas.rows[0].total),
        promedio_racha: Number(promedioRacha.rows[0].promedio),
        actividades_mas_jugadas: actividadesMasJugadas.rows,
        usuarios_ultimos_30_dias: Number(usuariosRecientes.rows[0].total),
    });
};

// ===================== Niveles =====================

const listarNiveles = async (req, res) => {
    const resultado = await pool.query('SELECT * FROM nivel ORDER BY orden ASC');
    res.json(resultado.rows);
};

const crearNivel = async (req, res) => {
    const { nombre, descripcion, orden } = req.body;
    if (!nombre || orden === undefined) {
        throw new ApiError(400, 'nombre y orden son requeridos.');
    }
    const resultado = await pool.query(
        'INSERT INTO nivel (nombre, descripcion, orden) VALUES ($1, $2, $3) RETURNING *',
        [nombre, descripcion ?? null, orden]
    );
    res.status(201).json(resultado.rows[0]);
};

const actualizarNivel = async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, orden } = req.body;
    const resultado = await pool.query(
        `UPDATE nivel SET
            nombre = COALESCE($1, nombre),
            descripcion = COALESCE($2, descripcion),
            orden = COALESCE($3, orden)
         WHERE id = $4 RETURNING *`,
        [nombre ?? null, descripcion ?? null, orden ?? null, id]
    );
    if (resultado.rows.length === 0) throw new ApiError(404, 'Nivel no encontrado.');
    res.json(resultado.rows[0]);
};

const eliminarNivel = async (req, res) => {
    const { id } = req.params;
    const enUso = await pool.query('SELECT id FROM actividad WHERE nivel_id = $1 LIMIT 1', [id]);
    if (enUso.rows.length > 0) {
        throw new ApiError(409, 'No se puede eliminar: este nivel todavía tiene actividades asignadas.');
    }
    const resultado = await pool.query('DELETE FROM nivel WHERE id = $1 RETURNING id', [id]);
    if (resultado.rows.length === 0) throw new ApiError(404, 'Nivel no encontrado.');
    res.json({ mensaje: 'Nivel eliminado correctamente.' });
};

// ===================== Actividades =====================

const listarActividades = async (req, res) => {
    const { nivel_id } = req.query;
    const resultado = nivel_id
        ? await pool.query('SELECT * FROM actividad WHERE nivel_id = $1 ORDER BY orden ASC', [nivel_id])
        : await pool.query('SELECT * FROM actividad ORDER BY nivel_id, orden ASC');
    res.json(resultado.rows);
};

const crearActividad = async (req, res) => {
    const { nivel_id, nombre, descripcion, tipo, orden, icono_url } = req.body;
    if (!nivel_id || !nombre || !tipo || orden === undefined) {
        throw new ApiError(400, 'nivel_id, nombre, tipo y orden son requeridos.');
    }
    const resultado = await pool.query(
        'INSERT INTO actividad (nivel_id, nombre, descripcion, tipo, orden, icono_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [nivel_id, nombre, descripcion ?? null, tipo, orden, icono_url ?? null]
    );
    res.status(201).json(resultado.rows[0]);
};

const actualizarActividad = async (req, res) => {
    const { id } = req.params;
    const { nivel_id, nombre, descripcion, tipo, orden, icono_url } = req.body;
    const resultado = await pool.query(
        `UPDATE actividad SET
            nivel_id = COALESCE($1, nivel_id),
            nombre = COALESCE($2, nombre),
            descripcion = COALESCE($3, descripcion),
            tipo = COALESCE($4, tipo),
            orden = COALESCE($5, orden),
            icono_url = COALESCE($6, icono_url)
         WHERE id = $7 RETURNING *`,
        [nivel_id ?? null, nombre ?? null, descripcion ?? null, tipo ?? null, orden ?? null, icono_url ?? null, id]
    );
    if (resultado.rows.length === 0) throw new ApiError(404, 'Actividad no encontrada.');
    res.json(resultado.rows[0]);
};

const eliminarActividad = async (req, res) => {
    const { id } = req.params;
    const cliente = await pool.connect();
    try {
        await cliente.query('BEGIN');
        await cliente.query('DELETE FROM progreso_usuario WHERE actividad_id = $1', [id]);
        await cliente.query('DELETE FROM item_actividad WHERE actividad_id = $1', [id]);
        const resultado = await cliente.query('DELETE FROM actividad WHERE id = $1 RETURNING id', [id]);
        if (resultado.rows.length === 0) throw new ApiError(404, 'Actividad no encontrada.');
        await cliente.query('COMMIT');
    } catch (err) {
        await cliente.query('ROLLBACK');
        throw err;
    } finally {
        cliente.release();
    }
    res.json({ mensaje: 'Actividad eliminada correctamente.' });
};

// ===================== Items de actividad =====================
// contenido es JSONB con forma distinta según el tipo de juego (memorama,
// ahorcado, atrapa_palabra, empareja, ruleta), por eso aquí se maneja como
// JSON crudo en vez de intentar modelar 5 formas distintas — el panel de
// admin expone un editor de texto/JSON para este campo.

const listarItems = async (req, res) => {
    const { actividad_id } = req.params;
    const resultado = await pool.query(
        'SELECT * FROM item_actividad WHERE actividad_id = $1 ORDER BY orden ASC',
        [actividad_id]
    );
    res.json(resultado.rows);
};

const crearItem = async (req, res) => {
    const { actividad_id, orden, contenido, respuesta_correcta, puntos_base } = req.body;
    if (!actividad_id || orden === undefined || contenido === undefined) {
        throw new ApiError(400, 'actividad_id, orden y contenido son requeridos.');
    }
    const resultado = await pool.query(
        'INSERT INTO item_actividad (actividad_id, orden, contenido, respuesta_correcta, puntos_base) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [actividad_id, orden, contenido, respuesta_correcta ?? null, puntos_base ?? 10]
    );
    res.status(201).json(resultado.rows[0]);
};

const actualizarItem = async (req, res) => {
    const { id } = req.params;
    const { orden, contenido, respuesta_correcta, puntos_base } = req.body;
    const resultado = await pool.query(
        `UPDATE item_actividad SET
            orden = COALESCE($1, orden),
            contenido = COALESCE($2, contenido),
            respuesta_correcta = COALESCE($3, respuesta_correcta),
            puntos_base = COALESCE($4, puntos_base)
         WHERE id = $5 RETURNING *`,
        [orden ?? null, contenido ?? null, respuesta_correcta ?? null, puntos_base ?? null, id]
    );
    if (resultado.rows.length === 0) throw new ApiError(404, 'Item no encontrado.');
    res.json(resultado.rows[0]);
};

const eliminarItem = async (req, res) => {
    const { id } = req.params;
    const resultado = await pool.query('DELETE FROM item_actividad WHERE id = $1 RETURNING id', [id]);
    if (resultado.rows.length === 0) throw new ApiError(404, 'Item no encontrado.');
    res.json({ mensaje: 'Item eliminado correctamente.' });
};

module.exports = {
    listarUsuarios, obtenerUsuario, actualizarUsuario, eliminarUsuario,
    estadisticas,
    listarNiveles, crearNivel, actualizarNivel, eliminarNivel,
    listarActividades, crearActividad, actualizarActividad, eliminarActividad,
    listarItems, crearItem, actualizarItem, eliminarItem,
};
