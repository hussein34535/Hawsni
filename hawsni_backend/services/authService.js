const supabase = require('../config/supabase');
const { supabaseAdmin } = require('../config/supabase');
const { supabaseAuth } = require('../config/supabase');
const jwt = require('jsonwebtoken');
const emailService = require('./emailService');
const OrderService = require('./orderService');

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
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
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
            console.error('[AuthService] createUser error:', authError);
            if (authError.message.includes('already registered') || authError.status === 422) {
                throw new Error('This email is already registered');
            }
            throw new Error('Registration failed');
        }

        const user = authData.user;
        if (user) {
            // Generate Random 6-digit OTP
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

            // Send emails (OTP to user, Notification to admin)
            try {
                await emailService.sendOtpEmail(email, name, otpCode);

                // Admin Notification
                emailService.sendAdminNotification(
                    'New User Registered! 👤',
                    `
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                    `
                ).catch(err => console.error('Admin registration notification failed:', err));
            } catch (emailError) {
                console.error('Failed to send registration emails:', emailError);
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
                await supabaseAdmin.auth.admin.deleteUser(user.id);
                throw new Error('Failed to create user profile');
            }

            // 4. Sign in to get native Supabase JWT (works with middleware)
            const { data: signInData, error: signInError } = await supabaseAuth.auth.signInWithPassword({ email, password });
            const token = signInError ? this.generateToken(user.id, email, 'user') : signInData.session.access_token;
            const refresh_token = signInError ? null : signInData.session.refresh_token;

            return {
                token,
                refresh_token,
                user: {
                    id: user.id,
                    name: name,
                    email: email,
                    role: 'user',
                    phone: phone,
                    is_email_verified: false
                },
                requireOtp: true,
                email: email,
                message: 'تم إنشاء الحساب بنجاح. يرجى تأكيد البريد الإلكتروني بالكود المرسل.'
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

        // Also confirm email in Supabase Auth (so signInWithPassword works)
        await supabaseAdmin.auth.admin.updateUserById(user.id, { email_confirm: true });

        if (updateError) {
            throw new Error('Failed to verify user');
        }

        // Link guest orders asynchronously
        OrderService.linkGuestOrders(user.id, user.email, user.phone)
            .catch(err => console.error('Error linking orders after verifyOtp:', err));

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
        console.log(`[API LOGIN] Attempting login`);
        const { data, error } = await supabaseAuth.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error(`[API LOGIN ERROR] Failed: ${error.message} | Status: ${error.status}`);
            throw new Error('Invalid credentials');
        }
        console.log(`[API LOGIN SUCCESS] Logged in as: ${data.user.id}`);

        const user = data.user;
        const session = data.session;

        // 2. Fetch additional user details from 'users' table
        const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        const userName = userProfile ? userProfile.name : user.user_metadata.full_name;
        const userRole = userProfile ? userProfile.role : 'user';
        const userPhone = userProfile ? userProfile.phone : user.user_metadata.phone;

        // Link guest orders asynchronously
        OrderService.linkGuestOrders(user.id, user.email, userPhone)
            .catch(err => console.error('Error linking orders after login:', err));

        // Return the native Supabase access token so RLS works seamlessly in Flutter
        const token = session.access_token;

        return {
            token,
            refresh_token: session.refresh_token,
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
            console.error('[AuthService] forgotPassword dbError:', dbError);
            throw new Error('Failed to process password reset request');
        }

        // Send reset email via Resend
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

        // 3. Update password in Supabase Auth + confirm email (user proved ownership via code)
        console.log(`[RESET] Attempting to update password for UserID: ${user.id} (${user.email})`);
        const { data: authUpdate, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { password: newPassword, email_confirm: true }
        );

        if (updateError) {
            console.error(`[RESET ERROR] Failed to update Auth password: ${updateError.message}`);
            throw new Error('Failed to reset password');
        }

        console.log(`[RESET SUCCESS] Auth password updated for UserID: ${user.id}`);

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
        const { error: signInError } = await supabaseAuth.auth.signInWithPassword({
            email: user.email,
            password: oldPassword
        });

        if (signInError) {
            throw new Error('Incorrect old password');
        }

        // 3. Update to new password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        );

        if (updateError) {
            console.error('[AuthService] changePassword error:', updateError);
            throw new Error('Failed to change password');
        }

        return { success: true, message: 'Password changed successfully' };
    }

    async googleLogin(accessToken, email, name, avatarUrl) {
        // 1. Verify the Supabase access token
        const { data: { user: supabaseUser }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

        if (authError || !supabaseUser) {
            throw new Error('Invalid Google authentication token');
        }

        const supabaseId = supabaseUser.id;

        // 2. Check if user exists in our users table by supabase_id or email
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', supabaseId)
            .single();

        let userRecord = existingUser;

        if (!userRecord) {
            // 3. Create new user record
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert([{
                    id: supabaseId,
                    name: name || email.split('@')[0],
                    email: email,
                    role: 'user',
                    avatar_url: avatarUrl || null,
                    is_email_verified: true
                }])
                .select()
                .single();

            if (createError) {
                console.error('[AuthService] googleLogin createError:', createError);
                throw new Error('Failed to create user profile');
            }

            userRecord = newUser;
        } else {
            // 4. Update existing user profile with Google data if missing
            const updates: any = {};
            if (!userRecord.email && email) updates.email = email;
            if (!userRecord.name && name) updates.name = name;
            if (!userRecord.avatar_url && avatarUrl) updates.avatar_url = avatarUrl;
            
            if (Object.keys(updates).length > 0) {
                const { data: updatedUser } = await supabase
                    .from('users')
                    .update(updates)
                    .eq('id', supabaseId)
                    .select()
                    .single();
                
                if (updatedUser) userRecord = updatedUser;
            }
        }

        // Link guest orders asynchronously
        OrderService.linkGuestOrders(supabaseId, email, userRecord.phone)
            .catch(err => console.error('Error linking orders after googleLogin:', err));

        // Generate app JWT
        const token = this.generateToken(supabaseId, email, userRecord.role || 'user');

        return {
            token,
            refresh_token: null,
            user: {
                id: supabaseId,
                name: userRecord.name,
                email: userRecord.email,
                role: userRecord.role || 'user',
                phone: userRecord.phone || null,
                avatar_url: userRecord.avatar_url || null
            }
        };
    }

    async refreshToken(refreshToken) {
        const { data, error } = await supabaseAuth.auth.refreshSession({
            refresh_token: refreshToken
        });

        if (error || !data.session) {
            throw new Error('Failed to refresh token');
        }

        return {
            token: data.session.access_token,
            refresh_token: data.session.refresh_token
        };
    }
}

module.exports = new AuthService();
