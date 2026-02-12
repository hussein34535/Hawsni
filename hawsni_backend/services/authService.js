const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');
const emailService = require('./emailService');

class AuthService {
    constructor() {
        this.generateToken = this.generateToken.bind(this);
    }

    generateToken(id, email, role) {
        return jwt.sign({ id, email, role }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE || '30d'
        });
    }

    async register(name, email, password, phone) {
        // 1. Register user in Supabase Auth using Admin API for immediate confirmation and robustness
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
                full_name: name,
                role: 'user',
                phone: phone
            }
        });

        if (authError) {
            // Check if user already exists
            if (authError.message.includes('already registered') || authError.status === 422) {
                throw new Error('This email is already registered');
            }
            throw new Error(authError.message);
        }

        const user = authData.user;
        if (user) {
            // Generate Random 6-digit OTP
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

            // Send OTP Email via Brevo
            try {
                await emailService.sendOtpEmail(email, name, otpCode);
            } catch (emailError) {
                console.error('Failed to send OTP email via Brevo:', emailError);
                // Continue registration even if email fails
            }

            // 3. Add or Update user profile in 'users' table
            // We use upsert to handle cases where a database trigger might have already created the profile
            const { error: profileError } = await supabase
                .from('users')
                .upsert([
                    {
                        id: user.id,
                        name: name,
                        role: 'user',
                        email: email,
                        phone: phone,
                        is_email_verified: false,
                        otp_code: otpCode,
                        otp_expires_at: otpExpiresAt.toISOString()
                    }
                ], { onConflict: 'id' });

            if (profileError) {
                console.error('Error creating user profile:', profileError);
                // If it's still a foreign key error, we'll try to delete the auth user to stay in sync
                await supabase.auth.admin.deleteUser(user.id);
                throw new Error(`Database Error: ${profileError.message}`);
            }

            console.log(`[OTP SENT] OTP for ${email}: ${otpCode}`);

            return {
                requireOtp: true,
                email: email,
                phone: phone,
                message: 'Please verify your email address'
            };
        }

        throw new Error('Registration failed');
    }

    async verifyOtp(email, code) {
        // 1. Find user by email
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (userError || !user) {
            throw new Error('User not found');
        }

        // 2. Validate OTP
        if (user.otp_code !== code) {
            throw new Error('Invalid OTP');
        }

        if (new Date(user.otp_expires_at) < new Date()) {
            throw new Error('OTP expired');
        }

        // 3. Mark as verified and clear OTP
        const { error: updateError } = await supabase
            .from('users')
            .update({
                is_email_verified: true,
                otp_code: null,
                otp_expires_at: null
            })
            .eq('id', user.id);

        if (updateError) {
            throw new Error('Failed to verify user');
        }

        // 4. Generate Token
        const token = this.generateToken(user.id, user.email, user.role);

        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                avatar_url: user.avatar_url
            }
        };
    }

    async login(email, password) {
        // 1. Sign in with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw new Error('Invalid credentials');
        }

        const user = data.user;

        // 2. Fetch additional user details from 'users' table
        const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        const userName = userProfile ? userProfile.name : user.user_metadata.full_name;
        const userRole = userProfile ? userProfile.role : 'user';

        const token = this.generateToken(user.id, user.email, userRole);

        return {
            token,
            user: {
                id: user.id,
                name: userName,
                email: user.email,
                role: userRole
            }
        };
    }

    async forgotPassword(email) {
        // Generate a 6-digit reset code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Store the reset code in the users table
        const { error: dbError } = await supabase
            .from('users')
            .update({
                reset_code: resetCode,
                reset_code_expires_at: expiresAt.toISOString()
            })
            .eq('email', email);

        if (dbError) {
            throw new Error(dbError.message);
        }

        // Send reset email via Brevo
        try {
            await emailService.sendPasswordResetEmail(email, resetCode);
        } catch (emailError) {
            console.error('Failed to send password reset email:', emailError);
            throw new Error('Failed to send reset email');
        }

        return { success: true, message: 'Password reset email sent' };
    }

    async resetPassword(code, newPassword) {
        // 1. Find user by reset code
        const { data: user, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('reset_code', code)
            .single();

        if (findError || !user) {
            throw new Error('Invalid or expired reset code');
        }

        // 2. Check expiry
        if (new Date(user.reset_code_expires_at) < new Date()) {
            throw new Error('Reset code has expired');
        }

        // 3. Update password in Supabase Auth
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        );

        if (updateError) {
            throw new Error(updateError.message);
        }

        // 4. Clear reset code
        await supabase
            .from('users')
            .update({ reset_code: null, reset_code_expires_at: null })
            .eq('id', user.id);

        return { success: true, message: 'Password updated successfully' };
    }

    async changePassword(userId, oldPassword, newPassword) {
        // 1. Get user email to verify old password
        const { data: user, error: findError } = await supabase
            .from('users')
            .select('email')
            .eq('id', userId)
            .single();

        if (findError || !user) {
            throw new Error('User not found');
        }

        // 2. Verify old password by attempting to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: oldPassword
        });

        if (signInError) {
            throw new Error('Incorrect old password');
        }

        // 3. Update to new password
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );

        if (updateError) {
            throw new Error(updateError.message);
        }

        return { success: true, message: 'Password changed successfully' };
    }
}

module.exports = new AuthService();
