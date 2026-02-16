const Stripe = require('stripe');
const paypal = require('@paypal/checkout-server-sdk');

class PaymentService {
    constructor() {
        // Initialize Stripe
        this.stripe = Stripe(process.env.STRIPE_SECRET_KEY);

        // Initialize PayPal
        let environment = new paypal.core.SandboxEnvironment(
            process.env.PAYPAL_CLIENT_ID,
            process.env.PAYPAL_CLIENT_SECRET
        );
        this.paypalClient = new paypal.core.PayPalHttpClient(environment);
    }

    // --- Stripe Methods ---

    async createStripePaymentIntent(amount, currency = 'usd') {
        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Stripe expects amount in cents
                currency: currency,
                automatic_payment_methods: {
                    enabled: true,
                },
            });
            return paymentIntent.client_secret;
        } catch (error) {
            console.error('Error creating Stripe PaymentIntent:', error);
            throw new Error('Failed to create payment intent');
        }
    }

    // --- PayPal Methods ---

    async createPaypalOrder(amount, currency = 'USD') {
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: currency,
                    value: amount.toString()
                }
            }]
        });

        try {
            const order = await this.paypalClient.execute(request);
            return order.result;
        } catch (error) {
            console.error('Error creating PayPal Order:', error);
            throw new Error('Failed to create PayPal order');
        }
    }

    async capturePaypalOrder(orderId) {
        const request = new paypal.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});

        try {
            const capture = await this.paypalClient.execute(request);
            return capture.result;
        } catch (error) {
            console.error('Error capturing PayPal Order:', error);
            throw new Error('Failed to capture PayPal order');
        }
    }
}

module.exports = new PaymentService();
