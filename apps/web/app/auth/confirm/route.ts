import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const next = searchParams.get('next') ?? '/dashboard'

    if (token_hash && type) {
        const supabase = await createClient()

        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        })
        if (!error) {
            // redirect user to specified redirect URL or root of app
            redirect(request, next)
        }
    }

    // redirect the user to an error page with some instructions
    redirect(request, '/login?error=Invalid auth code')
}

// Custom redirect helper to keep the original request URL's protocol/host if needed
function redirect(request: NextRequest, path: string) {
    const url = request.nextUrl.clone()
    url.pathname = path
    url.searchParams.delete('token_hash')
    url.searchParams.delete('type')
    return NextResponse.redirect(url)
}
