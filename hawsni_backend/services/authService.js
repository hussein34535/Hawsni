const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

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
        // 1. Check if user already exists (optional but good practice)
        // For now, we rely on Supabase Auth constraints

        // 2. Register user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name,
                    role: 'user',
                    phone: phone // Store phone in metadata as well
                },
                emailRedirectTo: undefined
            }
        });

        if (authError) {
            throw new Error(authError.message);
        }

        const user = authData.user;
        if (user) {
            // Generate Random 6-digit OTP
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

            // Send Email via Resend
            try {
                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'Hawsni <onboarding@resend.dev>',
                        to: email,
                        subject: 'Verify your Hawsni Account',
                        html: `
                            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                                <h1 style="color: #10b981; text-align: center;">Welcome to Hawsni!</h1>
                                <p>Hello ${name},</p>
                                <p>Thank you for joining Hawsni. To complete your registration, please use the following verification code:</p>
                                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">
                                    ${otpCode}
                                </div>
                                <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 20px;">
                                    This code will expire in 10 minutes. If you didn't request this, please ignore this email.
                                </p>
                            </div>
                        `
                    })
                });
            } catch (emailError) {
                console.error('Failed to send OTP email:', emailError);
                // We'll continue anyway for now, or you might want to throw an error
            }

            // 3. Add user to 'users' table with OTP details
            const { error: profileError } = await supabase
                .from('users')
                .insert([
                    {
                        id: user.id,
                        name: name,
                        role: 'user',
                        email: email,
                        phone: phone,
                        is_phone_verified: false,
                        otp_code: otpCode,
                        otp_expires_at: otpExpiresAt.toISOString()
                    }
                ]);

            if (profileError) {
                console.error('Error creating user profile:', profileError);
                await supabase.auth.admin.deleteUser(user.id);
                throw new Error(`Failed to create user profile: ${profileError.message}`);
            }

            console.log(`[OTP SENT] OTP for ${email}: ${otpCode}`);

            return {
                requireOtp: true,
                email: email,
                phone: phone,
                message: 'Please verify your phone number'
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
                is_phone_verified: true,
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
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'io.supabase.hawsniapp://reset-password', // Deep link for mobile app
        });

        if (error) {
            throw new Error(error.message);
        }

        return { success: true, message: 'Password reset email sent' };
    }

    async resetPassword(token, newPassword) {
        // Note: In a typical Supabase flow, the user clicks a link which contains the access_token (which we call 'token' here).
        // We then use that token to set the session, and then update the user.
        // However, passing the token directly to update user might not work if we are not in a session.
        // A common pattern for backend-handled reset is to verify the token or use the admin API if available.
        // But for client-side apps, usually the client handles the deep link, gets the session, and then calls update user.
        // If the frontend sends a token (access_token from the link), we can try to set the session.

        // For now, assuming the 'token' passed is the access_token from the reset link.

        /* 
           LIMITATION: Supabase 'updateUser' requires an active session or admin privileges.
           If we are doing this from the backend, we might need to use the service_role key to update the user by ID,
           but we don't have the user ID here, only the token.
           
           Alternative: The frontend should use the Supabase Client SDK to update the password directly after handling the deep link.
           But since we are building a backend API, we can try to use the token to set the session.
        */

        // Attempt to recover session with the token (if it's a recovery token) or just update if we can.
        // Actually, Supabase `resetPasswordForEmail` sends a link. When clicked, it redirects with `#access_token=...&type=recovery`.
        // The frontend should extract this.

        // If the frontend sends this token to the backend:
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            throw new Error('Invalid or expired token');
        }

        // Now update the user using the admin client or by acting as the user.
        // Since we verified the token, we know the user.

        const { error: updateError } = await supabase.auth.admin.updateUserById(
            data.user.id,
            { password: newPassword }
        );

        if (updateError) {
            throw new Error(updateError.message);
        }

        return { success: true, message: 'Password updated successfully' };
    }
}

module.exports = new AuthService();
