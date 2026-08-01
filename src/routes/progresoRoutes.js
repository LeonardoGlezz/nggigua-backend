const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const { guardarProgreso, obtenerProgreso, getRanking } = require('../controllers/progresoController');
const asyncHandler = require('../middlewares/asyncHandler');

router.post('/progreso', verificarToken, asyncHandler(guardarProgreso));
router.get('/progreso', verificarToken, asyncHandler(obtenerProgreso));
router.get('/ranking/memorama', verificarToken, asyncHandler(getRanking));

module.exports = router;