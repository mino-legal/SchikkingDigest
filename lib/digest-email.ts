import { DigestResponse } from '@/types';
import { listConfirmed, markSent } from '@/lib/subscriptions';
import { sendDigestEmail } from '@/lib/email';

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://schikken.mino.law').replace(/\/$/, '');
}

export interface FanOutResult {
  attempted: number;
  sent: number;
  failed: number;
  errors: { email: string; error: string }[];
}

/**
 * Send the week's digest to every confirmed subscriber, sequentially.
 * Sequential keeps us well under Resend's rate limits on the small community list;
 * if the list grows past a few hundred, swap for `resend.batch.send` (max 100/batch).
 */
export async function fanOutDigest(digest: DigestResponse): Promise<FanOutResult> {
  const subs = await listConfirmed();
  const result: FanOutResult = { attempted: subs.length, sent: 0, failed: 0, errors: [] };
  const base = siteUrl();

  for (const sub of subs) {
    const unsubscribeUrl = `${base}/uitschrijven?token=${encodeURIComponent(sub.unsubscribe_token)}`;
    const unsubscribePostUrl = `${base}/api/unsubscribe?token=${encodeURIComponent(sub.unsubscribe_token)}`;
    try {
      await sendDigestEmail({
        to: sub.email,
        unsubscribeUrl,
        unsubscribePostUrl,
        items: digest.items,
        lessen: digest.lessen,
        periodeVan: digest.periodeVan,
        periodeTot: digest.periodeTot,
      });
      await markSent(sub.id);
      result.sent++;
    } catch (err) {
      result.failed++;
      result.errors.push({ email: sub.email, error: err instanceof Error ? err.message : String(err) });
      console.error(`Digest verzenden mislukt voor ${sub.email}:`, err);
    }
  }

  return result;
}
