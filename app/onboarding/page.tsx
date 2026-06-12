import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import UserIntentForm from "@/components/onboarding/UserIntentForm";

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient()

  if (!supabase) redirect('/auth/signin?next=/onboarding')

  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user || error) redirect('/auth/signin?next=/onboarding')

  return (
    <div className="min-h-screen bg-[var(--background)] md:-mt-16">
      <UserIntentForm />
    </div>
  );
}
