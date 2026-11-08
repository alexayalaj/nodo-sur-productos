const Categoria = require('../models/Categoria');
const { exito } = require('../utils/responder');

async function listar(req, res, next) {
  try {
    const categorias = await Categoria.find().sort('nombre');
    return exito(res, 200, 'Categorías obtenidas.', categorias);
  } catch (err) {
    return next(err);
  }
}

async function crear(req, res, next) {
  try {
    const { nombre, descripcion } = req.body;
    const categoria = await Categoria.create({ nombre, descripcion });
    return exito(res, 201, 'Categoría creada.', categoria);
  } catch (err) {
    return next(err);
  }
}

module.exports = { listar, crear };
