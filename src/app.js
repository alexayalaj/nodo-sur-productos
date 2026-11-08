const path = require('path');
const express = require('express');
const { conectarDB, estadoConexion } = require('./config/db');
const autenticar = require('./middleware/autenticar');
const { noEncontrado, manejarErrores } = require('./middleware/errores');
const authRoutes = require('./routes/authRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const productoRoutes = require('./routes/productoRoutes');
const { exito, fallo } = require('./utils/responder');

const app = express();

app.use(express.json({ limit: '100kb' }));
// Express 5 deja req.body sin definir cuando no llega cuerpo.
app.use((req, res, next) => {
  if (req.body === undefined) req.body = {};
  next();
});
app.use(express.static(path.join(__dirname, '..', 'public')));

// Estado del servicio y de la base de datos (público).
app.get('/api/salud', async (req, res) => {
  try {
    await conectarDB();
    return exito(res, 200, 'Servicio disponible.', { baseDeDatos: estadoConexion() });
  } catch (err) {
    return fallo(res, 503, 'Servicio sin conexión a la base de datos.', { baseDeDatos: estadoConexion() });
  }
});

// En serverless cada invocación puede iniciar en frío: se asegura la conexión antes de las rutas.
app.use('/api', async (req, res, next) => {
  try {
    await conectarDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/categorias', autenticar, categoriaRoutes);
app.use('/api/productos', autenticar, productoRoutes);

app.use(noEncontrado);
app.use(manejarErrores);

module.exports = app;
