jest.mock('../../src/models/Usuario');
jest.mock('../../src/models/TokenRevocado');
jest.mock('bcryptjs');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../../src/models/Usuario');
const TokenRevocado = require('../../src/models/TokenRevocado');
const { registrar, iniciarSesion, cerrarSesion, perfil } = require('../../src/controllers/authController');
const { crearRes, consulta, SECRETO } = require('../helpers/mocks');

const usuarioBD = { _id: '1', nombre: 'Ana', correo: 'ana@correo.com', password: 'hash' };

beforeEach(() => {
  jest.resetAllMocks();
  process.env.JWT_SECRET = SECRETO;
});

describe('authController', () => {
  test('TC-P-01: registrar guarda la contraseña cifrada y responde 201 sin exponerla', async () => {
    Usuario.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hash');
    Usuario.create.mockResolvedValue(usuarioBD);
    const req = { body: { nombre: 'Ana', correo: 'ana@correo.com', password: '12345678' } };
    const res = crearRes();
    await registrar(req, res, jest.fn());
    expect(bcrypt.hash).toHaveBeenCalledWith('12345678', 10);
    expect(Usuario.create).toHaveBeenCalledWith({ nombre: 'Ana', correo: 'ana@correo.com', password: 'hash' });
    expect(res.status).toHaveBeenCalledWith(201);
    const cuerpo = res.json.mock.calls[0][0];
    expect(cuerpo.datos.usuario).not.toHaveProperty('password');
    expect(jwt.verify(cuerpo.datos.token, SECRETO).id).toBe('1');
  });

  test('TC-P-02: registrar con correo repetido envía un error 409', async () => {
    Usuario.findOne.mockResolvedValue(usuarioBD);
    const next = jest.fn();
    await registrar({ body: { nombre: 'Ana', correo: 'ana@correo.com', password: '12345678' } }, crearRes(), next);
    expect(next.mock.calls[0][0].estado).toBe(409);
    expect(Usuario.create).not.toHaveBeenCalled();
  });

  test('TC-P-03: registrar delega en next cuando falla la base de datos', async () => {
    const fallo = new Error('BD caída');
    Usuario.findOne.mockRejectedValue(fallo);
    const next = jest.fn();
    await registrar({ body: {} }, crearRes(), next);
    expect(next).toHaveBeenCalledWith(fallo);
  });

  test('TC-P-04: registrar sin JWT_SECRET configurado envía un error 500', async () => {
    delete process.env.JWT_SECRET;
    Usuario.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hash');
    Usuario.create.mockResolvedValue(usuarioBD);
    const next = jest.fn();
    await registrar({ body: { nombre: 'Ana', correo: 'ana@correo.com', password: '12345678' } }, crearRes(), next);
    expect(next.mock.calls[0][0].estado).toBe(500);
  });

  test('TC-P-05: iniciarSesion con credenciales correctas responde 200 con un token válido', async () => {
    Usuario.findOne.mockReturnValue(consulta(usuarioBD));
    bcrypt.compare.mockResolvedValue(true);
    const res = crearRes();
    await iniciarSesion({ body: { correo: 'ana@correo.com', password: '12345678' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    const { token } = res.json.mock.calls[0][0].datos;
    expect(jwt.verify(token, SECRETO).nombre).toBe('Ana');
  });

  test('TC-P-06: iniciarSesion con usuario inexistente responde 401 genérico', async () => {
    Usuario.findOne.mockReturnValue(consulta(null));
    const next = jest.fn();
    await iniciarSesion({ body: { correo: 'x@correo.com', password: '12345678' } }, crearRes(), next);
    expect(next.mock.calls[0][0].estado).toBe(401);
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  test('TC-P-07: iniciarSesion con contraseña incorrecta responde 401 con el mismo mensaje', async () => {
    Usuario.findOne.mockReturnValue(consulta(usuarioBD));
    bcrypt.compare.mockResolvedValue(false);
    const next = jest.fn();
    await iniciarSesion({ body: { correo: 'ana@correo.com', password: 'mala' } }, crearRes(), next);
    expect(next.mock.calls[0][0].estado).toBe(401);
    expect(next.mock.calls[0][0].message).toBe('Correo o contraseña incorrectos.');
  });

  test('TC-P-08: cerrarSesion guarda el jti con la fecha de expiración del token', async () => {
    TokenRevocado.create.mockResolvedValue({});
    const res = crearRes();
    await cerrarSesion({ usuario: { id: '1', jti: 'abc', exp: 1900000000 } }, res, jest.fn());
    expect(TokenRevocado.create).toHaveBeenCalledWith({ jti: 'abc', usuario: '1', expiraEn: new Date(1900000000 * 1000) });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('TC-P-09: cerrarSesion delega en next si no se puede revocar', async () => {
    const fallo = new Error('duplicado');
    TokenRevocado.create.mockRejectedValue(fallo);
    const next = jest.fn();
    await cerrarSesion({ usuario: { id: '1', jti: 'abc', exp: 1900000000 } }, crearRes(), next);
    expect(next).toHaveBeenCalledWith(fallo);
  });

  test('TC-P-10: perfil devuelve los datos públicos del usuario', async () => {
    Usuario.findById.mockResolvedValue(usuarioBD);
    const res = crearRes();
    await perfil({ usuario: { id: '1' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].datos).toEqual({ id: '1', nombre: 'Ana', correo: 'ana@correo.com' });
  });

  test('TC-P-11: perfil de un usuario eliminado responde 404', async () => {
    Usuario.findById.mockResolvedValue(null);
    const next = jest.fn();
    await perfil({ usuario: { id: '1' } }, crearRes(), next);
    expect(next.mock.calls[0][0].estado).toBe(404);
  });
});
