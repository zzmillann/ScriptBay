//modulo de codigo que exporta un objeto con metodos para realizar el pago con tarjeta de credito
//usando la API de la plataforma Stripe
//son 3 pasos:
// - 1º paso) crear un cliente dentro de la plataforma de Stripe: objeto CUSTOMER
// - 2º paso) crear un metodo de pago (tarjeta de credito) y asociarlo al cliente del 1º paso
// - 3º paso) crear un cargo asociado al cliente CUSTOMER y al metodo de pago CARD del 1º y 2º paso
//!!!! IMPORTANTE !!!! en el body de las peticiones HTTP que se hagan a este servicio stripeService.js
// no se pueden mandar datos en formato JSON, sino que se tienen que mandar en formato x-www-form-urlencoded
// hay que mandar cabecera de Authorization con Bearer + API KEY de Stripe
// Authorization: Bearer ......

const BASE_URL_STRIPE = "https://api.stripe.com/v1";

export default {
    Stage1_CreateCustomer: async (nombre, email) => {
        try {
            const datosCliente = {
                name: nombre,
                email
            }

            const petCrearCustomer = await fetch(`${BASE_URL_STRIPE}/customers`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.STRIPE_API_KEY}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams(datosCliente)
            });

            if (petCrearCustomer.status < 200 || petCrearCustomer.status >= 299) throw new Error(`Error en creacion de CUSTOMER en Stripe. Codigo HTTP: ${petCrearCustomer.status}`);

            const datosCustomerStripe = await petCrearCustomer.json();
            console.log("Datos del CUSTOMER creado en Stripe: ", datosCustomerStripe);

            return datosCustomerStripe.id;

        } catch (error) {
            console.log("ERROR en stripeService Stage1_CreateCustomer: ", error);
            return null;
        }
    },
    Stage2_CreateCardForCustomer: async (idCustomer) => {
        try {
            const datosTarjetaStripe = {
                'source': 'tok_visa' //<----- token de prueba en modo desarrollador de Stripe para simular tarjeta Visa
                //en real (produccion) los datos de la tarjeta se pasan a stripe asi:
                // 'source[number]': datosTarjeta.numero,
                // 'source[exp_month]': datosTarjeta.mesExpiracion,
                // 'source[exp_year]': datosTarjeta.anioExpiracion,
                // 'source[cvc]': datosTarjeta.cvc
            }

            const petCreateCard = await fetch(`${BASE_URL_STRIPE}/customers/${idCustomer}/sources`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.STRIPE_API_KEY}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams(datosTarjetaStripe)
            });

            if (petCreateCard.status < 200 || petCreateCard.status >= 299) throw new Error(`Error en creacion de CARD en Stripe. Codigo HTTP: ${petCreateCard.status}`);

            const datosCardStripe = await petCreateCard.json();
            console.log("Datos de la CARD creada en Stripe: ", datosCardStripe);

            return datosCardStripe.id;

        } catch (error) {
            console.log("ERROR en stripeService Stage2_CreateCardForCustomer: ", error);
            return null;
        }
    },
    Stage3_CreateChargeForCustomer: async (idCustomer, idCard, importe, descripcion) => {
        try {
            //https://docs.stripe.com/api/payment_intents/create?lang=curl
            const bodyPaymentIntent = {
                'customer': idCustomer,
                'payment_method': idCard,
                'amount': Math.round(importe * 100), //importe en centimos de euro
                'currency': 'eur',
                'description': descripcion,
                'confirm': 'true', //<--- no pide confirmacion al crear el payment intent, lo confirma directamente
                'automatic_payment_methods[enabled]': true, //<--- habilita para el pago en stripe metodos descritos en tu dashboard
                'automatic_payment_methods[allow_redirects]': 'never' //<--- para evitar redirecciones en el flujo de pago
            }

            const petPaymentIntent = await fetch(`${BASE_URL_STRIPE}/payment_intents`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.STRIPE_API_KEY}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams(bodyPaymentIntent)
            });

            if (petPaymentIntent.status < 200 || petPaymentIntent.status >= 299) throw new Error(`Error en creacion de PAYMENT INTENT en Stripe. Codigo HTTP: ${petPaymentIntent.status}`);

            const datosPaymentIntent = await petPaymentIntent.json();
            console.log("Datos del PAYMENT INTENT creado en Stripe: ", datosPaymentIntent);

            return datosPaymentIntent.id;

        } catch (error) {
            console.log("ERROR en stripeService Stage3_CreateChargeForCustomer: ", error);
            return null;
        }
    }
}
