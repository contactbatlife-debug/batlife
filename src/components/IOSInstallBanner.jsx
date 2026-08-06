// ============================================================
// BatLife — IOSInstallBanner.jsx
// Bandeau d'avertissement pour les utilisateurs iOS Safari
// non-installés — explique comment ajouter à l'écran d'accueil
// pour éviter la purge des données après 7 jours (ITP Safari)
// ============================================================

import { useApp } from "../context/AppContext";

export default function IOSInstallBanner({ t }) {
  const { showIOSBanner, dismissIOSBanner } = useApp();

  if (!showIOSBanner) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "80px", // au-dessus de la Navigation
      left: "12px",
      right: "12px",
      zIndex: 1000,
      background: "rgba(6,12,28,0.97)",
      border: "1px solid rgba(251,146,60,0.5)",
      borderLeft: "4px solid #fb923c",
      borderRadius: "16px",
      padding: "14px 16px",
      backdropFilter: "blur(16px)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }}>
      {/* Bouton fermer */}
      <button
        onClick={dismissIOSBanner}
        style={{
          position: "absolute", top: "10px", right: "12px",
          background: "none", border: "none", cursor: "pointer",
          color: "rgba(148,197,240,0.5)", fontSize: "18px", lineHeight: 1,
        }}
      >
        ✕
      </button>

      <div className="flex items-start gap-3">
        <span style={{ fontSize: "24px", flexShrink: 0 }}>📱</span>
        <div>
          <p style={{
            fontWeight: 700, fontSize: "13px", color: "#fb923c", marginBottom: "6px",
          }}>
            ⚠️ Protégez votre historique sur iPhone
          </p>
          <p style={{
            fontSize: "12px", color: "rgba(200,235,255,0.8)", lineHeight: 1.55, marginBottom: "8px",
          }}>
            Sur Safari, les données peuvent être effacées après 7 jours sans visite.
            Ajoutez BatLife à votre écran d'accueil pour les conserver définitivement.
          </p>
          <div style={{
            background: "rgba(251,146,60,0.08)",
            border: "0.5px solid rgba(251,146,60,0.25)",
            borderRadius: "10px",
            padding: "8px 12px",
            fontSize: "12px",
            color: "rgba(200,235,255,0.7)",
            lineHeight: 1.6,
          }}>
            Appuyez sur <strong style={{ color: "#fb923c" }}>􀈂 Partager</strong> →{" "}
            <strong style={{ color: "#fb923c" }}>Sur l'écran d'accueil</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
