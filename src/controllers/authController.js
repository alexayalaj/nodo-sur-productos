const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const TokenRevocado = require('../models/TokenRevocado');
const HttpError = require('../utils/HttpError');
const { exito } = require('../utils/responder');

function firmarToken(usuario) {
  if (!process.env.JWT_SECRET) {
    throw new HttpError(500, 'El servidor no tiene configurado JWT_SECRET.');
  }
  return jwt.sign({ id: String(usuario._id), nombre: usuario.nombre }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30m',
    jwtid: crypto.randomUUID()
  });
}

const datosPublicos = (u) => ({ id: u._id, nombre: u.nombre, correo: u.correo });

async function registrar(req, res, next) {
  try {
    const { nombre, correo, password } = req.body;
    if (await Usuario.findOne({ correo })) {
      throw new HttpError(409, 'Ya existe una cuenta con ese correo.');
    }
    const hash = await bcrypt.hash(password, 10);
    const usuario = await Usuario.create({ nombre, correo, password: hash });
    return exito(res, 201, 'Cuenta creada correctamente.', {
      token: firmarToken(usuario),
      usuario: datosPublicos(usuario)
    });
  } catch (err) {
    return next(err);
  }
}

async function iniciarSesion(req, res, next) {
  try {
    const { correo, password } = req.body;
    const usuario = await Usuario.findOne({ correo }).select('+password');
    const valido = usuario ? await bcrypt.compare(password, usuario.password) : false;
    if (!valido) {
      throw new HttpError(401, 'Correo o contraseña incorrectos.');
    }
    return exito(res, 200, 'Inicio de sesión correcto.', {
      token: firmarToken(usuario),
      usuario: datosPublicos(usuario)
    });
  } catch (err) {
    return next(err);
  }
}

// Revoca el token actual guardando su jti hasta la fecha en que expira.
async function cerrarSesion(req, res, next) {
  try {
    await TokenRevocado.create({
      jti: req.usuario.jti,
      usuario: req.usuario.id,
      expiraEn: new Date(req.usuario.exp * 1000)
    });
    return exito(res, 200, 'Sesión cerrada correctamente.');
  } catch (err) {
    return next(err);
  }
}

async function perfil(req, res, next) {
  try {
    const usuario = await Usuario.findById(req.usuario.id);
    if (!usuario) {
      throw new HttpError(404, 'Usuario no encontrado.');
    }
    return exito(res, 200, 'Perfil obtenido.', datosPublicos(usuario));
  } catch (err) {
    return next(err);
  }
}

module.exports = { registrar, iniciarSesion, cerrarSesion, perfil };
