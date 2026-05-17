import Link from 'next/link';
import { ReactNode } from 'react';

interface Props {
  title: string;
  tone: 'success' | 'error' | 'info';
  children: ReactNode;
}

export default function StatusPage({ title, tone, children }: Props) {
  const accent =
    tone === 'success'
      ? 'text-brand-blue'
      : tone === 'error'
        ? 'text-brand-terracotta'
        : 'text-brand-darkgray';

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      <header className="bg-brand-darkgray border-b border-black/30">
        <div className="px-6 sm:px-8 h-16 flex items-center">
          <Link
            href="/"
            className="text-xl sm:text-2xl font-bold text-white tracking-tight hover:text-white/70 transition-colors"
          >
            Schikkingslessen uit (tucht)rechtspraak
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-16 w-full">
        <div className="bg-brand-white rounded-brand shadow-brand p-8 sm:p-10">
          <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${accent}`}>
            {tone === 'success' ? 'Gelukt' : tone === 'error' ? 'Er ging iets mis' : 'Inschrijving'}
          </p>
          <h1 className="text-2xl font-bold text-brand-darkgray mb-4 leading-tight">{title}</h1>
          <div className="text-brand-darkgray/80 leading-relaxed space-y-3">{children}</div>
          <div className="mt-8 pt-6 border-t border-brand-lightgray/40">
            <Link
              href="/"
              className="text-sm font-semibold text-brand-blue hover:text-brand-darkgray transition-colors"
            >
              ← Terug naar de digest
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
