import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import UserIntentForm from "@/components/onboarding/UserIntentForm";

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient()

  if (!supabase) redirect('/auth/signin?next=/onboarding')

  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user || error) redirect('/auth/signin?next=/onboarding')

  const { data: intent } = await supabase
    .from('user_intents')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_complete')
    .eq('id', user.id)
    .maybeSingle()

  if (intent && profile?.onboarding_complete) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[var(--background)] md:-mt-16">
      <UserIntentForm />
    </div>
  );
}
