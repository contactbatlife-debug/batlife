import React, { useState, useMemo, useRef } from "react";
import { useApp } from "../context/AppContext";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Area, AreaChart, ComposedChart,
} from "recharts";
import { calculerStats } from "../services/stats";
import { exporterPDF, exporterCertificat } from "../services/exportPDF";
import { calculerPrevision } from "../services/previsionService";

const ITEMS_PER_PAGE = 6;

const g = {
  card: {
    background:"rgba(255,255,255,0.04)",
    border:"0.5px solid rgba(255,255,255,0.1)",
    borderTop:"0.5px solid rgba(255,255,255,0.16)",
    borderRadius:"16px",
  },
  inner: {
    background:"rgba(0,0,0,0.2)",
    border:"0.5px solid rgba(255,255,255,0.06)",
    borderRadius:"10px",
  },
  label: { color:"rgba(148,197,240,0.5)", fontSize:"12px" },
  subLabel: { color:"rgba(148,197,240,0.38)", fontSize:"10px" },
};

const mesureStyles = {
  reelle:     { bg:"rgba(74,222,128,0.12)",  border:"rgba(74,222,128,0.3)",  color:"#4ade80",  gradFrom:"rgba(74,222,128,0.7)"  },
  immediate:  { bg:"rgba(251,191,36,0.12)",  border:"rgba(251,191,36,0.3)",  color:"#fbbf24",  gradFrom:"rgba(251,191,36,0.7)"  },
  estimation: { bg:"rgba(129,140,248,0.12)", border:"rgba(129,140,248,0.3)", color:"#818cf8",  gradFrom:"rgba(129,140,248,0.7)" },
};

const resumeCards = (stats, sohColor) => [
  { val:stats.totalCycles,      unit:"",    label:"🔋", labelKey:"stats_cycles",           color:"#60a5fa", rgb:"96,165,250"   },
  { val:stats.kmTotaux>0?stats.kmTotaux:"—", unit:stats.kmTotaux>0?" km":"", label:"🛣️", labelKey:"stats_km_totaux", color:"#4ade80", rgb:"74,222,128" },
  { val:stats.autonomieMoyenne>0?stats.autonomieMoyenne:"—", unit:stats.autonomieMoyenne>0?" km":"", label:"📏", labelKey:"stats_autonomie_moyenne", color:"#facc15", rgb:"250,204,21" },
  { val:`${stats.sohMoyen}%`,   unit:"",    label:"🩺", labelKey:"stats_soh_moyen",         color:sohColor,  rgb: stats.sohMoyen>=85?"74,222,128":stats.sohMoyen>=65?"250,204,21":"248,113,113" },
];

function BadgeGlass({ bg, border, color, children }) {
  return (
    <span style={{
      fontSize:"10px", padding:"2px 8px", borderRadius:"8px", fontWeight:500,
      background:bg, border:`0.5px solid ${border}`, color,
      position:"relative", overflow:"hidden",
    }}>
      {children}
    </span>
  );
}

// ============================================================
// TOOLTIP CUSTOM pour le graphique SoH
// ============================================================
function SoHTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const isProjection = item?.payload?.projection;
  const val = item?.value;
  return (
    <div style={{
      background:"rgba(6,12,28,0.97)",
      border:`0.5px solid ${isProjection ? "rgba(251,146,60,0.4)" : "rgba(74,222,128,0.3)"}`,
      borderRadius:"10px", padding:"8px 12px",
      backdropFilter:"blur(12px)",
    }}>
      <p style={{ color:"rgba(148,197,240,0.6)", fontSize:"11px", marginBottom:"2px" }}>{label}</p>
      <p style={{
        color: isProjection ? "#fb923c" : val >= 85 ? "#4ade80" : val >= 70 ? "#facc15" : "#f87171",
        fontWeight:700, fontSize:"13px",
      }}>
        SoH {isProjection ? "~" : ""}{Math.round(val)}%
        {isProjection && <span style={{ fontSize:"10px", marginLeft:"4px", opacity:.7 }}>projection</span>}
      </p>
    </div>
  );
}

// ============================================================
// GRAPHIQUE ÉVOLUTION SOH
// ============================================================
function SoHChart({ prevision, t }) {
  if (!prevision?.disponible || !prevision?.pointsSoH?.length) return null;

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const { pointsSoH, tendance, degradationParMois } = prevision;

  const formatDate = (ts) => {
    const d = new Date(ts);
    return `${d.getDate()}/${d.getMonth()+1}`;
  };

  // ✅ Un seul tableau fusionné, chronologique, un point par date
  // Chaque point a soh (réel) OU sohProjection (projection), jamais les deux
  // sauf le point de jonction qui a les deux pour assurer la continuité visuelle
  const mergedPoints = pointsSoH.map(p => ({
    ts: p.ts,
    date: formatDate(p.ts),
    soh: p.soh,
    sohProjection: null,
  }));

  let hasProjection = false;

  if (tendance !== "stable" && degradationParMois > 0 && mergedPoints.length > 0) {
    hasProjection = true;
    const dernierPoint = pointsSoH[pointsSoH.length - 1];
    const sohActuel = dernierPoint.soh;
    const degradParJour = degradationParMois / 30;

    const joursJusqu70 = (sohActuel - 70) / degradParJour;
    const joursMax = Math.min(joursJusqu70, 24 * 30);
    const nbPoints = Math.min(6, Math.max(1, Math.ceil(joursMax / 30)));

    // ✅ Le point de jonction porte à la fois soh ET sohProjection
    // pour que la ligne orange démarre exactement où la verte s'arrête
    mergedPoints[mergedPoints.length - 1].sohProjection = sohActuel;

    for (let i = 1; i <= nbPoints; i++) {
      const joursOffset = i * (joursMax / nbPoints);
      const ts = dernierPoint.ts + joursOffset * MS_PER_DAY;
      const sohPredit = Math.max(65, sohActuel - degradParJour * joursOffset);
      mergedPoints.push({
        ts,
        date: formatDate(ts),
        soh: null,
        sohProjection: Math.round(sohPredit * 10) / 10,
      });
    }
  }

  if (mergedPoints.length < 2) return null;

  const allVals = mergedPoints.flatMap(p => [p.soh, p.sohProjection]).filter(v => v != null);
  const minSoH = Math.min(...allVals, 65);
  const yMin = Math.max(60, Math.floor(minSoH / 5) * 5 - 5);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold" style={g.label}>
          📉 {t("soh_evolution_titre") || "Évolution du SoH"}
        </p>
        <div className="flex items-center gap-3 text-xs" style={g.subLabel}>
          <span className="flex items-center gap-1">
            <span style={{ width:16, height:2, background:"#4ade80", display:"inline-block", borderRadius:1 }}/>
            {t("soh_reel") || "Réel"}
          </span>
          {hasProjection && (
            <span className="flex items-center gap-1">
              <span style={{ width:16, height:2, background:"#fb923c", display:"inline-block", borderRadius:1, opacity:.7 }}/>
              {t("soh_projection") || "Projection"}
            </span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <ComposedChart data={mergedPoints} margin={{ top:4, right:4, bottom:0, left:-20 }}>
          <defs>
            <linearGradient id="sohGradReal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80" stopOpacity={0.3}/>
              <stop offset="100%" stopColor="#4ade80" stopOpacity={0.02}/>
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
            stroke="transparent"
            tick={{ fill:"rgba(148,197,240,0.35)", fontSize:10 }}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="transparent"
            tick={{ fill:"rgba(148,197,240,0.35)", fontSize:10 }}
            domain={[yMin, 100]}
            tickFormatter={v => `${v}%`}
          />
          <Tooltip content={<SoHTooltip />} />

          {/* Ligne seuil 70% */}
          <ReferenceLine
            y={70}
            stroke="rgba(248,113,113,0.5)"
            strokeDasharray="4 3"
            strokeWidth={1.5}
            label={{
              value:"70%",
              position:"insideTopRight",
              fill:"rgba(248,113,113,0.7)",
              fontSize:9,
            }}
          />

          {/* Zone réelle */}
          <Area
            type="monotone"
            dataKey="soh"
            stroke="none"
            fill="url(#sohGradReal)"
            fillOpacity={1}
            connectNulls={false}
            isAnimationActive={false}
          />

          {/* Ligne réelle */}
          <Line
            type="monotone"
            dataKey="soh"
            stroke="#4ade80"
            strokeWidth={2.5}
            dot={{ fill:"#4ade80", r:3.5, strokeWidth:0 }}
            activeDot={{ r:5, fill:"#4ade80", filter:"drop-shadow(0 0 5px #4ade80)" }}
            connectNulls={false}
            isAnimationActive={false}
          />

          {/* Ligne projection — même axe X, démarre au point de jonction */}
          {hasProjection && (
            <Line
              type="monotone"
              dataKey="sohProjection"
              stroke="#fb923c"
              strokeWidth={2}
              strokeDasharray="5 3"
              strokeOpacity={0.8}
              dot={{ fill:"#fb923c", r:3, strokeWidth:0 }}
              activeDot={{ r:5, fill:"#fb923c" }}
              connectNulls={true}
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================
// CARTE PRÉVISION DE REMPLACEMENT (avec graphique SoH intégré)
// ============================================================
function PrevisionCard({ prevision, t }) {
  if (!prevision.disponible) {
    return (
      <div className="p-4" style={g.card}>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3" style={g.label}>
          🔮 {t("prevision_titre") || "Prévision de remplacement"}
        </h3>
        <p className="text-xs text-center py-3" style={g.label}>
          {t("prevision_pas_assez_data") || "Enregistrez au moins 5 sessions avec mesure réelle pour obtenir une prévision."}
        </p>
      </div>
    );
  }

  const { tendance, sohActuel, degradationParMois, cyclesRestants, dateRemplacement, moisRestants, confiance } = prevision;

  const config = {
    stable:    { rgb:"74,222,128",  accent:"#4ade80", emoji:"✅", label: t("prevision_stable")    || "Batterie en bonne santé" },
    bonne:     { rgb:"74,222,128",  accent:"#4ade80", emoji:"✅", label: t("prevision_bonne")     || "Batterie en bonne santé" },
    attention: { rgb:"250,204,21",  accent:"#facc15", emoji:"⚠️", label: t("prevision_attention") || "À surveiller" },
    critique:  { rgb:"248,113,113", accent:"#f87171", emoji:"🔴", label: t("prevision_critique")  || "Remplacement proche" },
  }[tendance] || { rgb:"74,222,128", accent:"#4ade80", emoji:"✅", label:"—" };

  const dateFormatee = dateRemplacement
    ? dateRemplacement.toLocaleDateString(undefined, { month:"long", year:"numeric" })
    : null;

  const barPct = Math.max(0, Math.min(100, ((sohActuel - 70) / 30) * 100));

  return (
    <div className="p-4 space-y-4" style={{
      ...g.card,
      border: `0.5px solid rgba(${config.rgb},0.25)`,
      borderTop: `0.5px solid rgba(${config.rgb},0.45)`,
      position:"relative", overflow:"hidden",
    }}>
      {/* Ligne lumineuse */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, height:"1px",
        background:`linear-gradient(90deg, transparent, rgba(${config.rgb},0.7), transparent)`,
      }} />

            {/* Titre */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2" style={g.label}>
          🔮 {t("prevision_titre") || "Prévision de remplacement"}
        </h3>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-lg" style={{
          color: config.accent,
          background: `rgba(${config.rgb},0.1)`,
          border: `0.5px solid rgba(${config.rgb},0.3)`,
        }}>
          {config.emoji} {config.label}
        </span>
      </div>

      {/* ✅ NOUVEAU : Badge de confiance de l'estimation */}
      {confiance && (
        <div className="flex items-center gap-2 mt-2 mb-1">
          <span className="text-xs" style={g.subLabel}>
            {t("prevision_confiance_label") || "Fiabilité de l'estimation :"}
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{
            background: confiance === "forte" ? "rgba(74,222,128,0.15)" 
                      : confiance === "moyenne" ? "rgba(250,204,21,0.15)" 
                      : "rgba(251,146,60,0.15)",
            color: confiance === "forte" ? "#4ade80" 
                 : confiance === "moyenne" ? "#facc15" 
                 : "#fb923c",
            border: `0.5px solid ${
              confiance === "forte" ? "rgba(74,222,128,0.3)" 
              : confiance === "moyenne" ? "rgba(250,204,21,0.3)" 
              : "rgba(251,146,60,0.3)"
            }`
          }}>
            {confiance === "forte" && (t("prevision_confiance_forte") || "🟢 Forte")}
            {confiance === "moyenne" && (t("prevision_confiance_moyenne") || "🟠 Moyenne")}
            {confiance === "faible" && (t("prevision_confiance_faible") || "🟡 À consolider")}
          </span>
        </div>
      )}

      {/* Barre de vie SoH */}
      <div>
        <div className="flex justify-between text-xs mb-1.5" style={g.subLabel}>
          <span>SoH actuel : <span style={{ color:config.accent, fontWeight:700 }}>{sohActuel}%</span></span>
          <span>{t("soh_seuil") || "Seuil remplacement"} : 70%</span>
        </div>
        <div style={{
          height:"10px", borderRadius:"5px",
          background:"rgba(255,255,255,0.07)",
          position:"relative", overflow:"hidden",
        }}>
          <div style={{
            height:"100%", borderRadius:"5px",
            width:`${barPct}%`,
            background: barPct > 60
              ? "linear-gradient(90deg, #4ade80, #38bdf8)"
              : barPct > 30
                ? "linear-gradient(90deg, #facc15, #fb923c)"
                : "linear-gradient(90deg, #f87171, #fb923c)",
            transition:"width 0.6s ease",
            boxShadow: `0 0 8px rgba(${config.rgb},0.5)`,
          }} />
          <div style={{
            position:"absolute", top:0, bottom:0, right:0,
            width:"2px", background:"rgba(248,113,113,0.6)",
          }} />
        </div>
        <div className="flex justify-between text-xs mt-1" style={g.subLabel}>
          <span>70%</span>
          <span>100%</span>
        </div>
      </div>

      {/* ✅ GRAPHIQUE SoH AVANT/APRÈS */}
      <div className="py-1" style={{
        borderTop:"0.5px solid rgba(255,255,255,0.05)",
        borderBottom:"0.5px solid rgba(255,255,255,0.05)",
      }}>
        <SoHChart prevision={prevision} t={t} />
      </div>

      {/* Chiffres clés */}
      {tendance !== "stable" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 text-center rounded-xl" style={{
            background:`rgba(${config.rgb},0.07)`,
            border:`0.5px solid rgba(${config.rgb},0.2)`,
          }}>
            <p className="text-xs mb-1" style={g.subLabel}>
              📅 {t("prevision_date") || "Remplacement estimé"}
            </p>
            <p className="font-bold text-sm" style={{ color:config.accent }}>
              {moisRestants === 0
                ? t("prevision_maintenant") || "Maintenant"
                : `${t("prevision_dans") || "dans"} ${moisRestants} ${t("prevision_mois") || "mois"}`}
            </p>
            {dateFormatee && (
              <p className="text-xs mt-0.5" style={g.subLabel}>{dateFormatee}</p>
            )}
          </div>

          <div className="p-3 text-center rounded-xl" style={{
            background:`rgba(${config.rgb},0.07)`,
            border:`0.5px solid rgba(${config.rgb},0.2)`,
          }}>
            <p className="text-xs mb-1" style={g.subLabel}>
              🔋 {t("prevision_cycles_restants") || "Cycles restants"}
            </p>
            <p className="font-bold text-sm" style={{ color:config.accent }}>
              {cyclesRestants != null ? `~${cyclesRestants}` : "—"}
            </p>
            <p className="text-xs mt-0.5" style={g.subLabel}>
              {t("prevision_cycles_label") || "charges"}
            </p>
          </div>
        </div>
      )}

      {/* Dégradation par mois */}
      {degradationParMois > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl" style={g.inner}>
          <span className="text-xs" style={g.label}>
            📉 {t("prevision_degradation") || "Dégradation estimée"}
          </span>
          <span className="text-xs font-bold" style={{ color: config.accent }}>
            -{degradationParMois}% SoH / mois
          </span>
        </div>
      )}

      {/* Conseil */}
      <div style={{
        background:`rgba(${config.rgb},0.07)`,
        border:`0.5px solid rgba(${config.rgb},0.2)`,
        borderLeft:`3px solid rgba(${config.rgb},0.6)`,
        borderRadius:"10px", padding:"10px 12px",
      }}>
        <p className="text-xs leading-relaxed" style={{ color:`rgba(${config.rgb},0.9)` }}>
          {tendance === "stable"    && (t("prevision_conseil_stable")    || "Votre batterie est en excellente forme. Continuez à charger entre 20% et 80% pour maintenir cet état.")}
          {tendance === "bonne"     && (t("prevision_conseil_bonne")     || "Votre batterie est en excellente forme. Continuez à charger entre 20% et 80% pour maintenir cet état.")}
          {tendance === "attention" && (t("prevision_conseil_attention") || "Dégradation détectée. Évitez les charges à 100% quotidiennes et les températures extrêmes.")}
          {tendance === "critique"  && (t("prevision_conseil_critique")  || "Remplacement recommandé prochainement. Prévoyez un budget pour une nouvelle batterie.")}
        </p>
      </div>

      <p className="text-xs text-center" style={{ color:"rgba(148,197,240,0.25)" }}>
        {t("prevision_disclaimer") || "Estimation basée sur vos mesures réelles — à titre indicatif."}
      </p>
    </div>
  );
}

// ============================================================
// COMPOSANT STATS PRINCIPAL
// ============================================================
function Stats({ t }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportingCert, setExportingCert] = useState(false);
  const chartRef = useRef(null);
  const { profile, history, setHistory } = useApp();
  const estExpert = profile?.level === "expert";

  const totalItems = history.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  const historySorted = useMemo(() =>
    [...history].sort((a,b) => (b.startTs||b.date||0)-(a.startTs||a.date||0)),
  [history]);

  const currentItems = useMemo(() => {
    const start = (currentPage-1)*ITEMS_PER_PAGE;
    return historySorted.slice(start, start+ITEMS_PER_PAGE);
  }, [currentPage, historySorted]);

  const startItem = totalItems===0 ? 0 : (currentPage-1)*ITEMS_PER_PAGE+1;
  const endItem = Math.min(currentPage*ITEMS_PER_PAGE, totalItems);
  const goToPage = (p) => { if (p>=1 && p<=totalPages) setCurrentPage(p); };

  function supprimerSession(item) {
    const msg = t("supprimer_session_confirm") || "Supprimer cette session de l'historique ?";
    if (!confirm(msg)) return;
    setHistory(prev => prev.filter(s =>
      (s.id || s.startTs) !== (item.id || item.startTs)
    ));
    // Retour page 1 si la page courante devient vide
    const newTotal = history.length - 1;
    const newTotalPages = Math.max(1, Math.ceil(newTotal / ITEMS_PER_PAGE));
    if (currentPage > newTotalPages) setCurrentPage(newTotalPages);
  }

  const stats     = useMemo(() => calculerStats(history), [history]);
  const prevision = useMemo(() => calculerPrevision(history), [history]);

  const finalGraphData = useMemo(() => {
    const data = historySorted.slice(0,7).reverse().map(item => {
      const d = new Date(item.startTs||item.date);
      return { date:isNaN(d.getTime())?"---":`${d.getDate()}/${d.getMonth()+1}`, charge:item.targetPct??item.charge??0 };
    });
    return data.length>0 ? data : [{date:"-",charge:0}];
  }, [historySorted]);

  const getModeLabel = (mode) => {
    if (!mode) return "—";
    const m = String(mode).toLowerCase();
    if (m.includes("daily")||m.includes("quotidien")) return t("quotidien");
    if (m.includes("course")||m.includes("grande")) return t("grande_course");
    if (m.includes("hivernage")) return t("hivernage");
    return mode;
  };

  const getMesureInfo = (item) => {
    const type = String(item.typeSaisie||"").toLowerCase();
    if (type.includes("réelle")||type.includes("real")||item.realMeasure)
      return { icon:"🎯", label:t("mesure_reelle_stabilisee")||"Réelle après repos", style:mesureStyles.reelle };
    if (type.includes("immédiate")||type.includes("immediate"))
      return { icon:"⚡", label:t("mesure_immediate_chaud")||"Immédiate", style:mesureStyles.immediate };
    return { icon:"🔮", label:t("mesure_estimation_appli")||"Estimation", style:mesureStyles.estimation };
  };

  const sohColor = stats.sohMoyen>=85?"#4ade80":stats.sohMoyen>=65?"#facc15":"#f87171";

  return (
    <div className="space-y-4 pb-28 px-1">

      <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color:"rgba(255,255,255,0.85)" }}>
        📊 {t("statistiques")}
      </h2>

      {/* Export PDF + Certificat */}
      <div className="flex gap-2">
        <button
          onClick={async () => {
            setExporting(true);
            try { await exporterPDF({ history: historySorted, stats, profile, chartRef }); }
            finally { setExporting(false); }
          }}
          disabled={exporting || totalItems === 0}
          className="flex-1 py-3 rounded-xl font-semibold transition-all"
          style={{
            background: exporting || totalItems === 0 ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg,rgba(56,189,248,0.2),rgba(99,102,241,0.15))",
            border: "0.5px solid rgba(56,189,248,0.35)",
            color: exporting || totalItems === 0 ? "rgba(148,197,240,0.4)" : "#38bdf8",
            cursor: exporting || totalItems === 0 ? "not-allowed" : "pointer",
          }}
        >
          {exporting ? "⏳..." : totalItems === 0 ? "📄 PDF" : "📄 Rapport PDF"}
        </button>

        <button
          onClick={async () => {
            setExportingCert(true);
            try { await exporterCertificat({ history: historySorted, profile }); }
            finally { setExportingCert(false); }
          }}
          disabled={exportingCert || totalItems === 0}
          className="flex-1 py-3 rounded-xl font-semibold transition-all"
          style={{
            background: exportingCert || totalItems === 0 ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg,rgba(74,222,128,0.2),rgba(56,189,248,0.12))",
            border: "0.5px solid rgba(74,222,128,0.35)",
            color: exportingCert || totalItems === 0 ? "rgba(148,197,240,0.4)" : "#4ade80",
            cursor: exportingCert || totalItems === 0 ? "not-allowed" : "pointer",
          }}
        >
          {exportingCert ? "⏳..." : totalItems === 0 ? "🏆 Certificat" : "🏆 Certificat"}
        </button>
      </div>

      {/* Cartes résumé */}
      <div className="grid grid-cols-2 gap-3">
        {resumeCards(stats, sohColor).map((item,i) => (
          <div key={i} className="flex flex-col items-center justify-center text-center p-4 min-h-[110px]"
            style={{
              background:`rgba(${item.rgb},0.08)`,
              border:`0.5px solid rgba(${item.rgb},0.25)`,
              borderTop:`0.5px solid rgba(${item.rgb},0.4)`,
              borderRadius:"16px", position:"relative", overflow:"hidden",
            }}>
            <div style={{ position:"absolute",top:0,left:0,right:0,height:"1px", background:`linear-gradient(90deg,transparent,rgba(${item.rgb},0.7),transparent)` }} />
            <p className="text-3xl font-bold" style={{ color:item.color }}>
              {item.val}{item.unit && <span className="text-lg" style={{ opacity:.7 }}>{item.unit}</span>}
            </p>
            <p className="text-sm mt-2" style={g.label}>{item.label} {t(item.labelKey)}</p>
          </div>
        ))}
      </div>

      {/* Carte prévision + graphique SoH */}
      <PrevisionCard prevision={prevision} t={t} />

      {/* Stats détaillées */}
      {totalItems>0 && (
        <div className="p-4 space-y-3" style={g.card}>
          <h3 className="text-sm font-semibold flex items-center gap-2" style={g.label}>
            📋 {t("stats_detaillees")}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { val:stats.meilleureAutonomie>0?`${stats.meilleureAutonomie} km`:"—", label:`🏆 ${t("stats_meilleure_autonomie")}`, color:"#4ade80", rgb:"74,222,128" },
              { val:stats.profondeurMoyenne>0?`${stats.profondeurMoyenne}%`:"—",     label:`📊 ${t("stats_profondeur_moyenne")}`, color:"#fb923c", rgb:"251,146,60" },
              { val:stats.tempMin!==null?`${stats.tempMin}°C`:"—",                   label:`🥶 ${t("stats_temp_min")}`,           color:"#38bdf8", rgb:"56,189,248" },
              { val:stats.frequenceHebdo>0?`${stats.frequenceHebdo}/sem`:"—",        label:`⏱️ ${t("stats_frequence")}`,          color:"#a78bfa", rgb:"167,139,250" },
            ].map((item,i) => (
              <div key={i} className="p-3 text-center" style={{
                background:`rgba(${item.rgb},0.07)`,
                border:`0.5px solid rgba(${item.rgb},0.2)`,
                borderRadius:"12px",
              }}>
                <p className="text-lg font-bold" style={{ color:item.color }}>{item.val}</p>
                <p className="text-xs mt-1" style={g.subLabel}>{item.label}</p>
              </div>
            ))}
          </div>

          {stats.meilleurMois && (
            <div className="flex items-center justify-between p-3" style={g.inner}>
              <span className="text-sm" style={g.label}>📅 {t("stats_meilleur_mois")}</span>
              <span className="font-semibold text-sm text-white">
                {stats.meilleurMois.nom} ({stats.meilleurMois.nombre} {t("stats_charges")})
              </span>
            </div>
          )}

          {Object.keys(stats.chargesParMode).length>0 && (
            <div className="p-3 space-y-2" style={g.inner}>
              <p className="text-xs font-semibold" style={g.label}>{t("stats_repartition_modes")}</p>
              {Object.entries(stats.chargesParMode).map(([mode,count]) => {
                const pct = stats.totalCycles>0 ? Math.round((count/stats.totalCycles)*100) : 0;
                return (
                  <div key={mode} className="flex items-center gap-2">
                    <span className="text-xs w-20 truncate" style={{ color:"rgba(255,255,255,0.7)" }}>{getModeLabel(mode)}</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.07)" }}>
                      <div className="h-full rounded-full" style={{ width:`${pct}%`, background:"linear-gradient(90deg,#818cf8,#38bdf8)" }} />
                    </div>
                    <span className="text-xs w-12 text-right" style={g.subLabel}>{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Graphique évolution charge */}
      <div className="p-4" ref={chartRef} style={g.card}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={g.label}>
          📈 {t("evolution_charge")}
        </h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={finalGraphData}>
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#818cf8"/>
                <stop offset="100%" stopColor="#38bdf8"/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" stroke="transparent" tick={{ fill:"rgba(148,197,240,0.4)", fontSize:11 }} />
            <YAxis stroke="transparent" tick={{ fill:"rgba(148,197,240,0.4)", fontSize:11 }} domain={[0,100]} />
            <Tooltip contentStyle={{
              background:"rgba(6,12,28,0.95)", border:"0.5px solid rgba(56,189,248,0.25)",
              borderRadius:"12px", color:"#fff", backdropFilter:"blur(12px)",
            }} />
            <Line type="monotone" dataKey="charge" stroke="url(#lineGrad)" strokeWidth={2.5}
              dot={{ fill:"#38bdf8", r:4, strokeWidth:0 }}
              activeDot={{ r:6, fill:"#818cf8", filter:"drop-shadow(0 0 6px #818cf8)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* En-tête historique */}
      <div className="flex items-center justify-between mt-2">
        <h3 className="font-semibold flex items-center gap-2" style={{ color:"rgba(255,255,255,0.7)", fontSize:"15px" }}>
          🕓 {t("historique")}
        </h3>
        <span className="text-xs" style={g.subLabel}>
          {totalItems>0 ? `${startItem}–${endItem} sur ${totalItems}` : "0 élément"}
        </span>
      </div>

      {/* Cartes historique */}
      <div className="space-y-3">
        {currentItems.length>0 ? currentItems.map((item,index) => {
          const d = new Date(item.startTs||item.date);
          const dateLisible = isNaN(d.getTime())
            ? t("date_inconnue")
            : d.toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});

          const departPct=item.startPct??"—", departV=item.startV??"—";
          const ciblePct=item.targetPct??"—",  cibleV=item.targetV??"—";
          const reelV=item.voltageReal??item.realVAfterRest??null;
          const reelPct=item.pctReal??item.realPctAfterRest??null;

          const delta=item.delta??item.deltaPct??null;
          const deltaV=item.deltaV??item.voltageGap??null;
          const ecartVal = estExpert
            ? (deltaV!=null?`${deltaV>0?"+":""}${deltaV}V`:null)
            : (delta!=null?`${delta>0?"+":""}${delta}%`:null);
          const ecartColor = !ecartVal||delta===0 ? "rgba(148,197,240,0.5)" : (delta??deltaV??0)>0?"#fb923c":"#38bdf8";

          const km=item.kmRidden??item.kilometres??null;
          const mesure=getMesureInfo(item);
          const vehicleName=item.vehicle??profile?.customName??"—";

          return (
            <div key={`hist-${item.id||item.startTs||index}-${index}`} className="p-4 space-y-3"
              style={{ ...g.card, position:"relative", overflow:"hidden" }}>
              <div style={{
                position:"absolute", top:0, left:0, right:0, height:"1px",
                background:`linear-gradient(90deg, transparent, ${mesure.style.gradFrom}, transparent)`,
              }} />

              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <p className="font-bold text-sm text-white">{vehicleName}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <BadgeGlass bg="rgba(255,255,255,0.06)" border="rgba(255,255,255,0.12)" color="rgba(255,255,255,0.7)">
                      {getModeLabel(item.mode)}
                    </BadgeGlass>
                    <BadgeGlass {...mesure.style}>
                      {mesure.icon} {mesure.label}
                    </BadgeGlass>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <p className="text-xs text-right" style={g.subLabel}>{dateLisible}</p>
                  <span
                    role="button"
                    onClick={() => supprimerSession(item)}
                    title="Supprimer cette session"
                    style={{
                      fontSize:"16px", cursor:"pointer", opacity:0.4,
                      transition:"opacity 0.2s",
                      userSelect:"none",
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity="1"}
                    onMouseLeave={e => e.currentTarget.style.opacity="0.4"}
                  >
                    🗑️
                  </span>
                </div>
              </div>

              <div className="px-3 py-2 space-y-1.5 rounded-xl" style={g.inner}>
                <div className="flex justify-between items-center text-sm">
                  <span style={g.label}>🔋 Départ</span>
                  <span className="font-bold text-white">{estExpert?`${departV}V`:`${departPct}%`}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={g.label}>🎯 Cible</span>
                  <span className="font-bold text-white">
                    {estExpert?`${cibleV}V`:`${ciblePct}%`}
                    {(reelV!=null||reelPct!=null) && (
                      <span className="font-normal ml-1" style={{ color:"#4ade80" }}>
                        ({estExpert?`${reelV}V réel`:`${reelPct}% réel`})
                      </span>
                    )}
                  </span>
                </div>
                {ecartVal && (
                  <div className="flex justify-between items-center text-sm">
                    <span style={g.label}>📐 Écart</span>
                    <span className="font-bold" style={{ color:ecartColor }}>{ecartVal}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-xs pt-1" style={{ borderTop:"0.5px solid rgba(255,255,255,0.05)" }}>
                <span style={g.subLabel}>🛣️ {km!=null?`${km} km`:"— km"}</span>
                <span style={g.subLabel}>🌡️ {item.temperature!=null?`${item.temperature}°C`:"—"}</span>
              </div>
            </div>
          );
        }) : (
          <p className="text-sm text-center py-8" style={g.label}>{t("aucune_recharge")}</p>
        )}
      </div>

      {/* Pagination */}
      {totalPages>1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {[
            { label:"«",              action:()=>goToPage(1),              disabled:currentPage===1 },
            { label:`← ${t("precedent")}`, action:()=>goToPage(currentPage-1), disabled:currentPage===1 },
            { label:`${currentPage} / ${totalPages}`, action:null, isInfo:true },
            { label:`${t("suivant")} →`, action:()=>goToPage(currentPage+1), disabled:currentPage===totalPages },
            { label:"»",              action:()=>goToPage(totalPages),     disabled:currentPage===totalPages },
          ].map((btn,i) => btn.isInfo ? (
            <span key={i} className="px-4 py-2 text-sm font-medium" style={g.label}>{btn.label}</span>
          ) : (
            <button key={i} onClick={btn.action} disabled={btn.disabled}
              className="px-3 py-2 rounded-xl text-sm transition-all"
              style={{
                background: btn.disabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.06)",
                border:`0.5px solid ${btn.disabled?"rgba(255,255,255,0.05)":"rgba(56,189,248,0.2)"}`,
                color:btn.disabled?"rgba(148,197,240,0.2)":"rgba(148,197,240,0.7)",
                cursor:btn.disabled?"not-allowed":"pointer",
              }}
            >{btn.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Stats;
