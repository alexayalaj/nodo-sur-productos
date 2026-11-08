const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const HttpError = require('../utils/HttpError');

const esObjectId = (valor) => mongoose.Types.ObjectId.isValid(valor) && String(valor).length === 24;

const reglasRegistro = [
  body('nombre').isString().trim().isLength({ min: 2, max: 60 }).withMessage('El nombre debe tener entre 2 y 60 caracteres.'),
  body('correo').isString().trim().isEmail().withMessage('El correo no es válido.').normalizeEmail(),
  body('password').isString().isLength({ min: 8, max: 72 }).withMessage('La contraseña debe tener entre 8 y 72 caracteres.')
];

const reglasLogin = [
  body('correo').isString().trim().isEmail().withMessage('El correo no es válido.').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('La contraseña es obligatoria.')
];

const reglasCategoria = [
  body('nombre').isString().trim().isLength({ min: 2, max: 60 }).withMessage('El nombre debe tener entre 2 y 60 caracteres.'),
  body('descripcion').optional().isString().trim().isLength({ max: 200 }).withMessage('La descripción admite hasta 200 caracteres.')
];

const reglaId = [param('id').custom(esObjectId).withMessage('El identificador no es válido.')];

const camposProducto = (obligatorios) => {
  const exigir = (cadena, mensajeFalta) => (obligatorios ? cadena.exists().withMessage(mensajeFalta) : cadena.optional());
  return [
    exigir(body('nombre'), 'El nombre es obligatorio.').isString().trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.'),
    exigir(body('sku'), 'El SKU es obligatorio.').isString().trim().matches(/^[A-Za-z0-9-]{3,30}$/).withMessage('El SKU admite letras, números y guiones (3 a 30 caracteres).'),
    body('descripcion').optional().isString().trim().isLength({ max: 500 }).withMessage('La descripción admite hasta 500 caracteres.'),
    exigir(body('precio'), 'El precio es obligatorio.').isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a 0.').toFloat(),
    exigir(body('stock'), 'El stock es obligatorio.').isInt({ min: 0 }).withMessage('El stock debe ser un entero mayor o igual a 0.').toInt(),
    exigir(body('categoria'), 'La categoría es obligatoria.').custom(esObjectId).withMessage('La categoría no es un identificador válido.'),
    body('activo').optional().isBoolean().withMessage('El campo activo debe ser verdadero o falso.').toBoolean()
  ];
};

const reglasProductoCrear = camposProducto(true);
const reglasProductoActualizar = [...reglaId, ...camposProducto(false)];

const reglasListarProductos = [
  query('categoria').optional().custom(esObjectId).withMessage('La categoría no es un identificador válido.'),
  query('q').optional().isString().trim().isLength({ max: 60 }).withMessage('La búsqueda admite hasta 60 caracteres.'),
  query('orden').optional().isIn(['nombre', 'precio', 'stock', 'createdAt']).withMessage('El orden debe ser nombre, precio, stock o createdAt.'),
  query('dir').optional().isIn(['asc', 'desc']).withMessage('La dirección debe ser asc o desc.')
];

// Si alguna regla falla, responde 400 con la lista de campos inválidos.
function resultadoValidacion(req, res, next) {
  const resultado = validationResult(req);
  if (resultado.isEmpty()) return next();
  const errores = resultado.array().map((e) => ({ campo: e.path, mensaje: e.msg }));
  return next(new HttpError(400, 'Los datos enviados no son válidos.', errores));
}

module.exports = {
  reglasRegistro,
  reglasLogin,
  reglasCategoria,
  reglaId,
  reglasProductoCrear,
  reglasProductoActualizar,
  reglasListarProductos,
  resultadoValidacion
};
