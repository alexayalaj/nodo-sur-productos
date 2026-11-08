jest.mock('../../src/config/db', () => ({
  conectarDB: jest.fn(),
  estadoConexion: jest.fn()
}));

const request = require('supertest');
const { conectarDB, estadoConexion } = require('../../src/config/db');
const HttpError = require('../../src/utils/HttpError');
const app = require('../../src/app');

beforeEach(() => jest.resetAllMocks());

describe('aplicación', () => {
  test('TC-P-96: GET /api/salud responde 200 cuando la base de datos está conectada', async () => {
    conectarDB.mockResolvedValue();
    estadoConexion.mockReturnValue('conectado');
    const res = await request(app).get('/api/salud');
    expect(res.status).toBe(200);
    expect(res.body.datos.baseDeDatos).toBe('conectado');
  });

  test('TC-P-97: GET /api/salud responde 503 si no se puede conectar a la base de datos', async () => {
    conectarDB.mockRejectedValue(new HttpError(503, 'sin conexión'));
    estadoConexion.mockReturnValue('desconectado');
    const res = await request(app).get('/api/salud');
    expect(res.status).toBe(503);
    expect(res.body.ok).toBe(false);
  });

  test('TC-P-98: una ruta de la API sin conexión a la base de datos responde 503', async () => {
    conectarDB.mockRejectedValue(new HttpError(503, 'sin conexión'));
    const res = await request(app).post('/api/auth/login').send({ correo: 'a@b.com', password: 'x' });
    expect(res.status).toBe(503);
  });

  test('TC-P-99: una ruta inexistente responde 404 en JSON', async () => {
    conectarDB.mockResolvedValue();
    const res = await request(app).get('/api/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
  });

  test('TC-P-100: la página de inicio de sesión se sirve como archivo estático', async () => {
    const res = await request(app).get('/index.html');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Acceso al catálogo');
  });
});
