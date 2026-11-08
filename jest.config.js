module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/scripts/**'],
  coverageDirectory: 'coverage',
  // src/scripts/seed.js se excluye: es un script de carga manual contra una base real, no lógica de la API.
  coverageThreshold: { global: { lines: 80, functions: 80, statements: 80, branches: 70 } }
};
