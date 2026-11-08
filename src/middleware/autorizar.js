const Producto = require('../models/Producto');
const HttpError = require('../utils/HttpError');

// Solo quien creó el producto puede editarlo o eliminarlo (403 en otro caso).
async function esCreador(req, res, next) {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      throw new HttpError(404, 'Producto no encontrado.');
    }
    if (String(producto.creadoPor) !== String(req.usuario.id)) {
      throw new HttpError(403, 'Solo el creador del producto puede modificarlo o eliminarlo.');
    }
    req.producto = producto;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { esCreador };
