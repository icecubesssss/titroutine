'use server';

import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { createClient } from '@/utils/supabase/server';

type AuthResult = { error?: string; message?: string };

function safeLocale(value: FormDataEntryValue | null): string {
  const locale = String(value ?? '');
  return routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const locale = safeLocale(formData.get('locale'));

  if (!email || !password) {
    return { error: 'missing_fields' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect(`/${locale}`);
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const locale = safeLocale(formData.get('locale'));

  if (!email || !password) {
    return { error: 'missing_fields' };
  }
  if (password.length < 6) {
    return { error: 'weak_password' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  // When email confirmation is enabled, no session is returned yet.
  if (!data.session) {
    return { message: 'check_email' };
  }

  redirect(`/${locale}`);
}

export async function signOut(locale: string): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${safeLocale(locale)}/login`);
}
