const express = require('express');
const router = express.Router();
const { registro, login, getPerfilCompleto } = require('../controllers/authController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.post('/registro', registro);
router.post('/login', login);
router.get('/perfil-completo', verificarToken, getPerfilCompleto);

module.exports = router;