import { randomBytes } from 'crypto';
import { createServerSupabaseClient } from '@/lib/supabase';

const TABLE = 'schikking_subscriptions';

export interface Subscriber {
  id: string;
  email: string;
  confirmed_at: string | null;
  confirm_token: string;
  unsubscribe_token: string;
  last_sent_at: string | null;
  created_at: string;
}

function token(): string {
  return randomBytes(24).toString('base64url');
}

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export class SubscriptionError extends Error {
  constructor(message: string, public code: 'invalid_email' | 'not_found' | 'db_error') {
    super(message);
  }
}

/**
 * Create or refresh a pending subscription.
 * If the email is already confirmed, returns the existing row without sending.
 * If pending, rotates the confirm token (so old links stop working).
 * Returns the subscriber row + a flag indicating whether a confirm email should be sent.
 */
export async function createPending(rawEmail: string): Promise<{
  subscriber: Subscriber;
  alreadyConfirmed: boolean;
}> {
  const email = normalize(rawEmail);
  if (!isValidEmail(email)) {
    throw new SubscriptionError('Ongeldig e-mailadres', 'invalid_email');
  }

  const supabase = createServerSupabaseClient();

  const { data: existing, error: selectErr } = await supabase
    .from(TABLE)
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (selectErr) throw new SubscriptionError(selectErr.message, 'db_error');

  if (existing?.confirmed_at) {
    return { subscriber: existing as Subscriber, alreadyConfirmed: true };
  }

  if (existing) {
    const newConfirm = token();
    const { data, error } = await supabase
      .from(TABLE)
      .update({ confirm_token: newConfirm })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw new SubscriptionError(error.message, 'db_error');
    return { subscriber: data as Subscriber, alreadyConfirmed: false };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      email,
      confirm_token: token(),
      unsubscribe_token: token(),
    })
    .select()
    .single();
  if (error) throw new SubscriptionError(error.message, 'db_error');
  return { subscriber: data as Subscriber, alreadyConfirmed: false };
}

export async function confirm(confirmToken: string): Promise<Subscriber> {
  const supabase = createServerSupabaseClient();
  const { data: existing, error: selectErr } = await supabase
    .from(TABLE)
    .select('*')
    .eq('confirm_token', confirmToken)
    .maybeSingle();
  if (selectErr) throw new SubscriptionError(selectErr.message, 'db_error');
  if (!existing) throw new SubscriptionError('Bevestigingslink onbekend of verlopen', 'not_found');

  if (existing.confirmed_at) return existing as Subscriber;

  const { data, error } = await supabase
    .from(TABLE)
    .update({ confirmed_at: new Date().toISOString() })
    .eq('id', existing.id)
    .select()
    .single();
  if (error) throw new SubscriptionError(error.message, 'db_error');
  return data as Subscriber;
}

export async function unsubscribe(unsubToken: string): Promise<{ email: string } | null> {
  const supabase = createServerSupabaseClient();
  const { data: existing, error: selectErr } = await supabase
    .from(TABLE)
    .select('id, email')
    .eq('unsubscribe_token', unsubToken)
    .maybeSingle();
  if (selectErr) throw new SubscriptionError(selectErr.message, 'db_error');
  if (!existing) return null;

  const { error } = await supabase.from(TABLE).delete().eq('id', existing.id);
  if (error) throw new SubscriptionError(error.message, 'db_error');
  return { email: existing.email };
}

export async function listConfirmed(): Promise<Subscriber[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .not('confirmed_at', 'is', null);
  if (error) throw new SubscriptionError(error.message, 'db_error');
  return (data ?? []) as Subscriber[];
}

export async function markSent(id: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase
    .from(TABLE)
    .update({ last_sent_at: new Date().toISOString() })
    .eq('id', id);
}
