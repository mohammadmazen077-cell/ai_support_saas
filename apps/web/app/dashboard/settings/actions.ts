'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateBusinessSettings(enabled: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('business_settings')
        .upsert({
            user_id: user.id,
            escalation_notifications_enabled: enabled
        });

    if (error) {
        console.error('Failed to update settings:', error);
        throw new Error('Failed to update settings');
    }

    revalidatePath('/dashboard/settings');
}

export async function getBusinessSettings() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

    return data;
}
