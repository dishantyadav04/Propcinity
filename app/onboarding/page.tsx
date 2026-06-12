import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import UserIntentForm from "@/components/onboarding/UserIntentForm";

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient()
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/signin?next=/onboarding')
  }

  return (
    <div className="min-h-screen bg-[var(--background)] md:-mt-16">
      <UserIntentForm />
    </div>
  );
}
