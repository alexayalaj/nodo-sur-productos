jest.mock('../../src/models/Producto');
jest.mock('../../src/models/Categoria');

const Producto = require('../../src/models/Producto');
const Categoria = require('../../src/models/Categoria');
const { listar, obtener, crear, actualizar, eliminar } = require('../../src/controllers/productoController');
const { crearRes, consulta, ID_USUARIO, ID_PRODUCTO, ID_CATEGORIA } = require('../helpers/mocks');

beforeEach(() => jest.resetAllMocks());

describe('productoController', () => {
  test('TC-P-16: listar sin filtros ordena por fecha descendente y rellena categoría y creador', async () => {
    const q = consulta([{ nombre: 'Licencia' }]);
    Producto.find.mockReturnValue(q);
    const res = crearRes();
    await listar({ query: {} }, res, jest.fn());
    expect(Producto.find).toHaveBeenCalledWith({});
    expect(q.populate).toHaveBeenCalledWith('categoria', 'nombre');
    expect(q.populate).toHaveBeenCalledWith('creadoPor', 'nombre');
    expect(q.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('TC-P-17: listar aplica categoría, búsqueda escapada y orden por precio ascendente', async () => {
    const q = consulta([]);
    Producto.find.mockReturnValue(q);
    await listar({ query: { categoria: ID_CATEGORIA, q: 'a.b(', orden: 'precio', dir: 'asc' } }, crearRes(), jest.fn());
    const filtro = Producto.find.mock.calls[0][0];
    expect(filtro.categoria).toBe(ID_CATEGORIA);
    expect(filtro.$or[0].nombre.source).toBe('a\\.b\\(');
    expect(q.sort).toHaveBeenCalledWith({ precio: 1 });
  });

  test('TC-P-18: listar delega en next si la consulta falla', async () => {
    const fallo = new Error('BD');
    Producto.find.mockReturnValue(consulta(null, fallo));
    const next = jest.fn();
    await listar({ query: {} }, crearRes(), next);
    expect(next).toHaveBeenCalledWith(fallo);
  });

  test('TC-P-19: obtener devuelve el producto con 200', async () => {
    Producto.findById.mockReturnValue(consulta({ nombre: 'Licencia' }));
    const res = crearRes();
    await obtener({ params: { id: ID_PRODUCTO } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('TC-P-20: obtener un producto inexistente envía un error 404', async () => {
    Producto.findById.mockReturnValue(consulta(null));
    const next = jest.fn();
    await obtener({ params: { id: ID_PRODUCTO } }, crearRes(), next);
    expect(next.mock.calls[0][0].estado).toBe(404);
  });

  test('TC-P-21: obtener delega en next si la consulta falla', async () => {
    const fallo = new Error('BD');
    Producto.findById.mockReturnValue(consulta(null, fallo));
    const next = jest.fn();
    await obtener({ params: { id: ID_PRODUCTO } }, crearRes(), next);
    expect(next).toHaveBeenCalledWith(fallo);
  });

  test('TC-P-22: crear asigna al usuario del token como creador y responde 201', async () => {
    Categoria.exists.mockResolvedValue({ _id: ID_CATEGORIA });
    const creado = { nombre: 'Licencia', populate: jest.fn().mockResolvedValue() };
    Producto.create.mockResolvedValue(creado);
    const req = { body: { nombre: 'Licencia', categoria: ID_CATEGORIA }, usuario: { id: ID_USUARIO } };
    const res = crearRes();
    await crear(req, res, jest.fn());
    expect(Producto.create).toHaveBeenCalledWith({ nombre: 'Licencia', categoria: ID_CATEGORIA, creadoPor: ID_USUARIO });
    expect(creado.populate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('TC-P-23: crear con una categoría inexistente envía un error 400', async () => {
    Categoria.exists.mockResolvedValue(null);
    const next = jest.fn();
    await crear({ body: { categoria: ID_CATEGORIA }, usuario: { id: ID_USUARIO } }, crearRes(), next);
    expect(next.mock.calls[0][0].estado).toBe(400);
    expect(Producto.create).not.toHaveBeenCalled();
  });

  test('TC-P-24: crear delega en next si la base de datos rechaza el producto', async () => {
    Categoria.exists.mockResolvedValue({});
    const fallo = { code: 11000 };
    Producto.create.mockRejectedValue(fallo);
    const next = jest.fn();
    await crear({ body: { categoria: ID_CATEGORIA }, usuario: { id: ID_USUARIO } }, crearRes(), next);
    expect(next).toHaveBeenCalledWith(fallo);
  });

  test('TC-P-25: actualizar usa runValidators, ignora campos no editables y responde 200', async () => {
    const q = consulta({ nombre: 'Nuevo' });
    Producto.findByIdAndUpdate.mockReturnValue(q);
    const req = { params: { id: ID_PRODUCTO }, body: { nombre: 'Nuevo', creadoPor: 'intruso' } };
    const res = crearRes();
    await actualizar(req, res, jest.fn());
    expect(Producto.findByIdAndUpdate).toHaveBeenCalledWith(ID_PRODUCTO, { nombre: 'Nuevo' }, { new: true, runValidators: true });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('TC-P-26: actualizar sin ningún campo editable envía un error 400', async () => {
    const next = jest.fn();
    await actualizar({ params: { id: ID_PRODUCTO }, body: { otro: 1 } }, crearRes(), next);
    expect(next.mock.calls[0][0].estado).toBe(400);
  });

  test('TC-P-27: actualizar con una categoría inexistente envía un error 400', async () => {
    Categoria.exists.mockResolvedValue(null);
    const next = jest.fn();
    await actualizar({ params: { id: ID_PRODUCTO }, body: { categoria: ID_CATEGORIA } }, crearRes(), next);
    expect(next.mock.calls[0][0].estado).toBe(400);
  });

  test('TC-P-28: actualizar un producto que ya no existe envía un error 404', async () => {
    Producto.findByIdAndUpdate.mockReturnValue(consulta(null));
    const next = jest.fn();
    await actualizar({ params: { id: ID_PRODUCTO }, body: { nombre: 'Nuevo' } }, crearRes(), next);
    expect(next.mock.calls[0][0].estado).toBe(404);
  });

  test('TC-P-29: eliminar responde 200 con el identificador eliminado', async () => {
    Producto.findByIdAndDelete.mockResolvedValue({ _id: ID_PRODUCTO });
    const res = crearRes();
    await eliminar({ params: { id: ID_PRODUCTO } }, res, jest.fn());
    expect(res.json.mock.calls[0][0].datos).toEqual({ id: ID_PRODUCTO });
  });

  test('TC-P-30: eliminar un producto inexistente envía un error 404', async () => {
    Producto.findByIdAndDelete.mockResolvedValue(null);
    const next = jest.fn();
    await eliminar({ params: { id: ID_PRODUCTO } }, crearRes(), next);
    expect(next.mock.calls[0][0].estado).toBe(404);
  });

  test('TC-P-31: eliminar delega en next si la base de datos falla', async () => {
    const fallo = new Error('BD');
    Producto.findByIdAndDelete.mockRejectedValue(fallo);
    const next = jest.fn();
    await eliminar({ params: { id: ID_PRODUCTO } }, crearRes(), next);
    expect(next).toHaveBeenCalledWith(fallo);
  });
});
