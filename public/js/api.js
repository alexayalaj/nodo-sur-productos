// Capa de acceso a la API: rutas relativas, token en localStorage y manejo de sesión vencida.
const Api = (() => {
  const CLAVE_TOKEN = 'nodosur_productos_token';
  const CLAVE_USUARIO = 'nodosur_productos_usuario';

  const obtenerToken = () => localStorage.getItem(CLAVE_TOKEN);
  const obtenerUsuario = () => {
    try { return JSON.parse(localStorage.getItem(CLAVE_USUARIO)); } catch (e) { return null; }
  };
  function guardarSesion(token, usuario) {
    localStorage.setItem(CLAVE_TOKEN, token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
  }
  function limpiarSesion() {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
  }

  // Devuelve { estado, cuerpo } con el token en el encabezado Authorization.
  // Ante 401 con token (sesión cerrada) o 403 de autenticación se limpia la sesión.
  async function pedir(metodo, ruta, datos) {
    const headers = {};
    if (datos !== undefined) headers['Content-Type'] = 'application/json';
    const token = obtenerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    let respuesta;
    try {
      respuesta = await fetch(ruta, { method: metodo, headers, body: datos !== undefined ? JSON.stringify(datos) : undefined });
    } catch (e) {
      return { estado: 0, cuerpo: { ok: false, mensaje: 'No se pudo conectar con el servidor.' } };
    }
    let cuerpo;
    try { cuerpo = await respuesta.json(); } catch (e) { cuerpo = { ok: false, mensaje: 'Respuesta no válida del servidor.' }; }
    const sesionVencida = token && (respuesta.status === 401 || (respuesta.status === 403 && /token/i.test(cuerpo.mensaje || '')));
    return { estado: respuesta.status, cuerpo, sesionVencida: Boolean(sesionVencida) };
  }

  return { obtenerToken, obtenerUsuario, guardarSesion, limpiarSesion, pedir };
})();
