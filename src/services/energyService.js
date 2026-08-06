// ============================================================
// BatLife — energyService.js
// Calcul de la consommation énergétique en Wh/km
// ============================================================

/** Capacité totale en Wh selon le profil */
export function whCapacity(profile) {
  const v = profile?.nominalVoltage ?? 48;
  const ah = profile?.capacityAh ?? 15;
  return v * ah;
}

/**
 * Consommation entre deux charges successives.
 * On compare le niveau atteint à la charge N-1 (targetPct)
 * avec le niveau de départ de la charge N (startPct).
 */
export function consumption(prevSession, currSession, profile) {
  const cap = whCapacity(profile);
  const km = currSession?.kmRidden ?? currSession?.kilometres ?? 0;
  if (!cap || !km || km <= 0) return null;

  const startLevel = prevSession?.targetPct ?? prevSession?.finalPct ?? 100;
  const endLevel   = currSession?.startPct ?? 0;
  const usedPct    = startLevel - endLevel;

  if (usedPct <= 0) return null;

  const wh = cap * usedPct / 100;
  const whPerKm = wh / km;

  // Filtre les valeurs physiquement impossibles (< 2 ou > 50 Wh/km)
  if (whPerKm < 2 || whPerKm > 50) return null;

  return {
    wh:      Math.round(wh),
    whPerKm: +whPerKm.toFixed(1),
    usedPct: Math.round(usedPct),
    km,
  };
}

/**
 * Moyenne robuste sur l'historique (médiane, insensible aux valeurs aberrantes).
 * Nécessite au moins 3 sessions avec km enregistrés.
 */
export function avgWhPerKm(history, profile) {
  if (!history || history.length < 2) return null;

  const sorted = [...history].sort(
    (a, b) => (a.startTs || a.date || 0) - (b.startTs || b.date || 0)
  );

  const vals = sorted
    .map((s, i) => consumption(sorted[i - 1], s, profile)?.whPerKm)
    .filter(v => v != null)
    .sort((a, b) => a - b);

  if (vals.length < 3) return null;

  const m = Math.floor(vals.length / 2);
  return vals.length % 2
    ? vals[m]
    : +((vals[m - 1] + vals[m]) / 2).toFixed(1);
}

/**
 * Stats complètes pour l'affichage :
 * - moyenne Wh/km
 * - coût estimé par 100 km (basé sur prix électricité ~0.25€/kWh)
 * - autonomie réelle en km à pleine charge
 */
export function energyStats(history, profile) {
  const whPerKm = avgWhPerKm(history, profile);
  if (!whPerKm) return { disponible: false };

  const cap = whCapacity(profile);
  const autonomieWh = Math.round(cap / whPerKm);
  const coutPour100km = +((whPerKm * 100 / 1000) * 0.25).toFixed(2);

  return {
    disponible: true,
    whPerKm,
    autonomieWh,
    coutPour100km,
    nbSessions: history.filter(s =>
      (s.kmRidden ?? s.kilometres ?? 0) > 0
    ).length,
  };
}
