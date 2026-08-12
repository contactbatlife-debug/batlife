// ============================================================
// BatLife — previsionService.js
// Prévision de remplacement batterie basée sur le SoH
// ============================================================
//
// ⚠️ IMPORTANT : Sans mesure directe de capacité (Ah réels vs Ah
// nominaux), il n'existe AUCUN moyen fiable de calculer le vrai
// SoH d'une batterie Li-ion à partir du seul écart de tension
// après repos. Cet écart dépend surtout de la température
// ambiante et de l'heure de mesure, pas de la santé des cellules.
//
// Cette fonction fournit donc une ESTIMATION TRÈS PRUDENTE,
// fortement lissée, qui ne doit jamais chuter brutalement sur
// la base de quelques sessions. Le but est d'éviter de générer
// une fausse alerte anxiogène pour l'utilisateur.

const SOH_REMPLACEMENT = 70;

// ✅ Calcule un indice de confiance basé sur le nombre de sessions
function calculerConfiance(nbSessions) {
  if (nbSessions >= 21) return "forte";
  if (nbSessions >= 13) return "moyenne";
  return "faible";
}

export function calculerPrevision(history, sohInitial = 100) {
  // ✅ Le point de départ de la courbe est donné par l'utilisateur
  const sohMax = Math.max(70, Math.min(100, Number(sohInitial) || 100));

  const sessionsReelles = history
    .filter(h => h.realMeasure === true && h.delta !== null && h.delta !== undefined)
    .sort((a, b) => (a.startTs || a.date || 0) - (b.startTs || b.date || 0));

  if (sessionsReelles.length < 8) {
    return { disponible: false, raison: "pas_assez_delta" };
  }

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
    // ✅ Indice de confiance basé sur le volume de données
  const confiance = calculerConfiance(sessionsReelles.length);

  // ✅ Fenêtre large (10 sessions) pour lisser fortement le bruit de mesure
  const fenetre = Math.min(10, Math.floor(sessionsReelles.length / 2));

  // Référence "batterie neuve" = moyenne des 8 premières sessions
  const refGroupe = sessionsReelles.slice(0, Math.min(8, sessionsReelles.length));
  const deltaRef = refGroupe.reduce((acc, s) => acc + Math.abs(s.delta), 0) / refGroupe.length;

  const pointsSohBrut = [];
  for (let i = 0; i <= sessionsReelles.length - fenetre; i++) {
    const groupe = sessionsReelles.slice(i, i + fenetre);
    const avgDelta = groupe.reduce((acc, s) => acc + Math.abs(s.delta), 0) / fenetre;
    const derive = Math.max(0, avgDelta - deltaRef);
    // Facteur très conservateur : 0.5 au lieu de 1.5/2
    const soh = Math.max(70, Math.min(sohMax, sohMax - derive * 0.5));
    const ts = groupe[Math.floor(fenetre / 2)].startTs || groupe[Math.floor(fenetre / 2)].date;
    pointsSohBrut.push({ ts, soh });
  }

  if (pointsSohBrut.length < 2) {
    return { disponible: false, raison: "pas_assez_points" };
  }

  // ✅ Lissage supplémentaire : moyenne mobile sur les points déjà lissés
  // pour éliminer les derniers sauts brusques visibles dans le graphique
  const pointsSoH = pointsSohBrut.map((p, i) => {
    const debut = Math.max(0, i - 2);
    const fin = Math.min(pointsSohBrut.length, i + 3);
    const voisins = pointsSohBrut.slice(debut, fin);
    const sohLisse = voisins.reduce((acc, v) => acc + v.soh, 0) / voisins.length;
    return { ts: p.ts, soh: Math.round(sohLisse * 10) / 10 };
  });

  const sohActuel = Math.round(pointsSoH[pointsSoH.length - 1].soh);

  // Régression linéaire
  const n = pointsSoH.length;
  const tsMin = pointsSoH[0].ts;
  const xs = pointsSoH.map(p => (p.ts - tsMin) / MS_PER_DAY);
  const ys = pointsSoH.map(p => p.soh);

  const sumX  = xs.reduce((a, b) => a + b, 0);
  const sumY  = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
  const sumX2 = xs.reduce((acc, x) => acc + x * x, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (Math.abs(denom) < 0.001) {
        return {
      disponible: true, sohActuel, tendance: "stable", confiance,
      degradationParMois: 0, cyclesRestants: null,
      dateRemplacement: null, moisRestants: null, pointsSoH,
    };
  }

  const pente   = (n * sumXY - sumX * sumY) / denom;
  const origine = (sumY - pente * sumX) / n;

  // ✅ Plafond très strict : max 5% de dégradation par an (0.0137%/jour)
  // C'est déjà une dégradation rapide pour une Li-ion bien utilisée.
  const penteMax = -0.0137;
  const penteLissee = Math.max(penteMax, pente);

  // Seuil de détection plus tolérant pour éviter les faux positifs
   if (penteLissee >= -0.008 || sohMax <= 75) {
       return {
      disponible: true, sohActuel, tendance: "stable", confiance,
      degradationParMois: 0, cyclesRestants: null,
      dateRemplacement: null, moisRestants: null, pointsSoH,
    };
  }

  const joursActuels = (Date.now() - tsMin) / MS_PER_DAY;
  const sohActuelCalcule = origine + penteLissee * joursActuels;
  const joursRestants = (SOH_REMPLACEMENT - sohActuelCalcule) / penteLissee;

  if (joursRestants <= 0) {
        return {
      disponible: true, sohActuel, tendance: "critique", confiance,
      degradationParMois: Math.abs(Math.round(penteLissee * 30 * 10) / 10),
      cyclesRestants: 0, dateRemplacement: new Date(), moisRestants: 0, pointsSoH,
    };
  }

  const dateRemplacement = new Date(Date.now() + joursRestants * MS_PER_DAY);
  const moisRestants = Math.round(joursRestants / 30);

  const premiereSession = sessionsReelles[0].startTs || sessionsReelles[0].date;
  const derniereSession = sessionsReelles[sessionsReelles.length - 1].startTs || sessionsReelles[sessionsReelles.length - 1].date;
  const dureeTotaleMs = derniereSession - premiereSession;
  const cyclesParJour = dureeTotaleMs > 0 ? sessionsReelles.length / (dureeTotaleMs / MS_PER_DAY) : 0;
  const cyclesRestants = Math.round(cyclesParJour * joursRestants);

  const degradationParMois = Math.abs(Math.round(penteLissee * 30 * 10) / 10);

  let tendance = "bonne";
  if (moisRestants < 6)   tendance = "critique";
  else if (moisRestants < 18) tendance = "attention";

    return {
    disponible: true, sohActuel, tendance, confiance, degradationParMois,
    cyclesRestants: Math.max(0, cyclesRestants),
    dateRemplacement, moisRestants: Math.max(0, moisRestants), pointsSoH,
  };
}
