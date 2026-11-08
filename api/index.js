// Entrada serverless de Vercel: reutiliza la misma app de Express.
require('dotenv').config({ quiet: true });
module.exports = require('../src/app');
