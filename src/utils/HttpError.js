// Error con código HTTP asociado; el middleware de errores lo convierte en respuesta JSON.
class HttpError extends Error {
  constructor(estado, mensaje, detalles) {
    super(mensaje);
    this.name = 'HttpError';
    this.estado = estado;
    this.detalles = detalles;
  }
}

module.exports = HttpError;
