const mongoose = require('mongoose');
const HttpError = require('../utils/HttpError');

// La promesa de conexión se guarda en global para reutilizarla entre invocaciones
// de una función serverless (Mongoose, s.f.) y evitar abrir una conexión por petición.
function cache() {
  if (!global.__nodoSurMongo) global.__nodoSurMongo = { promesa: null };
  return global.__nodoSurMongo;
}

async function conectarDB(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new HttpError(503, 'Falta la variable de entorno MONGODB_URI.');
  }
  if (mongoose.connection.readyState === 1) return mongoose;
  const estado = cache();
  if (!estado.promesa) {
    estado.promesa = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 8000, bufferCommands: false })
      .catch((err) => {
        estado.promesa = null;
        throw new HttpError(
          503,
          'No se pudo conectar a MongoDB. Revisa MONGODB_URI y que la IP esté permitida en Atlas (Network Access).',
          err.message
        );
      });
  }
  return estado.promesa;
}

function estadoConexion() {
  const nombres = { 0: 'desconectado', 1: 'conectado', 2: 'conectando', 3: 'desconectando' };
  return nombres[mongoose.connection.readyState] || 'desconocido';
}

module.exports = { conectarDB, estadoConexion };
