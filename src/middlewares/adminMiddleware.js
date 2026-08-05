const { ApiError } = require('./errorHandler');

// Debe ir SIEMPRE después de verificarToken en la cadena de middlewares:
// necesita req.usuario ya decodificado del JWT (incluye rol porque
// authController.login lo mete en el payload del token al firmarlo).
const verificarAdmin = (req, res, next) => {
    if (!req.usuario || req.usuario.rol !== 'ADMIN') {
        throw new ApiError(403, 'No tienes permisos de administrador para esta acción.');
    }
    next();
};

module.exports = { verificarAdmin };
