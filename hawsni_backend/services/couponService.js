const supabase = require('../config/supabase');

class CouponService {
    async getAllCoupons() {
        const { data, error } = await supabase
            .from('coupons')
            .select('*');

        if (error) throw new Error(error.message);
        return data;
    }

    async validateCoupon(code) {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code.toUpperCase())
            .single();

        if (error || !data) {
            throw new Error('Invalid coupon code');
        }

        if (data.expirationDate && new Date(data.expirationDate) < new Date()) {
            throw new Error('Coupon expired');
        }

        if (data.usageLimit && data.usedCount >= data.usageLimit) {
            throw new Error('Coupon usage limit reached');
        }

        if (data.isActive === false) {
            throw new Error('Coupon is not active');
        }

        return {
            code: data.code,
            discount: data.discount,
            type: data.type // percentage or fixed
        };
    }

    async createCoupon(couponData) {
        const { data, error } = await supabase
            .from('coupons')
            .insert([couponData])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async updateCoupon(id, couponData) {
        const { data, error } = await supabase
            .from('coupons')
            .update(couponData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async deleteCoupon(id) {
        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
        return true;
    }
}

module.exports = new CouponService();
