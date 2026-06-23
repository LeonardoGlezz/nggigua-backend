const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const { guardarProgreso, obtenerProgreso, getRanking } = require('../controllers/progresoController');

router.post('/progreso', verificarToken, guardarProgreso);
router.get('/progreso', verificarToken, obtenerProgreso);
router.get('/ranking/memorama', verificarToken, getRanking);

module.exports = router;