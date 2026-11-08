jest.mock('../../src/config/db', () => ({
  conectarDB: jest.fn().mockResolvedValue(),
  estadoConexion: jest.fn().mockReturnValue('conectado')
}));
jest.mock('../../src/models/Usuario');
jest.mock('../../src/models/TokenRevocado');

const request = require('supertest');
const bcrypt = require('bcryptjs');
const Usuario = require('../../src/models/Usuario');
const TokenRevocado = require('../../src/models/TokenRevocado');
const { conectarDB, estadoConexion } = require('../../src/config/db');
const app = require('../../src/app');
const { consulta, crearToken, SECRETO, ID_USUARIO } = require('../helpers/mocks');

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = SECRETO;
  conectarDB.mockResolvedValue();
  estadoConexion.mockReturnValue('conectado');
  TokenRevocado.exists.mockResolvedValue(null);
});

const registroValido = { nombre: 'Ana', correo: 'Ana@Correo.com', password: '12345678' };

describe('rutas de autenticación', () => {
  test('TC-P-60: POST /api/auth/registro responde 201 con token y correo normalizado', async () => {
    Usuario.findOne.mockResolvedValue(null);
    Usuario.create.mockImplementation(async (d) => ({ _id: ID_USUARIO, ...d }));
    const res = await request(app).post('/api/auth/registro').send(registroValido);
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.datos.token).toEqual(expect.any(String));
    expect(Usuario.create.mock.calls[0][0].correo).toBe('ana@correo.com');
    expect(Usuario.create.mock.calls[0][0].password).not.toBe('12345678');
  });

  test('TC-P-61: POST /api/auth/registro con datos inválidos responde 400 y lista los campos', async () => {
    const res = await request(app).post('/api/auth/registro').send({ nombre: 'A', correo: 'no-es-correo', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.datos.map((e) => e.campo)).toEqual(expect.arrayContaining(['nombre', 'correo', 'password']));
  });

  test('TC-P-62: POST /api/auth/registro con un correo existente responde 409', async () => {
    Usuario.findOne.mockResolvedValue({ _id: ID_USUARIO });
    const res = await request(app).post('/api/auth/registro').send(registroValido);
    expect(res.status).toBe(409);
  });

  test('TC-P-63: POST /api/auth/login correcto responde 200 con token', async () => {
    const hash = await bcrypt.hash('12345678', 4);
    Usuario.findOne.mockReturnValue(consulta({ _id: ID_USUARIO, nombre: 'Ana', correo: 'ana@correo.com', password: hash }));
    const res = await request(app).post('/api/auth/login').send({ correo: 'ana@correo.com', password: '12345678' });
    expect(res.status).toBe(200);
    expect(res.body.datos.token).toEqual(expect.any(String));
  });

  test('TC-P-64: POST /api/auth/login con contraseña incorrecta responde 401', async () => {
    const hash = await bcrypt.hash('12345678', 4);
    Usuario.findOne.mockReturnValue(consulta({ _id: ID_USUARIO, nombre: 'Ana', password: hash }));
    const res = await request(app).post('/api/auth/login').send({ correo: 'ana@correo.com', password: 'incorrecta' });
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  test('TC-P-65: POST /api/auth/login sin datos responde 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  test('TC-P-66: POST /api/auth/login con JSON mal formado responde 400', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"correo": ');
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toMatch(/JSON/);
  });

  test('TC-P-67: POST /api/auth/logout con token válido revoca el token y responde 200', async () => {
    TokenRevocado.create.mockResolvedValue({});
    const res = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${crearToken()}`);
    expect(res.status).toBe(200);
    expect(TokenRevocado.create).toHaveBeenCalledWith(expect.objectContaining({ jti: 'jti-1' }));
  });

  test('TC-P-68: POST /api/auth/logout sin token responde 401', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });

  test('TC-P-69: GET /api/auth/perfil con token responde 200', async () => {
    Usuario.findById.mockResolvedValue({ _id: ID_USUARIO, nombre: 'Ana', correo: 'ana@correo.com' });
    const res = await request(app).get('/api/auth/perfil').set('Authorization', `Bearer ${crearToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.datos.nombre).toBe('Ana');
  });

  test('TC-P-70: un token revocado ya no sirve y responde 401', async () => {
    TokenRevocado.exists.mockResolvedValue({ _id: 'x' });
    const res = await request(app).get('/api/auth/perfil').set('Authorization', `Bearer ${crearToken()}`);
    expect(res.status).toBe(401);
  });

  test('TC-P-71: un token con firma incorrecta responde 403', async () => {
    const res = await request(app).get('/api/auth/perfil').set('Authorization', `Bearer ${crearToken({ secreto: 'otro' })}`);
    expect(res.status).toBe(403);
  });
});
