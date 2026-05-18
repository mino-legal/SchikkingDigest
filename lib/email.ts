import { Resend } from 'resend';
import type { DigestItem, Les, LesCategorie } from '@/types';

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY is not configured');
    _resend = new Resend(apiKey);
  }
  return _resend;
}

function fromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || 'Schikken <schikken@mino.law>';
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://schikken.mino.law').replace(/\/$/, '');
}

// Palette mirrors tailwind.config.js brand tokens so the email matches the site.
const C = {
  bg: '#fafaf7',
  white: '#ffffff',
  darkgray: '#1f2937',
  lightgray: '#d1d5db',
  blue: '#2563eb',
  bgBlue: '#eff6ff',
  bgRed: '#fef2f2',
  terracotta: '#c1572a',
  mutedText: '#4b5563',
  hairline: '#e5e7eb',
};
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const FONT_MONO = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";

// Mino brand palette for the footer block (mirrors the site footer).
const MINO = {
  bg: '#2D001D',
  text: '#DDE6FF',
  textMuted: 'rgba(221,230,255,0.85)',
  textDim: 'rgba(221,230,255,0.6)',
  cardBg: 'rgba(221,230,255,0.06)',
  cardBorder: 'rgba(221,230,255,0.18)',
  accent: '#E87A45',
};

function minoFooterHtml(): string {
  return `
    <div style="background-color:${MINO.bg};padding:36px 32px;font-family:${FONT};color:${MINO.text};">
      <p style="margin:0 0 4px 0;font-size:16px;font-weight:700;letter-spacing:0.04em;color:${MINO.text};font-family:${FONT};">
        mino
      </p>
      <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:${MINO.textMuted};font-family:${FONT};">
        SchikkingsDigest is gemaakt door
        <a href="https://www.linkedin.com/in/lucaslieverse/" style="color:${MINO.text};text-decoration:underline;font-weight:600;">Lucas Lieverse</a>,
        docent-onderzoeker HBO-Rechten en gepromoveerd op de Nederlandse schikkingspraktijk. Hij geeft trainingen en lezingen aan rechters, advocaten en mediators, en bouwde deze digest om zelf bij te houden wat de (tucht)rechtspraak ons over schikken leert.
      </p>
      <p style="margin:0 0 18px 0;font-size:13px;line-height:1.6;color:${MINO.textDim};font-family:${FONT};">
        Mino is een community van juristen die met AI hun eigen praktijktools bouwen.
      </p>
      <div style="background-color:${MINO.cardBg};border:1px solid ${MINO.cardBorder};border-radius:8px;padding:14px 16px;font-size:13px;line-height:1.6;color:${MINO.textMuted};font-family:${FONT};">
        <span style="color:${MINO.text};font-weight:600;">Wil je ook leren dit soort tools te bouwen?</span>
        Meld je aan voor de volgende
        <a href="https://mino.law/workshop" style="color:${MINO.text};text-decoration:underline;text-decoration-color:${MINO.accent};font-weight:600;">Claude Code workshop</a>.
      </div>
    </div>`;
}

function minoFooterText(): string {
  return `mino
SchikkingsDigest is gemaakt door Lucas Lieverse (https://www.linkedin.com/in/lucaslieverse/), docent-onderzoeker HBO-Rechten en gepromoveerd op de Nederlandse schikkingspraktijk. Hij geeft trainingen en lezingen aan rechters, advocaten en mediators, en bouwde deze digest om zelf bij te houden wat de (tucht)rechtspraak ons over schikken leert.

Mino is een community van juristen die met AI hun eigen praktijktools bouwen.

Wil je ook leren dit soort tools te bouwen? Meld je aan voor de volgende Claude Code workshop: https://mino.law/workshop`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dutchDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Confirmation email ────────────────────────────────────────────────────

export interface SendConfirmationOptions {
  to: string;
  confirmUrl: string;
}

function confirmHtml(opts: SendConfirmationOptions): string {
  return `<!doctype html>
<html lang="nl"><head><meta charset="utf-8" /><title>Bevestig je inschrijving</title></head>
<body style="margin:0;padding:0;background-color:${C.bg};font-family:${FONT};">
  <div style="max-width:560px;margin:0 auto;">
    <div style="padding:40px 24px 24px 24px;">
      <div style="background-color:${C.white};border:1px solid ${C.hairline};border-radius:12px;padding:32px;">
        <h1 style="margin:0 0 12px 0;font-size:20px;font-weight:700;color:${C.darkgray};">Bevestig je inschrijving</h1>
        <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:${C.mutedText};">
          Klik op de knop hieronder om je in te schrijven voor de wekelijkse SchikkingsDigest. Elke donderdag ontvang je de relevante uitspraken over schikken en minnelijke regelingen.
        </p>
        <p style="margin:0 0 24px 0;">
          <a href="${escape(opts.confirmUrl)}" style="display:inline-block;background-color:${C.blue};color:${C.white};text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px;">Bevestig inschrijving</a>
        </p>
        <p style="margin:0;font-size:12px;color:${C.mutedText};line-height:1.5;">
          Heb je deze e-mail niet aangevraagd? Negeer hem dan; zonder bevestiging gebeurt er niets.
        </p>
      </div>
    </div>
    ${minoFooterHtml()}
  </div>
</body></html>`;
}

function confirmText(opts: SendConfirmationOptions): string {
  return `Bevestig je inschrijving voor de SchikkingsDigest.

Klik om te bevestigen:
${opts.confirmUrl}

Heb je deze e-mail niet aangevraagd? Negeer hem dan.

---
${minoFooterText()}`;
}

export async function sendConfirmationEmail(opts: SendConfirmationOptions): Promise<void> {
  const { error } = await getResend().emails.send({
    from: fromEmail(),
    to: opts.to,
    subject: 'Bevestig je inschrijving — SchikkingsDigest',
    html: confirmHtml(opts),
    text: confirmText(opts),
  });
  if (error) throw new Error(`Resend failed: ${error.message}`);
}

// ─── Weekly digest email ───────────────────────────────────────────────────

export interface SendDigestOptions {
  to: string;
  unsubscribeUrl: string;
  unsubscribePostUrl: string;
  items: DigestItem[];
  lessen: Les[];
  periodeVan: string;
  periodeTot: string;
}

const CATEGORIE_ORDER: LesCategorie[] = [
  'Schikkingsadvies',
  'Vaststellingsovereenkomst',
  'Onderhandelingen',
  'Hoedanigheid advocaat',
  'Overig',
];

function itemHtml(item: DigestItem): string {
  return `
    <div style="margin:0 0 28px 0;padding:0 0 24px 0;border-bottom:1px solid ${C.hairline};">
      <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${C.blue};font-family:${FONT};">
        ${escape(item.categorie)}
      </p>
      <h2 style="margin:0 0 8px 0;font-size:17px;font-weight:600;color:${C.darkgray};line-height:1.35;font-family:${FONT};">
        ${escape(item.headline)}
      </h2>
      <p style="margin:0 0 12px 0;font-size:12px;color:${C.mutedText};font-family:${FONT};">
        <span style="font-family:${FONT_MONO};">${escape(item.id)}</span>
        ${item.instantie ? ` · ${escape(item.instantie)}` : ''}
        ${item.datum ? ` · ${escape(dutchDate(item.datum))}` : ''}
      </p>
      <p style="margin:0 0 12px 0;font-size:14px;color:${C.darkgray};line-height:1.6;font-family:${FONT};">
        ${escape(item.feiten)}
      </p>
      <p style="margin:0 0 12px 0;font-size:14px;color:${C.darkgray};line-height:1.6;font-family:${FONT};">
        ${escape(item.oordeel)}
      </p>
      <div style="margin:0 0 14px 0;padding:12px 14px;background-color:${C.bgBlue};border-left:3px solid ${C.blue};border-radius:4px;">
        <p style="margin:0;font-size:14px;color:${C.darkgray};line-height:1.55;font-family:${FONT};">
          ${escape(item.relevantie)}
        </p>
      </div>
      <p style="margin:0;font-size:12px;font-family:${FONT};">
        <a href="${escape(item.url)}" style="color:${C.blue};text-decoration:underline;">Lees de volledige uitspraak →</a>
      </p>
    </div>`;
}

function digestHtml(opts: SendDigestOptions): string {
  const { items, periodeVan, periodeTot, unsubscribeUrl } = opts;
  const periodeLabel = `${dutchDate(periodeVan)} – ${dutchDate(periodeTot)}`;
  const itemsHtml = items.map(itemHtml).join('');

  return `<!doctype html>
<html lang="nl"><head><meta charset="utf-8" /><title>SchikkingsDigest</title></head>
<body style="margin:0;padding:0;background-color:${C.bg};font-family:${FONT};">
  <div style="max-width:640px;margin:0 auto;background-color:${C.white};">
    <div style="padding:28px 32px 12px 32px;border-bottom:1px solid ${C.hairline};">
      <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${C.blue};font-family:${FONT};">
        SchikkingsDigest
      </p>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:${C.darkgray};line-height:1.3;font-family:${FONT};">
        Schikkingslessen uit (tucht)rechtspraak
      </h1>
      <p style="margin:8px 0 0 0;font-size:12px;color:${C.mutedText};font-family:${FONT};">
        Periode ${escape(periodeLabel)} · ${items.length} relevante ${items.length === 1 ? 'uitspraak' : 'uitspraken'}
      </p>
    </div>

    <div style="padding:28px 32px;">
      ${items.length === 0
        ? `<p style="margin:0;font-size:15px;color:${C.mutedText};font-family:${FONT};line-height:1.6;">Geen relevante uitspraken in deze periode. Tot volgende week!</p>`
        : itemsHtml}
    </div>

    <div style="padding:20px 32px;background-color:${C.bg};border-top:1px solid ${C.hairline};">
      <p style="margin:0 0 6px 0;font-size:12px;color:${C.mutedText};font-family:${FONT};line-height:1.5;">
        Samenvattingen zijn door AI gegenereerd. Lees voor je je erop beroept altijd de volledige uitspraak.
      </p>
      <p style="margin:0;font-size:11px;color:${C.mutedText};font-family:${FONT};">
        <a href="${escape(siteUrl())}" style="color:${C.mutedText};text-decoration:underline;">schikken.mino.law</a>
        ·
        <a href="${escape(unsubscribeUrl)}" style="color:${C.mutedText};text-decoration:underline;">Uitschrijven</a>
      </p>
    </div>
    ${minoFooterHtml()}
  </div>
</body></html>`;
}

function digestText(opts: SendDigestOptions): string {
  const { items, periodeVan, periodeTot, unsubscribeUrl } = opts;
  const periodeLabel = `${dutchDate(periodeVan)} – ${dutchDate(periodeTot)}`;
  const body = items.length === 0
    ? 'Geen relevante uitspraken in deze periode. Tot volgende week!'
    : items
        .map((i, idx) => `${idx + 1}. [${i.categorie}] ${i.headline}
${i.id}${i.instantie ? ` · ${i.instantie}` : ''}${i.datum ? ` · ${dutchDate(i.datum)}` : ''}

Feiten: ${i.feiten}
Oordeel: ${i.oordeel}
Les: ${i.relevantie}

Volledige uitspraak: ${i.url}
`)
        .join('\n---\n\n');

  return `SchikkingsDigest — ${periodeLabel}
${items.length} relevante ${items.length === 1 ? 'uitspraak' : 'uitspraken'}

${body}

---
Samenvattingen door AI. Lees altijd de volledige uitspraak.
Uitschrijven: ${unsubscribeUrl}

---
${minoFooterText()}`;
}

export async function sendDigestEmail(opts: SendDigestOptions): Promise<void> {
  const lead = opts.items[0]?.headline;
  const subject = lead
    ? `SchikkingsDigest — ${lead}`
    : opts.items.length === 0
      ? 'SchikkingsDigest — geen nieuwe uitspraken deze week'
      : 'SchikkingsDigest — wekelijkse update';

  const { error } = await getResend().emails.send({
    from: fromEmail(),
    to: opts.to,
    subject,
    html: digestHtml(opts),
    text: digestText(opts),
    headers: {
      'List-Unsubscribe': `<${opts.unsubscribePostUrl}>, <${opts.unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });
  if (error) throw new Error(`Resend failed: ${error.message}`);
}

export { CATEGORIE_ORDER };
