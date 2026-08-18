const nodemailer = require('nodemailer');
const dns = require('dns');
require('dotenv').config({ quiet: true });

// La red de salida de Render (al menos en el plan gratuito) no tiene ruta
// IPv6, pero Node por defecto puede resolver smtp.gmail.com a una dirección
// IPv6 primero e intentar conectarse por ahí, fallando con ENETUNREACH antes
// de siquiera probar IPv4. Forzar el orden de resolución a IPv4 primero
// evita ese intento fallido. Esto es un ajuste a nivel de proceso, no solo
// del transporte de correo, pero es inofensivo para el resto de la app.
dns.setDefaultResultOrder('ipv4first');

// Envío de correos reales (recuperación de contraseña) vía Gmail + App
// Password. Se eligió esto sobre servicios tipo Resend/SendGrid porque
// esos, en su capa gratuita sin dominio propio verificado, solo permiten
// mandar correos a la cuenta dueña de la API key — no a usuarios reales
// arbitrarios, que es justo lo que necesita este flujo. Gmail con una
// "contraseña de aplicación" (no la contraseña normal de la cuenta) no
// tiene esa restricción y sigue funcionando en 2026.
//
// Configuración necesaria en variables de entorno:
//   EMAIL_USER = una cuenta de Gmail (ej. hablandonggigua@gmail.com)
//   EMAIL_PASS = contraseña de aplicación de 16 caracteres (se genera en
//                myaccount.google.com/apppasswords, requiere verificación
//                en dos pasos activada en esa cuenta)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    // Refuerzo adicional al ajuste de DNS de arriba: obliga a la conexión
    // TCP misma a usar IPv4, por si el resolver del entorno ignorara la
    // preferencia de dns.setDefaultResultOrder.
    family: 4,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Si faltan las variables, es mejor avisar claro en el log del servidor
// que fallar de forma críptica en medio de un request de un usuario real.
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[MAILER] EMAIL_USER / EMAIL_PASS no configuradas: el envío de correos de recuperación fallará.');
}

const enviarCorreoRecuperacion = async (correoDestino, enlaceRestablecer) => {
    await transporter.sendMail({
        from: `"Hablando Nggigua" <${process.env.EMAIL_USER}>`,
        to: correoDestino,
        subject: 'Recupera tu contraseña — Hablando Nggigua',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #2b2b2b;">
                <h2 style="color: #C4622D; margin: 0 0 16px;">Hablando Nggigua</h2>
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
                <p>Si fuiste tú, haz clic en el siguiente botón. El enlace es válido durante <strong>1 hora</strong>.</p>
                <p style="text-align: center; margin: 32px 0;">
                    <a href="${enlaceRestablecer}"
                       style="background: linear-gradient(135deg, #C4622D, #E9C46A); color: white; text-decoration: none; padding: 14px 28px; border-radius: 14px; font-weight: bold; display: inline-block;">
                        Restablecer mi contraseña
                    </a>
                </p>
                <p style="font-size: 13px; color: #777;">Si tú no solicitaste esto, puedes ignorar este correo — tu contraseña no cambiará.</p>
                <p style="font-size: 13px; color: #777;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br>${enlaceRestablecer}</p>
            </div>
        `,
    });
};

module.exports = { enviarCorreoRecuperacion };
