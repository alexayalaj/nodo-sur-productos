jest.mock('../../src/config/db', () => ({
  conectarDB: jest.fn().mockResolvedValue(),
  estadoConexion: jest.fn().mockReturnValue('conectado')
}));
jest.mock('../../src/models/Producto');
jest.mock('../../src/models/TokenRevocado');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const Producto = require('../../src/models/Producto');
const TokenRevocado = require('../../src/models/TokenRevocado');
const app = require('../../src/app');

process.env.JWT_SECRET = 'secreto-de-prueba';
const token = jwt.sign({ id: 'u1', nombre: 'Ana' }, process.env.JWT_SECRET, { expiresIn: '5m', jwtid: 'j1' });

describe('rutas de productos', () => {
  test('GET /api/productos sin token responde 401', async () => {
    const res = await request(app).get('/api/productos');
    expect(res.status).toBe(401);
  });

  test('GET /api/productos con token responde 200', async () => {
    TokenRevocado.exists.mockResolvedValue(null);
    Producto.find.mockResolvedValue([{ nombre: 'Licencia' }]);
    const res = await request(app).get('/api/productos').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
