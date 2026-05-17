"use client";

import { useState } from "react";

type State = "idle" | "sending" | "pending" | "already" | "error";

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState("error");
        setError(data?.fout ?? "Er ging iets mis. Probeer het opnieuw.");
        return;
      }
      setState(data.status === "already_confirmed" ? "already" : "pending");
      setEmail("");
    } catch {
      setState("error");
      setError("Netwerkfout. Probeer het opnieuw.");
    }
  }

  if (state === "pending") {
    return (
      <div className="bg-brand-bg-blue/60 border border-brand-blue/15 rounded-brand px-5 py-4 text-sm leading-relaxed">
        <p className="font-semibold text-brand-darkgray mb-1">Bijna klaar!</p>
        <p className="text-brand-darkgray/70">
          Check je inbox — we hebben een bevestigingsmail gestuurd. Klik op de
          link en je staat op de lijst.
        </p>
      </div>
    );
  }

  if (state === "already") {
    return (
      <div className="bg-brand-bg-blue/60 border border-brand-blue/15 rounded-brand px-5 py-4 text-sm leading-relaxed">
        <p className="font-semibold text-brand-darkgray mb-1">
          Je staat er al op
        </p>
        <p className="text-brand-darkgray/70">
          Dit adres is al bevestigd. Donderdag in je inbox.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-brand-white border border-brand-lightgray rounded-brand p-5 sm:p-6"
    >
      <p className="font-semibold text-brand-darkgray text-base mb-1">
        Wekelijks per e-mail
      </p>
      <p className="text-sm text-brand-darkgray/70 leading-relaxed">
        Donderdag in je inbox: de relevante uitspraken over schikken en minnelijke regelingen.
        Gratis, geen spam, één klik om uit te schrijven.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="je@kantoor.nl"
          disabled={state === "sending"}
          className="flex-1 px-3 py-2 text-sm rounded-brand border border-brand-lightgray bg-brand-bg focus:outline-none focus:border-brand-blue disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className={`px-4 py-2 rounded-brand text-sm font-semibold transition-all duration-200 ${
            state === "sending"
              ? "bg-brand-bg text-brand-darkgray/40 cursor-not-allowed"
              : "bg-brand-blue text-white shadow-brand hover:bg-brand-darkgray hover:shadow-brand-hover"
          }`}
        >
          {state === "sending" ? "Versturen…" : "Inschrijven"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-brand-terracotta">{error}</p>}
    </form>
  );
}
