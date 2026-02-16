const PaymentService = require('../../services/paymentService');

class PaymentController {

    // Create Stripe Payment Intent
    async createStripeIntent(req, res) {
        try {
            const { amount, currency } = req.body;
            if (!amount) {
                return res.status(400).json({ success: false, message: 'Amount is required' });
            }

            const clientSecret = await PaymentService.createStripePaymentIntent(amount, currency);

            res.json({
                success: true,
                clientSecret: clientSecret
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Create PayPal Order
    async createPaypalOrder(req, res) {
        try {
            const { amount, currency } = req.body;
            if (!amount) {
                return res.status(400).json({ success: false, message: 'Amount is required' });
            }

            const order = await PaymentService.createPaypalOrder(amount, currency);

            res.json({
                success: true,
                orderId: order.id,
                links: order.links
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Capture PayPal Order
    async capturePaypalOrder(req, res) {
        try {
            const { orderId } = req.body;
            if (!orderId) {
                return res.status(400).json({ success: false, message: 'Order ID is required' });
            }

            const capture = await PaymentService.capturePaypalOrder(orderId);

            res.json({
                success: true,
                capture: capture
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new PaymentController();
