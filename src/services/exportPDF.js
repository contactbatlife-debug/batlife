import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { energyStats } from "./energyService";
import { calculerPrevision } from "./previsionService";

/**
 * Exporte l'historique + stats + graphique en PDF
 */
export async function exporterPDF({ history, stats, profile, chartRef }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = 210;
  const pageH = 297;
  const margin = 14;
  const colW = pageW - margin * 2;
  let y = margin;

  const couleurPrimaire  = [14, 165, 233];
  const couleurTexte     = [15, 23, 42];
  const couleurGris      = [100, 116, 139];
  const couleurLigne     = [226, 232, 240];

  const checkPage = (hauteur = 10) => {
    if (y + hauteur > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const ligne = () => {
    doc.setDrawColor(...couleurLigne);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 4;
  };

  // EN-TÊTE
  doc.setFillColor(...couleurPrimaire);
  doc.rect(0, 0, pageW, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("BatLife — Rapport de batterie", margin, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
  doc.text(`Généré le ${dateStr}`, margin, 20);

  if (profile?.customName || profile?.nominalVoltage) {
    const bat = `${profile.customName || "Batterie"} — ${profile.nominalVoltage}V · ${profile.capacityAh}Ah`;
    doc.text(bat, pageW - margin - doc.getTextWidth(bat), 20);
  }

  y = 36;

  // STATS RÉSUMÉ
  doc.setTextColor(...couleurTexte);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Statistiques globales", margin, y);
  y += 6;
  ligne();

  const statItems = [
    ["Cycles totaux",         `${stats.totalCycles}`],
    ["Km totaux",             stats.kmTotaux > 0 ? `${stats.kmTotaux} km` : "—"],
    ["Autonomie moyenne",     stats.autonomieMoyenne > 0 ? `${stats.autonomieMoyenne} km` : "—"],
    ["Meilleure autonomie",   stats.meilleureAutonomie > 0 ? `${stats.meilleureAutonomie} km` : "—"],
    ["Profondeur moyenne",    stats.profondeurMoyenne > 0 ? `${stats.profondeurMoyenne}%` : "—"],
    ["Temp. minimale",        stats.tempMin !== null ? `${stats.tempMin}°C` : "—"],
    ["Fréquence hebdo",       stats.frequenceHebdo > 0 ? `${stats.frequenceHebdo}/sem` : "—"],
    ["Indice de santé (SoH)", `${stats.sohMoyen}%`],
  ];

  const colW2 = colW / 2 - 4;
  statItems.forEach(([label, val], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const xPos = margin + col * (colW2 + 8);
    const yPos = y + row * 10;

    checkPage(12);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(xPos, yPos - 5, colW2, 8, 2, 2, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...couleurGris);
    doc.text(label, xPos + 3, yPos - 0.5);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...couleurTexte);
    doc.text(val, xPos + colW2 - 3 - doc.getTextWidth(val), yPos - 0.5);
  });

  y += Math.ceil(statItems.length / 2) * 10 + 6;

  // GRAPHIQUE
  if (chartRef?.current) {
    checkPage(70);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...couleurTexte);
    doc.text("Évolution des charges", margin, y);
    y += 6;
    ligne();

    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const imgH = (canvas.height / canvas.width) * colW;
      checkPage(imgH + 4);
      doc.addImage(imgData, "PNG", margin, y, colW, imgH);
      y += imgH + 8;
    } catch (e) {
      console.warn("Capture graphique impossible :", e);
      y += 4;
    }
  }

  // HISTORIQUE
  checkPage(20);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...couleurTexte);
  doc.text(`Historique des charges (${history.length})`, margin, y);
  y += 6;
  ligne();

  const cols = [
    { label: "Date",      w: 32 },
    { label: "Mode",      w: 22 },
    { label: "Départ",    w: 20 },
    { label: "Cible",     w: 20 },
    { label: "Réel",      w: 22 },
    { label: "Écart",     w: 18 },
    { label: "Km",        w: 16 },
    { label: "Temp",      w: 16 },
    { label: "Mesure",    w: 26 },
  ];

  const drawHeader = () => {
    doc.setFillColor(...couleurPrimaire);
    doc.rect(margin, y - 4, colW, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    let x = margin + 2;
    cols.forEach(c => {
      doc.text(c.label, x, y);
      x += c.w;
    });
    y += 5;
    doc.setTextColor(...couleurTexte);
  };

  drawHeader();

  const estExpert = profile?.level === "expert";

  history.forEach((item, idx) => {
    checkPage(8);
    if (y === margin + 5) drawHeader();

    const d = new Date(item.startTs || item.date);
    const dateStr2 = isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit"
    });

    const mode = (() => {
      const m = String(item.mode || "").toLowerCase();
      if (m.includes("daily") || m.includes("quotidien")) return "Quotidien";
      if (m.includes("course") || m.includes("grande"))   return "Sortie";
      return item.mode || "—";
    })();

    const depart = estExpert ? `${item.startV}V`   : `${item.startPct}%`;
    const cible  = estExpert ? `${item.targetV}V`  : `${item.targetPct}%`;
    const reel   = estExpert
      ? (item.voltageReal ? `${item.voltageReal}V` : "—")
      : (item.pctReal     ? `${item.pctReal}%`     : "—");
    const ecart  = estExpert
      ? (item.deltaV != null ? `${item.deltaV > 0 ? "+" : ""}${item.deltaV}V` : "—")
      : (item.delta  != null ? `${item.delta  > 0 ? "+" : ""}${item.delta}%`  : "—");
    const km     = item.kmRidden ?? item.kilometres;
    const temp   = item.temperature != null ? `${item.temperature}°C` : "—";
    const mesure = item.realMeasure ? "Réelle" : "Estimée";

    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 4, colW, 6.5, "F");
    }

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");

    const vals = [dateStr2, mode, depart, cible, reel, ecart,
      km ? `${km} km` : "—", temp, mesure];
    let x = margin + 2;
    vals.forEach((v, i) => {
      doc.text(String(v), x, y);
      x += cols[i].w;
    });

    y += 6.5;
  });

  // PIED DE PAGE
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(...couleurGris);
    doc.text(
      `BatLife · Page ${p}/${totalPages} · batlife.app`,
      pageW / 2,
      pageH - 6,
      { align: "center" }
    );
  }

  const filename = `batlife-rapport-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

// ============================================================
// CERTIFICAT DE SANTÉ BATTERIE
// Une page unique, pensée pour la revente de VAE d'occasion
// ============================================================
export async function exporterCertificat({ history, profile }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = 210;
  const pageH = 297;
  const margin = 16;
  const colW = pageW - margin * 2;

  const cyan    = [14, 165, 233];
  const vert    = [74, 222, 128];
  const dark    = [10, 24, 48];
  const gris    = [100, 116, 139];
  const blanc   = [255, 255, 255];
  const vertF   = [34, 197, 94];

  // Helpers
  const box = (x, y, w, h, r, fill) => {
    doc.setFillColor(...fill);
    doc.roundedRect(x, y, w, h, r, r, "F");
  };

  const txt = (text, x, y, size, color, style = "normal", align = "left") => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    doc.setTextColor(...color);
    doc.text(String(text), x, y, { align });
  };

  // ── FOND ──────────────────────────────────────────────────
  doc.setFillColor(...dark);
  doc.rect(0, 0, pageW, pageH, "F");

  // Bandeau supérieur cyan
  doc.setFillColor(...cyan);
  doc.rect(0, 0, pageW, 38, "F");

  // Liseré vert en bas du bandeau
  doc.setFillColor(...vert);
  doc.rect(0, 36, pageW, 2, "F");

  // ── TITRE ─────────────────────────────────────────────────
  txt("CERTIFICAT DE SUIVI DE BATTERIE", pageW / 2, 14, 16, blanc, "bold", "center");
  txt("batlife.app — Outil de suivi indépendant", pageW / 2, 22, 9, [200, 235, 255], "normal", "center");

  const dateGen = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric"
  });
  txt(`Généré le ${dateGen}`, pageW / 2, 30, 8, [180, 220, 255], "normal", "center");

  // ── INFOS BATTERIE ────────────────────────────────────────
  let y = 48;
  box(margin, y, colW, 22, 4, [15, 35, 65]);
  doc.setDrawColor(...cyan);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, colW, 22, 4, 4);

  txt("BATTERIE SUIVIE", margin + 6, y + 7, 7, [120, 180, 220], "bold");
  txt(
    profile?.customName || "Ma Batterie",
    margin + 6, y + 15, 13, blanc, "bold"
  );
  const specsBat = `${profile?.nominalVoltage || 48}V · ${profile?.capacityAh || 15}Ah · ${(profile?.nominalVoltage || 48) * (profile?.capacityAh || 15)} Wh`;
  txt(specsBat, pageW - margin - 6, y + 15, 11, [120, 200, 255], "bold", "right");

  // Période de suivi
  const sorted = [...history].sort((a, b) => (a.startTs || 0) - (b.startTs || 0));
  const premiere = sorted[0] ? new Date(sorted[0].startTs || sorted[0].date) : null;
  const derniere = sorted[sorted.length - 1] ? new Date(sorted[sorted.length - 1].startTs || sorted[sorted.length - 1].date) : null;

  if (premiere && derniere) {
    const periodeStr = `Suivi depuis ${premiere.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`;
    txt(periodeStr, pageW - margin - 6, y + 7, 7, [120, 180, 220], "normal", "right");
  }

  // ── CHIFFRES CLÉS ─────────────────────────────────────────
  y += 30;
  txt("CHIFFRES CLÉS", margin, y, 8, [120, 180, 220], "bold");
  y += 5;

  const kmTotaux = Math.round(history.reduce((acc, s) => acc + (s.kmRidden ?? s.kilometres ?? 0), 0));
  const cycles = history.length;
  const energy = energyStats(history, profile);
  const prevision = calculerPrevision(history);
  const sohActuel = prevision?.disponible ? prevision.sohActuel : null;

  const kpis = [
    { val: `${cycles}`, label: "Charges\nenregistrées", color: cyan },
    { val: kmTotaux > 0 ? `${kmTotaux} km` : "—", label: "Distance\ntotale", color: vert },
    { val: energy.disponible ? `${energy.whPerKm} Wh` : "—", label: "Consommation\n/ km", color: [251, 146, 60] },
    { val: sohActuel ? `${sohActuel}%` : "—", label: "Indicateur\nde capacité", color: [167, 139, 250] },
  ];

  const kpiW = colW / 4 - 3;
  kpis.forEach((kpi, i) => {
    const xPos = margin + i * (kpiW + 4);
    box(xPos, y, kpiW, 28, 4, [15, 35, 65]);
    doc.setDrawColor(...kpi.color);
    doc.setLineWidth(0.4);
    doc.roundedRect(xPos, y, kpiW, 28, 4, 4);

    // Valeur
    doc.setFontSize(kpi.val.length > 5 ? 13 : 16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...kpi.color);
    doc.text(kpi.val, xPos + kpiW / 2, y + 13, { align: "center" });

    // Label sur 2 lignes
    const lines = kpi.label.split("\n");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...gris);
    lines.forEach((l, li) => {
      doc.text(l, xPos + kpiW / 2, y + 19 + li * 4, { align: "center" });
    });
  });

  // ── BARRE SOH ─────────────────────────────────────────────
  y += 36;
  if (sohActuel) {
    txt("INDICATEUR DE CAPACITÉ (SoH estimé)", margin, y, 8, [120, 180, 220], "bold");
    y += 5;

    // Fond barre
    box(margin, y, colW, 8, 4, [20, 45, 80]);

    // Remplissage
    const pct = Math.max(0, Math.min(100, ((sohActuel - 70) / 30) * 100));
    const fillW = colW * pct / 100;
    const fillColor = sohActuel >= 85 ? vertF : sohActuel >= 70 ? [250, 204, 21] : [248, 113, 113];
    box(margin, y, fillW, 8, 4, fillColor);

    // Marqueur 70%
    const x70 = margin + colW * 0;
    doc.setDrawColor(248, 113, 113);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin, y + 8);

    txt(`${sohActuel}%`, margin + fillW + 3, y + 6, 8, blanc, "bold");
    txt("Seuil remplacement : 70%", pageW - margin, y + 6, 7, [248, 113, 113], "normal", "right");

    y += 14;

    // Message état
    const etatMsg = sohActuel >= 85
      ? "Batterie en bonne sante - usage quotidien recommande"
      : sohActuel >= 70
        ? "Batterie a surveiller - envisager le remplacement"
        : "Remplacement recommande";
    const etatColor = sohActuel >= 85 ? vertF : sohActuel >= 70 ? [250, 204, 21] : [248, 113, 113];
    box(margin, y, colW, 9, 3, [15, 35, 65]);
    txt(etatMsg, pageW / 2, y + 6, 8, etatColor, "bold", "center");
    y += 14;
  }

  // ── PRÉVISION ─────────────────────────────────────────────
  if (prevision?.disponible && prevision.dateRemplacement) {
    const dateRemp = prevision.dateRemplacement.toLocaleDateString("fr-FR", {
      month: "long", year: "numeric"
    });
    box(margin, y, colW, 14, 4, [15, 35, 65]);
    doc.setDrawColor(...[167, 139, 250]);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, colW, 14, 4, 4);
    txt("Remplacement estime :", margin + 6, y + 6, 8, [120, 180, 220], "normal");
    txt(`dans ${prevision.moisRestants} mois (${dateRemp})`, margin + 6, y + 11, 9, [167, 139, 250], "bold");
    if (prevision.degradationParMois > 0) {
      txt(`Dégradation estimée : -${prevision.degradationParMois}% SoH/mois`, pageW - margin - 6, y + 8.5, 8, gris, "normal", "right");
    }
    y += 20;
  }

  // ── BONNES PRATIQUES ──────────────────────────────────────
  txt("BONNES PRATIQUES OBSERVÉES", margin, y, 8, [120, 180, 220], "bold");
  y += 5;

  const sessionsReelles = history.filter(h => h.realMeasure).length;
  const pctReelles = history.length > 0 ? Math.round(sessionsReelles / history.length * 100) : 0;
  const chargesQuotidiennes = history.filter(h => {
    const m = String(h.mode || "").toLowerCase();
    return m.includes("daily") || m.includes("quotidien");
  }).length;
  const pctQuotidien = history.length > 0 ? Math.round(chargesQuotidiennes / history.length * 100) : 0;

  const pratiques = [
    { label: "Charges à 80% (mode quotidien)", val: `${pctQuotidien}%` },
    { label: "Mesures réelles après repos",    val: `${pctReelles}%` },
    { label: "Sessions enregistrées",          val: `${cycles}` },
  ];

  const pratW = colW / 3 - 3;
  pratiques.forEach((p, i) => {
    const xPos = margin + i * (pratW + 4.5);
    box(xPos, y, pratW, 18, 3, [15, 35, 65]);
    txt(p.val, xPos + pratW / 2, y + 8, 14, cyan, "bold", "center");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...gris);
    const lines = doc.splitTextToSize(p.label, pratW - 4);
    lines.forEach((l, li) => {
      doc.text(l, xPos + pratW / 2, y + 13 + li * 3.5, { align: "center" });
    });
  });

  // ── DISCLAIMER ────────────────────────────────────────────
  y = pageH - 42;
  doc.setDrawColor(...gris);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  const disclaimer = "Ce certificat est généré automatiquement à partir des données saisies par l'utilisateur dans BatLife. Il ne constitue pas un diagnostic technique des cellules et ne remplace pas une expertise professionnelle. L'indicateur de capacité (SoH) est une estimation basée sur des mesures de tension après repos — à titre indicatif uniquement.";
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...gris);
  const lines = doc.splitTextToSize(disclaimer, colW);
  lines.forEach((l, i) => {
    doc.text(l, margin, y + i * 3.5);
  });

  // ── QR / SIGNATURE ────────────────────────────────────────
  y = pageH - 16;
  txt("Généré par BatLife.app — Outil de gestion de batterie gratuit · contact.batlife@gmail.com", pageW / 2, y, 7, gris, "normal", "center");

  // ── SAUVEGARDE ────────────────────────────────────────────
  const nomFichier = `batlife-certificat-${(profile?.customName || "batterie").replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(nomFichier);
}