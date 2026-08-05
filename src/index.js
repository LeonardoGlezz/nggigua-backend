const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
// quiet: true — desde la v17, dotenv imprime "tips" promocionales en cada
// arranque (de otro producto del mantenedor). No es malicioso, pero no
// pertenece a los logs de un servidor.
require('dotenv').config({ quiet: true });
const pool = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const leccionRoutes = require('./routes/leccionRoutes');
const progresoRoutes = require('./routes/progresoRoutes');
const insigniaRoutes = require('./routes/insigniaRoutes');
const adminRoutes = require('./routes/adminRoutes');
const asyncHandler = require('./middlewares/asyncHandler');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Antes cors() estaba abierto a cualquier origen (*), lo cual está bien
// para prototipar pero no para producción: cualquier sitio web podría
// hacer requests autenticados contra esta API desde el navegador de un
// usuario. Ahora solo se permite el/los origen(es) configurados.
const origenesPermitidos = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim());

app.use(helmet());
app.use(cors({
    origin: origenesPermitidos,
    credentials: true,
}));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api', leccionRoutes);
app.use('/api', progresoRoutes);
app.use('/api', insigniaRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) =>{
    res.json({ mensaje: 'Nggigua API funcionando'});
});

app.get('/test-db', asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT NOW()');
    res.json({ conectado: true, hora: result.rows[0].now });
}));

// 404 para cualquier ruta no definida arriba.
app.use(notFoundHandler);

// SIEMPRE al final: atrapa cualquier error lanzado (o promesa rechazada)
// en cualquier ruta anterior. Sin esto, un error de DB tumba el request
// sin respuesta clara, o en el peor caso, el proceso completo.
app.use(errorHandler);

app.listen(PORT, ()=>{
    console.log(`Servidor corriendo en puerto ${PORT}`);
});