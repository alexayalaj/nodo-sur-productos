jest.mock('../../src/models/Categoria');

const Categoria = require('../../src/models/Categoria');
const { listar, crear } = require('../../src/controllers/categoriaController');

const crearRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('categoriaController', () => {
  test('listar devuelve las categorías', async () => {
    Categoria.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([{ nombre: 'Licencias' }]) });
    const res = crearRes();
    await listar({}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('crear devuelve 201', async () => {
    Categoria.create.mockResolvedValue({ nombre: 'Licencias' });
    const res = crearRes();
    await crear({ body: { nombre: 'Licencias' } }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
