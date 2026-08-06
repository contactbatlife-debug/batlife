// ============================================================
// BatLife — MigrationCard.jsx
// Composant à intégrer dans la page Outils
// ============================================================
import { useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { migrateFromHTML, markMigrationDone } from "../services/migrationService";

const g = {
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "0.5px solid rgba(255,255,255,0.1)",
    borderTop: "0.5px solid rgba(255,255,255,0.16)",
    borderRadius: "16px",
  },
  label: { color: "rgba(148,197,240,0.5)", fontSize: "12px" },
};

export default function MigrationCard({ t }) {
  const { setHistory, setProfile, setCalibration, setTemperature, showToast } = useApp();
  const fileRef = useRef(null);
  const [preview, setPreview]   = useState(null); // résultat d'analyse avant import
  const [status, setStatus]     = useState("idle"); // idle | analyzing | ready | importing | done | error
  const [errorMsg, setErrorMsg] = useState("");

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("analyzing");
    setPreview(null);
    setErrorMsg("");

    const reader = new FileReader();
    reader.onload = () => {
      const result = migrateFromHTML(reader.result);
      if (!result.success) {
        setStatus("error");
        setErrorMsg(result.message);
        return;
      }
      setPreview(result);
      setStatus("ready");
    };
    reader.onerror = () => {
      setStatus("error");
      setErrorMsg("Impossible de lire le fichier.");
    };
    reader.readAsText(file);

    // Reset input pour permettre re-sélection du même fichier
    e.target.value = "";
  }

  function handleImport() {
    if (!preview) return;
    setStatus("importing");

    setTimeout(() => {
      try {
        // Fusionner avec l'historique existant (pas d'écrasement)
        setHistory(prev => {
          const existingIds = new Set(prev.map(s => s.id || s.startTs));
          const newSessions = preview.history.filter(
            s => !existingIds.has(s.id) && !existingIds.has(s.startTs)
          );
          return [...newSessions, ...prev].slice(0, 200);
        });

        // Profil : uniquement si l'utilisateur n'en a pas encore configuré un
        if (preview.profile.customName && preview.profile.customName !== "Ma Batterie") {
          setProfile(prev => ({ ...prev, ...preview.profile }));
        }

        // Calibration
        setCalibration(preview.calibration);

        // Température
        setTemperature(preview.temperature);

        markMigrationDone();
        setStatus("done");
        showToast?.({
          text: `✅ ${preview.sessionsCount} session(s) importée(s) !`,
          variant: "success",
        });
      } catch (err) {
        setStatus("error");
        setErrorMsg(`Erreur lors de l'import : ${err.message}`);
      }
    }, 300);
  }

  function handleReset() {
    setPreview(null);
    setStatus("idle");
    setErrorMsg("");
  }

  return (
    <div className="p-4 space-y-3" style={{ ...g.card, position: "relative", overflow: "hidden" }}>
      {/* Ligne lumineuse */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.7), rgba(56,189,248,0.5), transparent)",
      }} />

      {/* Titre */}
      <div className="flex items-center gap-2">
        <span style={{ fontSize: "20px" }}>📦</span>
        <div>
          <p className="font-semibold text-sm text-white">
            {t("migration_titre") || "Importer depuis l'ancienne version"}
          </p>
          <p className="text-xs mt-0.5" style={g.label}>
            {t("migration_desc") || "Récupérez votre historique BatLife HTML v5/v6"}
          </p>
        </div>
      </div>

      {/* === ÉTAT : idle === */}
      {status === "idle" && (
        <>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(148,197,240,0.65)" }}>
            {t("migration_instructions") ||
              "Dans l'ancienne app BatLife, allez dans Outils → Exporter les données. Sélectionnez ensuite le fichier JSON obtenu."}
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 rounded-xl font-semibold transition-all"
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(56,189,248,0.15))",
              border: "0.5px solid rgba(139,92,246,0.4)",
              color: "#a78bfa",
            }}
          >
            📂 {t("migration_choisir_fichier") || "Choisir le fichier backup..."}
          </button>
        </>
      )}

      {/* === ÉTAT : analyzing === */}
      {status === "analyzing" && (
        <div className="text-center py-4" style={g.label}>
          ⏳ {t("migration_analyse") || "Analyse du fichier..."}
        </div>
      )}

      {/* === ÉTAT : ready — aperçu avant import === */}
      {status === "ready" && preview && (
        <div className="space-y-3">
          {/* Résumé */}
          <div className="p-3 rounded-xl space-y-2" style={{
            background: "rgba(74,222,128,0.07)",
            border: "0.5px solid rgba(74,222,128,0.25)",
          }}>
            <p className="text-xs font-semibold" style={{ color: "#4ade80" }}>
              ✅ {t("migration_pret") || "Fichier valide — aperçu :"}
            </p>
            {[
              { label: "🔋 Sessions", val: `${preview.sessionsCount} charge(s)` },
              { label: "🚴 Véhicule", val: preview.profile.vehicle || "—" },
              { label: "⚡ Tension",  val: `${preview.profile.nominalVoltage}V` },
              { label: "🔬 Niveau",   val: preview.profile.level === "expert" ? "Expert (V)" : "Débutant (%)" },
            ].map((row, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span style={{ color: "rgba(148,197,240,0.6)" }}>{row.label}</span>
                <span className="font-semibold text-white">{row.val}</span>
              </div>
            ))}
          </div>

          {/* Note fusion */}
          <p className="text-xs" style={{ color: "rgba(148,197,240,0.5)" }}>
            ℹ️ {t("migration_fusion_note") ||
              "Les sessions seront fusionnées avec votre historique actuel (pas d'écrasement)."}
          </p>

          {/* Boutons */}
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(255,255,255,0.1)",
                color: "rgba(148,197,240,0.6)",
              }}
            >
              ✕ {t("annuler") || "Annuler"}
            </button>
            <button
              onClick={handleImport}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{
                background: "linear-gradient(135deg, rgba(74,222,128,0.25), rgba(56,189,248,0.15))",
                border: "0.5px solid rgba(74,222,128,0.4)",
                color: "#4ade80",
              }}
            >
              ⬇️ {t("migration_importer") || "Importer"}
            </button>
          </div>
        </div>
      )}

      {/* === ÉTAT : importing === */}
      {status === "importing" && (
        <div className="text-center py-4" style={g.label}>
          ⏳ {t("migration_en_cours") || "Import en cours..."}
        </div>
      )}

      {/* === ÉTAT : done === */}
      {status === "done" && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl text-center" style={{
            background: "rgba(74,222,128,0.1)",
            border: "0.5px solid rgba(74,222,128,0.3)",
          }}>
            <p className="font-bold text-sm" style={{ color: "#4ade80" }}>
              🎉 {t("migration_succes") || "Migration réussie !"}
            </p>
            <p className="text-xs mt-1" style={{ color: "rgba(74,222,128,0.7)" }}>
              {preview?.sessionsCount} {t("migration_sessions_importees") || "session(s) importée(s) dans vos Stats."}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="w-full py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.1)",
              color: "rgba(148,197,240,0.6)",
            }}
          >
            {t("migration_reimporter") || "Importer un autre fichier"}
          </button>
        </div>
      )}

      {/* === ÉTAT : error === */}
      {status === "error" && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl" style={{
            background: "rgba(248,113,113,0.1)",
            border: "0.5px solid rgba(248,113,113,0.3)",
          }}>
            <p className="text-xs font-semibold" style={{ color: "#f87171" }}>
              ❌ {t("migration_erreur") || "Erreur"}
            </p>
            <p className="text-xs mt-1" style={{ color: "rgba(248,113,113,0.7)" }}>
              {errorMsg}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="w-full py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.1)",
              color: "rgba(148,197,240,0.6)",
            }}
          >
            ↩ {t("migration_reessayer") || "Réessayer"}
          </button>
        </div>
      )}
    </div>
  );
}
