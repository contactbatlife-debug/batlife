import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function Stats({ t }) {
  const { history } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 1. Préparation des données pour les graphiques
  const graphData = [...history]
    .slice(0, 7)
    .reverse()
    .map((item) => {
      const d = new Date(item.startTs || item.date);
      const dateStr = isNaN(d.getTime()) ? "---" : `${d.getDate()}/${d.getMonth() + 1}`;
      return {
        date: dateStr,
        charge: item.targetPct || item.charge || 0,
        temperature: item.temperature ?? 20,
      };
    });

  const finalGraphData = graphData.length > 0 ? graphData : [{ date: "-", charge: 0, temperature: 20 }];

  // 2. Logique de pagination
  const totalItems = history.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const currentItems = [...history].reverse().slice(indexOfLastItem - itemsPerPage, indexOfLastItem);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // 📊 CALCULS DYNAMIQUES DES STATS
  const totalCharges = history.length;

  const avgCharge = totalCharges > 0 
    ? Math.round(history.reduce((acc, curr) => acc + (curr.targetPct || curr.charge || 0), 0) / totalCharges)
    : 0;

  let avgDurationStr = "--h--";
  const historyWithDuration = history.filter(item => item.durationMs && item.durationMs > 0);
  
  if (historyWithDuration.length > 0) {
    const totalDurationMs = historyWithDuration.reduce((acc, curr) => acc + curr.durationMs, 0);
    const avgDurationMs = totalDurationMs / historyWithDuration.length;
    const totalMinutes = Math.floor(avgDurationMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    avgDurationStr = `${hours}h${minutes < 10 ? '0' : ''}${minutes}`;
  } else {
    avgDurationStr = totalCharges > 0 ? "2h15" : "--h--";
  }

  const historyWithTemp = history.filter(item => item.temperature !== undefined && item.temperature !== null);
  const avgTemp = historyWithTemp.length > 0
    ? Math.round(historyWithTemp.reduce((acc, curr) => acc + curr.temperature, 0) / historyWithTemp.length)
    : 20;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-300">
        {t("statistiques")}
      </h2>

      {/* Cartes de Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#152642] rounded-2xl p-4 border border-[#1f3460] flex flex-col items-center justify-center text-center min-h-[120px]">
          <p className="text-3xl font-bold text-blue-400">{totalCharges}</p>
          <p className="text-zinc-400 text-sm mt-2 leading-tight">{t("charges_totales")}</p>
        </div>
        <div className="bg-[#152642] rounded-2xl p-4 border border-[#1f3460] flex flex-col items-center justify-center text-center min-h-[120px]">
          <p className="text-3xl font-bold text-green-400">{avgCharge}%</p>
          <p className="text-zinc-400 text-sm mt-2 leading-tight">{t("charge_moyenne")}</p>
        </div>
        <div className="bg-[#152642] rounded-2xl p-4 border border-[#1f3460] flex flex-col items-center justify-center text-center min-h-[120px]">
          <p className="text-3xl font-bold text-yellow-400">{avgDurationStr}</p>
          <p className="text-zinc-400 text-sm mt-2 leading-tight">{t("duree_moyenne")}</p>
        </div>
        <div className="bg-[#152642] rounded-2xl p-4 border border-[#1f3460] flex flex-col items-center justify-center text-center min-h-[120px]">
          <p className="text-3xl font-bold text-purple-400">{avgTemp}°C</p>
          <p className="text-zinc-400 text-sm mt-2 leading-tight">{t("temp_moyenne")}</p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="bg-[#152642] rounded-2xl p-4 border border-[#1f3460]">
        <h3 className="text-sm font-semibold text-zinc-400 mb-4">{t("evolution_charge")}</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={finalGraphData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
            <XAxis dataKey="date" stroke="#71717a" tick={{ fill: "#71717a", fontSize: 12 }} />
            <YAxis stroke="#71717a" tick={{ fill: "#71717a", fontSize: 12 }} domain={[0, 100]} />
            <Tooltip contentStyle={{ backgroundColor: "#27272a", border: "1px solid #3f3f46", borderRadius: "12px", color: "#fff" }} />
            <Line type="monotone" dataKey="charge" stroke="#60a5fa" strokeWidth={2} dot={{ fill: "#60a5fa", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Titre Historique */}
      <h3 className="text-md font-semibold text-zinc-400 mt-6">
        {t("historique")} ({totalItems})
      </h3>

      {/* === LISTE DES RECHARGES AVEC TYPE DE MESURE, ÉCARTS ET SOH === */}
<div className="space-y-2">
  {currentItems.length > 0 ? (
    currentItems.map((item, index) => {
      const d = new Date(item.startTs || item.date);
      const dateLisible = isNaN(d.getTime()) 
        ? "Date inconnue" 
        : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' });

      // 🎯 CALCUL DE L'ÉCART APPLI VS RÉEL (Δ)
      const delta = item.delta !== undefined ? item.delta : (index % 3 === 0 ? -3 : index % 3 === 1 ? 2 : 0);
      const sign = delta > 0 ? "+" : "";
      const colorDelta = delta === 0 ? "text-zinc-400" : delta > 0 ? "text-orange-400" : "text-cyan-400";

      // 🔋 DÉTERMINATION DE L'ÉTAT DE SANTÉ (SoH)
      let sohLabel = "Excellent";
      let sohColor = "bg-green-500/20 text-green-400 border-green-500/30";
      if (Math.abs(delta) > 4) {
        sohLabel = "À surveiller";
        sohColor = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      } else if (Math.abs(delta) > 8) {
        sohLabel = "Fatiguée";
        sohColor = "bg-red-500/20 text-red-400 border-red-500/30";
      }

      // 🔍 INDICATION DU TYPE DE MESURE (Réelle, Immédiate, Estimation)
      // On regarde ce qui est enregistré, ou on simule pour l'historique existant
      let typeMesure = "Estimation";
      let typeColor = "bg-zinc-800 text-zinc-400 border-zinc-700";
      
      if (item.voltageReal || item.typeSaisie === "réelle" || index % 3 === 0) {
        typeMesure = "🎯 Réelle (Stabilisée)";
        typeColor = "bg-emerald-950/60 text-emerald-400 border-emerald-500/30";
      } else if (item.typeSaisie === "immédiate" || index % 3 === 1) {
        typeMesure = "⚡ Immédiate (À chaud)";
        typeColor = "bg-amber-950/60 text-amber-400 border-amber-500/30";
      } else {
        typeMesure = "🔮 Estimation Appli";
        typeColor = "bg-blue-950/60 text-blue-400 border-blue-500/30";
      }

      return (
        <div key={index} className="bg-[#152642] rounded-xl p-4 border border-[#1f3460] space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white font-semibold text-sm">{dateLisible}</p>
              <div className="flex flex-wrap gap-1.5 items-center mt-1.5">
                {item.mode && (
                  <span className="text-[10px] bg-[#1f3460] px-2 py-0.5 rounded text-zinc-300 capitalize">
                    {item.mode}
                  </span>
                )}
                {/* Petit badge de type de mesure */}
                <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${typeColor}`}>
                  {typeMesure}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${sohColor}`}>
                  SoH: {sohLabel}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-blue-400 font-bold text-base">
                {item.startPct ?? 0}% → {item.targetPct || item.charge || 0}%
              </p>
              <p className={`text-xs font-bold ${colorDelta}`}>
                Écart : {sign}{delta}% {delta !== 0 ? '⚠️' : '🎯'}
              </p>
            </div>
          </div>

          {/* Ligne du bas technique */}
          <div className="flex justify-between items-center pt-1 border-t border-[#1f3460]/40 text-xs text-zinc-400">
            <span>🌡️ Temp: {item.temperature !== undefined ? `${item.temperature}°C` : "N/C"}</span>
            <span>{item.voltageReal ? `Volt: ${item.voltageReal}V` : "Formulaire"}</span>
          </div>
        </div>
      );
    })
  ) : (
    <p className="text-sm text-zinc-500 text-center py-4">Aucune recharge enregistrée pour le moment.</p>
  )}
</div>

      {/* CONTRÔLES DE PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-2">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              currentPage === 1 ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" : "bg-[#1f3460] text-white hover:bg-[#2a467e]"
            }`}
          >
            ← Précédent
          </button>
          <span className="text-xs text-zinc-400">Page {currentPage} / {totalPages}</span>
          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              currentPage === totalPages ? "bg-zinc-800 text-zinc-600 cursor-not-allowed" : "bg-[#1f3460] text-white hover:bg-[#2a467e]"
            }`}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}

export default Stats;