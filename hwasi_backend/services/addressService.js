const supabase = require('../config/supabase');

class AddressService {
    async getAddresses(userId) {
        const { data, error } = await supabase
            .from('user_addresses')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }

    async addAddress(userId, addressData) {
        // If this address is set as default, unset others first
        if (addressData.is_default) {
            await supabase
                .from('user_addresses')
                .update({ is_default: false })
                .eq('user_id', userId);
        }

        const { data, error } = await supabase
            .from('user_addresses')
            .insert([{
                user_id: userId,
                ...addressData
            }])
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }

    async updateAddress(userId, addressId, addressData) {
        // If setting as default, unset others
        if (addressData.is_default) {
            await supabase
                .from('user_addresses')
                .update({ is_default: false })
                .eq('user_id', userId);
        }

        const { data, error } = await supabase
            .from('user_addresses')
            .update(addressData)
            .eq('id', addressId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }

    async deleteAddress(userId, addressId) {
        const { error } = await supabase
            .from('user_addresses')
            .delete()
            .eq('id', addressId)
            .eq('user_id', userId);

        if (error) {
            throw new Error(error.message);
        }

        return { success: true };
    }
}

module.exports = new AddressService();
