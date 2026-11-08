const express = require('express');
const controlador = require('../controllers/productoController');
const { esCreador } = require('../middleware/autorizar');
const {
  reglaId,
  reglasProductoCrear,
  reglasProductoActualizar,
  reglasListarProductos,
  resultadoValidacion
} = require('../middleware/validar');

// Este router se monta detrás de autenticar (ver app.js).
const router = express.Router();

router.get('/', reglasListarProductos, resultadoValidacion, controlador.listar);
router.get('/:id', reglaId, resultadoValidacion, controlador.obtener);
router.post('/', reglasProductoCrear, resultadoValidacion, controlador.crear);
router.put('/:id', reglasProductoActualizar, resultadoValidacion, esCreador, controlador.actualizar);
router.delete('/:id', reglaId, resultadoValidacion, esCreador, controlador.eliminar);

module.exports = router;
