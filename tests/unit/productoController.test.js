jest.mock('../../src/models/Producto');
jest.mock('../../src/models/Categoria');

const Producto = require('../../src/models/Producto');
const Categoria = require('../../src/models/Categoria');
const { listar, obtener, crear, actualizar, eliminar } = require('../../src/controllers/productoController');

const crearRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('productoController', () => {
  test('listar devuelve los productos', async () => {
    Producto.find.mockResolvedValue([{ nombre: 'Licencia' }]);
    const res = crearRes();
    await listar({ query: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('obtener devuelve un producto', async () => {
    Producto.findById.mockResolvedValue({ nombre: 'Licencia' });
    const res = crearRes();
    await obtener({ params: { id: '1' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('crear devuelve 201', async () => {
    Categoria.exists.mockResolvedValue({ _id: 'c1' });
    Producto.create.mockResolvedValue({ nombre: 'Licencia' });
    const req = { body: { nombre: 'Licencia', categoria: 'c1' }, usuario: { id: 'u1' } };
    const res = crearRes();
    await crear(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('actualizar devuelve 200', async () => {
    Producto.findByIdAndUpdate.mockResolvedValue({ nombre: 'Nuevo' });
    const req = { params: { id: '1' }, body: { nombre: 'Nuevo' } };
    const res = crearRes();
    await actualizar(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('eliminar devuelve 200', async () => {
    Producto.findByIdAndDelete.mockResolvedValue({ _id: '1' });
    const res = crearRes();
    await eliminar({ params: { id: '1' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
