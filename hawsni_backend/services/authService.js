const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');

class AuthService {
    constructor() {
        this.generateToken = this.generateToken.bind(this);
    }

    generateToken(id, email, role) {
        return jwt.sign({ id, email, role }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE || '30d'
        });
    }

    async register(name, email, password) {
        // 1. Register user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name,
                    role: 'user'
                },
                emailRedirectTo: undefined // Disable email confirmation for now
            }
        });

        if (authError) {
            throw new Error(authError.message);
        }

        const user = authData.user;

        if (user) {
            // 2. Add user to 'users' table (using service role key to bypass RLS)
            const { error: profileError } = await supabase
                .from('users')
                .insert([
                    { id: user.id, name: name, role: 'user', email: email }
                ]);

            if (profileError) {
                console.error('Error creating user profile:', profileError);
                // If profile creation fails, delete the auth user to maintain consistency
                await supabase.auth.admin.deleteUser(user.id);
                throw new Error(`Failed to create user profile: ${profileError.message}`);
            }

            const token = this.generateToken(user.id, user.email, 'user');

            return {
                token,
                user: {
                    id: user.id,
                    name: name,
                    email: user.email,
                    role: 'user'
                }
            };
        }

        throw new Error('Registration failed');
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
