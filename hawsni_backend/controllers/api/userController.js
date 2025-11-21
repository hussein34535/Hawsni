const UserService = require('../../services/userService');

class UserController {
    async getProfile(req, res) {
        try {
            const user = await UserService.getProfile(req.user.id);
            res.json({ success: true, user });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateProfile(req, res) {
        try {
            const { name, phone } = req.body;
            const user = await UserService.updateProfile(req.user.id, { name, phone });
            res.json({ success: true, user });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getAddresses(req, res) {
        try {
            const addresses = await UserService.getAddresses(req.user.id);
            res.json({ success: true, addresses });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async addAddress(req, res) {
        try {
            const address = await UserService.addAddress(req.user.id, req.body);
            res.json({ success: true, address });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateAddress(req, res) {
        try {
            const address = await UserService.updateAddress(req.user.id, req.params.addressId, req.body);
            res.json({ success: true, address });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async deleteAddress(req, res) {
        try {
            await UserService.deleteAddress(req.user.id, req.params.addressId);
            res.json({ success: true, message: 'Address deleted' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new UserController();
