const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { ApiError } = require('../middlewares/errorHandler');
const { enviarCorreoRecuperacion } = require('../config/mailer');

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIPOS_PERFIL_VALIDOS = ['Niño', 'Joven', 'Adulto'];

// El frontend ya valida esto, pero cualquiera puede pegarle a la API
// directo con curl/Postman sin pasar por el formulario. Nunca hay que
// confiar solo en la validación del cliente.
const validarDatosRegistro = ({ correo, contrasena, nombre, tipo_perfil }) => {
    if (!correo || !contrasena || !nombre || !tipo_perfil) {
        throw new ApiError(400, 'Completa todos los campos.');
    }
    if (!REGEX_CORREO.test(correo)) {
        throw new ApiError(400, 'El correo no es válido.');
    }
    if (contrasena.length < 6) {
        throw new ApiError(400, 'La contraseña debe tener al menos 6 caracteres.');
    }
    if (!TIPOS_PERFIL_VALIDOS.includes(tipo_perfil)) {
        throw new ApiError(400, 'Tipo de perfil inválido.');
    }
};

const registro = async (req, res) => {
    const { correo, contrasena, nombre, tipo_perfil } = req.body;

    validarDatosRegistro({ correo, contrasena, nombre, tipo_perfil });

    const hashContrasena = await bcrypt.hash(contrasena, 10);

    let cuentaId;
    try {
        const nuevaCuenta = await pool.query(
            'INSERT INTO cuenta (correo, contrasena, rol) VALUES ($1, $2, $3) RETURNING id',
            [correo, hashContrasena, 'USUARIO']
        );
        cuentaId = nuevaCuenta.rows[0].id;
    } catch (err) {
        // 23505 = unique_violation en Postgres → el correo ya existe.
        if (err.code === '23505') {
            throw new ApiError(409, 'Este correo ya está registrado.');
        }
        throw err;
    }

    await pool.query(
        'INSERT INTO perfil_usuario (cuenta_id, nombre, tipo_perfil) VALUES ($1, $2, $3)',
        [cuentaId, nombre, tipo_perfil]
    );

    res.status(201).json({ mensaje: 'Usuario registrado exitosamente' });
};

const login = async (req, res) => {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
        throw new ApiError(400, 'Correo y contraseña son requeridos.');
    }

    const resultado = await pool.query(
        'SELECT * FROM cuenta WHERE correo = $1',
        [correo]
    );

    if (resultado.rows.length === 0) {
        throw new ApiError(401, 'Credenciales inválidas');
    }

    const cuenta = resultado.rows[0];

    const contrasenaValida = await bcrypt.compare(contrasena, cuenta.contrasena);

    if (!contrasenaValida) {
        throw new ApiError(401, 'Credenciales inválidas');
    }

    const token = jwt.sign(
        { id: cuenta.id, rol: cuenta.rol },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );

    res.json({ token });
};

const getPerfilCompleto = async (req, res) => {
    const cuenta_id = req.usuario.id;

    const resultado = await pool.query(
        'SELECT * FROM perfil_usuario WHERE cuenta_id = $1',
        [cuenta_id]
    );

    if (resultado.rows.length === 0) {
        throw new ApiError(404, 'Perfil no encontrado');
    }

    res.json({ usuario: resultado.rows[0] });
};


// Paso 1 de la recuperación: el usuario manda su correo. Generamos un
// token aleatorio, lo guardamos con expiración de 1 hora, y mandamos el
// link real por correo. SIEMPRE respondemos el mismo mensaje exista o no
// esa cuenta — si dijéramos "correo no encontrado" cualquiera podría usar
// este endpoint para averiguar qué correos están registrados.
const olvidePassword = async (req, res) => {
    const { correo } = req.body;

    if (!correo) {
        throw new ApiError(400, 'El correo es requerido.');
    }

    const resultado = await pool.query('SELECT id FROM cuenta WHERE correo = $1', [correo]);

    if (resultado.rows.length > 0) {
        const cuentaId = resultado.rows[0].id;
        const token = crypto.randomBytes(32).toString('hex');
        const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        await pool.query(
            'UPDATE cuenta SET token_recuperacion = $1, token_expira = $2 WHERE id = $3',
            [token, expira, cuentaId]
        );

        const urlFrontend = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
        const enlace = `${urlFrontend}/restablecer-password?token=${token}`;

        try {
            await enviarCorreoRecuperacion(correo, enlace);
        } catch (err) {
            // No exponemos el detalle del error de correo al cliente (podría
            // filtrar si el correo existe o no), pero sí lo logueamos para
            // poder diagnosticar problemas de configuración de EMAIL_USER/PASS.
            console.error('[MAILER] Error enviando correo de recuperación:', err.message);
        }
    }

    res.json({ mensaje: 'Si el correo está registrado, recibirás un enlace de recuperación en unos minutos.' });
};

// Paso 2: el usuario llega desde el link del correo con el token, y manda
// su nueva contraseña.
const restablecerPassword = async (req, res) => {
    const { token, nuevaContrasena } = req.body;

    if (!token || !nuevaContrasena) {
        throw new ApiError(400, 'Token y nueva contraseña son requeridos.');
    }
    if (nuevaContrasena.length < 6) {
        throw new ApiError(400, 'La contraseña debe tener al menos 6 caracteres.');
    }

    const resultado = await pool.query(
        'SELECT id, token_expira FROM cuenta WHERE token_recuperacion = $1',
        [token]
    );

    if (resultado.rows.length === 0) {
        throw new ApiError(400, 'El enlace de recuperación no es válido. Solicita uno nuevo.');
    }

    const cuenta = resultado.rows[0];
    if (new Date(cuenta.token_expira) < new Date()) {
        throw new ApiError(400, 'El enlace de recuperación expiró. Solicita uno nuevo.');
    }

    const hashContrasena = await bcrypt.hash(nuevaContrasena, 10);

    await pool.query(
        'UPDATE cuenta SET contrasena = $1, token_recuperacion = NULL, token_expira = NULL WHERE id = $2',
        [hashContrasena, cuenta.id]
    );

    res.json({ mensaje: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' });
};

module.exports = { registro, login, getPerfilCompleto, olvidePassword, restablecerPassword };
