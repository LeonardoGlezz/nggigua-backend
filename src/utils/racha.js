// Lógica de la racha de aprendizaje diaria (perfil_usuario.racha_actual).
// Separada en su propio archivo para poder probarla sin necesidad de una
// conexión real a la base de datos.

// Diferencia en días de calendario entre dos fechas, ignorando la hora
// exacta — practicar a las 11:58pm y otra vez a las 12:02am del día
// siguiente sí cuenta como "otro día".
function diferenciaDiasCalendario(fechaAnterior, fechaActual) {
    const a = Date.UTC(fechaAnterior.getUTCFullYear(), fechaAnterior.getUTCMonth(), fechaAnterior.getUTCDate());
    const b = Date.UTC(fechaActual.getUTCFullYear(), fechaActual.getUTCMonth(), fechaActual.getUTCDate());
    return Math.round((b - a) / 86400000);
}

// Reglas de la racha:
// - racha_actual === 0  → primera vez que se registra actividad real, inicia en 1.
//   (ultima_conexion no sirve de referencia aquí: se llena por defecto con la
//   fecha de registro de la cuenta, no con una práctica real).
// - Mismo día calendario que la última práctica → no cambia.
// - Exactamente un día después → sube +1.
// - Dos o más días después → se rompió la racha, reinicia en 1.
function calcularNuevaRacha(rachaActual, ultimaConexion, ahora = new Date()) {
    if (!rachaActual || rachaActual <= 0) return 1;

    const diffDias = diferenciaDiasCalendario(new Date(ultimaConexion), ahora);
    if (diffDias <= 0) return rachaActual;
    if (diffDias === 1) return rachaActual + 1;
    return 1;
}

module.exports = { calcularNuevaRacha, diferenciaDiasCalendario };
