// Modulo de codigo que exporta un objeto con metodos para enviar emails usando la API de Mailjet
// La autenticacion es Basic Auth: base64(MAILJET_PUBLIC_KEY:MAILJET_SECRET_KEY)
// Igual que en el proyecto de clase pero adaptado a ScriptBay (ES Modules + branding propio)

const MAILJET_API_URL = 'https://api.mailjet.com/v3.1/send';

const getAuthHeader = () =>
    'Basic ' + Buffer.from(
        process.env.MAILJET_PUBLIC_KEY + ':' + process.env.MAILJET_SECRET_KEY
    ).toString('base64');

export default {

    enviarBienvenida: async (emailDestino, nombre) => {
        try {
            const body = {
                Messages: [
                    {
                        From: {
                            Email: process.env.MAILJET_EMAIL_FROM,
                            Name: 'ScriptBay'
                        },
                        To: [
                            {
                                Email: emailDestino,
                                Name: nombre
                            }
                        ],
                        Subject: '¡Bienvenido a ScriptBay!',
                        HTMLPart: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f0f0f; color: #e0e0e0; border-radius: 12px; overflow: hidden;">
                                
                                <!-- Header -->
                                <div style="background: linear-gradient(135deg, #6c63ff, #a855f7); padding: 40px 30px; text-align: center;">
                                    <h1 style="margin: 0; font-size: 32px; color: #ffffff; letter-spacing: 2px;">ScriptBay</h1>
                                    <p style="margin: 8px 0 0; color: #e0d7ff; font-size: 14px;">El marketplace para desarrolladores</p>
                                </div>

                                <!-- Body -->
                                <div style="padding: 40px 30px;">
                                    <h2 style="color: #a855f7; margin-top: 0;">¡Hola, ${nombre}!</h2>
                                    <p style="line-height: 1.7; color: #cccccc;">
                                        Gracias por registrarte en <strong style="color: #ffffff;">ScriptBay</strong>. 
                                        Ya formas parte de nuestra comunidad de desarrolladores.
                                    </p>
                                    <p style="line-height: 1.7; color: #cccccc;">
                                        En ScriptBay puedes:
                                    </p>
                                    <ul style="color: #cccccc; line-height: 2;">
                                        <li>🛒 Comprar scripts, componentes y proyectos de otros desarrolladores</li>
                                        <li>💻 Publicar y vender tus propios productos digitales</li>
                                        <li>🔗 Mostrar tu perfil profesional con tus redes y portfolio</li>
                                        <li>⛓️ Pagos registrados en la blockchain para mayor transparencia</li>
                                    </ul>

                                    <!-- CTA Button -->
                                    <div style="text-align: center; margin: 35px 0;">
                                        <a href="http://localhost:5173"
                                           style="background: linear-gradient(135deg, #6c63ff, #a855f7); color: #ffffff; text-decoration: none;
                                                  padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                                            Ir a ScriptBay
                                        </a>
                                    </div>

                                    <p style="color: #888; font-size: 13px; line-height: 1.6;">
                                        Si no has creado esta cuenta, puedes ignorar este email.
                                    </p>
                                </div>

                                <!-- Footer -->
                                <div style="background-color: #1a1a1a; padding: 20px 30px; text-align: center; border-top: 1px solid #2a2a2a;">
                                    <p style="margin: 0; color: #666; font-size: 12px;">
                                        © 2026 ScriptBay · Todos los derechos reservados
                                    </p>
                                </div>

                            </div>
                        `,
                        TextPart: `¡Bienvenido a ScriptBay, ${nombre}! Gracias por registrarte. Visita http://localhost:5173 para empezar.`
                    }
                ]
            };

            const respuesta = await fetch(MAILJET_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const datos = await respuesta.json();
            console.log('[Bienvenida] Respuesta Mailjet HTTP:', respuesta.status, JSON.stringify(datos));

            // Igual que en el proyecto de clase: comprobamos el campo Status del primer mensaje
            if (!datos.Messages || datos.Messages[0].Status !== 'success') {
                throw new Error(`Mailjet error: HTTP ${respuesta.status} | ${JSON.stringify(datos.Messages?.[0] || datos)}`);
            }

            return true;

        } catch (error) {
            console.log('ERROR en mailjetService.enviarBienvenida:', error);
            // No lanzamos el error para que un fallo en el email no bloquee el registro
            return false;
        }
    },

    // Envia la factura en PDF al comprador justo tras el pago (igual que IronPDF en el proyecto de clase)
    // pdfBuffer: Buffer generado por facturaService.generarFacturaPDF
    enviarFactura: async (emailDestino, nombre, pdfBuffer, numFactura) => {
        try {
            const body = {
                Messages: [
                    {
                        From: { Email: process.env.MAILJET_EMAIL_FROM, Name: 'ScriptBay' },
                        To: [{ Email: emailDestino, Name: nombre }],
                        Subject: `Tu factura de ScriptBay - ${numFactura}`,
                        HTMLPart: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f0f0f; color: #e0e0e0; border-radius: 12px; overflow: hidden;">
                                <div style="background: linear-gradient(135deg, #6c63ff, #a855f7); padding: 40px 30px; text-align: center;">
                                    <h1 style="margin: 0; font-size: 32px; color: #ffffff; letter-spacing: 2px;">ScriptBay</h1>
                                    <p style="margin: 8px 0 0; color: #e0d7ff; font-size: 14px;">El marketplace para desarrolladores</p>
                                </div>
                                <div style="padding: 40px 30px;">
                                    <h2 style="color: #a855f7; margin-top: 0;">¡Gracias por tu compra!</h2>
                                    <p style="line-height: 1.7; color: #cccccc;">
                                        Hola <strong style="color: #ffffff;">${nombre}</strong>,
                                    </p>
                                    <p style="line-height: 1.7; color: #cccccc;">
                                        Tu pago ha sido procesado correctamente. Adjunto encontrarás la factura <strong style="color: #ffffff;">${numFactura}</strong> en formato PDF.
                                    </p>
                                    <div style="text-align: center; margin: 35px 0;">
                                        <a href="http://localhost:5173"
                                           style="background: linear-gradient(135deg, #6c63ff, #a855f7); color: #ffffff; text-decoration: none;
                                                  padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                                            Ir a ScriptBay
                                        </a>
                                    </div>
                                    <p style="color: #888; font-size: 13px;">Conserva este email y el PDF adjunto como justificante de tu compra.</p>
                                </div>
                                <div style="background-color: #1a1a1a; padding: 20px 30px; text-align: center; border-top: 1px solid #2a2a2a;">
                                    <p style="margin: 0; color: #666; font-size: 12px;">© 2026 ScriptBay · Todos los derechos reservados</p>
                                </div>
                            </div>
                        `,
                        TextPart: `Hola ${nombre}, tu pago ha sido procesado. Adjunto tu factura ${numFactura}. Visita ScriptBay en http://localhost:5173`,
                        Attachments: [
                            {
                                ContentType: 'application/pdf',
                                Filename: `${numFactura}.pdf`,
                                Base64Content: pdfBuffer.toString('base64')
                            }
                        ]
                    }
                ]
            };

            const respuesta = await fetch(MAILJET_API_URL, {
                method: 'POST',
                headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const datos = await respuesta.json();
            console.log('[Factura] Respuesta Mailjet HTTP:', respuesta.status, JSON.stringify(datos));
            if (!datos.Messages || datos.Messages[0].Status !== 'success') {
                throw new Error(`Mailjet error: HTTP ${respuesta.status} | ${JSON.stringify(datos.Messages?.[0] || datos)}`);
            }

            console.log('[Factura] Email con PDF enviado a:', emailDestino, '| Factura:', numFactura);
            return true;

        } catch (error) {
            console.error('ERROR en mailjetService.enviarFactura:', error.message);
            throw error; // re-lanzamos para que el .catch() externo lo vea
        }
    }

};
