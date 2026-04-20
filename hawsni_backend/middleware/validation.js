const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

const userRegistrationSchema = [
    body('name').trim().notEmpty().withMessage('Name is required').escape(),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters').escape(),
    body('phone').optional().trim().escape(),
    validate
];

const loginSchema = [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password cannot be empty').escape(),
    validate
];

const productSchema = [
    body('name').trim().notEmpty().withMessage('Product name is required').escape(),
    body('description').trim().notEmpty().withMessage('Description is required').escape(),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category_id').optional().isUUID().withMessage('Invalid Category ID'),
    validate
];

const orderSchema = [
    body('shipping_address').isObject().withMessage('Shipping address is required'),
    body('payment_method').isIn(['Cash on Delivery', 'Credit Card', 'PayPal']).withMessage('Invalid payment method'),
    body('subtotal').isFloat({ min: 0 }),
    body('total').isFloat({ min: 0 }),
    validate
];

module.exports = {
    userRegistrationSchema,
    loginSchema,
    productSchema,
    orderSchema
};
