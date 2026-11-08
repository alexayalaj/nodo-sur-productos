const jwt = require('jsonwebtoken');
const TokenRevocado = require('../models/TokenRevocado');
const HttpError = require('../utils/HttpError');

// Valida el JWT del encabezado Authorization: Bearer <token>.
// Sin token: 401. Token inválido o expirado: 403. Token cerrado con logout: 401.
async function autenticar(req, res, next) {
  try {
    const cabecera = req.headers.authorization || '';
    const [esquema, token] = cabecera.split(' ');
    if (esquema !== 'Bearer' || !token) {
      throw new HttpError(401, 'Falta el token de autenticación.');
    }
    if (!process.env.JWT_SECRET) {
      throw new HttpError(500, 'El servidor no tiene configurado JWT_SECRET.');
    }
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new HttpError(403, 'Token inválido o expirado.');
    }
    const revocado = await TokenRevocado.exists({ jti: payload.jti });
    if (revocado) {
      throw new HttpError(401, 'La sesión fue cerrada. Inicia sesión de nuevo.');
    }
    req.usuario = { id: payload.id, nombre: payload.nombre, jti: payload.jti, exp: payload.exp };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = autenticar;
