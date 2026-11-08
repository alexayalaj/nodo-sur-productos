const express = require('express');
const controlador = require('../controllers/categoriaController');
const { reglasCategoria, resultadoValidacion } = require('../middleware/validar');

// Este router se monta detrás de autenticar (ver app.js).
const router = express.Router();

router.get('/', controlador.listar);
router.post('/', reglasCategoria, resultadoValidacion, controlador.crear);

module.exports = router;
