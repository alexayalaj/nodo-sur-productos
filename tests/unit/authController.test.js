jest.mock('../../src/models/Usuario');
jest.mock('../../src/models/TokenRevocado');
jest.mock('bcryptjs');

const bcrypt = require('bcryptjs');
const Usuario = require('../../src/models/Usuario');
const TokenRevocado = require('../../src/models/TokenRevocado');
const { registrar, iniciarSesion, cerrarSesion, perfil } = require('../../src/controllers/authController');

process.env.JWT_SECRET = 'secreto-de-prueba';

const crearRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authController', () => {
  test('registrar crea un usuario y devuelve 201', async () => {
    Usuario.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hash');
    Usuario.create.mockResolvedValue({ _id: '1', nombre: 'Ana', correo: 'ana@correo.com' });
    const req = { body: { nombre: 'Ana', correo: 'ana@correo.com', password: '12345678' } };
    const res = crearRes();
    await registrar(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('iniciarSesion devuelve 200 con credenciales correctas', async () => {
    Usuario.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: '1', nombre: 'Ana', correo: 'ana@correo.com', password: 'hash' }) });
    bcrypt.compare.mockResolvedValue(true);
    const req = { body: { correo: 'ana@correo.com', password: '12345678' } };
    const res = crearRes();
    await iniciarSesion(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('cerrarSesion revoca el token', async () => {
    TokenRevocado.create.mockResolvedValue({});
    const req = { usuario: { id: '1', jti: 'abc', exp: 1900000000 } };
    const res = crearRes();
    await cerrarSesion(req, res, jest.fn());
    expect(TokenRevocado.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('perfil devuelve el usuario', async () => {
    Usuario.findById.mockResolvedValue({ _id: '1', nombre: 'Ana', correo: 'ana@correo.com' });
    const res = crearRes();
    await perfil({ usuario: { id: '1' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
