import { NextRequest, NextResponse } from 'next/server';
import { unsubscribe } from '@/lib/subscriptions';

// RFC 8058 one-click unsubscribe target. Mail clients POST here directly without
// any user interaction; the visible link in the email points to /uitschrijven instead.
export async function POST(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token');
  if (!token) return NextResponse.json({ fout: 'Token ontbreekt' }, { status: 400 });

  try {
    await unsubscribe(token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('One-click unsubscribe fout:', err);
    return NextResponse.json({ fout: 'Kon niet uitschrijven' }, { status: 500 });
  }
}
