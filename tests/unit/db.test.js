jest.mock('mongoose', () => ({ connect: jest.fn(), connection: { readyState: 0 } }));

const mongoose = require('mongoose');
const { conectarDB, estadoConexion } = require('../../src/config/db');

beforeEach(() => {
  jest.resetAllMocks();
  mongoose.connection.readyState = 0;
  delete global.__nodoSurMongo;
  delete process.env.MONGODB_URI;
});

describe('config/db', () => {
  test('TC-P-55: sin MONGODB_URI rechaza con un error 503 claro', async () => {
    await expect(conectarDB()).rejects.toMatchObject({ estado: 503, message: expect.stringContaining('MONGODB_URI') });
  });

  test('TC-P-56: si ya hay conexión abierta no vuelve a conectar', async () => {
    mongoose.connection.readyState = 1;
    await conectarDB('mongodb://x');
    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  test('TC-P-57: reutiliza la misma promesa de conexión entre invocaciones', async () => {
    mongoose.connect.mockResolvedValue(mongoose);
    await Promise.all([conectarDB('mongodb://x'), conectarDB('mongodb://x')]);
    expect(mongoose.connect).toHaveBeenCalledTimes(1);
    expect(mongoose.connect.mock.calls[0][1]).toMatchObject({ serverSelectionTimeoutMS: 8000 });
  });

  test('TC-P-58: si la conexión falla informa de la IP de Atlas y permite reintentar', async () => {
    mongoose.connect.mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce(mongoose);
    await expect(conectarDB('mongodb://x')).rejects.toMatchObject({ estado: 503, message: expect.stringContaining('IP') });
    await conectarDB('mongodb://x');
    expect(mongoose.connect).toHaveBeenCalledTimes(2);
  });

  test('TC-P-59: estadoConexion traduce el estado de Mongoose', () => {
    mongoose.connection.readyState = 1;
    expect(estadoConexion()).toBe('conectado');
    mongoose.connection.readyState = 9;
    expect(estadoConexion()).toBe('desconocido');
  });
});
