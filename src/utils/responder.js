// Formato único de respuesta: { ok, mensaje, datos }.
function exito(res, estado, mensaje, datos) {
  return res.status(estado).json({ ok: true, mensaje, datos: datos === undefined ? null : datos });
}

function fallo(res, estado, mensaje, datos) {
  return res.status(estado).json({ ok: false, mensaje, datos: datos === undefined ? null : datos });
}

module.exports = { exito, fallo };
