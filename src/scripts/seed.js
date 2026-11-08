// Carga datos de ejemplo: un usuario, categorías y productos del catálogo de Nodo Sur.
// Uso: SEED_PASSWORD=... npm run seed   (requiere MONGODB_URI en .env)
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { conectarDB } = require('../config/db');
const Usuario = require('../models/Usuario');
const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');

const categorias = [
  { nombre: 'Licencias de software', descripcion: 'Licencias anuales para equipos de trabajo.' },
  { nombre: 'Equipo de cómputo', descripcion: 'Laptops, monitores y periféricos.' },
  { nombre: 'Servicios empaquetados', descripcion: 'Paquetes de servicio con alcance definido.' }
];

const productos = [
  { nombre: 'Licencia Suite Ofimática (anual)', sku: 'LIC-OFI-001', categoria: 'Licencias de software', precio: 2490, stock: 40 },
  { nombre: 'Licencia Antivirus Empresarial (anual)', sku: 'LIC-ANT-002', categoria: 'Licencias de software', precio: 1290, stock: 25 },
  { nombre: 'Laptop 14" 16 GB RAM', sku: 'EQ-LAP-014', categoria: 'Equipo de cómputo', precio: 18990, stock: 8 },
  { nombre: 'Monitor 27" Full HD', sku: 'EQ-MON-027', categoria: 'Equipo de cómputo', precio: 3890, stock: 15 },
  { nombre: 'Paquete de soporte mensual', sku: 'SRV-SOP-001', categoria: 'Servicios empaquetados', precio: 4500, stock: 100 },
  { nombre: 'Migración a la nube (paquete base)', sku: 'SRV-NUB-002', categoria: 'Servicios empaquetados', precio: 35000, stock: 5 }
];

async function main() {
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error('Define SEED_PASSWORD (mínimo 8 caracteres) para el usuario de ejemplo.');
  }
  await conectarDB();
  const hash = await bcrypt.hash(password, 10);
  const usuario = await Usuario.findOneAndUpdate(
    { correo: 'demo@nodosur.mx' },
    { nombre: 'Usuario Demo', correo: 'demo@nodosur.mx', password: hash },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
  const porNombre = {};
  for (const c of categorias) {
    const doc = await Categoria.findOneAndUpdate({ nombre: c.nombre }, c, { upsert: true, returnDocument: 'after' });
    porNombre[c.nombre] = doc._id;
  }
  for (const p of productos) {
    await Producto.findOneAndUpdate(
      { sku: p.sku },
      { ...p, categoria: porNombre[p.categoria], creadoPor: usuario._id },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );
  }
  console.log(`Seed listo: ${categorias.length} categorías y ${productos.length} productos. Usuario: demo@nodosur.mx`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
