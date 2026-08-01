const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ApiError } = require('../middlewares/errorHandler');

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


module.exports = { registro, login, getPerfilCompleto };
