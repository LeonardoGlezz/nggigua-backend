const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const leccionRoutes = require('./routes/leccionRoutes');
const progresoRoutes = require('./routes/progresoRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api', leccionRoutes);
app.use('/api', progresoRoutes);

app.get('/', (req, res) =>{
    res.json({ mensaje: 'Nggigua API funcionando'});
});

app.get('/test-db', async (req, res) => {
    const result = await pool.query('SELECT NOW()');
    res.json({ conectado: true, hora: result.rows[0].now });
});

app.listen(PORT, ()=>{
    console.log(`Servidor corriendo en puerto ${PORT}`);
});