require('dotenv').config({ quiet: true });
const app = require('./src/app');
const { conectarDB } = require('./src/config/db');

const faltantes = ['MONGODB_URI', 'JWT_SECRET'].filter((nombre) => !process.env[nombre]);
if (faltantes.length > 0) {
  console.error(`Faltan variables de entorno: ${faltantes.join(', ')}. Copia .env.example como .env y complétalas.`);
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

conectarDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Productos Nodo Sur escuchando en http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error(`${err.message}${err.detalles ? ` (${err.detalles})` : ''}`);
    process.exit(1);
  });
