jest.mock('../../src/config/db', () => ({
  conectarDB: jest.fn().mockResolvedValue(),
  estadoConexion: jest.fn().mockReturnValue('conectado')
}));
jest.mock('../../src/models/Usuario');
jest.mock('../../src/models/TokenRevocado');

const request = require('supertest');
const Usuario = require('../../src/models/Usuario');
const app = require('../../src/app');

process.env.JWT_SECRET = 'secreto-de-prueba';

describe('rutas de autenticación', () => {
  test('POST /api/auth/registro responde 201', async () => {
    Usuario.findOne.mockResolvedValue(null);
    Usuario.create.mockResolvedValue({ _id: '1', nombre: 'Ana', correo: 'ana@correo.com' });
    const res = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Ana', correo: 'ana@correo.com', password: '12345678' });
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
  });

  test('POST /api/auth/login con datos incompletos responde 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});
