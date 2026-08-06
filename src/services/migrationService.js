// ============================================================
// BatLife — migrationService.js
// Migration des données HTML v5/v6 vers React v6
// ============================================================

const MIGRATION_DONE_KEY = "bl_migration_v5_done";

// ============================================================
// MAPPING : reliability → typeSaisie
// ============================================================
function mapTypeSaisie(reliability, realMeasure) {
  if (!realMeasure) return "estimation_appli";
  const r = String(reliability || "").toLowerCase();
  if (r === "rested")    return "réelle_voltage";
  if (r === "immediate") return "immédiate_voltage";
  return "réelle_voltage";
}

// ============================================================
// CONVERSION D'UNE SESSION HTML → format React
// ============================================================
function convertSession(raw) {
  const startTs = raw.date - (raw.duration || 0);
  const endTs   = raw.date;

  const targetPct = raw.targetPct ?? raw.estimatedPct ?? null;
  const targetV   = raw.targetV   ?? raw.estimatedV   ?? null;
  const finalPct  = raw.finalPct  ?? null;
  const finalV    = raw.finalV    ?? null;

  // Calcul de l'écart (delta) entre final et cible
  const deltaV   = (finalV   != null && targetV   != null)
    ? Number((finalV   - targetV).toFixed(2))   : null;
  const deltaPct = (finalPct != null && targetPct != null)
    ? Number((finalPct - targetPct).toFixed(1)) : null;

  return {
    // Identifiant unique
    id: `migrated_${raw.date}`,

    // Timestamps
    date:    raw.date,
    startTs: startTs > 0 ? startTs : raw.date,
    endTs,

    // Véhicule
    vehicle:       raw.vehicle   ?? "duotts_c29",
    nominal:       raw.nominal   ?? 48,
    nominalVoltage: raw.nominal  ?? 48,

    // Mode
    mode: raw.mode ?? "daily",

    // Départ
    startV:   raw.startV   ?? null,
    startPct: raw.startPct ?? null,

    // Cible
    targetV,
    targetPct,

    // Final (valeur au débranchement)
    finalV,
    finalPct,

    // Mesure réelle après repos (dans l'ancienne app = finalV/finalPct)
    realMeasure:    raw.realMeasure ?? false,
    typeSaisie:     mapTypeSaisie(raw.reliability, raw.realMeasure),
    realVAfterRest: raw.realMeasure ? finalV   : null,
    realPctAfterRest: raw.realMeasure ? finalPct : null,
    voltageReal:    raw.realMeasure ? finalV   : null,
    pctReal:        raw.realMeasure ? finalPct : null,

    // Écarts
    deltaV,
    delta:      deltaPct,
    deltaPct,
    voltageGap: deltaV,

    // Trajet
    kmRidden:    raw.kmRidden   ?? null,
    kilometres:  raw.kmRidden   ?? null,

    // Conditions
    temperature: raw.temperature ?? null,

    // Durée
    duration:   raw.duration ?? null,
    durationMs: raw.duration ?? null,

    // Marqueur migration
    _migrated: true,
  };
}

// ============================================================
// MIGRATION PRINCIPALE
// Retourne { success, sessionsCount, message }
// ============================================================
export function migrateFromHTML(jsonContent) {
  try {
    const backup = typeof jsonContent === "string"
      ? JSON.parse(jsonContent)
      : jsonContent;

    if (!backup?.data) {
      return { success: false, message: "Format de fichier invalide." };
    }

    const { data } = backup;

    // --- Historique ---
    const rawHistory = data["bl_history_v5"] ?? [];
    if (rawHistory.length === 0) {
      return { success: false, message: "Aucune session trouvée dans ce fichier." };
    }

    const convertedHistory = rawHistory
      .map(convertSession)
      .sort((a, b) => b.startTs - a.startTs); // plus récent en premier

    // --- Profil ---
    const rawProfile = data["bl_profile_v5"] ?? {};
    const convertedProfile = {
      vehicle:        rawProfile.vehicle        ?? "duotts_c29",
      customName:     rawProfile.customName     || "Ma Batterie",
      level:          rawProfile.level          ?? "beginner",
      nominalVoltage: rawProfile.nominalVoltage ?? 48,
      capacityAh:     rawProfile.capacityAh     ?? 15,
      Idefault:       rawProfile.Idefault       ?? 2,
      lang:           rawProfile.lang           ?? "fr",
    };

    // --- Calibration ---
    const rawCalib = data["bl_calibration_v5"] ?? {};
    const convertedCalib = {
      daily:   rawCalib.daily   ?? 51,
      course:  rawCalib.course  ?? 54,
      storage: rawCalib.storage ?? 47.3,
    };

    // --- Température ---
    const temperature = data["bl_temperature_v6"] ?? 20;

    return {
      success: true,
      sessionsCount: convertedHistory.length,
      history:     convertedHistory,
      profile:     convertedProfile,
      calibration: convertedCalib,
      temperature,
      message: `${convertedHistory.length} session(s) prête(s) à importer.`,
    };

  } catch (err) {
    console.error("[Migration] Erreur :", err);
    return { success: false, message: `Erreur de lecture : ${err.message}` };
  }
}

// ============================================================
// VÉRIFICATION : migration déjà effectuée ?
// ============================================================
export function isMigrationDone() {
  return localStorage.getItem(MIGRATION_DONE_KEY) === "true";
}

export function markMigrationDone() {
  localStorage.setItem(MIGRATION_DONE_KEY, "true");
}
