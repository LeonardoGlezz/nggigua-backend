const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verificarToken } = require('../middlewares/authMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');

router.get('/niveles', verificarToken, asyncHandler(async (req, res) => {
    const resultado = await pool.query(
        'SELECT * FROM nivel ORDER BY orden ASC'
    );
    res.json(resultado.rows);
}));

router.get('/niveles/:id/actividades', verificarToken, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const resultado = await pool.query(
        'SELECT * FROM actividad WHERE nivel_id = $1 ORDER BY orden ASC',
        [id]
    );
    res.json(resultado.rows);
}));

router.get('/actividades/:id/items', verificarToken, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const resultado = await pool.query(
        'SELECT * FROM item_actividad WHERE actividad_id = $1 ORDER BY orden ASC',
        [id]
    );
    res.json(resultado.rows);
}));

module.exports = router;
