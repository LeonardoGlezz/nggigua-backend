const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const { listarInsignias } = require('../controllers/insigniaController');
const asyncHandler = require('../middlewares/asyncHandler');

router.get('/insignias', verificarToken, asyncHandler(listarInsignias));

module.exports = router;
