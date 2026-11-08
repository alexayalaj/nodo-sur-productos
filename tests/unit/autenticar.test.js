jest.mock('../../src/models/TokenRevocado');

const jwt = require('jsonwebtoken');
const TokenRevocado = require('../../src/models/TokenRevocado');
const autenticar = require('../../src/middleware/autenticar');

process.env.JWT_SECRET = 'secreto-de-prueba';

describe('autenticar', () => {
  test('con token válido llama a next y llena req.usuario', async () => {
    TokenRevocado.exists.mockResolvedValue(null);
    const token = jwt.sign({ id: 'u1', nombre: 'Ana' }, process.env.JWT_SECRET, { expiresIn: '5m', jwtid: 'j1' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const next = jest.fn();
    await autenticar(req, {}, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.usuario.id).toBe('u1');
  });

  test('sin token responde con error 401', async () => {
    const next = jest.fn();
    await autenticar({ headers: {} }, {}, next);
    expect(next.mock.calls[0][0].estado).toBe(401);
  });
});
