const REST_END_TS_KEY              = "bl_rest_end_ts";
const REST_CHARGE_SNAPSHOT_KEY     = "bl_rest_charge_snapshot";
const REST_NOTIFIED_FOR_END_TS_KEY = "bl_rest_notified_for_end_ts";

export const REST_DURATION_MS = 30 * 60 * 1000;

// Délai max après lequel on considère le timer comme "expiré/abandonné"
// Si l'app est rouverte plus de 2h après la fin du repos, on efface tout
const REST_MAX_STALE_MS = 2 * 60 * 60 * 1000;

/* ============================================================
   COMMUNICATION AVEC LE SERVICE WORKER
   ============================================================ */
function scheduleSwNotification(title, body, delayMs) {
  if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller) {
    setTimeout(() => {
      if (Notification.permission === "granted") {
        try { new Notification(title, { body, icon: "/icon-192x192.png" }); } catch {}
      }
    }, delayMs);
    return;
  }

  navigator.serviceWorker.controller.postMessage({
    action: "scheduleNotification",
    delay:  delayMs,
    title,
    body,
  });
}

function cancelSwNotification() {
  if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller) return;
  navigator.serviceWorker.controller.postMessage({ action: "cancelNotification" });
}

/* ============================================================
   DÉMARRAGE DU TIMER DE REPOS
   ============================================================ */
export const startRestTimer = (chargeSession, durationMs = REST_DURATION_MS) => {
  const endTs = Date.now() + durationMs;

  localStorage.setItem(REST_END_TS_KEY, String(endTs));
  localStorage.setItem(REST_NOTIFIED_FOR_END_TS_KEY, "");

  if (chargeSession) {
    localStorage.setItem(REST_CHARGE_SNAPSHOT_KEY, JSON.stringify(chargeSession));
  }

  scheduleSwNotification(
    "BatLife : repos terminé",
    "Les 30 minutes de repos sont écoulées. Mesurez maintenant la valeur réelle.",
    durationMs
  );

  return endTs;
};

/* ============================================================
   ANNULATION DU TIMER
   ============================================================ */
export const clearRestTimer = () => {
  localStorage.removeItem(REST_END_TS_KEY);
  localStorage.removeItem(REST_CHARGE_SNAPSHOT_KEY);
  localStorage.removeItem(REST_NOTIFIED_FOR_END_TS_KEY);
  cancelSwNotification();
  
  // ✅ Sentinelle pour bloquer tout re-déclenchement
  localStorage.setItem(REST_END_TS_KEY, "0");
};

/* ============================================================
   GETTERS
   ============================================================ */
export const getRestEndTs = () => {
  const value = localStorage.getItem(REST_END_TS_KEY);
  const n = value ? Number(value) : 0;
  if (n <= 0) return null;

  // ✅ FIX : si le timer est terminé depuis plus de REST_MAX_STALE_MS,
  // on considère que la session a été abandonnée → on nettoie tout
  if (Date.now() > n + REST_MAX_STALE_MS) {
    clearRestTimer();
    return null;
  }

  return n;
};

export const getRestTimeRemaining = () => {
  const endTs = getRestEndTs();
  if (!endTs) return 0;
  return Math.max(0, endTs - Date.now());
};

export const getRestChargeSnapshot = () => {
  const raw = localStorage.getItem(REST_CHARGE_SNAPSHOT_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

/* ============================================================
   FORMAT MM:SS
   ============================================================ */
export const formatMMSS = (ms) => {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

/* ============================================================
   NOTIFICATION DE FIN DE REPOS
   ============================================================ */
export const triggerRestNotificationOnce = ({ endTs, title, body } = {}) => {
  if (!endTs) return;

  const alreadyNotified = localStorage.getItem(REST_NOTIFIED_FOR_END_TS_KEY);
  if (String(alreadyNotified) === String(endTs)) return;

  localStorage.setItem(REST_NOTIFIED_FOR_END_TS_KEY, String(endTs));

  if ("vibrate" in navigator) {
    navigator.vibrate([300, 150, 300, 150, 300]);
  }

  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.0);
  } catch {}
};