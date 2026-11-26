import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const API_BASE = import.meta.env.VITE_API_URL || "";

const ATTEMPT_TIMEOUT_MS = 30_000; // a cold-starting API can hold the first request open for a while
const RETRY_DELAY_MS = 2_000;
const SHOW_WAKING_AFTER_MS = 2_000; // only explain "servers are starting" if it's actually slow
const SHOW_SLOW_AFTER_MS = 45_000;
const GIVE_UP_AFTER_MS = 120_000;
const FADE_MS = 300;

// Pings the API until it answers, then renders the app.
// The hosted API sleeps when idle (Azure free tier), so the first visit can take 10-30 s;
// without this the app would render against a sleeping API and e.g. log the user out.
export function ServerWakeGate({ children }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState("checking"); // checking | waking | slow | failed | fading | ready
  const [attempt, setAttempt] = useState(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();
    const controllers = new Set();

    const timers = [
      setTimeout(() => !cancelled && setPhase((p) => (p === "checking" ? "waking" : p)), SHOW_WAKING_AFTER_MS),
      setTimeout(() => !cancelled && setPhase((p) => (p === "waking" ? "slow" : p)), SHOW_SLOW_AFTER_MS),
    ];

    async function ping() {
      const controller = new AbortController();
      controllers.add(controller);
      const timeout = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
      try {
        const response = await fetch(`${API_BASE}/health/ready`, {
          cache: "no-store",
          signal: controller.signal,
        });
        return response.ok;
      } catch {
        return false;
      } finally {
        clearTimeout(timeout);
        controllers.delete(controller);
      }
    }

    async function run() {
      while (!cancelled) {
        if (await ping()) {
          if (cancelled) return;
          // Skip the fade if the splash was barely visible
          if (Date.now() - startedAt < SHOW_WAKING_AFTER_MS) {
            setPhase("ready");
          } else {
            setPhase("fading");
            setTimeout(() => !cancelled && setPhase("ready"), FADE_MS);
          }
          return;
        }
        if (Date.now() - startedAt > GIVE_UP_AFTER_MS) {
          if (!cancelled) setPhase("failed");
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }

    run();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      controllers.forEach((c) => c.abort());
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setPhase("checking");
    setAttempt((n) => n + 1);
  }, []);

  if (phase === "ready") return children;

  return (
    <>
      {phase === "fading" && children}
      <div
        className={`boot-screen${phase === "fading" ? " boot-fade-out" : ""}`}
        role="status"
        aria-live="polite"
      >
        <p className="boot-wordmark">Athletiqa</p>
        {phase !== "failed" && (
          <div className="boot-track">
            <div className="boot-bar" />
          </div>
        )}
        <p className="boot-message">
          {(phase === "checking" || phase === "fading") && t("Laddar…")}
          {phase === "waking" && (
            <>
              <strong>{t("Servrarna startar")}</strong>
              {t("Sidan har legat i viloläge. Första besöket tar oftast 10–30 sekunder.")}
            </>
          )}
          {phase === "slow" && (
            <>
              <strong>{t("Det tar lite längre tid än vanligt")}</strong>
              {t("Servrarna startar fortfarande, vänta en stund till.")}
            </>
          )}
          {phase === "failed" && (
            <>
              <strong>{t("Kunde inte nå servern")}</strong>
              {t("Kontrollera din anslutning och försök igen.")}
            </>
          )}
        </p>
        {phase === "failed" && (
          <button type="button" className="boot-retry" onClick={retry}>
            {t("Försök igen")}
          </button>
        )}
      </div>
    </>
  );
}

export default ServerWakeGate;
