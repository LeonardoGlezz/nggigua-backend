const express = require('express');
const router = express.Router();
const { registro, login, getPerfilCompleto, olvidePassword, restablecerPassword } = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const { limitadorAuth } = require('../middlewares/rateLimiter');

router.post('/registro', limitadorAuth, asyncHandler(registro));
router.post('/login', limitadorAuth, asyncHandler(login));
router.get('/perfil-completo', verificarToken, asyncHandler(getPerfilCompleto));
// Mismo limitador que login/registro: sin esto alguien podría usar este
// endpoint para mandar correos de spam masivo a direcciones ajenas, o
// probar fuerza bruta contra restablecer-password.
router.post('/olvide-password', limitadorAuth, asyncHandler(olvidePassword));
router.post('/restablecer-password', limitadorAuth, asyncHandler(restablecerPassword));

module.exports = router;