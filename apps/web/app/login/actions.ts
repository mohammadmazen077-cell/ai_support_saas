'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

const MAX_EMAIL_LENGTH = 254
const MAX_PASSWORD_LENGTH = 512
const MIN_PASSWORD_LENGTH = 6

function validateEmail(email: unknown): string | null {
    if (typeof email !== 'string' || !email.trim()) return null
    const trimmed = email.trim()
    if (trimmed.length > MAX_EMAIL_LENGTH) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(trimmed) ? trimmed : null
}

function validatePassword(password: unknown): string | null {
    if (typeof password !== 'string') return null
    if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) return null
    return password
}

export async function login(formData: FormData) {
    const email = validateEmail(formData.get('email'))
    const password = validatePassword(formData.get('password'))

    if (!email || !password) {
        redirect('/login?error=Invalid credentials')
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        redirect('/login?error=Could not authenticate user')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const email = validateEmail(formData.get('email'))
    const password = validatePassword(formData.get('password'))

    if (!email || !password) {
        redirect('/login?error=Invalid credentials')
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/confirm`,
        },
    })

    if (error) {
        redirect('/login?error=Could not authenticate user')
    }

    revalidatePath('/', 'layout')
    redirect('/login?message=Check email to continue sign in process')
}
