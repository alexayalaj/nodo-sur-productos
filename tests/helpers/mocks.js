// Utilidades compartidas por las pruebas: respuesta simulada y consultas de Mongoose encadenables.
const jwt = require('jsonwebtoken');

const crearRes = () => {
  const res = { headersSent: false };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Simula una consulta de Mongoose: populate, sort y select devuelven la misma consulta
// y al hacer await resuelve con `resultado` (o rechaza con `error`).
const consulta = (resultado, error) => {
  const q = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    then: (ok, ko) => (error ? Promise.reject(error) : Promise.resolve(resultado)).then(ok, ko)
  };
  return q;
};

const SECRETO = 'secreto-de-prueba';
const ID_USUARIO = '64b000000000000000000001';
const ID_OTRO = '64b000000000000000000002';
const ID_PRODUCTO = '64b0000000000000000000a1';
const ID_CATEGORIA = '64b0000000000000000000c1';

const crearToken = (opciones = {}) =>
  jwt.sign({ id: opciones.id || ID_USUARIO, nombre: 'Ana' }, opciones.secreto || SECRETO, {
    expiresIn: opciones.expiresIn || '5m',
    jwtid: opciones.jti || 'jti-1'
  });

module.exports = { crearRes, consulta, crearToken, SECRETO, ID_USUARIO, ID_OTRO, ID_PRODUCTO, ID_CATEGORIA };
