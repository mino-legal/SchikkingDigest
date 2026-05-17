import { NextRequest, NextResponse } from 'next/server';
import { createPending, SubscriptionError } from '@/lib/subscriptions';
import { sendConfirmationEmail } from '@/lib/email';

function siteUrl(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, '');
  return new URL(req.url).origin;
}

export async function POST(req: NextRequest) {
  let email: string;
  try {
    const body = await req.json();
    email = typeof body?.email === 'string' ? body.email : '';
  } catch {
    return NextResponse.json({ fout: 'Ongeldig verzoek' }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ fout: 'E-mailadres ontbreekt' }, { status: 400 });
  }

  try {
    const { subscriber, alreadyConfirmed } = await createPending(email);

    if (alreadyConfirmed) {
      return NextResponse.json({ ok: true, status: 'already_confirmed' });
    }

    const confirmUrl = `${siteUrl(req)}/bevestigen?token=${encodeURIComponent(subscriber.confirm_token)}`;
    await sendConfirmationEmail({ to: subscriber.email, confirmUrl });

    return NextResponse.json({ ok: true, status: 'pending' });
  } catch (err) {
    if (err instanceof SubscriptionError && err.code === 'invalid_email') {
      return NextResponse.json({ fout: err.message }, { status: 400 });
    }
    console.error('Subscribe fout:', err);
    return NextResponse.json({ fout: 'Kon inschrijving niet verwerken' }, { status: 500 });
  }
}
