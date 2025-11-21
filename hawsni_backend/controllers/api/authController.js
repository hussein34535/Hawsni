const AuthService = require('../../services/authService');
const { validationResult } = require('express-validator');

class AuthController {
    async register(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: errors.array()[0].msg });
        }

        try {
            const { name, email, password } = req.body;
            const result = await AuthService.register(name, email, password);
            res.status(201).json({ success: true, ...result });
        } catch (error) {
            console.error('Register Error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async login(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: errors.array()[0].msg });
        }

        try {
            const { email, password } = req.body;
            const result = await AuthService.login(email, password);
            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Login Error:', error);
            res.status(401).json({ success: false, message: error.message });
        }
    }

    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ success: false, message: 'Email is required' });
            }
            const result = await AuthService.forgotPassword(email);
            res.json(result);
        } catch (error) {
            console.error('Forgot Password Error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async resetPassword(req, res) {
        try {
            const { token, password } = req.body;
            if (!token || !password) {
                return res.status(400).json({ success: false, message: 'Token and password are required' });
            }
            const result = await AuthService.resetPassword(token, password);
            res.json(result);
        } catch (error) {
            console.error('Reset Password Error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = new AuthController();
