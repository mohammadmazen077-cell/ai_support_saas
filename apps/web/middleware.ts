import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    // Only run updateSession for dashboard routes
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        return await updateSession(request)
    }
    return undefined
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/dashboard/:path*',
    ],
}
