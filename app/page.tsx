"use client";

import { useState, useEffect, useRef } from "react";
import { RefreshCw, Lock, Info } from "lucide-react";
import DigestCard from "@/components/DigestCard";
import SubscribeForm from "@/components/SubscribeForm";
import { DigestItem, DigestResponse, Les } from "@/types";

function formatDatum(iso: string) {
  return new Date(iso).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type Tab = "week" | "totnutoe";
type LessenSort = "categorie" | "datum";

function LesRegel({ les }: { les: Les }) {
  return (
    <div className="text-sm text-brand-darkgray/80 leading-snug flex gap-3">
      <span className="text-brand-lightgray font-mono text-xs mt-0.5 shrink-0">
        ·
      </span>
      <span>
        {les.tekst}
        {les.bronnen.length > 0 && (
          <span className="text-brand-darkgray/70 ml-2 text-xs font-mono">
            {les.bronnen.map((b, j) => (
              <span key={b.id}>
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-blue transition-colors"
                  title={b.headline}
                >
                  {b.id}
                </a>
                {j < les.bronnen.length - 1 && ", "}
              </span>
            ))}
          </span>
        )}
      </span>
    </div>
  );
}

export default function Home() {
  const [items, setItems] = useState<DigestItem[]>([]);
  const [lessen, setLessen] = useState<Les[]>([]);
  const [lessenDatum, setLessenDatum] = useState<string | null>(null);
  const [meta, setMeta] = useState<Omit<
    DigestResponse,
    "items" | "lessen"
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fout, setFout] = useState<string | null>(null);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("week");
  const [lessenSort, setLessenSort] = useState<LessenSort>("categorie");
  const [adminMode, setAdminMode] = useState(false);
  const tokenRef = useRef<HTMLInputElement>(null);
  const disclaimerRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    laadOpgeslagen();
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.has("admin")) {
      localStorage.setItem("digest_admin", "1");
      setAdminMode(true);
    } else if (localStorage.getItem("digest_admin") === "1") {
      setAdminMode(true);
    }
  }, []);
  useEffect(() => {
    if (showTokenInput) tokenRef.current?.focus();
  }, [showTokenInput]);

  async function laadOpgeslagen() {
    setLoading(true);
    setFout(null);
    try {
      const res = await fetch("/api/digest");
      const data: DigestResponse & { fout?: string } = await res.json();
      if (data.fout) {
        setFout(data.fout);
        return;
      }
      if (data.ophaalDatum) {
        setItems(data.items);
        setLessen(data.lessen ?? []);
        if (data.lessenAanvangsDatum) setLessenDatum(data.lessenAanvangsDatum);
        setMeta({
          ophaalDatum: data.ophaalDatum,
          periodeVan: data.periodeVan,
          periodeTot: data.periodeTot,
          aantalRuw: data.aantalRuw,
        });
      }
    } catch (err) {
      setFout(`Netwerkfout: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  function handleVernieuwClick() {
    const opgeslagen = sessionStorage.getItem("digest_token") ?? "";
    if (opgeslagen) vernieuwDigest(opgeslagen);
    else setShowTokenInput(true);
  }

  async function handleTokenSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    sessionStorage.setItem("digest_token", tokenInput.trim());
    setShowTokenInput(false);
    setTokenInput("");
    await vernieuwDigest(tokenInput.trim());
  }

  async function vernieuwDigest(token: string) {
    setRefreshing(true);
    setFout(null);
    try {
      const res = await fetch("/api/digest", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: DigestResponse & { fout?: string } = await res.json();
      if (res.status === 401) {
        sessionStorage.removeItem("digest_token");
        setFout("Verkeerd wachtwoord.");
        return;
      }
      if (!res.ok || data.fout) {
        setFout(data.fout ?? "Onbekende fout bij ophalen.");
        return;
      }
      setItems(data.items);
      setLessen(data.lessen ?? []);
      if (data.lessenAanvangsDatum) setLessenDatum(data.lessenAanvangsDatum);
      setMeta({
        ophaalDatum: data.ophaalDatum,
        periodeVan: data.periodeVan,
        periodeTot: data.periodeTot,
        aantalRuw: data.aantalRuw,
      });
    } catch (err) {
      setFout(`Netwerkfout: ${String(err)}`);
    } finally {
      setRefreshing(false);
    }
  }

  const busy = loading || refreshing;

  return (
    <main className="min-h-screen bg-brand-bg flex flex-col">
      {/* Mino community attribution strip */}
      <div
        className="border-b text-[11px] font-medium tracking-wide"
        style={{
          backgroundColor: "hsl(221 100% 93%)",
          borderColor: "hsl(321 100% 21% / 0.12)",
          color: "hsl(321 100% 21% / 0.85)",
        }}
      >
        <div className="px-6 sm:px-8 py-2 flex items-center justify-between gap-x-4 gap-y-1 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span>Gemaakt door</span>
            <a
              href="https://www.linkedin.com/in/lucaslieverse/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-2 decoration-[hsl(321_100%_21%_/_0.3)] hover:decoration-current transition-colors"
              style={{ color: "hsl(321 100% 21%)" }}
            >
              Lucas Lieverse
            </a>
          </span>
          <span className="flex items-center gap-2">
            <span>Een community-tool via</span>
            <a
              href="https://mino.law"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Mino"
              className="inline-flex items-center transition-opacity hover:opacity-70"
              style={{ color: "hsl(321 100% 21%)" }}
            >
              <svg
                viewBox="0 0 420 101"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                className="h-[11px] w-auto block"
                fill="currentColor"
              >
                <path d="M8.378 34.08V100.252H0V0.851997H41.464L62.196 42.316L78.668 0.851997H124.108V100.252H78.668V25.702L49.7 100.252H37.346L8.378 34.08Z" />
                <path d="M132.154 0.851997H178.446V100.252H132.154V0.851997Z" />
                <path d="M186.514 0.851997H228.262L269.726 50.552V0.851997H278.246V100.252H244.876L195.176 34.08V100.252H186.514V0.851997Z" />
                <path d="M352.675 100.962C339.989 100.962 328.535 99.0213 318.311 95.14C308.087 91.2587 299.993 85.5313 294.029 77.958C288.159 70.29 285.225 61.1073 285.225 50.41C285.225 39.8073 288.207 30.7193 294.171 23.146C300.135 15.5727 308.181 9.84533 318.311 5.964C328.535 1.988 339.989 0 352.675 0C365.265 0 376.625 1.988 386.755 5.964C396.979 9.84533 405.025 15.5727 410.895 23.146C416.859 30.7193 419.841 39.8073 419.841 50.41C419.841 61.1073 416.859 70.29 410.895 77.958C405.025 85.5313 396.979 91.2587 386.755 95.14C376.625 99.0213 365.265 100.962 352.675 100.962ZM352.675 92.584C356.651 92.584 359.585 90.7853 361.479 87.188C363.088 84.4427 364.177 79.5673 364.745 72.562C365.029 68.87 365.171 61.486 365.171 50.41C365.171 39.2393 364.934 31.3347 364.461 26.696C364.177 21.016 363.135 16.7087 361.337 13.774C359.443 10.1767 356.556 8.378 352.675 8.378C348.699 8.378 345.717 10.1767 343.729 13.774C342.119 16.614 341.078 20.9213 340.605 26.696C340.226 31.6187 340.037 39.5233 340.037 50.41C340.037 62.7167 340.179 70.1007 340.463 72.562C340.841 79.094 341.883 83.9693 343.587 87.188C345.575 90.7853 348.604 92.584 352.675 92.584Z" />
              </svg>
            </a>
          </span>
        </div>
      </div>

      {/* Title block */}
      <div className="max-w-3xl mx-auto px-6 pt-12 sm:pt-16 pb-2">
        <a href="/" className="block group">
          <h1 className="font-display text-5xl sm:text-6xl leading-[1.05] tracking-tight text-brand-darkgray group-hover:text-brand-blue transition-colors">
            Schikkingslessen uit
            <br />
            <em className="italic">(tucht)rechtspraak</em>
          </h1>
        </a>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-6 pb-8">
        {/* Intro + disclaimer in één uitklapbare callout */}
        <details
          ref={disclaimerRef}
          className="text-xs text-brand-darkgray/75 leading-relaxed mb-6 px-4 py-3 bg-brand-bg-blue/60 border border-brand-blue/15 rounded-brand group"
        >
          <summary className="cursor-pointer list-none flex items-start gap-2 marker:hidden">
            <Info size={14} className="text-brand-blue shrink-0 mt-0.5" />
            <span>
              SchikkingsDigest verzamelt elke week nieuwe uitspraken uit het
              Nederlandse civiele recht en het advocatentuchtrecht over schikken
              en minnelijke regelingen. AI beoordeelt de relevantie en vat de
              feiten, het oordeel en de praktische les samen. De samenvattingen
              zijn geautomatiseerd. Lees voordat je je daarop beroept altijd de
              volledige tekst.
              <span className="ml-1 text-brand-blue font-semibold underline underline-offset-2 group-open:hidden">
                Hoe werkt dit en wat betekent dat?
              </span>
            </span>
          </summary>
          <div className="mt-3 pl-6 space-y-2 text-brand-darkgray/70">
            <p>
              Elke week worden uitspraken van{" "}
              <a
                href="https://www.rechtspraak.nl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue underline underline-offset-2 hover:text-brand-darkgray"
              >
                Rechtspraak.nl
              </a>{" "}
              (civiel recht) en{" "}
              <a
                href="https://tuchtrecht.overheid.nl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue underline underline-offset-2 hover:text-brand-darkgray"
              >
                Tuchtrecht.overheid.nl
              </a>{" "}
              (advocatuur) opgehaald op zoekwoorden rond schikken en minnelijke
              regelingen.
            </p>
            <p>
              AI (Claude) beoordeelt vervolgens of de uitspraak iets bruikbaars
              leert over de schikkingspraktijk en schrijft een korte
              samenvatting.
            </p>
            <p>
              Twee beperkingen om in gedachten te houden. Ten eerste werkt de
              tool met zoekwoorden, dus uitspraken waarin schikken centraal
              staat, maar het woord zelf niet voorkomt kunnen worden gemist. Ten
              tweede kan AI nuances missen of een uitspraak verkeerd
              interpreteren of uitlegge.
            </p>
            <button
              type="button"
              onClick={() => {
                if (disclaimerRef.current) disclaimerRef.current.open = false;
              }}
              className="text-brand-blue font-semibold underline underline-offset-2 hover:text-brand-darkgray transition-colors mt-1"
            >
              Verberg uitleg
            </button>
          </div>
        </details>

        {/* Inschrijfformulier */}
        <div className="mb-6">
          <SubscribeForm />
        </div>

        {/* Error */}
        {fout && (
          <div className="bg-brand-bg-red border border-brand-terracotta/20 rounded-brand px-5 py-4 text-sm text-brand-terracotta mb-6">
            {fout}
          </div>
        )}

        {/* Tabs — alleen tonen als er data is */}
        {!busy && meta && (
          <div className="flex gap-1 mb-6">
            {(["week", "totnutoe"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold rounded-brand transition-all duration-150 flex items-center gap-2 border ${
                  activeTab === tab
                    ? "bg-brand-blue text-white border-brand-blue shadow-brand"
                    : "bg-brand-white text-brand-darkgray/70 border-brand-lightgray hover:border-brand-darkgray/40 hover:text-brand-darkgray"
                }`}
              >
                {tab === "week" ? "Lessen van de week" : "Lessen tot nu toe"}
                {tab === "week" && items.length > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      activeTab === tab
                        ? "bg-white/20 text-white"
                        : "bg-brand-bg-blue text-brand-blue"
                    }`}
                  >
                    {items.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Loading skeleton */}
        {busy && (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-brand-white rounded-brand shadow-brand p-8"
              >
                <div className="flex gap-3 mb-4">
                  <div className="h-5 w-20 bg-brand-bg-blue rounded-full" />
                  <div className="h-5 w-28 bg-brand-bg rounded-full ml-auto" />
                </div>
                <div className="h-6 w-3/4 bg-brand-bg rounded mb-1" />
                <div className="h-6 w-1/2 bg-brand-bg rounded mb-5" />
                <div className="space-y-2">
                  <div className="h-3 w-12 bg-brand-bg-blue rounded" />
                  <div className="h-3 bg-brand-bg rounded" />
                  <div className="h-3 w-4/5 bg-brand-bg rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Lessen van de week */}
        {!busy && activeTab === "week" && meta && (
          <>
            {meta.ophaalDatum && (
              <p className="text-xs text-brand-darkgray/40 mb-6 animate-fade-in">
                Opgehaald op {formatDatum(meta.ophaalDatum)}
                {" · "}periode {formatDatum(meta.periodeVan!)} –{" "}
                {formatDatum(meta.periodeTot!)}
                {" · "}
                {meta.aantalRuw} uitspraken gevonden
                {" · "}
                {items.length} relevante uitspraken
              </p>
            )}
            {items.length > 0 ? (
              <div className="space-y-4 animate-slide-in">
                {items.map((item) => (
                  <DigestCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="font-semibold text-brand-darkgray mb-1">
                  Geen relevante uitspraken deze week
                </p>
                <p className="text-sm text-brand-darkgray/60">
                  In de afgelopen 14 dagen zijn geen uitspraken over schikken
                  gevonden.
                </p>
              </div>
            )}
          </>
        )}

        {/* Tab: Lessen tot nu toe */}
        {!busy && activeTab === "totnutoe" && meta && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              {lessenDatum ? (
                <p className="text-xs text-brand-darkgray/40">
                  Bijgehouden vanaf {formatDatum(lessenDatum)}
                </p>
              ) : (
                <span />
              )}
              {lessen.length > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-brand-darkgray/50 mr-1">Sorteer</span>
                  {(["categorie", "datum"] as LessenSort[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setLessenSort(s)}
                      className={`px-2.5 py-1 rounded-brand font-semibold transition-colors ${
                        lessenSort === s
                          ? "bg-brand-bg-blue text-brand-blue"
                          : "text-brand-darkgray/50 hover:text-brand-darkgray"
                      }`}
                    >
                      {s === "categorie" ? "op onderwerp" : "op datum"}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {lessen.length > 0 ? (
              lessenSort === "categorie" ? (
                <div className="space-y-6">
                  {(
                    [
                      "Schikkingsadvies",
                      "Vaststellingsovereenkomst",
                      "Onderhandelingen",
                      "Hoedanigheid advocaat",
                      "Overig",
                    ] as const
                  ).map((cat) => {
                    const groep = lessen.filter(
                      (l) => (l.categorie ?? "Overig") === cat,
                    );
                    if (groep.length === 0) return null;
                    return (
                      <div key={cat}>
                        <p className="text-xs font-bold uppercase tracking-wider text-brand-blue mb-2">
                          {cat}
                        </p>
                        <div className="bg-brand-white rounded-brand shadow-brand p-5 space-y-2.5">
                          {groep.map((les, i) => (
                            <LesRegel key={i} les={les} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    const metDatum = lessen.map((les) => ({
                      les,
                      datum: les.bronnen.reduce(
                        (max, b) => (b.datum > max ? b.datum : max),
                        "",
                      ),
                    }));
                    const groepen = new Map<string, typeof metDatum>();
                    for (const item of metDatum) {
                      const key = item.datum.slice(0, 7) || "onbekend";
                      if (!groepen.has(key)) groepen.set(key, []);
                      groepen.get(key)!.push(item);
                    }
                    const gesorteerd = [...groepen.entries()].sort((a, b) =>
                      b[0].localeCompare(a[0]),
                    );
                    return gesorteerd.map(([maandKey, groep]) => {
                      const label =
                        maandKey === "onbekend"
                          ? "Datum onbekend"
                          : new Date(maandKey + "-01").toLocaleDateString(
                              "nl-NL",
                              { month: "long", year: "numeric" },
                            );
                      groep.sort((a, b) => b.datum.localeCompare(a.datum));
                      return (
                        <div key={maandKey}>
                          <p className="text-xs font-bold uppercase tracking-wider text-brand-blue mb-2">
                            {label}
                          </p>
                          <div className="bg-brand-white rounded-brand shadow-brand p-5 space-y-2.5">
                            {groep.map(({ les }, i) => (
                              <LesRegel key={i} les={les} />
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )
            ) : (
              <p className="text-sm text-brand-darkgray/50 text-center py-10">
                Nog geen lessen opgebouwd. Vernieuw de digest om te beginnen.
              </p>
            )}
          </div>
        )}

        {/* Beginstaat — blob nog leeg */}
        {!busy && !meta && !fout && (
          <div className="text-center py-24">
            <p className="text-brand-darkgray/60 text-sm">
              Klik op{" "}
              <strong className="text-brand-darkgray font-semibold">
                Vernieuw
              </strong>{" "}
              om de meest recente uitspraken op te halen.
            </p>
          </div>
        )}
      </div>

      {/* Footer — mino brand */}
      <footer
        className="mt-auto"
        style={{ backgroundColor: "#2D001D", color: "hsl(221 100% 93%)" }}
      >
        <div className="max-w-3xl mx-auto px-6 py-14 sm:py-16">
          <a
            href="https://mino.law"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mb-4 opacity-90 hover:opacity-100 transition-opacity"
            aria-label="mino"
          >
            <svg
              width="420"
              height="101"
              viewBox="0 0 420 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-auto"
              style={{ color: "hsl(221 100% 93%)" }}
            >
              <path
                d="M8.378 34.08V100.252H0V0.851997H41.464L62.196 42.316L78.668 0.851997H124.108V100.252H78.668V25.702L49.7 100.252H37.346L8.378 34.08Z"
                fill="currentColor"
              />
              <path
                d="M132.154 0.851997H178.446V100.252H132.154V0.851997Z"
                fill="currentColor"
              />
              <path
                d="M186.514 0.851997H228.262L269.726 50.552V0.851997H278.246V100.252H244.876L195.176 34.08V100.252H186.514V0.851997Z"
                fill="currentColor"
              />
              <path
                d="M352.675 100.962C339.989 100.962 328.535 99.0213 318.311 95.14C308.087 91.2587 299.993 85.5313 294.029 77.958C288.159 70.29 285.225 61.1073 285.225 50.41C285.225 39.8073 288.207 30.7193 294.171 23.146C300.135 15.5727 308.181 9.84533 318.311 5.964C328.535 1.988 339.989 0 352.675 0C365.265 0 376.625 1.988 386.755 5.964C396.979 9.84533 405.025 15.5727 410.895 23.146C416.859 30.7193 419.841 39.8073 419.841 50.41C419.841 61.1073 416.859 70.29 410.895 77.958C405.025 85.5313 396.979 91.2587 386.755 95.14C376.625 99.0213 365.265 100.962 352.675 100.962ZM352.675 92.584C356.651 92.584 359.585 90.7853 361.479 87.188C363.088 84.4427 364.177 79.5673 364.745 72.562C365.029 68.87 365.171 61.486 365.171 50.41C365.171 39.2393 364.934 31.3347 364.461 26.696C364.177 21.016 363.135 16.7087 361.337 13.774C359.443 10.1767 356.556 8.378 352.675 8.378C348.699 8.378 345.717 10.1767 343.729 13.774C342.119 16.614 341.078 20.9213 340.605 26.696C340.226 31.6187 340.037 39.5233 340.037 50.41C340.037 62.7167 340.179 70.1007 340.463 72.562C340.841 79.094 341.883 83.9693 343.587 87.188C345.575 90.7853 348.604 92.584 352.675 92.584Z"
                fill="currentColor"
              />
            </svg>
          </a>
          <p
            className="text-base leading-relaxed max-w-xl mb-4"
            style={{ color: "hsl(221 100% 93% / 0.85)" }}
          >
            SchikkingsDigest is gemaakt door{" "}
            <a
              href="https://www.linkedin.com/in/lucaslieverse/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-2 transition-colors"
              style={{
                color: "hsl(221 100% 93%)",
                textDecorationColor: "hsl(221 100% 93% / 0.4)",
              }}
            >
              Lucas Lieverse
            </a>
            , docent-onderzoeker HBO-Rechten en gepromoveerd op de Nederlandse
            schikkingspraktijk. Hij geeft trainingen en lezingen aan rechters,
            advocaten en mediators, en bouwde deze digest om zelf bij te houden
            wat de (tucht)rechtspraak ons over schikken leert.
          </p>
          <p
            className="text-sm leading-relaxed max-w-xl mb-8"
            style={{ color: "hsl(221 100% 93% / 0.6)" }}
          >
            Mino is een community van juristen die met AI hun eigen
            praktijktools bouwen.
          </p>
          <div
            className="max-w-xl rounded-lg px-5 py-4 text-sm leading-relaxed"
            style={{
              backgroundColor: "hsl(221 100% 93% / 0.06)",
              border: "1px solid hsl(221 100% 93% / 0.12)",
              color: "hsl(221 100% 93% / 0.85)",
            }}
          >
            <span
              style={{ color: "hsl(221 100% 93%)" }}
              className="font-semibold"
            >
              Wil je ook leren dit soort tools te bouwen?
            </span>{" "}
            Meld je aan voor de volgende{" "}
            <a
              href="https://mino.law/workshop"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-4 transition-colors hover:opacity-80"
              style={{
                color: "hsl(221 100% 93%)",
                textDecorationColor: "hsl(20 85% 55%)",
                textDecorationThickness: "2px",
              }}
            >
              Claude Code workshop
            </a>
            .
          </div>
          <div
            className="mt-10 pt-6 text-xs"
            style={{
              borderColor: "hsl(221 100% 93% / 0.15)",
              color: "hsl(221 100% 93% / 0.45)",
            }}
          >
            SchikkingsDigest maakt gebruik van AI. Controleer de output.
          </div>
        </div>
      </footer>

      {/* Admin-only refresh — geactiveerd via ?admin=1, daarna bewaard in localStorage */}
      {adminMode && (
        <div className="fixed bottom-4 right-4 z-20">
          {showTokenInput ? (
            <form
              onSubmit={handleTokenSubmit}
              className="flex items-center gap-2 bg-brand-white border border-brand-lightgray rounded-brand shadow-brand px-3 py-2"
            >
              <input
                ref={tokenRef}
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Wachtwoord"
                className="px-2 py-1 text-xs rounded-brand border border-brand-lightgray bg-brand-bg focus:outline-none focus:border-brand-blue w-32"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-brand text-xs font-semibold bg-brand-blue text-white hover:bg-brand-darkgray transition-colors"
              >
                <Lock size={10} />
                Ok
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTokenInput(false);
                  setTokenInput("");
                }}
                className="text-xs text-brand-darkgray/50 hover:text-brand-darkgray transition-colors px-1"
              >
                ×
              </button>
            </form>
          ) : (
            <button
              onClick={handleVernieuwClick}
              disabled={busy}
              title="Vernieuw digest (admin)"
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-brand text-xs font-semibold shadow-brand transition-all duration-200 ${
                busy
                  ? "bg-brand-bg text-brand-darkgray/40 cursor-not-allowed"
                  : "bg-brand-darkgray text-white hover:bg-brand-blue"
              }`}
            >
              <RefreshCw
                size={12}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Ophalen…" : "Vernieuw"}
            </button>
          )}
        </div>
      )}
    </main>
  );
}
