'use server';

import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server';

export async function deleteUserAccount() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    throw new Error('Admin client not initialized');
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    throw deleteError;
  }

  return { success: true };
}
