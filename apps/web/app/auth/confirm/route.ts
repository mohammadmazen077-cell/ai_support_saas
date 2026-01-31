import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/utils/supabase/server'

const ALLOWED_REDIRECT_PATHS = ['/dashboard', '/login', '/settings']

function isSafeRedirect(path: string): boolean {
    if (!path || typeof path !== 'string') return false
    const normalized = path.startsWith('/') ? path : `/${path}`
    return normalized === '/' || ALLOWED_REDIRECT_PATHS.some((p) => normalized === p || normalized.startsWith(p + '/'))
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const nextParam = searchParams.get('next') ?? '/dashboard'
    const next = isSafeRedirect(nextParam) ? (nextParam.startsWith('/') ? nextParam : `/${nextParam}`) : '/dashboard'

    if (token_hash && type) {
        const supabase = await createClient()

        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        })
        if (!error) {
            redirect(request, next)
        }
    }

    redirect(request, '/login?error=Invalid auth code')
}

function redirect(request: NextRequest, path: string) {
    const url = request.nextUrl.clone()
    url.pathname = path
    url.searchParams.delete('token_hash')
    url.searchParams.delete('type')
    url.searchParams.delete('next')
    return NextResponse.redirect(url)
}
