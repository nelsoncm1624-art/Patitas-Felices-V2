// Error de negocio con mensaje claro para el usuario
class CitaError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'CitaError';
    this.status = status;
  }
}
module.exports = CitaError;
