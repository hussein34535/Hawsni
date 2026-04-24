const CouponService = require('../../services/couponService');

class CouponController {
    async getAllCoupons(req, res) {
        try {
            const coupons = await CouponService.getAllCoupons();
            res.json({ success: true, coupons });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async validateCoupon(req, res) {
        try {
            const { code } = req.body;
            if (!code) {
                return res.status(400).json({ success: false, message: 'Coupon code is required' });
            }
            const coupon = await CouponService.validateCoupon(code);
            res.json({ success: true, coupon });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async createCoupon(req, res) {
        try {
            const coupon = await CouponService.createCoupon(req.body);
            res.status(201).json({ success: true, coupon });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async updateCoupon(req, res) {
        try {
            const coupon = await CouponService.updateCoupon(req.params.id, req.body);
            res.json({ success: true, coupon });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async deleteCoupon(req, res) {
        try {
            await CouponService.deleteCoupon(req.params.id);
            res.json({ success: true, message: 'Coupon deleted' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new CouponController();
