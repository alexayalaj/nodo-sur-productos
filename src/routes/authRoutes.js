const express = require('express');
const controlador = require('../controllers/authController');
const autenticar = require('../middleware/autenticar');
const { reglasRegistro, reglasLogin, resultadoValidacion } = require('../middleware/validar');

const router = express.Router();

router.post('/registro', reglasRegistro, resultadoValidacion, controlador.registrar);
router.post('/login', reglasLogin, resultadoValidacion, controlador.iniciarSesion);
router.post('/logout', autenticar, controlador.cerrarSesion);
router.get('/perfil', autenticar, controlador.perfil);

module.exports = router;
