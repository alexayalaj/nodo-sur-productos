const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const HttpError = require('../utils/HttpError');
const { exito } = require('../utils/responder');

const CAMPOS_EDITABLES = ['nombre', 'sku', 'descripcion', 'precio', 'stock', 'categoria', 'activo'];

const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function verificarCategoria(id) {
  if (!(await Categoria.exists({ _id: id }))) {
    throw new HttpError(400, 'La categoría indicada no existe.');
  }
}

async function listar(req, res, next) {
  try {
    const { categoria, q, orden = 'createdAt', dir = 'desc' } = req.query;
    const filtro = {};
    if (categoria) filtro.categoria = categoria;
    if (q) {
      const patron = new RegExp(escaparRegex(q), 'i');
      filtro.$or = [{ nombre: patron }, { sku: patron }];
    }
    const productos = await Producto.find(filtro)
      .populate('categoria', 'nombre')
      .populate('creadoPor', 'nombre')
      .sort({ [orden]: dir === 'asc' ? 1 : -1 });
    return exito(res, 200, 'Productos obtenidos.', productos);
  } catch (err) {
    return next(err);
  }
}

async function obtener(req, res, next) {
  try {
    const producto = await Producto.findById(req.params.id)
      .populate('categoria', 'nombre')
      .populate('creadoPor', 'nombre');
    if (!producto) {
      throw new HttpError(404, 'Producto no encontrado.');
    }
    return exito(res, 200, 'Producto obtenido.', producto);
  } catch (err) {
    return next(err);
  }
}

async function crear(req, res, next) {
  try {
    await verificarCategoria(req.body.categoria);
    const producto = await Producto.create({ ...req.body, creadoPor: req.usuario.id });
    await producto.populate([
      { path: 'categoria', select: 'nombre' },
      { path: 'creadoPor', select: 'nombre' }
    ]);
    return exito(res, 201, 'Producto creado.', producto);
  } catch (err) {
    return next(err);
  }
}

async function actualizar(req, res, next) {
  try {
    const cambios = {};
    CAMPOS_EDITABLES.forEach((campo) => {
      if (req.body[campo] !== undefined) cambios[campo] = req.body[campo];
    });
    if (Object.keys(cambios).length === 0) {
      throw new HttpError(400, 'No se envió ningún campo para actualizar.');
    }
    if (cambios.categoria) await verificarCategoria(cambios.categoria);
    const producto = await Producto.findByIdAndUpdate(req.params.id, cambios, {
      new: true,
      runValidators: true
    })
      .populate('categoria', 'nombre')
      .populate('creadoPor', 'nombre');
    if (!producto) {
      throw new HttpError(404, 'Producto no encontrado.');
    }
    return exito(res, 200, 'Producto actualizado.', producto);
  } catch (err) {
    return next(err);
  }
}

async function eliminar(req, res, next) {
  try {
    const producto = await Producto.findByIdAndDelete(req.params.id);
    if (!producto) {
      throw new HttpError(404, 'Producto no encontrado.');
    }
    return exito(res, 200, 'Producto eliminado.', { id: producto._id });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
