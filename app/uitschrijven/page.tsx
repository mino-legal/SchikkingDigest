import StatusPage from '@/components/StatusPage';
import { unsubscribe } from '@/lib/subscriptions';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function UitschrijvenPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <StatusPage title="Uitschrijflink ontbreekt" tone="error">
        <p>Open de uitschrijflink onderaan een van onze e-mails om uit te schrijven.</p>
      </StatusPage>
    );
  }

  try {
    const result = await unsubscribe(token);
    if (!result) {
      return (
        <StatusPage title="Al uitgeschreven" tone="info">
          <p>Dit adres staat niet (meer) in onze lijst. Je krijgt geen e-mails meer.</p>
        </StatusPage>
      );
    }
    return (
      <StatusPage title="Je bent uitgeschreven" tone="success">
        <p>
          <strong>{result.email}</strong> is uit de verzendlijst verwijderd. Je krijgt geen
          SchikkingDigest meer.
        </p>
        <p className="text-sm text-brand-darkgray/60">
          Mocht je later toch weer mee willen doen, schrijf je dan opnieuw in via het formulier.
        </p>
      </StatusPage>
    );
  } catch (err) {
    console.error('Uitschrijven fout:', err);
    return (
      <StatusPage title="Uitschrijven mislukt" tone="error">
        <p>Er ging iets mis. Probeer het later opnieuw of stuur een mail naar schikken@mino.law.</p>
      </StatusPage>
    );
  }
}
