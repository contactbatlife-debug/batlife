import { TEMP_FACTORS } from "./config";

// Trouve le facteur de température le plus proche
export function getTempFactor(temp) {
  const keys = Object.keys(TEMP_FACTORS).map(Number).sort((a, b) => a - b);
  let closest = keys[0];
  let minDiff = Math.abs(temp - keys[0]);
  keys.forEach(k => {
    const diff = Math.abs(temp - k);
    if (diff < minDiff) {
      minDiff = diff;
      closest = k;
    }
  });
  return TEMP_FACTORS[String(closest)];
}

// Applique la correction de température sur la durée
export function applyTempCorrection(durationMs, temp) {
  const factor = getTempFactor(temp);
  return Math.round(durationMs / factor.chargeFactor);
}

// Retourne le niveau d'alerte température
export function getTempAlert(temp, t) {
  const factor = getTempFactor(temp);
  if (!factor.warning) {
    return { level: "ok", message: t ? t("temp_ok") : "Température idéale" };
  }
  const pctLoss = Math.round((1 - factor.capacityFactor) * 100);
  const messages = {
    danger_frost:   "⚠️ Gel intense : ne pas charger",
    danger_cold:    `❄️ Froid : perte ${pctLoss}% capacité`,
    warning_cold:   "❄️ Froid : performance réduite",
    warning_hot:    "🌡️ Chaud : surveiller la batterie",
    danger_hot:     "🔥 Trop chaud : éviter la charge",
    danger_veryhot: "🔥 Très chaud : ne pas charger"
  };
  return {
    level: factor.level,
    message: messages[factor.warning] || "Température idéale"
  };
}