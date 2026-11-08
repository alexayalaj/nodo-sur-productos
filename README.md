# Productos Nodo Sur

Catálogo interno de productos (licencias, equipo y servicios empaquetados) de la empresa ficticia
Nodo Sur Soluciones Digitales S.A. de C.V. Es una aplicación web con API REST en Node.js y Express,
datos en MongoDB Atlas, autenticación con JWT, pruebas con Jest y despliegue en Vercel con GitHub Actions.
Corresponde a la Actividad 4 de Desarrollo Full-Stack (Universidad Tecmilenio).

- Repositorio: https://github.com/alexayalaj/nodo-sur-productos
- Aplicación: [URL de la aplicación en Vercel: pegar aquí]

## Requisitos

- Node.js 20 o superior y npm.
- Una base de datos MongoDB (clúster en MongoDB Atlas o instancia local).

## Instalación

```bash
git clone https://github.com/alexayalaj/nodo-sur-productos.git
cd nodo-sur-productos
npm install
cp .env.example .env   # y completa los valores
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `MONGODB_URI` | Cadena de conexión de MongoDB, con el nombre de la base (`nodo_sur_productos`). |
| `JWT_SECRET` | Clave para firmar los tokens (cadena larga y aleatoria). |
| `JWT_EXPIRES_IN` | Vigencia del token (por defecto `30m`). |
| `PORT` | Puerto local (por defecto `3000`). |
| `SEED_PASSWORD` | Solo para `npm run seed`: contraseña del usuario de ejemplo. |

El archivo `.env` está en `.gitignore`; nunca se sube al repositorio.

## Ejecución local

```bash
npm run seed    # opcional: carga categorías, productos y el usuario demo@nodosur.mx
npm start       # http://localhost:3000   (npm run dev recarga al cambiar archivos)
```

Abre `http://localhost:3000` para iniciar sesión o crear una cuenta; el panel está en `/productos.html`.

## Pruebas

```bash
npm test        # Jest + supertest, con informe de cobertura
```

Las pruebas usan mocks de los modelos de Mongoose, por lo que no necesitan base de datos. Las pruebas
iniciales (controladores, middleware y rutas) se generaron con Claude Code a partir del código existente;
después se revisaron y ajustaron a mano. Los cambios quedan en el historial de git, en dos confirmaciones
consecutivas: «Agrega pruebas iniciales de controladores, middleware y rutas» y «Ajusta y amplía las
pruebas: mocks encadenables, casos de error y umbral de cobertura». El umbral de cobertura (80 % de líneas,
funciones y sentencias; 70 % de ramas) está en `jest.config.js`. Cada caso lleva un identificador `TC-P-NN`.

## Endpoints

Todas las respuestas tienen la forma `{ ok, mensaje, datos }`. Las rutas protegidas exigen el encabezado
`Authorization: Bearer <token>`.

| Método y ruta | Acceso | Éxito | Errores |
|---|---|---|---|
| POST `/api/auth/registro` | público | 201 + token | 400, 409 |
| POST `/api/auth/login` | público | 200 + token | 400, 401 |
| POST `/api/auth/logout` | token | 200 | 401, 403 |
| GET `/api/auth/perfil` | token | 200 | 401, 403 |
| GET `/api/categorias` · POST `/api/categorias` | token | 200 · 201 | 400, 401, 403, 409 |
| GET `/api/productos` (`?categoria`, `?q`, `?orden`, `?dir`) · GET `/api/productos/:id` | token | 200 | 400, 401, 403, 404 |
| POST `/api/productos` | token | 201 | 400, 401, 403, 409 |
| PUT `/api/productos/:id` · DELETE `/api/productos/:id` | token y ser el creador | 200 | 400, 401, 403, 404 |
| GET `/api/salud` | público | 200 | 503 |

Ejemplo:

```bash
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" \
  -d '{"correo":"demo@nodosur.mx","password":"<SEED_PASSWORD>"}'
```

## Despliegue en Vercel

1. En MongoDB Atlas crea la base `nodo_sur_productos`, un usuario de base de datos propio y permite el acceso
   de red (Network Access) con `0.0.0.0/0`, porque Vercel usa IPs variables.
2. Importa el repositorio en Vercel (proyecto sin framework). `vercel.json` reenvía `/api/*` a `api/index.js`
   y Vercel sirve `public/` como contenido estático.
3. En Settings > Environment Variables define `MONGODB_URI`, `JWT_SECRET` y `JWT_EXPIRES_IN`.

## Pipeline de CI/CD

`.github/workflows/ci.yml` se ejecuta en cada push y pull request a `main`:

1. Job `test`: instala con `npm ci` y ejecuta `npm test` en Node 20.
2. Job `deploy` (solo en push a `main` y solo si `test` pasó): `vercel pull`, `vercel build --prod` y
   `vercel deploy --prebuilt --prod`.

Secretos del repositorio necesarios (Settings > Secrets and variables > Actions): `VERCEL_TOKEN`,
`VERCEL_ORG_ID` y `VERCEL_PROJECT_ID`.

## Estructura

```
api/index.js          entrada serverless de Vercel
server.js             arranque local
src/app.js            Express, middleware y routers
src/config/db.js      conexión reutilizable a MongoDB
src/models/           Usuario, Categoria, Producto, TokenRevocado
src/controllers/      authController, categoriaController, productoController
src/routes/           rutas por recurso
src/middleware/       autenticar, autorizar, validar, errores
src/scripts/seed.js   datos de ejemplo
public/               vistas estáticas (login y panel), CSS y JS
tests/                pruebas unitarias y de rutas
```
