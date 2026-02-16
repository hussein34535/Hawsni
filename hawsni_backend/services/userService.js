const supabase = require('../config/supabase');

class UserService {
    async getProfile(userId) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async updateProfile(userId, updateData) {
        const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async uploadAvatar(userId, file) {
        const fileName = `${userId}-${Date.now()}.${file.originalname.split('.').pop()}`;

        // 1. Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('avatars')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('avatars')
            .getPublicUrl(fileName);

        // 3. Update User Profile
        return this.updateProfile(userId, { avatar_url: publicUrl });
    }

    async getAddresses(userId) {
        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', userId);

        if (error) throw new Error(error.message);
        return data;
    }

    async addAddress(userId, addressData) {
        // If set as default, unset others
        if (addressData.isDefault) {
            await supabase
                .from('addresses')
                .update({ isDefault: false })
                .eq('user_id', userId);
        }

        const { data, error } = await supabase
            .from('addresses')
            .insert([{ ...addressData, user_id: userId }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async updateAddress(userId, addressId, addressData) {
        // If set as default, unset others
        if (addressData.isDefault) {
            await supabase
                .from('addresses')
                .update({ isDefault: false })
                .eq('user_id', userId);
        }

        const { data, error } = await supabase
            .from('addresses')
            .update(addressData)
            .eq('id', addressId)
            .eq('user_id', userId) // Ensure ownership
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async deleteAddress(userId, addressId) {
        const { error } = await supabase
            .from('addresses')
            .delete()
            .eq('id', addressId)
            .eq('user_id', userId); // Ensure ownership

        if (error) throw new Error(error.message);
        return true;
    }

}

module.exports = new UserService();
