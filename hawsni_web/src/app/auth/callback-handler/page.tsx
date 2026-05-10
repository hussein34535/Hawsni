'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/axios';

function CallbackInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setUser } = useAuthStore();

    useEffect(() => {
        const handleCallback = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session) {
                router.push('/login?error=google_auth_failed');
                return;
            }

            try {
                const res = await apiClient.post('/auth/google', {
                    access_token: session.access_token,
                    email: session.user.email,
                    name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                    avatar_url: session.user.user_metadata?.avatar_url,
                });

                if (res.data.success) {
                    setUser(res.data.user, res.data.token);
                    if (res.data.refresh_token) {
                        localStorage.setItem('refresh_token', res.data.refresh_token);
                    }
                }
            } catch (err) {
                console.error('Google auth sync failed:', err);
            }

            const next = searchParams.get('next') || '/';
            router.push(next);
        };

        handleCallback();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-10 h-10 border-4 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

export default function CallbackHandler() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-10 h-10 border-4 border-[var(--color-brand-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <CallbackInner />
        </Suspense>
    );
}
