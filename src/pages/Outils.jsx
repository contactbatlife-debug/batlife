import React, { useRef, useState } from 'react';
import { useApp } from "../context/AppContext";
import { vdb } from "../services/calculs"; 

function Outils({ t }) {
  const { exportBackup, importBackup, showToast, profile } = useApp();
  const fileInputRef = useRef(null);

  // --- ❄️ ÉTATS HIVERNAGE ---
  const [showHivernage, setShowHivernage] = useState(false);
  const [saisie, setSaisie] = useState("");
  const [typeSaisie, setTypeSaisie] = useState("V");

  // --- 🎯 ÉTATS CALIBRATION ---
  const [showCalibration, setShowCalibration] = useState(false);
  const [tensionSaisie, setTensionSaisie] = useState("");

  const tensionNominale = profile?.nominalVoltage || 48;
  const d = vdb(tensionNominale);
  const vStockage = d?.storage || (tensionNominale === 48 ? 46.8 : 35.1);

  // --- 📐 LOGIQUE DE CALIBRATION (Calcul du % réel selon les Volts) ---
  let resultatCalibration = null;
  if (tensionSaisie !== "") {
    const v = parseFloat(tensionSaisie);
    const vMax = tensionNominale === 48 ? 54.6 : 42.0;
    const vMin = tensionNominale === 48 ? 39.0 : 30.0;

    if (v > vMax + 1 || v < vMin - 1) {
      resultatCalibration = { erreur: true, message: `Tension hors limites pour une batterie de ${tensionNominale}V.` };
    } else {
      // Calcul du pourcentage théorique linéaire basé sur les limites de la batterie
      let pct = ((v - vMin) / (vMax - vMin)) * 100;
      pct = Math.max(0, Math.min(100, Math.round(pct))); // Bloquer entre 0 et 100
      
      resultatCalibration = {
        erreur: false,
        pourcentage: pct,
        message: pct >= 95 ? "🔋 Batterie totalement pleine." : pct <= 15 ? "🪫 Seuil critique ! Rechargez rapidement." : "✅ Batterie stable et calibrée."
      };
    }
  }

  // --- LOGIQUE HIVERNAGE ---
  let diagnosticMessage = "";
  let couleurMessage = "text-zinc-400";

  if (saisie !== "") {
    const valeur = parseFloat(saisie);
    if (typeSaisie === "V") {
      if (valeur > vStockage + 0.5) {
        diagnosticMessage = `🔋 Tension trop haute pour l'hivernage. Roulez un peu ou déchargez jusqu'à ${vStockage}V.`;
        couleurMessage = "text-orange-400";
      } else if (valeur < vStockage - 0.5) {
        diagnosticMessage = `🪫 Tension trop basse ! Mettez un petit coup de charge jusqu'à ${vStockage}V.`;
        couleurMessage = "text-yellow-400";
      } else {
        diagnosticMessage = "🎯 Parfait ! Votre batterie est à la tension idéale de stockage.";
        couleurMessage = "text-green-400";
      }
    } else {
      if (valeur > 50) {
        diagnosticMessage = "🔋 Pourcentage trop élevé. Déchargez-la un peu (cible : ~45%).";
        couleurMessage = "text-orange-400";
      } else if (valeur < 35) {
        diagnosticMessage = "🪫 Pourcentage trop bas ! Rechargez-la légèrement (cible : ~45%).";
        couleurMessage = "text-yellow-400";
      } else {
        diagnosticMessage = "🎯 Parfait ! Le niveau est idéal pour passer l'hiver.";
        couleurMessage = "text-green-400";
      }
    }
  }

  // --- GESTIONNAIRES DE SAUVEGARDE ---
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    importBackup(
      file,
      () => {
        if (typeof showToast === 'function') showToast("✅ Restauration réussie !");
        setTimeout(() => window.location.reload(), 1000);
      },
      () => {
        if (typeof showToast === 'function') showToast("❌ Erreur lors de l'importation.");
      }
    );
  };

  const handleInjectTestData = () => {
    const fakeHistory = [
      { startTs: Date.now() - 3600000 * 24 * 6, startPct: 20, targetPct: 80, temperature: 18, mode: "daily" },
      { startTs: Date.now() - 3600000 * 24 * 5, startPct: 35, targetPct: 85, temperature: 22, mode: "daily" },
      { startTs: Date.now() - 3600000 * 24 * 4, startPct: 15, targetPct: 100, temperature: 25, mode: "course" },
      { startTs: Date.now() - 3600000 * 24 * 3, startPct: 40, targetPct: 80, temperature: 19, mode: "daily" },
      { startTs: Date.now() - 3600000 * 24 * 2, startPct: 30, targetPct: 90, temperature: 15, mode: "daily" },
      { startTs: Date.now() - 3600000 * 24 * 1, startPct: 25, targetPct: 85, temperature: 21, mode: "daily" },
      { startTs: Date.now(), startPct: 50, targetPct: 80, temperature: 24, mode: "daily" }
    ];
    localStorage.setItem("bl_history_v5", JSON.stringify(fakeHistory));
    if (typeof showToast === 'function') showToast("🚀 7 recharges de test injectées !");
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleResetClick = () => {
    if (confirm("Voulez-vous vraiment réinitialiser toutes les données de BatLife ? Cette action est irréversible.")) {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("bl_")) keys.push(key);
      }
      keys.forEach(k => localStorage.removeItem(k));
      if (typeof showToast === 'function') showToast("🗑️ Application réinitialisée.");
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const outilsList = [
    {
      id: "demo",
      icon: "🧪",
      titre: "Mode Démo / Test",
      texte: "Injecter instantanément 7 recharges fictives pour tester les graphiques et la pagination.",
      bouton: "Remplir l'historique",
      couleur: "bg-purple-600 hover:bg-purple-500",
      action: handleInjectTestData
    },
    {
      id: "calibration",
      icon: "🎯",
      titre: t("calibration") || "Calibration précise",
      texte: t("calibration_texte") || "Mesurez le pourcentage exact de votre batterie à partir de sa tension stabilisée au repos.",
      bouton: showCalibration ? "Masquer la calibration" : (t("calibrer") || "Calibrer"),
      couleur: "bg-blue-600 hover:bg-blue-500",
      action: () => { setShowCalibration(!showCalibration); setShowHivernage(false); }
    },
    {
      id: "hivernage",
      icon: "❄️",
      titre: t("hivernage") || "Diagnostic Hivernage",
      texte: t("hivernage_texte") || "Calculez la tension optimale pour stocker votre batterie pendant une longue période sans l'abîmer.",
      bouton: showHivernage ? "Masquer le diagnostic" : (t("diagnostiquer") || "Diagnostiquer"),
      couleur: "bg-cyan-600 hover:bg-cyan-500",
      action: () => { setShowHivernage(!showHivernage); setShowCalibration(false); }
    },
    {
      id: "export",
      icon: "📤",
      titre: t("exporter"),
      texte: t("exporter_texte"),
      bouton: t("exporter_btn"),
      couleur: "bg-green-600 hover:bg-green-500",
      action: exportBackup
    },
    {
      id: "import",
      icon: "📥",
      titre: t("importer"),
      texte: t("importer_texte"),
      bouton: t("importer_btn"),
      couleur: "bg-yellow-600 hover:bg-yellow-500",
      action: handleImportClick
    },
    {
      id: "reset",
      icon: "🗑️",
      titre: t("reinitialiser"),
      texte: t("reinitialiser_texte"),
      bouton: t("reinitialiser_btn"),
      couleur: "bg-red-600 hover:bg-red-500",
      action: handleResetClick
    },
  ];

  function partager() {
    if (navigator.share) {
      navigator.share({
        title: "BatLife",
        text: "Découvrez BatLife, l'application pour optimiser la batterie de votre VAE ou trottinette électrique !",
        url: "https://batlife.app"
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText("https://batlife.app");
      alert("Lien copié dans le presse-papier !");
    }
  }

  return (
    <div className="space-y-4">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />

      <h2 className="text-lg font-semibold text-zinc-300">
        {t("outils_titre") || "Boîte à Outils"}
      </h2>

      <div className="space-y-3">
        {outilsList.map((outil) => (
          <div key={outil.id} className="space-y-3">
            <div className="bg-[#152642] rounded-2xl p-4 border border-[#1f3460]">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-2xl shrink-0">{outil.icon}</span>
                  <div className="min-w-0">
                    <p className="text-white font-semibold leading-snug break-words">
                      {outil.titre}
                    </p>
                    <p className="text-zinc-400 text-sm leading-snug mt-1 break-words">
                      {outil.texte}
                    </p>
                  </div>
                </div>

                <button
                  onClick={outil.action}
                  className={`w-full ${outil.couleur} text-white text-sm px-3 py-2.5 rounded-xl transition-colors font-medium`}
                >
                  {outil.bouton}
                </button>
              </div>
            </div>

            {/* 🎯 SECTION DYNAMIQUE : INTERFACE DE CALIBRATION PRÉCISE */}
            {outil.id === "calibration" && showCalibration && (
              <div className="bg-[#1a2f50] rounded-2xl p-4 border border-blue-500/40 shadow-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-blue-400 uppercase">
                    Voltmètre vers Capacité ({tensionNominale}V)
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    ⚠️ Laissez la batterie 30 min au repos avant.
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder={`Entrez les Volts mesurés (ex: ${tensionNominale === 48 ? '52.1' : '39.8'})`}
                    value={tensionSaisie}
                    onChange={(e) => setTensionSaisie(e.target.value)}
                    className="w-full bg-[#0d1f3a] border border-blue-500/30 rounded-xl py-2 px-3 text-white font-medium text-sm focus:outline-none focus:border-blue-500"
                  />
                  <span className="absolute right-3 top-2.5 text-blue-400 text-xs font-bold">
                    V
                  </span>
                </div>

                {tensionSaisie !== "" && resultatCalibration && (
                  <div className="p-3 bg-[#0d1f3a]/80 rounded-xl border border-blue-500/20 text-center space-y-1">
                    {!resultatCalibration.erreur ? (
                      <>
                        <p className="text-zinc-400 text-xs">Capacité réelle mesurée :</p>
                        <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                          {resultatCalibration.pourcentage}%
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-1">{resultatCalibration.message}</p>
                      </>
                    ) : (
                      <p className="text-xs font-semibold text-red-400">{resultatCalibration.message}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ❄️ SECTION DYNAMIQUE : INTERFACE INTERACTIVE HIVERNAGE */}
            {outil.id === "hivernage" && showHivernage && (
              <div className="bg-[#1a2f50] rounded-2xl p-4 border border-cyan-500/40 shadow-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-cyan-400 uppercase">
                    Calculateur Hivernage ({tensionNominale}V)
                  </span>
                  <span className="text-xs text-zinc-300 bg-cyan-900/40 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">
                    Cible : {vStockage}V (~45%)
                  </span>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.1"
                      placeholder={typeSaisie === "V" ? "Tension actuelle (ex: 48.2)" : "Pourcentage (ex: 65)"}
                      value={saisie}
                      onChange={(e) => setSaisie(e.target.value)}
                      className="w-full bg-[#0d1f3a] border border-cyan-500/30 rounded-xl py-2 px-3 text-white font-medium text-sm focus:outline-none focus:border-cyan-500"
                    />
                    <span className="absolute right-3 top-2.5 text-cyan-400 text-xs font-bold">
                      {typeSaisie}
                    </span>
                  </div>

                  <button
                    onClick={() => { setTypeSaisie(typeSaisie === "V" ? "%" : "V"); setSaisie(""); }}
                    className="bg-[#0d1f3a] hover:bg-[#152642] border border-[#1f3460] px-3 rounded-xl text-xs text-zinc-300 font-medium transition-colors"
                  >
                    En {typeSaisie === "V" ? "%" : "Volts"}
                  </button>
                </div>

                {saisie !== "" && (
                  <div className="p-3 bg-[#0d1f3a]/80 rounded-xl border border-cyan-500/20 text-center">
                    <p className={`text-xs font-semibold ${couleurMessage}`}>
                      {diagnosticMessage}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* === BLOC BUY ME A COFFEE === */}
      <div className="bg-[#152642] rounded-2xl p-6 border-2 border-yellow-500 space-y-4 mt-6">
        <div className="text-center">
          <div className="text-5xl mb-2">☕</div>
          <h3 className="text-yellow-400 text-xl font-bold">Soutenez BatLife</h3>
        </div>
        <p className="text-zinc-300 text-sm leading-relaxed text-center">
          Je suis un retraité passionné qui a commencé ce projet à partir d'un simple fichier Excel, pour mieux comprendre et préserver la durée de vie des batteries de vélos et trottinettes électriques.
        </p>
        <a
          href="https://buymeacoffee.com/batlife"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 rounded-full text-center transition-colors"
        >
          ☕ Offrir un café
        </a>
        <button
          onClick={partager}
          className="block w-full bg-transparent border-2 border-blue-500 text-blue-400 hover:bg-blue-500/10 font-semibold py-3 rounded-full transition-colors"
        >
          📤 Partager BatLife
        </button>
      </div>
    </div>
  );
}

export default Outils;