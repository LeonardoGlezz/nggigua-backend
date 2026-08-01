const express = require('express');
const router = express.Router();
const { registro, login, getPerfilCompleto } = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const { limitadorAuth } = require('../middlewares/rateLimiter');

router.post('/registro', limitadorAuth, asyncHandler(registro));
router.post('/login', limitadorAuth, asyncHandler(login));
router.get('/perfil-completo', verificarToken, asyncHandler(getPerfilCompleto));

module.exports = router;