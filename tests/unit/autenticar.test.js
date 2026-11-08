jest.mock('../../src/models/TokenRevocado');

const TokenRevocado = require('../../src/models/TokenRevocado');
const autenticar = require('../../src/middleware/autenticar');
const { crearToken, SECRETO, ID_USUARIO } = require('../helpers/mocks');

beforeEach(() => {
  jest.resetAllMocks();
  process.env.JWT_SECRET = SECRETO;
  TokenRevocado.exists.mockResolvedValue(null);
});

const ejecutar = async (cabecera) => {
  const req = { headers: cabecera ? { authorization: cabecera } : {} };
  const next = jest.fn();
  await autenticar(req, {}, next);
  return { req, next, error: next.mock.calls[0][0] };
};

describe('middleware autenticar', () => {
  test('TC-P-32: un token válido llama a next y llena req.usuario', async () => {
    const { req, error } = await ejecutar(`Bearer ${crearToken()}`);
    expect(error).toBeUndefined();
    expect(req.usuario).toMatchObject({ id: ID_USUARIO, nombre: 'Ana', jti: 'jti-1' });
  });

  test('TC-P-33: sin encabezado Authorization responde 401', async () => {
    const { error } = await ejecutar();
    expect(error.estado).toBe(401);
  });

  test('TC-P-34: un esquema distinto de Bearer responde 401', async () => {
    const { error } = await ejecutar(`Basic ${crearToken()}`);
    expect(error.estado).toBe(401);
  });

  test('TC-P-35: un token con firma incorrecta responde 403', async () => {
    const { error } = await ejecutar(`Bearer ${crearToken({ secreto: 'otro' })}`);
    expect(error.estado).toBe(403);
  });

  test('TC-P-36: un token expirado responde 403', async () => {
    const { error } = await ejecutar(`Bearer ${crearToken({ expiresIn: '-10s' })}`);
    expect(error.estado).toBe(403);
  });

  test('TC-P-37: un token revocado con logout responde 401', async () => {
    TokenRevocado.exists.mockResolvedValue({ _id: 'x' });
    const { error } = await ejecutar(`Bearer ${crearToken()}`);
    expect(error.estado).toBe(401);
    expect(error.message).toMatch(/sesión fue cerrada/);
  });

  test('TC-P-38: sin JWT_SECRET en el servidor responde 500', async () => {
    delete process.env.JWT_SECRET;
    const { error } = await ejecutar('Bearer abc');
    expect(error.estado).toBe(500);
  });

  test('TC-P-39: si falla la consulta de tokens revocados delega el error en next', async () => {
    const fallo = new Error('BD');
    TokenRevocado.exists.mockRejectedValue(fallo);
    const { error } = await ejecutar(`Bearer ${crearToken()}`);
    expect(error).toBe(fallo);
  });
});
