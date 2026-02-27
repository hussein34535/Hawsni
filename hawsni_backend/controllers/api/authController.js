const AuthService = require('../../services/authService');
const { validationResult } = require('express-validator');

class AuthController {
    async register(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: errors.array()[0].msg });
        }

        try {
            const { name, email, password, phone } = req.body;
            const result = await AuthService.register(name, email, password, phone);
            res.status(201).json({ success: true, ...result });
        } catch (error) {
            console.error('Register Error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async verifyOtp(req, res) {
        try {
            const { email, code } = req.body;
            if (!email || !code) {
                return res.status(400).json({ success: false, message: 'Email and code are required' });
            }
            const result = await AuthService.verifyOtp(email, code);
            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Verify OTP Error:', error);
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
            const { code, password } = req.body;
            if (!code || !password) {
                return res.status(400).json({ success: false, message: 'Reset code and new password are required' });
            }
            const result = await AuthService.resetPassword(code, password);
            res.json(result);
        } catch (error) {
            console.error('Reset Password Error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async changePassword(req, res) {
        try {
            const { oldPassword, newPassword } = req.body;
            const userId = req.user.id; // From protect middleware

            if (!oldPassword || !newPassword) {
                return res.status(400).json({ success: false, message: 'Old and new passwords are required' });
            }

            const result = await AuthService.changePassword(userId, oldPassword, newPassword);
            res.json(result);
        } catch (error) {
            console.error('Change Password Error:', error);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async refresh(req, res) {
        try {
            const { refresh_token } = req.body;
            if (!refresh_token) {
                return res.status(400).json({ success: false, message: 'Refresh token is required' });
            }
            const result = await AuthService.refreshToken(refresh_token);
            res.json({ success: true, ...result });
        } catch (error) {
            console.error('Refresh Token Error:', error);
            res.status(401).json({ success: false, message: error.message });
        }
    }
}

module.exports = new AuthController();
