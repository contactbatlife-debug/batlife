import { v2p } from "./calculs";

export function calculerAutonomieReelle(history, currentPct, temperature = 20) {

  // Trier par date croissante pour comparer sessions consécutives
  const sorted = [...(history || [])].sort((a, b) => (a.startTs || 0) - (b.startTs || 0));

  const trajets = [];

  for (let i = 0; i < sorted.length; i++) {
    const h = sorted[i];
    const km = h.kmRidden ?? h.kilometres ?? 0;
    if (km <= 0) continue;

    const nominalV = h.nominalVoltage || 48;

    // Niveau à l'arrivée (début de cette charge)
    const startV = h.startV ?? 0;
    const startPct = h.startPct > 0 ? h.startPct : (startV ? v2p(startV, nominalV) : 0);

    // Niveau de départ du trajet = fin de la charge précédente
    let departPct = 0;
    if (i > 0) {
      const prev = sorted[i - 1];
      const prevNominalV = prev.nominalVoltage || 48;
      const prevRealV = prev.realVAfterRest ?? prev.voltageReal ?? prev.targetV ?? 0;
      const prevRealPct = prev.pctReal ?? prev.realPctAfterRest ?? 0;
      departPct = prevRealPct > 0 ? prevRealPct : (prevRealV ? v2p(prevRealV, prevNominalV) : 0);
    }

    if (departPct <= 0 || startPct <= 0 || departPct <= startPct) continue;

    const pctConsomme = departPct - startPct;
    if (pctConsomme > 0 && km > 0) {
      trajets.push({ km, pctConsomme });
    }
  }

  if (trajets.length === 0) {
    return { hasData: false, autonomieRestante: null, consommationParKm: null, autonomieTotale: null, kmRestantsA80: null };
  }

  let totalKm = 0;
  let totalPct = 0;
  trajets.forEach(t => { totalKm += t.km; totalPct += t.pctConsomme; });

  const consommationParKm = totalPct / totalKm;

  let coeffTemp = 1;
  if (temperature < 20) coeffTemp = 1 - (20 - temperature) * 0.005;
  else if (temperature > 30) coeffTemp = 0.95;

  const autonomieTotale = 100 / consommationParKm;
  const autonomieRestante = (currentPct / consommationParKm) * coeffTemp;
  const kmRestantsA80 = (80 / consommationParKm) * coeffTemp;

  return {
    hasData: true,
    consommationParKm: consommationParKm.toFixed(2),
    autonomieTotale: Math.round(autonomieTotale),
    autonomieRestante: Math.round(autonomieRestante),
    kmRestantsA80: Math.round(kmRestantsA80),
    trajetsComptabilises: trajets.length,
  };
}