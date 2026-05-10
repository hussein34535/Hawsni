import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') || '/';

    if (code) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${origin}/auth/callback-handler?next=${encodeURIComponent(next)}`);
        }
    }

    return NextResponse.redirect(`${origin}?error=auth_callback_error`);
}
