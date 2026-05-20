// Modulo de codigo que exporta un objeto con metodos para interactuar con la API de PayPal
// Igual que en el proyecto de clase pero en ES Modules y adaptado a ScriptBay
// Dos metodos:
//   - Stage1_createOrderPayPal  → crea la orden de pago en PayPal sandbox
//   - Stage2_captureOrderPayPal → captura el pago de una orden aprobada por el usuario

// Cache del token OAuth2 en memoria para no pedirlo en cada peticion (igual que en clase)
let cacheTokenPayPal = {
    accessToken: null,
    expiryTime: null
};

async function getPayPalAccessToken() {
    try {
        // Si no hay token o el que hay ya caducó, pedimos uno nuevo
        if (cacheTokenPayPal.accessToken === null || Date.now() >= cacheTokenPayPal.expiryTime) {
            console.log('PayPal: pidiendo nuevo token de acceso OAuth2...');

            const petToken = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(
                        process.env.PAYPAL_CLIENT_ID + ':' + process.env.PAYPAL_CLIENT_SECRET
                    ).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'grant_type=client_credentials'
            });

            if (!petToken.ok) throw new Error(`Error HTTP ${petToken.status} al obtener token de PayPal`);

            const data = await petToken.json();

            // Guardamos el token restando 5 minutos para que no caduque justo al usarlo
            cacheTokenPayPal.accessToken = data.access_token;
            cacheTokenPayPal.expiryTime = Date.now() + (data.expires_in - 5 * 60) * 1000;

            console.log('PayPal: token de acceso obtenido y cacheado en memoria');
            return data.access_token;

        } else {
            console.log('PayPal: usando token de acceso cacheado en memoria');
            return cacheTokenPayPal.accessToken;
        }

    } catch (error) {
        console.error('ERROR en getPayPalAccessToken:', error);
        throw new Error(`No se pudo obtener el token de PayPal: ${error.message}`);
    }
}

export default {

    // 1º PASO: crear la orden de pago en PayPal
    // Devuelve el objeto ORDER completo de PayPal (contiene el link de aprobacion)
    Stage1_createOrderPayPal: async (idUsuario, idProducto, titulo, precio, wallet) => {
        try {
            const accessToken = await getPayPalAccessToken();

            const walletParam = wallet ? `&wallet=${encodeURIComponent(wallet)}` : '';

            const orderPayload = {
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        custom_id: `${idUsuario}|${idProducto}`, // lo mandamos para tenerlo en la captura
                        description: `Compra en ScriptBay: ${titulo}`,
                        amount: {
                            currency_code: 'EUR',
                            value: parseFloat(precio).toFixed(2)
                        }
                    }
                ],
                application_context: {
                    brand_name: 'ScriptBay',
                    landing_page: 'NO_PREFERENCE',
                    user_action: 'PAY_NOW',
                    // PayPal redirige aqui cuando el usuario aprueba o cancela
                    // El backend captura y manda postMessage al popup (tecnica del proyecto de clase)
                    return_url: `${process.env.BACKEND_URL}/api/productos/PaypalCallback?idUsuario=${idUsuario}&idProducto=${idProducto}&titulo=${encodeURIComponent(titulo)}&precio=${precio}${walletParam}`,
                    cancel_url: `${process.env.BACKEND_URL}/api/productos/PaypalCallback?idUsuario=${idUsuario}&idProducto=${idProducto}&cancel=true`
                }
            };

            const response = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(orderPayload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`PayPal Stage1 error: ${JSON.stringify(errorData)}`);
            }

            const orderCreated = await response.json();
            console.log('PayPal Stage1 completado - Order ID:', orderCreated.id);
            return orderCreated;

        } catch (error) {
            console.error('ERROR en paypalService.Stage1_createOrderPayPal:', error);
            return null;
        }
    },

    // 2º PASO: capturar el pago de una orden aprobada por el usuario en PayPal
    // Devuelve el objeto CAPTURE de PayPal con status: 'COMPLETED' si todo ok
    Stage2_captureOrderPayPal: async (orderId) => {
        try {
            if (!orderId) throw new Error('orderId es requerido para capturar la orden');

            const accessToken = await getPayPalAccessToken();

            const response = await fetch(
                `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`PayPal Stage2 error: ${JSON.stringify(errorData)}`);
            }

            const captureData = await response.json();
            console.log('PayPal Stage2 completado - estado:', captureData.status);
            return captureData;

        } catch (error) {
            console.error('ERROR en paypalService.Stage2_captureOrderPayPal:', error);
            return null;
        }
    }

};
