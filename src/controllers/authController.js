const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const registro = async (req, res) => {
    const { correo, contrasena, nombre, tipo_perfil } = req.body;
    
    const hashContrasena = await bcrypt.hash(contrasena, 10);
    
    const nuevaCuenta = await pool.query(
        'INSERT INTO cuenta (correo, contrasena, rol) VALUES ($1, $2, $3) RETURNING id',
        [correo, hashContrasena, 'USUARIO']
    );
    
    const cuentaId = nuevaCuenta.rows[0].id;
    
    await pool.query(
        'INSERT INTO perfil_usuario (cuenta_id, nombre, tipo_perfil) VALUES ($1, $2, $3)',
        [cuentaId, nombre, tipo_perfil]
    );
    
    res.status(201).json({ mensaje: 'Usuario registrado exitosamente' });
};

const login = async (req, res) => {
    const { correo, contrasena } = req.body;

    const resultado = await pool.query(
        'SELECT * FROM cuenta WHERE correo = $1',
        [correo]
    );

    if (resultado.rows.length === 0) {
        return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    const cuenta = resultado.rows[0];

    const contrasenaValida = await bcrypt.compare(contrasena, cuenta.contrasena);

    if (!contrasenaValida) {
        return res.status(401).json({ mensaje: 'Credenciales inválidas' });
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
        return res.status(404).json({ mensaje: 'Perfil no encontrado' });
    }
    
    res.json({ usuario: resultado.rows[0] });
};


module.exports = { registro, login, getPerfilCompleto };