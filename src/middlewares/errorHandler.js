// Clase para errores "esperados" (validación, 404, duplicados, etc.)
// Los controllers hacen: throw new ApiError(409, 'Correo ya registrado')
// y el mensaje llega tal cual al cliente. Cualquier otro error (uno que
// no sea ApiError) se trata como un fallo inesperado y NO se expone su
// detalle interno al cliente — solo se loguea en el servidor.
class ApiError extends Error {
    constructor(status, mensaje) {
        super(mensaje);
        this.status = status;
    }
}

// Códigos de error de PostgreSQL que sí queremos traducir a una respuesta
// clara en vez de un 500 genérico. Referencia: postgresql.org/docs/current/errcodes-appendix.html
const CODIGOS_PG = {
    '22P02': { status: 400, mensaje: 'Uno de los identificadores enviados no es válido.' }, // invalid_text_representation (ej. UUID mal formado)
    '23503': { status: 400, mensaje: 'Referencia inválida: el recurso relacionado no existe.' }, // foreign_key_violation
    '23505': { status: 409, mensaje: 'El registro ya existe.' }, // unique_violation
};

// Debe ir SIEMPRE al final de todos los app.use()/rutas en index.js.
// Express reconoce un error-handling middleware por tener 4 argumentos.
const errorHandler = (err, req, res, next) => {
    // 1) Errores que nosotros mismos lanzamos a propósito (throw new ApiError(...)).
    if (err instanceof ApiError) {
        return res.status(err.status).json({ mensaje: err.message });
    }

    // 2) Errores de PostgreSQL con un significado claro (ver CODIGOS_PG arriba).
    //    Sin esto, un UUID mal formado o una referencia inexistente terminaban
    //    como un 500 genérico en vez de un 400 explicable.
    const codigoPg = CODIGOS_PG[err.code];
    if (codigoPg) {
        return res.status(codigoPg.status).json({ mensaje: codigoPg.mensaje });
    }

    // 3) Errores que Express/body-parser ya marcan con su propio status 4xx
    //    (ej. JSON mal formado en el body). Sin esto también caían en 500.
    const statusExpress = err.statusCode || err.status;
    if (typeof statusExpress === 'number' && statusExpress >= 400 && statusExpress < 500) {
        return res.status(statusExpress).json({ mensaje: 'Solicitud inválida.' });
    }

    // 4) Cualquier otra cosa: fallo inesperado. Se loguea completo para
    //    poder debuggear, pero al cliente solo le llega un mensaje genérico
    //    — nunca el stack trace ni detalles internos.
    console.error('[ERROR NO CONTROLADO]', err);
    res.status(500).json({ mensaje: 'Ocurrió un error interno. Intenta de nuevo.' });
};

const notFoundHandler = (req, res) => {
    res.status(404).json({ mensaje: 'Ruta no encontrada' });
};

module.exports = { ApiError, errorHandler, notFoundHandler };
