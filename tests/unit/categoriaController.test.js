jest.mock('../../src/models/Categoria');

const Categoria = require('../../src/models/Categoria');
const { listar, crear } = require('../../src/controllers/categoriaController');
const { crearRes, consulta } = require('../helpers/mocks');

beforeEach(() => jest.resetAllMocks());

describe('categoriaController', () => {
  test('TC-P-12: listar devuelve las categorías ordenadas por nombre', async () => {
    const q = consulta([{ nombre: 'Licencias' }]);
    Categoria.find.mockReturnValue(q);
    const res = crearRes();
    await listar({}, res, jest.fn());
    expect(q.sort).toHaveBeenCalledWith('nombre');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].datos).toEqual([{ nombre: 'Licencias' }]);
  });

  test('TC-P-13: listar delega en next si la consulta falla', async () => {
    const fallo = new Error('BD');
    Categoria.find.mockReturnValue(consulta(null, fallo));
    const next = jest.fn();
    await listar({}, crearRes(), next);
    expect(next).toHaveBeenCalledWith(fallo);
  });

  test('TC-P-14: crear guarda la categoría y responde 201', async () => {
    Categoria.create.mockResolvedValue({ nombre: 'Licencias' });
    const res = crearRes();
    await crear({ body: { nombre: 'Licencias', descripcion: 'Anuales' } }, res, jest.fn());
    expect(Categoria.create).toHaveBeenCalledWith({ nombre: 'Licencias', descripcion: 'Anuales' });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('TC-P-15: crear delega en next si hay un error (por ejemplo, nombre duplicado)', async () => {
    const fallo = { code: 11000 };
    Categoria.create.mockRejectedValue(fallo);
    const next = jest.fn();
    await crear({ body: { nombre: 'Licencias' } }, crearRes(), next);
    expect(next).toHaveBeenCalledWith(fallo);
  });
});
