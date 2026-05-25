import { v2p, p2v, vdb } from "./calculs";
import { applyTempCorrection } from "./temperature";

// Calcule la durée totale de charge en millisecondes
export function calculerDureeCharge({
  startV,
  startPct,
  targetV,
  targetPct,
  nominalVoltage,
  capacityAh,
  chargerCurrent,
  temperature
}) {
  const chargerAmps = Math.min(chargerCurrent || 2, 10);
  const totalCapWh = (capacityAh || 15) * nominalVoltage;
  const chargerPowerW = nominalVoltage * chargerAmps * 0.88;
  const deltaPct = targetPct - startPct;
  const energyNeededWh = (deltaPct / 100) * totalCapWh;
  const cvFactor = targetPct > 85 ? 1.25 : 1.10;
  let durationMs = (energyNeededWh / chargerPowerW) * 3600 * 1000 * cvFactor;

  // Correction température
  durationMs = applyTempCorrection(durationMs, temperature);

  return Math.round(durationMs);
}

// Démarre une nouvelle session de charge
export function creerSessionCharge({
  startV,
  startPct,
  targetV,
  targetPct,
  mode,
  vehicle,
  nominalVoltage,
  capacityAh,
  chargerCurrent,
  temperature,
  level,
  kmRidden
}) {
  const durationMs = calculerDureeCharge({
    startV,
    startPct,
    targetV,
    targetPct,
    nominalVoltage,
    capacityAh,
    chargerCurrent,
    temperature
  });

  return {
    startV,
    startPct,
    targetV,
    targetPct,
    mode,
    vehicle,
    nominal: nominalVoltage,
    level,
    startTs: Date.now(),
    endTs: Date.now() + durationMs,
    durationMs,
    kmRidden: kmRidden || null,
    temperature
  };
}

// Calcule la progression d'une charge en cours
export function calculerProgression(activeCharge) {
  if (!activeCharge) return null;

  const elapsed = Date.now() - activeCharge.startTs;
  const remaining = activeCharge.endTs - Date.now();
  const ratio = Math.min(1, elapsed / activeCharge.durationMs);

  // Tension actuelle estimée (interpolation linéaire)
  const currentV = +(activeCharge.startV +
    (activeCharge.targetV - activeCharge.startV) * ratio).toFixed(1);
  const currentPct = Math.round(activeCharge.startPct +
    (activeCharge.targetPct - activeCharge.startPct) * ratio);

  return {
    elapsed,
    remaining: Math.max(0, remaining),
    ratio,
    currentV,
    currentPct,
    isComplete: remaining <= 0
  };
}

// Calcule la cible selon le mode choisi
export function calculerCible({ mode, calibration, nominalVoltage }) {
  const targetV = mode === "daily" ? calibration.daily : calibration.course;
  const targetPct = v2p(targetV, nominalVoltage);
  return { targetV, targetPct };
}