const cuerpoTabla = document.getElementById('cuerpo-tabla');
const tablaContenedor = document.getElementById('tabla-contenedor');
const vacio = document.getElementById('vacio');
const cargando = document.getElementById('cargando');
const contador = document.getElementById('contador');
const aviso = document.getElementById('aviso');
const dialogo = document.getElementById('dialogo');
const form = document.getElementById('form-producto');
const avisoForm = document.getElementById('aviso-form');
const selFiltroCategoria = document.getElementById('f-categoria');
const selFormCategoria = document.getElementById('p-categoria');
const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const usuario = Api.obtenerUsuario();

// El panel exige sesión: sin token se vuelve al inicio de sesión.
if (!Api.obtenerToken() || !usuario) {
  window.location.href = 'index.html';
}

function mostrarAviso(texto, tipo) {
  aviso.textContent = texto;
  aviso.className = `mensaje ${tipo || ''}`;
}

function cerrarPorSesionVencida() {
  Api.limpiarSesion();
  window.location.href = 'index.html?sesion=vencida';
}

function crearElemento(etiqueta, texto, clase) {
  const el = document.createElement(etiqueta);
  if (texto !== undefined) el.textContent = texto; // textContent evita inyectar HTML
  if (clase) el.className = clase;
  return el;
}

function celda(texto, clase) {
  return crearElemento('td', texto, clase);
}

function fila(p) {
  const tr = document.createElement('tr');
  tr.dataset.id = p._id;
  tr.append(celda(p.sku), celda(p.nombre), celda(p.categoria ? p.categoria.nombre : 'N/D'));
  tr.append(celda(moneda.format(p.precio), 'num'), celda(String(p.stock), 'num'));
  const estado = crearElemento('td');
  estado.appendChild(crearElemento('span', p.activo ? 'Activo' : 'Inactivo', p.activo ? 'etiqueta' : 'etiqueta insignia-inactivo'));
  tr.appendChild(estado);
  tr.appendChild(celda(p.creadoPor ? p.creadoPor.nombre : 'N/D'));

  const acciones = crearElemento('td');
  const propio = p.creadoPor && p.creadoPor._id === usuario.id;
  if (propio) {
    const contenedor = crearElemento('div', undefined, 'acciones');
    const editar = crearElemento('button', 'Editar', 'btn-accion');
    editar.type = 'button';
    editar.setAttribute('aria-label', `Editar ${p.nombre}`);
    editar.addEventListener('click', () => abrirFormulario(p));
    const borrar = crearElemento('button', 'Eliminar', 'btn-accion peligro');
    borrar.type = 'button';
    borrar.setAttribute('aria-label', `Eliminar ${p.nombre}`);
    borrar.addEventListener('click', () => eliminar(p));
    contenedor.append(editar, borrar);
    acciones.appendChild(contenedor);
  } else {
    acciones.textContent = 'Solo lectura';
  }
  tr.appendChild(acciones);
  return tr;
}

function dibujar(productos) {
  cuerpoTabla.replaceChildren(...productos.map(fila));
  tablaContenedor.hidden = productos.length === 0;
  vacio.hidden = productos.length > 0;
  const valor = productos.reduce((suma, p) => suma + p.precio * p.stock, 0);
  contador.textContent = `${productos.length} producto(s) | Valor de inventario: ${moneda.format(valor)}`;
}

async function cargarCategorias() {
  const { cuerpo, sesionVencida } = await Api.pedir('GET', '/api/categorias');
  if (sesionVencida) return cerrarPorSesionVencida();
  if (!cuerpo.ok) { mostrarAviso(cuerpo.mensaje, 'error'); return; }
  cuerpo.datos.forEach((c) => {
    const opcion = () => { const o = document.createElement('option'); o.value = c._id; o.textContent = c.nombre; return o; };
    selFiltroCategoria.appendChild(opcion());
    selFormCategoria.appendChild(opcion());
  });
}

async function cargar() {
  cargando.hidden = false;
  const params = new URLSearchParams();
  const q = document.getElementById('f-q').value.trim();
  if (q) params.set('q', q);
  if (selFiltroCategoria.value) params.set('categoria', selFiltroCategoria.value);
  const orden = document.getElementById('f-orden').value;
  params.set('orden', orden);
  params.set('dir', orden === 'createdAt' ? 'desc' : 'asc');
  const { cuerpo, sesionVencida } = await Api.pedir('GET', `/api/productos?${params}`);
  cargando.hidden = true;
  if (sesionVencida) return cerrarPorSesionVencida();
  if (!cuerpo.ok) { mostrarAviso(cuerpo.mensaje, 'error'); return; }
  mostrarAviso('');
  dibujar(cuerpo.datos);
}

let temporizador;
document.getElementById('f-q').addEventListener('input', () => { clearTimeout(temporizador); temporizador = setTimeout(cargar, 300); });
selFiltroCategoria.addEventListener('change', cargar);
document.getElementById('f-orden').addEventListener('change', cargar);

function marcarError(idCampo, texto) {
  const campo = document.getElementById(idCampo);
  const error = document.getElementById(`err-${idCampo}`);
  campo.classList.toggle('invalido', Boolean(texto));
  campo.setAttribute('aria-invalid', texto ? 'true' : 'false');
  if (texto) { campo.setAttribute('aria-describedby', error.id); error.textContent = texto; error.hidden = false; }
  else { campo.removeAttribute('aria-describedby'); error.hidden = true; }
  return !texto;
}

function abrirFormulario(p) {
  form.reset();
  ['p-nombre', 'p-sku', 'p-categoria', 'p-precio', 'p-stock'].forEach((id) => marcarError(id, ''));
  avisoForm.textContent = '';
  document.getElementById('dialogo-titulo').textContent = p ? 'Editar producto' : 'Nuevo producto';
  document.getElementById('p-id').value = p ? p._id : '';
  if (p) {
    document.getElementById('p-nombre').value = p.nombre;
    document.getElementById('p-sku').value = p.sku;
    selFormCategoria.value = p.categoria ? p.categoria._id : '';
    document.getElementById('p-precio').value = p.precio;
    document.getElementById('p-stock').value = p.stock;
    document.getElementById('p-activo').value = String(p.activo);
    document.getElementById('p-descripcion').value = p.descripcion || '';
  }
  dialogo.showModal();
  document.getElementById('p-nombre').focus();
}

document.getElementById('btn-nuevo').addEventListener('click', () => abrirFormulario(null));
document.getElementById('btn-cancelar').addEventListener('click', () => dialogo.close());

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('p-nombre').value.trim();
  const sku = document.getElementById('p-sku').value.trim();
  const categoria = selFormCategoria.value;
  const precioTxt = document.getElementById('p-precio').value;
  const stockTxt = document.getElementById('p-stock').value;

  const v = [
    marcarError('p-nombre', nombre.length >= 2 ? '' : 'El nombre debe tener al menos 2 caracteres.'),
    marcarError('p-sku', /^[A-Za-z0-9-]{3,30}$/.test(sku) ? '' : 'El SKU admite letras, números y guiones (3 a 30 caracteres).'),
    marcarError('p-categoria', categoria ? '' : 'Selecciona una categoría.'),
    marcarError('p-precio', precioTxt !== '' && Number(precioTxt) >= 0 ? '' : 'Escribe un precio mayor o igual a 0.'),
    marcarError('p-stock', stockTxt !== '' && Number.isInteger(Number(stockTxt)) && Number(stockTxt) >= 0 ? '' : 'El stock debe ser un entero mayor o igual a 0.')
  ];
  if (v.includes(false)) return;

  const datos = {
    nombre, sku, categoria,
    precio: Number(precioTxt),
    stock: Number(stockTxt),
    activo: document.getElementById('p-activo').value === 'true',
    descripcion: document.getElementById('p-descripcion').value.trim()
  };
  const id = document.getElementById('p-id').value;
  const { cuerpo, sesionVencida } = id
    ? await Api.pedir('PUT', `/api/productos/${id}`, datos)
    : await Api.pedir('POST', '/api/productos', datos);

  if (sesionVencida) return cerrarPorSesionVencida();
  if (cuerpo.ok) {
    dialogo.close();
    mostrarAviso(cuerpo.mensaje, 'ok');
    await cargar();
    return;
  }
  const detalle = Array.isArray(cuerpo.datos) ? ` ${cuerpo.datos.map((x) => x.mensaje).join(' ')}` : '';
  avisoForm.textContent = (cuerpo.mensaje || 'No se pudo guardar el producto.') + detalle;
});

async function eliminar(p) {
  if (!window.confirm(`¿Eliminar el producto "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
  const { cuerpo, sesionVencida } = await Api.pedir('DELETE', `/api/productos/${p._id}`);
  if (sesionVencida) return cerrarPorSesionVencida();
  if (cuerpo.ok) {
    mostrarAviso(cuerpo.mensaje, 'ok');
    await cargar();
  } else {
    mostrarAviso(cuerpo.mensaje, 'error');
  }
}

// Cerrar sesión: revoca el token en el servidor y limpia el navegador.
document.getElementById('btn-salir').addEventListener('click', async () => {
  await Api.pedir('POST', '/api/auth/logout');
  Api.limpiarSesion();
  window.location.href = 'index.html';
});

document.getElementById('usuario-activo').textContent = usuario ? `Sesión: ${usuario.nombre}` : '';
cargarCategorias().then(cargar);
