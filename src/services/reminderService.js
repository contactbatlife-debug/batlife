// ============================================================
// BatLife — reminderService.js
// Gère les rappels :
//   1. +5 jours sans aucune charge
//   2. +30 jours sans charge complète (≥ 95%)
// ============================================================

const REMINDER_DAYS_NO_CHARGE   = 5;
const REMINDER_DAYS_FULL_CHARGE = 30;
const FULL_CHARGE_THRESHOLD_PCT = 95; // on considère "pleine" à ≥ 95%

const SW_NOTIF_TAG_NO_CHARGE   = "batlife-reminder-no-charge";
const SW_NOTIF_TAG_FULL_CHARGE = "batlife-reminder-full-charge";

// ============================================================
// CALCUL DE L'ÉTAT DES RAPPELS
// Retourne un objet { noCharge, fullCharge } avec :
//   - active    : boolean — faut-il afficher le rappel ?
//   - daysSince : nombre de jours depuis la dernière charge/charge pleine
// ============================================================
export function calculerRappels(history) {
  const now = Date.now();
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  // --- Rappel 1 : pas de charge depuis X jours ---
  let noCharge = { active: false, daysSince: 0 };
  if (history.length === 0) {
    // Aucun historique → pas de rappel (l'utilisateur découvre l'app)
    noCharge = { active: false, daysSince: 0 };
  } else {
    const lastTs = history.reduce((max, s) => Math.max(max, s.startTs || s.date || 0), 0);
    const daysSince = Math.floor((now - lastTs) / MS_PER_DAY);
    noCharge = {
      active: daysSince >= REMINDER_DAYS_NO_CHARGE,
      daysSince,
    };
  }

  // --- Rappel 2 : pas de charge complète depuis 30 jours ---
  let fullCharge = { active: false, daysSince: 0 };
  const fullSessions = history.filter(
    s => (s.targetPct ?? s.charge ?? 0) >= FULL_CHARGE_THRESHOLD_PCT
  );
  if (fullSessions.length === 0) {
    // Jamais fait de charge pleine mais au moins 30 jours d'historique
    if (history.length > 0) {
      const firstTs = history.reduce((min, s) => Math.min(min, s.startTs || s.date || now), now);
      const daysSinceFirst = Math.floor((now - firstTs) / MS_PER_DAY);
      fullCharge = {
        active: daysSinceFirst >= REMINDER_DAYS_FULL_CHARGE,
        daysSince: daysSinceFirst,
      };
    }
  } else {
    const lastFullTs = fullSessions.reduce((max, s) => Math.max(max, s.startTs || s.date || 0), 0);
    const daysSince = Math.floor((now - lastFullTs) / MS_PER_DAY);
    fullCharge = {
      active: daysSince >= REMINDER_DAYS_FULL_CHARGE,
      daysSince,
    };
  }

  return { noCharge, fullCharge };
}

// ============================================================
// PLANIFICATION DES NOTIFICATIONS PUSH via Service Worker
// À appeler au montage du Dashboard (une fois par session)
// ============================================================
export function planifierNotificationsRappel(history) {
  if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller) return;

  const { noCharge, fullCharge } = calculerRappels(history);
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  // Notification "pas de charge"
  if (!noCharge.active) {
    const joursRestants = REMINDER_DAYS_NO_CHARGE - noCharge.daysSince;
    const delayMs = joursRestants * MS_PER_DAY;
    navigator.serviceWorker.controller.postMessage({
      action: "scheduleReminderNoCharge",
      delay:  delayMs,
      title:  "🔋 BatLife — Rappel de charge",
      body:   `Cela fait ${REMINDER_DAYS_NO_CHARGE} jours que vous n'avez pas rechargé. Pensez à brancher votre vélo !`,
      tag:    SW_NOTIF_TAG_NO_CHARGE,
    });
  }

  // Notification "charge d'équilibrage"
  if (!fullCharge.active) {
    const joursRestants = REMINDER_DAYS_FULL_CHARGE - fullCharge.daysSince;
    const delayMs = Math.max(0, joursRestants) * MS_PER_DAY;
    navigator.serviceWorker.controller.postMessage({
      action: "scheduleReminderFullCharge",
      delay:  delayMs,
      title:  "⚖️ BatLife — Charge d'équilibrage",
      body:   "Cela fait 30 jours sans charge complète. Une charge à 100% mensuelle équilibre vos cellules.",
      tag:    SW_NOTIF_TAG_FULL_CHARGE,
    });
  }
}