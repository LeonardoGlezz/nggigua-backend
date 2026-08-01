// Envuelve un controller async para no repetir try/catch en cada uno.
// Si el controller revienta (DB caída, error inesperado, etc.), el error
// se pasa a next(err) y lo atrapa el errorHandler global en vez de tumbar
// el proceso o devolver un stack trace crudo al cliente.
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
