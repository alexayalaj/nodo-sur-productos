const { fallo } = require('../utils/responder');

// Ruta inexistente: 404 en formato JSON.
function noEncontrado(req, res) {
  return fallo(res, 404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`);
}

// Manejador central (err, req, res, next): convierte cada error en una respuesta clara.
// eslint-disable-next-line no-unused-vars
function manejarErrores(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err.name === 'HttpError') {
    return fallo(res, err.estado, err.message, err.detalles);
  }
  if (err.name === 'CastError') {
    return fallo(res, 400, `Valor no válido para ${err.path}.`);
  }
  if (err.name === 'ValidationError') {
    const errores = Object.values(err.errors || {}).map((e) => ({ campo: e.path, mensaje: e.message }));
    return fallo(res, 400, 'Los datos enviados no son válidos.', errores);
  }
  if (err.code === 11000) {
    const campo = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'campo';
    return fallo(res, 409, `Ya existe un registro con ese valor de ${campo}.`);
  }
  if (err.type === 'entity.parse.failed') {
    return fallo(res, 400, 'El cuerpo de la petición no es un JSON válido.');
  }
  if (err.type === 'entity.too.large') {
    return fallo(res, 413, 'El cuerpo de la petición es demasiado grande.');
  }

  console.error(err);
  const detalle = process.env.NODE_ENV === 'production' ? null : err.message;
  return fallo(res, 500, 'Error interno del servidor.', detalle);
}

module.exports = { noEncontrado, manejarErrores };
