const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true, trim: true, maxlength: 60 },
    descripcion: { type: String, trim: true, maxlength: 200 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Categoria', categoriaSchema);
