const rateLimit = require('express-rate-limit');

// Limita intentos de login/registro por IP. Sin esto, alguien puede
// probar miles de contraseñas por segundo contra /login (fuerza bruta)
// o crear miles de cuentas basura contra /registro.
const limitadorAuth = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20, // 20 intentos por IP en esa ventana
    standardHeaders: true,
    legacyHeaders: false,
    message: { mensaje: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.' },
});

module.exports = { limitadorAuth };
