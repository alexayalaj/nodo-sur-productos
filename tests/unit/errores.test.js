const HttpError = require('../../src/utils/HttpError');
const { noEncontrado, manejarErrores } = require('../../src/middleware/errores');
const { crearRes } = require('../helpers/mocks');

const manejar = (err, res = crearRes()) => {
  const next = jest.fn();
  manejarErrores(err, {}, res, next);
  return { res, next, cuerpo: res.json.mock.calls[0] && res.json.mock.calls[0][0] };
};

describe('middleware de errores', () => {
  let consola;
  beforeEach(() => { consola = jest.spyOn(console, 'error').mockImplementation(() => {}); });
  afterEach(() => { consola.mockRestore(); delete process.env.NODE_ENV; });

  test('TC-P-44: noEncontrado responde 404 con el método y la ruta', () => {
    const res = crearRes();
    noEncontrado({ method: 'GET', originalUrl: '/api/nada' }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0].mensaje).toContain('GET /api/nada');
  });

  test('TC-P-45: un HttpError conserva su código, mensaje y detalles', () => {
    const { res, cuerpo } = manejar(new HttpError(409, 'Duplicado', [{ campo: 'sku' }]));
    expect(res.status).toHaveBeenCalledWith(409);
    expect(cuerpo).toEqual({ ok: false, mensaje: 'Duplicado', datos: [{ campo: 'sku' }] });
  });

  test('TC-P-46: un CastError responde 400', () => {
    const { res } = manejar({ name: 'CastError', path: '_id' });
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('TC-P-47: un ValidationError de Mongoose responde 400 con la lista de campos', () => {
    const { res, cuerpo } = manejar({ name: 'ValidationError', errors: { precio: { path: 'precio', message: 'min' } } });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(cuerpo.datos).toEqual([{ campo: 'precio', mensaje: 'min' }]);
  });

  test('TC-P-48: un error de índice único (11000) responde 409 e indica el campo', () => {
    const { res, cuerpo } = manejar({ code: 11000, keyPattern: { sku: 1 } });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(cuerpo.mensaje).toContain('sku');
  });

  test('TC-P-49: un error 11000 sin detalle del índice usa un texto genérico', () => {
    const { cuerpo } = manejar({ code: 11000 });
    expect(cuerpo.mensaje).toContain('campo');
  });

  test('TC-P-50: un JSON mal formado responde 400', () => {
    const { res } = manejar({ type: 'entity.parse.failed' });
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('TC-P-51: un cuerpo demasiado grande responde 413', () => {
    const { res } = manejar({ type: 'entity.too.large' });
    expect(res.status).toHaveBeenCalledWith(413);
  });

  test('TC-P-52: un error inesperado responde 500 y muestra el mensaje fuera de producción', () => {
    const { res, cuerpo } = manejar(new Error('falla interna'));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(cuerpo.datos).toBe('falla interna');
  });

  test('TC-P-53: en producción el error 500 no revela detalles', () => {
    process.env.NODE_ENV = 'production';
    const { cuerpo } = manejar(new Error('falla interna'));
    expect(cuerpo.datos).toBeNull();
  });

  test('TC-P-54: si la respuesta ya se envió delega el error al manejador de Express', () => {
    const res = crearRes();
    res.headersSent = true;
    const err = new Error('tarde');
    const { next } = manejar(err, res);
    expect(next).toHaveBeenCalledWith(err);
  });
});
