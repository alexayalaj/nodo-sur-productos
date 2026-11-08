const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    descripcion: { type: String, trim: true, maxlength: 500 },
    precio: { type: Number, required: true, min: 0 },
    stock: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'El stock debe ser un entero.' }
    },
    categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', required: true },
    creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Producto', productoSchema);
