import { useState } from "react";

const ONBOARDING_KEY = "bl_onboarding_done";

export function isOnboardingDone() {
  return localStorage.getItem(ONBOARDING_KEY) === "true";
}

export function markOnboardingDone() {
  localStorage.setItem(ONBOARDING_KEY, "true");
}

// ============================================================
// SLIDE 2 — Schéma visuel SVG "Comment ça marche"
// ============================================================
function SchemaCharge() {
  return (
    <svg viewBox="0 0 320 110" style={{ width: "100%", maxWidth: 320 }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>

      {/* Étape 1 */}
      <circle cx="40" cy="55" r="28" fill="rgba(56,189,248,0.12)" stroke="rgba(56,189,248,0.4)" strokeWidth="0.8"/>
      <text x="40" y="48" textAnchor="middle" fontSize="18">🔋</text>
      <text x="40" y="64" textAnchor="middle" fontSize="8" fill="rgba(148,197,240,0.8)">Niveau</text>
      <text x="40" y="74" textAnchor="middle" fontSize="8" fill="rgba(148,197,240,0.8)">actuel</text>

      {/* Flèche 1→2 */}
      <line x1="70" y1="55" x2="108" y2="55" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4,2"/>
      <polygon points="108,51 116,55 108,59" fill="#818cf8"/>

      {/* Étape 2 */}
      <circle cx="148" cy="55" r="28" fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.4)" strokeWidth="0.8"/>
      <text x="148" y="48" textAnchor="middle" fontSize="18">⚡</text>
      <text x="148" y="64" textAnchor="middle" fontSize="8" fill="rgba(148,197,240,0.8)">Suivi</text>
      <text x="148" y="74" textAnchor="middle" fontSize="8" fill="rgba(148,197,240,0.8)">en cours</text>

      {/* Flèche 2→3 */}
      <line x1="178" y1="55" x2="216" y2="55" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="4,2"/>
      <polygon points="216,51 224,55 216,59" fill="#4ade80"/>

      {/* Étape 3 */}
      <circle cx="256" cy="55" r="28" fill="rgba(74,222,128,0.12)" stroke="rgba(74,222,128,0.4)" strokeWidth="0.8"/>
      <text x="256" y="48" textAnchor="middle" fontSize="18">🧊</text>
      <text x="256" y="64" textAnchor="middle" fontSize="8" fill="rgba(148,197,240,0.8)">30 min</text>
      <text x="256" y="74" textAnchor="middle" fontSize="8" fill="rgba(148,197,240,0.8)">de repos</text>

      {/* Labels numérotés */}
      {[
        { x: 40,  label: "1" },
        { x: 148, label: "2" },
        { x: 256, label: "3" },
      ].map(({ x, label }) => (
        <circle key={label} cx={x} cy={20} r={8} fill="rgba(255,255,255,0.08)"
          stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
      ))}
      <text x="40"  y="24" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.6)" fontWeight="700">1</text>
      <text x="148" y="24" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.6)" fontWeight="700">2</text>
      <text x="256" y="24" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.6)" fontWeight="700">3</text>
    </svg>
  );
}

// ============================================================
// SLIDE 3 — Demande de permission notifications
// ============================================================
function NotifSlide({ notifState, onRequestPermission }) {
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
      {notifState === "granted" ? (
        <div style={{
          background: "rgba(74,222,128,0.1)",
          border: "0.5px solid rgba(74,222,128,0.35)",
          borderRadius: "14px", padding: "16px",
          textAlign: "center",
        }}>
          <p style={{ fontSize: "32px", marginBottom: "8px" }}>✅</p>
          <p style={{ color: "#4ade80", fontWeight: 700, fontSize: "14px" }}>
            Notifications activées !
          </p>
          <p style={{ color: "rgba(74,222,128,0.7)", fontSize: "12px", marginTop: "4px" }}>
            BatLife vous alertera quand la charge ou le repos est terminé.
          </p>
        </div>
      ) : notifState === "denied" ? (
        <div style={{
          background: "rgba(251,146,60,0.1)",
          border: "0.5px solid rgba(251,146,60,0.35)",
          borderRadius: "14px", padding: "16px",
        }}>
          <p style={{ color: "#fb923c", fontWeight: 600, fontSize: "13px" }}>
            ⚠️ Notifications bloquées
          </p>
          <p style={{ color: "rgba(251,146,60,0.75)", fontSize: "12px", marginTop: "4px", lineHeight: 1.5 }}>
            Vous pouvez les activer dans les paramètres de votre navigateur. L'app fonctionne très bien sans.
          </p>
        </div>
      ) : (
        <>
          {[
            { icon: "⏱️", text: "Fin de charge atteinte → alerte immédiate" },
            { icon: "🧊", text: "30 min de repos écoulées → alerte pour mesurer" },
            { icon: "🔋", text: "5 jours sans recharge → rappel bienveillant" },
          ].map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "12px",
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: "12px", padding: "12px 14px",
            }}>
              <span style={{ fontSize: "20px", flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>
                {item.text}
              </span>
            </div>
          ))}
          <button
            onClick={onRequestPermission}
            style={{
              marginTop: "4px",
              padding: "13px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(56,189,248,0.2))",
              border: "0.5px solid rgba(99,102,241,0.45)",
              color: "#818cf8",
              fontSize: "14px", fontWeight: 700,
              cursor: "pointer",
            }}
          >
            🔔 Activer les notifications
          </button>
          <p style={{ textAlign: "center", fontSize: "11px", color: "rgba(148,197,240,0.4)" }}>
            Optionnel — vous pouvez continuer sans
          </p>
        </>
      )}
    </div>
  );
}

// ============================================================
// SLIDES CONFIG
// ============================================================
const slides = [
  {
    id: "welcome",
    emoji: "🔋",
    title: "Bienvenue sur BatLife",
    description: "L'application qui prolonge la durée de vie de la batterie de votre vélo électrique ou trottinette.",
    highlight: "✓ Gratuit  ·  ✓ Sans compte  ·  ✓ Données sur votre téléphone",
    color: { rgb: "56,189,248", accent: "#38bdf8" },
  },
  {
    id: "howto",
    emoji: "🎯",
    title: "Comment ça marche ?",
    description: "Un suivi de charge en 3 étapes simples pour mesurer avec précision l'état réel de votre batterie.",
    hasSchema: true,
    steps: [
      { icon: "1️⃣", text: "Entrez votre niveau actuel et démarrez le suivi" },
      { icon: "2️⃣", text: "BatLife calcule le moment exact pour débrancher" },
      { icon: "3️⃣", text: "Après 30 min de repos, mesurez la valeur réelle" },
    ],
    color: { rgb: "99,102,241", accent: "#818cf8" },
  },
  {
    id: "notifs",
    emoji: "🔔",
    title: "Restez informé",
    description: "BatLife peut vous alerter au bon moment, même quand l'app est fermée.",
    hasNotif: true,
    color: { rgb: "139,92,246", accent: "#a78bfa" },
  },
  {
    id: "vehicle",
    emoji: "🚴",
    title: "Configurez votre véhicule",
    description: "Compatible avec les principales marques de VAE et trottinettes. Vous configurerez votre profil juste après.",
    features: [
      { icon: "🔋", text: "Duotts, Lankeleisi, Bosch, Yamaha..." },
      { icon: "🛴", text: "Xiaomi, Segway, Dualtron, Ninebot..." },
      { icon: "⚙️", text: "Ou saisie manuelle : Ah, Volts, courant" },
    ],
    color: { rgb: "34,197,94", accent: "#4ade80" },
  },
];

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function Onboarding({ onFinish }) {
  const [current, setCurrent]     = useState(0);
  const [exiting, setExiting]     = useState(false);
  const [slideDir, setSlideDir]   = useState(1);   // 1 = forward, -1 = backward
  const [animating, setAnimating] = useState(false);
  const [notifState, setNotifState] = useState(
    "Notification" in window ? Notification.permission : "denied"
  );

  const slide  = slides[current];
  const isLast = current === slides.length - 1;

  function goTo(index) {
    if (animating || index === current) return;
    setSlideDir(index > current ? 1 : -1);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 220);
  }

  function goNext() {
    if (isLast) {
      setExiting(true);
      setTimeout(() => { markOnboardingDone(); onFinish?.(); }, 400);
    } else {
      goTo(current + 1);
    }
  }

  function skip() {
    setExiting(true);
    setTimeout(() => { markOnboardingDone(); onFinish?.(); }, 400);
  }

  async function requestNotifPermission() {
    if (!("Notification" in window)) return;
    try {
      const result = await Notification.requestPermission();
      setNotifState(result);
    } catch {}
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99998,
      background: "linear-gradient(160deg, #060d1f 0%, #0b1a35 50%, #080f20 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px",
      opacity: exiting ? 0 : 1,
      transition: "opacity 0.4s ease",
      overflowY: "auto",
    }}>

      {/* Orbe décoratif */}
      <div style={{
        position: "absolute", width: 300, height: 300, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(${slide.color.rgb},0.13) 0%, transparent 70%)`,
        top: -100, right: -80, pointerEvents: "none",
        transition: "background 0.6s ease",
      }} />
      <div style={{
        position: "absolute", width: 200, height: 200, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(${slide.color.rgb},0.08) 0%, transparent 70%)`,
        bottom: 80, left: -60, pointerEvents: "none",
      }} />

      {/* Bouton passer */}
      {!isLast && (
        <button onClick={skip} style={{
          position: "absolute", top: 24, right: 24,
          background: "rgba(255,255,255,0.06)",
          border: "0.5px solid rgba(255,255,255,0.1)",
          borderRadius: "20px", padding: "6px 16px",
          color: "rgba(148,197,240,0.55)", fontSize: "13px",
          cursor: "pointer",
        }}>
          Passer
        </button>
      )}

      {/* Numéro slide */}
      <p style={{
        position: "absolute", top: 28, left: 24,
        fontSize: "12px", color: "rgba(148,197,240,0.35)",
        fontVariantNumeric: "tabular-nums",
      }}>
        {current + 1} / {slides.length}
      </p>

      {/* Contenu slide */}
      <div style={{
        width: "100%", maxWidth: 380,
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: "20px",
        textAlign: "center",
        opacity: animating ? 0 : 1,
        transform: animating ? `translateX(${slideDir * 30}px)` : "translateX(0)",
        transition: "opacity 0.22s ease, transform 0.22s ease",
      }}>

        {/* Emoji / icône */}
        <div style={{
          width: 110, height: 110, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${slide.color.rgb},0.2) 0%, rgba(${slide.color.rgb},0.05) 60%, transparent 100%)`,
          border: `0.5px solid rgba(${slide.color.rgb},0.3)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "52px",
          boxShadow: `0 0 40px rgba(${slide.color.rgb},0.18)`,
          flexShrink: 0,
        }}>
          {slide.emoji}
        </div>

        {/* Titre */}
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "white", lineHeight: 1.2, margin: 0 }}>
          {slide.title}
        </h1>

        {/* Description */}
        {slide.description && (
          <p style={{ fontSize: "14px", color: "rgba(148,197,240,0.7)", lineHeight: 1.6, margin: 0 }}>
            {slide.description}
          </p>
        )}

        {/* Highlight (slide 1) */}
        {slide.highlight && (
          <div style={{
            background: `rgba(${slide.color.rgb},0.08)`,
            border: `0.5px solid rgba(${slide.color.rgb},0.25)`,
            borderRadius: "12px", padding: "10px 16px",
            fontSize: "12px", color: slide.color.accent, fontWeight: 600,
            letterSpacing: "0.02em",
          }}>
            {slide.highlight}
          </div>
        )}

        {/* Schéma SVG (slide 2) */}
        {slide.hasSchema && (
          <div style={{ width: "100%", padding: "0 4px" }}>
            <SchemaCharge />
          </div>
        )}

        {/* Étapes texte (slide 2) */}
        {slide.steps && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
            {slide.steps.map((step, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "10px",
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                borderRadius: "12px", padding: "10px 14px",
                textAlign: "left",
              }}>
                <span style={{ fontSize: "18px", flexShrink: 0 }}>{step.icon}</span>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.82)", lineHeight: 1.4 }}>
                  {step.text}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Slide notifications (slide 3) */}
        {slide.hasNotif && (
          <NotifSlide notifState={notifState} onRequestPermission={requestNotifPermission} />
        )}

        {/* Features (slide 4) */}
        {slide.features && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
            {slide.features.map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "10px",
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                borderRadius: "10px", padding: "10px 14px",
                textAlign: "left",
              }}>
                <span style={{ fontSize: "18px", flexShrink: 0 }}>{f.icon}</span>
                <span style={{ fontSize: "13px", color: "rgba(148,197,240,0.8)" }}>{f.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Indicateurs de progression cliquables */}
      <div style={{ display: "flex", gap: "8px", marginTop: "32px" }}>
        {slides.map((_, i) => (
          <div
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: i === current ? "28px" : "8px",
              height: "8px", borderRadius: "4px",
              background: i === current
                ? slide.color.accent
                : i < current
                  ? `rgba(${slide.color.rgb},0.35)`
                  : "rgba(255,255,255,0.18)",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
          />
        ))}
      </div>

      {/* Bouton principal */}
      <button
        onClick={goNext}
        style={{
          marginTop: "20px",
          width: "100%", maxWidth: 380,
          padding: "15px",
          borderRadius: "16px",
          background: `linear-gradient(135deg, rgba(${slide.color.rgb},0.28), rgba(${slide.color.rgb},0.14))`,
          border: `0.5px solid rgba(${slide.color.rgb},0.5)`,
          color: slide.color.accent,
          fontSize: "15px", fontWeight: 700,
          cursor: "pointer",
          boxShadow: `0 0 24px rgba(${slide.color.rgb},0.18)`,
          transition: "all 0.3s ease",
        }}
      >
        {isLast ? "🚀 Commencer !" : "Suivant →"}
      </button>

      {/* Navigation retour */}
      {current > 0 && (
        <button
          onClick={() => goTo(current - 1)}
          style={{
            marginTop: "10px",
            background: "none", border: "none",
            color: "rgba(148,197,240,0.4)", fontSize: "13px",
            cursor: "pointer", padding: "6px 12px",
          }}
        >
          ← Précédent
        </button>
      )}

    </div>
  );
}
