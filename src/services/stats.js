// src/services/stats.js

/**
 * Calcule toutes les statistiques avancées
 * à partir de l'historique complet des charges
 */
export function calculerStats(history) {
  if (!history || history.length === 0) {
    return {
      totalCycles: 0,
      kmTotaux: 0,
      autonomieMoyenne: 0,
      meilleureAutonomie: 0,
      profondeurMoyenne: 0,
      tempMin: null,
      frequenceHebdo: 0,
      sohMoyen: 100,
      chargesParMode: {},
      meilleurMois: null,
    };
  }

  // === CYCLES ===
  const totalCycles = history.length;

  // === KM TOTAUX ===
  // On récupère le bon champ (kmRidden ou kilometres) et on filtre
  // les valeurs aberrantes (> 500 km par trajet = probablement un timestamp)
  const entriesWithKm = history.filter((h) => {
    const km = h.kmRidden ?? h.kilometres;
    return km && Number(km) > 0 && Number(km) < 500;
  });

  const kmTotaux = Math.round(
    entriesWithKm.reduce((acc, h) => {
      const km = h.kmRidden ?? h.kilometres;
      return acc + Number(km);
    }, 0)
  );

  // === AUTONOMIE MOYENNE (km par charge) ===
  const autonomieMoyenne =
    entriesWithKm.length > 0
      ? Math.round(kmTotaux / entriesWithKm.length)
      : 0;

  // === MEILLEURE AUTONOMIE ===
  const meilleureAutonomie =
    entriesWithKm.length > 0
      ? Math.max(...entriesWithKm.map((h) => Number(h.kmRidden ?? h.kilometres)))
      : 0;

  // === PROFONDEUR MOYENNE DE CHARGE ===
  // (la différence moyenne entre le % de départ et le % de fin)
  const entriesWithPct = history.filter(
    (h) =>
      h.startPct !== undefined &&
      (h.targetPct !== undefined || h.charge !== undefined)
  );

  const profondeurMoyenne =
    entriesWithPct.length > 0
      ? Math.round(
          entriesWithPct.reduce((acc, h) => {
            const depart = h.startPct ?? 0;
            const fin = h.targetPct ?? h.charge ?? 100;
            return acc + Math.abs(fin - depart);
          }, 0) / entriesWithPct.length
        )
      : 0;

  // === TEMPÉRATURE LA PLUS BASSE ===
  const entriesWithTemp = history.filter(
    (h) => h.temperature !== undefined && h.temperature !== null
  );

  const tempMin =
    entriesWithTemp.length > 0
      ? Math.min(...entriesWithTemp.map((h) => h.temperature))
      : null;

  // === FRÉQUENCE HEBDOMADAIRE ===
  const frequenceHebdo = calculerFrequenceHebdo(history);

  // === SoH MOYEN (état de santé basé sur les écarts) ===
  const sohMoyen = calculerSoHMoyen(history);

  // === CHARGES PAR MODE ===
  const chargesParMode = {};
  history.forEach((h) => {
    const mode = h.mode || "inconnu";
    chargesParMode[mode] = (chargesParMode[mode] || 0) + 1;
  });

  // === MEILLEUR MOIS ===
  const meilleurMois = calculerMeilleurMois(history);

  return {
    totalCycles,
    kmTotaux,
    autonomieMoyenne,
    meilleureAutonomie,
    profondeurMoyenne,
    tempMin,
    frequenceHebdo,
    sohMoyen,
    chargesParMode,
    meilleurMois,
  };
}

/**
 * Calcule la fréquence moyenne de charges par semaine
 */
function calculerFrequenceHebdo(history) {
  if (history.length < 2) return 0;

  const timestamps = history
    .map((h) => h.startTs || (h.date ? new Date(h.date).getTime() : null))
    .filter((ts) => ts !== null && ts > 0)
    .sort((a, b) => a - b);

  if (timestamps.length < 2) return 0;

  const premiere = timestamps[0];
  const derniere = timestamps[timestamps.length - 1];
  const dureeMs = derniere - premiere;
  const dureeSemaines = dureeMs / (1000 * 60 * 60 * 24 * 7);

  if (dureeSemaines < 0.1) return history.length; // Très peu de temps = tout est récent

  return Math.round((history.length / dureeSemaines) * 10) / 10;
}

/**
 * Calcule le SoH moyen basé sur les écarts réels vs estimés
 */
function calculerSoHMoyen(history) {
  const entriesWithDelta = history.filter(
    (h) => h.delta !== undefined && h.delta !== null
  );

  if (entriesWithDelta.length === 0) return 100; // Pas de données = parfait

  const avgAbsDelta =
    entriesWithDelta.reduce((acc, h) => acc + Math.abs(h.delta), 0) /
    entriesWithDelta.length;

  // Plus l'écart est petit, meilleur est le SoH
  // 0% d'écart = SoH 100%, 10% d'écart = SoH 80%, etc.
  const soh = Math.max(0, Math.min(100, Math.round(100 - avgAbsDelta * 2)));

  return soh;
}

/**
 * Trouve le mois avec le plus de charges
 */
function calculerMeilleurMois(history) {
  const mois = {};
  const moisNoms = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  history.forEach((h) => {
    const d = new Date(h.startTs || h.date);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    mois[key] = (mois[key] || 0) + 1;
  });

  const entries = Object.entries(mois);
  if (entries.length === 0) return null;

  const best = entries.reduce((a, b) => (a[1] > b[1] ? a : b));
  const [year, month] = best[0].split("-");

  return {
    nom: `${moisNoms[parseInt(month)]} ${year}`,
    nombre: best[1],
  };
}