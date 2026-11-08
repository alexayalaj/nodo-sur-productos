jest.mock('../../src/config/db', () => ({
  conectarDB: jest.fn().mockResolvedValue(),
  estadoConexion: jest.fn().mockReturnValue('conectado')
}));
jest.mock('../../src/models/Producto');
jest.mock('../../src/models/Categoria');
jest.mock('../../src/models/TokenRevocado');

const request = require('supertest');
const Producto = require('../../src/models/Producto');
const Categoria = require('../../src/models/Categoria');
const TokenRevocado = require('../../src/models/TokenRevocado');
const app = require('../../src/app');
const { consulta, crearToken, SECRETO, ID_USUARIO, ID_OTRO, ID_PRODUCTO, ID_CATEGORIA } = require('../helpers/mocks');

const productoValido = { nombre: 'Licencia Suite', sku: 'lic-001', precio: 2490, stock: 10, categoria: ID_CATEGORIA };
const auth = () => ({ Authorization: `Bearer ${crearToken()}` });

beforeEach(() => {
  jest.resetAllMocks();
  process.env.JWT_SECRET = SECRETO;
  TokenRevocado.exists.mockResolvedValue(null);
});

describe('seguridad de las rutas de productos', () => {
  test('TC-P-72: GET /api/productos sin token responde 401', async () => {
    const res = await request(app).get('/api/productos');
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  test('TC-P-73: GET /api/productos con token inválido responde 403', async () => {
    const res = await request(app).get('/api/productos').set('Authorization', 'Bearer basura');
    expect(res.status).toBe(403);
  });

  test('TC-P-74: POST, PUT y DELETE sin token también responden 401', async () => {
    const rutas = [
      request(app).post('/api/productos').send(productoValido),
      request(app).put(`/api/productos/${ID_PRODUCTO}`).send({ nombre: 'X' }),
      request(app).delete(`/api/productos/${ID_PRODUCTO}`)
    ];
    const respuestas = await Promise.all(rutas);
    expect(respuestas.map((r) => r.status)).toEqual([401, 401, 401]);
  });
});

describe('lectura de productos', () => {
  test('TC-P-75: GET /api/productos con token responde 200 con la lista', async () => {
    Producto.find.mockReturnValue(consulta([{ nombre: 'Licencia' }]));
    const res = await request(app).get('/api/productos?orden=precio&dir=asc').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.datos).toHaveLength(1);
  });

  test('TC-P-76: GET /api/productos con un orden no permitido responde 400', async () => {
    const res = await request(app).get('/api/productos?orden=password').set(auth());
    expect(res.status).toBe(400);
  });

  test('TC-P-77: GET /api/productos/:id con un identificador inválido responde 400', async () => {
    const res = await request(app).get('/api/productos/abc').set(auth());
    expect(res.status).toBe(400);
  });

  test('TC-P-78: GET /api/productos/:id existente responde 200', async () => {
    Producto.findById.mockReturnValue(consulta({ _id: ID_PRODUCTO, nombre: 'Licencia' }));
    const res = await request(app).get(`/api/productos/${ID_PRODUCTO}`).set(auth());
    expect(res.status).toBe(200);
  });

  test('TC-P-79: GET /api/productos/:id inexistente responde 404', async () => {
    Producto.findById.mockReturnValue(consulta(null));
    const res = await request(app).get(`/api/productos/${ID_PRODUCTO}`).set(auth());
    expect(res.status).toBe(404);
  });

  test('TC-P-80: un error inesperado de la base de datos responde 500 sin detalles de pila', async () => {
    const consola = jest.spyOn(console, 'error').mockImplementation(() => {});
    Producto.find.mockReturnValue(consulta(null, new Error('BD caída')));
    const res = await request(app).get('/api/productos').set(auth());
    expect(res.status).toBe(500);
    expect(res.body.ok).toBe(false);
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.js/);
    consola.mockRestore();
  });
});

describe('creación de productos', () => {
  test('TC-P-81: POST /api/productos válido responde 201', async () => {
    Categoria.exists.mockResolvedValue({ _id: ID_CATEGORIA });
    Producto.create.mockImplementation(async (d) => ({ ...d, populate: jest.fn().mockResolvedValue() }));
    const res = await request(app).post('/api/productos').set(auth()).send(productoValido);
    expect(res.status).toBe(201);
    expect(Producto.create.mock.calls[0][0]).toMatchObject({ precio: 2490, stock: 10, creadoPor: ID_USUARIO });
  });

  test('TC-P-82: POST /api/productos con precio negativo, stock decimal y categoría inválida responde 400', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set(auth())
      .send({ ...productoValido, precio: -5, stock: 1.5, categoria: 'xyz' });
    expect(res.status).toBe(400);
    expect(res.body.datos.map((e) => e.campo)).toEqual(expect.arrayContaining(['precio', 'stock', 'categoria']));
    expect(Producto.create).not.toHaveBeenCalled();
  });

  test('TC-P-83: POST /api/productos sin cuerpo responde 400 con los campos obligatorios', async () => {
    const res = await request(app).post('/api/productos').set(auth());
    expect(res.status).toBe(400);
    expect(res.body.datos.length).toBeGreaterThanOrEqual(5);
  });

  test('TC-P-84: POST /api/productos con un SKU repetido responde 409', async () => {
    Categoria.exists.mockResolvedValue({ _id: ID_CATEGORIA });
    Producto.create.mockRejectedValue({ code: 11000, keyPattern: { sku: 1 } });
    const res = await request(app).post('/api/productos').set(auth()).send(productoValido);
    expect(res.status).toBe(409);
    expect(res.body.mensaje).toContain('sku');
  });
});

describe('edición y eliminación solo por el creador', () => {
  const propio = { _id: ID_PRODUCTO, creadoPor: ID_USUARIO };
  const ajeno = { _id: ID_PRODUCTO, creadoPor: ID_OTRO };

  test('TC-P-85: PUT /api/productos/:id por el creador responde 200', async () => {
    Producto.findById.mockResolvedValue(propio);
    Producto.findByIdAndUpdate.mockReturnValue(consulta({ ...propio, nombre: 'Nuevo' }));
    const res = await request(app).put(`/api/productos/${ID_PRODUCTO}`).set(auth()).send({ nombre: 'Nuevo' });
    expect(res.status).toBe(200);
    expect(res.body.datos.nombre).toBe('Nuevo');
  });

  test('TC-P-86: PUT /api/productos/:id de otro usuario responde 403 y no modifica nada', async () => {
    Producto.findById.mockResolvedValue(ajeno);
    const res = await request(app).put(`/api/productos/${ID_PRODUCTO}`).set(auth()).send({ nombre: 'Nuevo' });
    expect(res.status).toBe(403);
    expect(Producto.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('TC-P-87: PUT /api/productos/:id inexistente responde 404', async () => {
    Producto.findById.mockResolvedValue(null);
    const res = await request(app).put(`/api/productos/${ID_PRODUCTO}`).set(auth()).send({ nombre: 'Nuevo' });
    expect(res.status).toBe(404);
  });

  test('TC-P-88: PUT /api/productos/:id con un precio inválido responde 400', async () => {
    const res = await request(app).put(`/api/productos/${ID_PRODUCTO}`).set(auth()).send({ precio: 'gratis' });
    expect(res.status).toBe(400);
  });

  test('TC-P-89: DELETE /api/productos/:id por el creador responde 200', async () => {
    Producto.findById.mockResolvedValue(propio);
    Producto.findByIdAndDelete.mockResolvedValue(propio);
    const res = await request(app).delete(`/api/productos/${ID_PRODUCTO}`).set(auth());
    expect(res.status).toBe(200);
  });

  test('TC-P-90: DELETE /api/productos/:id de otro usuario responde 403', async () => {
    Producto.findById.mockResolvedValue(ajeno);
    const res = await request(app).delete(`/api/productos/${ID_PRODUCTO}`).set(auth());
    expect(res.status).toBe(403);
    expect(Producto.findByIdAndDelete).not.toHaveBeenCalled();
  });
});
