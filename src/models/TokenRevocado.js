const mongoose = require('mongoose');

// Lista de tokens cerrados con logout. El índice TTL borra cada documento
// cuando el token habría expirado de todas formas.
const tokenRevocadoSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  expiraEn: { type: Date, required: true, index: { expireAfterSeconds: 0 } }
});

module.exports = mongoose.model('TokenRevocado', tokenRevocadoSchema);
