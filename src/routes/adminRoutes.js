const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const { verificarAdmin } = require('../middlewares/adminMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');
const {
    listarUsuarios, obtenerUsuario, actualizarUsuario, eliminarUsuario,
    estadisticas,
    listarNiveles, crearNivel, actualizarNivel, eliminarNivel,
    listarActividades, crearActividad, actualizarActividad, eliminarActividad,
    listarItems, crearItem, actualizarItem, eliminarItem,
} = require('../controllers/adminController');

// Toda ruta de este router exige: (1) estar autenticado y (2) tener rol
// ADMIN. Se aplica una vez a nivel de router en vez de repetirlo en cada
// línea de abajo.
router.use(verificarToken, verificarAdmin);

router.get('/usuarios', asyncHandler(listarUsuarios));
router.get('/usuarios/:id', asyncHandler(obtenerUsuario));
router.put('/usuarios/:id', asyncHandler(actualizarUsuario));
router.delete('/usuarios/:id', asyncHandler(eliminarUsuario));

router.get('/estadisticas', asyncHandler(estadisticas));

router.get('/niveles', asyncHandler(listarNiveles));
router.post('/niveles', asyncHandler(crearNivel));
router.put('/niveles/:id', asyncHandler(actualizarNivel));
router.delete('/niveles/:id', asyncHandler(eliminarNivel));

router.get('/actividades', asyncHandler(listarActividades));
router.post('/actividades', asyncHandler(crearActividad));
router.put('/actividades/:id', asyncHandler(actualizarActividad));
router.delete('/actividades/:id', asyncHandler(eliminarActividad));

router.get('/actividades/:actividad_id/items', asyncHandler(listarItems));
router.post('/items', asyncHandler(crearItem));
router.put('/items/:id', asyncHandler(actualizarItem));
router.delete('/items/:id', asyncHandler(eliminarItem));

module.exports = router;
