jest.mock('../../src/config/db', () => ({
  conectarDB: jest.fn().mockResolvedValue(),
  estadoConexion: jest.fn().mockReturnValue('conectado')
}));
jest.mock('../../src/models/Categoria');
jest.mock('../../src/models/TokenRevocado');

const request = require('supertest');
const Categoria = require('../../src/models/Categoria');
const TokenRevocado = require('../../src/models/TokenRevocado');
const app = require('../../src/app');
const { consulta, crearToken, SECRETO } = require('../helpers/mocks');

const auth = () => ({ Authorization: `Bearer ${crearToken()}` });

beforeEach(() => {
  jest.resetAllMocks();
  process.env.JWT_SECRET = SECRETO;
  TokenRevocado.exists.mockResolvedValue(null);
});

describe('rutas de categorías', () => {
  test('TC-P-91: GET /api/categorias sin token responde 401', async () => {
    const res = await request(app).get('/api/categorias');
    expect(res.status).toBe(401);
  });

  test('TC-P-92: GET /api/categorias con token responde 200', async () => {
    Categoria.find.mockReturnValue(consulta([{ nombre: 'Licencias' }]));
    const res = await request(app).get('/api/categorias').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.datos).toHaveLength(1);
  });

  test('TC-P-93: POST /api/categorias válido responde 201', async () => {
    Categoria.create.mockResolvedValue({ nombre: 'Licencias' });
    const res = await request(app).post('/api/categorias').set(auth()).send({ nombre: 'Licencias' });
    expect(res.status).toBe(201);
  });

  test('TC-P-94: POST /api/categorias con nombre vacío responde 400', async () => {
    const res = await request(app).post('/api/categorias').set(auth()).send({ nombre: '' });
    expect(res.status).toBe(400);
  });

  test('TC-P-95: POST /api/categorias con nombre repetido responde 409', async () => {
    Categoria.create.mockRejectedValue({ code: 11000, keyPattern: { nombre: 1 } });
    const res = await request(app).post('/api/categorias').set(auth()).send({ nombre: 'Licencias' });
    expect(res.status).toBe(409);
  });
});
