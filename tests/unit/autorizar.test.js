jest.mock('../../src/models/Producto');

const Producto = require('../../src/models/Producto');
const { esCreador } = require('../../src/middleware/autorizar');
const { ID_USUARIO, ID_OTRO, ID_PRODUCTO } = require('../helpers/mocks');

beforeEach(() => jest.resetAllMocks());

const ejecutar = async (usuarioId) => {
  const req = { params: { id: ID_PRODUCTO }, usuario: { id: usuarioId } };
  const next = jest.fn();
  await esCreador(req, {}, next);
  return { req, next, error: next.mock.calls[0][0] };
};

describe('middleware esCreador', () => {
  test('TC-P-40: el creador del producto puede continuar y el producto queda en req', async () => {
    Producto.findById.mockResolvedValue({ _id: ID_PRODUCTO, creadoPor: ID_USUARIO });
    const { req, error } = await ejecutar(ID_USUARIO);
    expect(error).toBeUndefined();
    expect(req.producto._id).toBe(ID_PRODUCTO);
  });

  test('TC-P-41: un usuario distinto del creador recibe 403', async () => {
    Producto.findById.mockResolvedValue({ _id: ID_PRODUCTO, creadoPor: ID_OTRO });
    const { error } = await ejecutar(ID_USUARIO);
    expect(error.estado).toBe(403);
  });

  test('TC-P-42: un producto inexistente recibe 404', async () => {
    Producto.findById.mockResolvedValue(null);
    const { error } = await ejecutar(ID_USUARIO);
    expect(error.estado).toBe(404);
  });

  test('TC-P-43: si la consulta falla delega el error en next', async () => {
    const fallo = new Error('BD');
    Producto.findById.mockRejectedValue(fallo);
    const { error } = await ejecutar(ID_USUARIO);
    expect(error).toBe(fallo);
  });
});
