import StatusPage from "@/components/StatusPage";
import { confirm, SubscriptionError } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function BevestigenPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <StatusPage title="Bevestigingslink ontbreekt" tone="error">
        <p>
          De link is niet compleet. Vraag een nieuwe bevestigingsmail aan via
          het inschrijfformulier.
        </p>
      </StatusPage>
    );
  }

  try {
    const subscriber = await confirm(token);
    return (
      <StatusPage title="Je bent ingeschreven" tone="success">
        <p>
          Je inschrijving voor <strong>{subscriber.email}</strong> is bevestigd.
          Vanaf nu krijg je elke donderdag de wekelijkse SchikkingDigest in je
          inbox.
        </p>
      </StatusPage>
    );
  } catch (err) {
    const message =
      err instanceof SubscriptionError && err.code === "not_found"
        ? "Deze bevestigingslink is onbekend of al gebruikt. Vraag eventueel een nieuwe aan via het inschrijfformulier."
        : "Er ging iets mis bij het bevestigen. Probeer het later opnieuw.";
    return (
      <StatusPage title="Bevestigen mislukt" tone="error">
        <p>{message}</p>
      </StatusPage>
    );
  }
}
