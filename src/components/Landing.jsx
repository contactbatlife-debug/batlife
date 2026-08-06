import { useEffect, useRef, useState } from "react";

// ============================================================
// LANDING PAGE — BatLife
// Signature : jauge de batterie qui se charge progressivement
// au scroll, reprenant la métaphore centrale du produit.
// ============================================================

const STYLE = `
.bl-landing {
  --bg:        #060c1c;
  --bg-card:   rgba(255,255,255,0.04);
  --border:    rgba(255,255,255,0.1);
  --cyan:      #38bdf8;
  --green:     #4ade80;
  --violet:    #818cf8;
  --text:      rgba(255,255,255,0.92);
  --text-dim:  rgba(148,197,240,0.6);
  --text-mute: rgba(148,197,240,0.4);
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
}

.bl-landing * { box-sizing: border-box; }

.bl-orb {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  filter: blur(2px);
}

.bl-nav {
  position: relative;
  z-index: 10;
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 24px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.bl-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 20px;
}
.bl-logo-text {
  background: linear-gradient(135deg, #fff 0%, var(--cyan) 60%, var(--violet) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.bl-nav-cta {
  background: linear-gradient(135deg, rgba(56,189,248,0.2), rgba(99,102,241,0.15));
  border: 1px solid rgba(56,189,248,0.4);
  color: var(--cyan);
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
}
.bl-nav-cta:hover { box-shadow: 0 0 20px rgba(56,189,248,0.25); }

.bl-hero {
  position: relative;
  z-index: 5;
  max-width: 1100px;
  margin: 0 auto;
  padding: 60px 24px 40px;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 48px;
  align-items: center;
}
@media (max-width: 860px) {
  .bl-hero { grid-template-columns: 1fr; padding-top: 32px; gap: 32px; }
}

.bl-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--green);
  background: rgba(74,222,128,0.08);
  border: 1px solid rgba(74,222,128,0.25);
  padding: 6px 14px;
  border-radius: 100px;
  margin-bottom: 24px;
}

.bl-h1 {
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.02em;
  margin: 0 0 20px;
}
.bl-h1 em {
  font-style: normal;
  background: linear-gradient(135deg, var(--cyan) 0%, var(--violet) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.bl-sub {
  font-size: 17px;
  line-height: 1.6;
  color: var(--text-dim);
  margin: 0 0 32px;
  max-width: 480px;
}

.bl-cta-row {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}
.bl-cta-primary {
  background: linear-gradient(135deg, rgba(56,189,248,0.3), rgba(99,102,241,0.25));
  border: 1px solid rgba(56,189,248,0.5);
  color: #fff;
  padding: 15px 28px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 0 30px rgba(56,189,248,0.18);
  transition: transform 0.15s, box-shadow 0.15s;
}
.bl-cta-primary:hover { transform: translateY(-1px); box-shadow: 0 0 40px rgba(56,189,248,0.3); }
.bl-cta-secondary {
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  color: var(--text-dim);
  padding: 15px 22px;
  border-radius: 14px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  text-decoration: none;
}

.bl-trust {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--text-mute);
}
.bl-trust span { display: flex; align-items: center; gap: 6px; }

/* === Signature element : jauge batterie animée === */
.bl-gauge-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
.bl-gauge {
  position: relative;
  width: 100%;
  max-width: 220px;
  height: 380px;
  border: 3px solid rgba(255,255,255,0.18);
  border-radius: 32px;
  overflow: hidden;
  background: rgba(0,0,0,0.3);
  box-shadow: 0 0 60px rgba(56,189,248,0.08), inset 0 0 30px rgba(0,0,0,0.4);
}
.bl-gauge::before {
  content: "";
  position: absolute;
  top: -14px; left: 50%;
  transform: translateX(-50%);
  width: 60px; height: 16px;
  background: rgba(255,255,255,0.18);
  border-radius: 6px 6px 0 0;
}
.bl-gauge-fill {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: linear-gradient(180deg, var(--cyan) 0%, var(--green) 100%);
  transition: height 1.8s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 0 24px rgba(74,222,128,0.4);
}
.bl-gauge-fill::after {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; height: 3px;
  background: rgba(255,255,255,0.5);
}
.bl-gauge-pct {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 2px 12px rgba(0,0,0,0.5);
  z-index: 2;
}
.bl-gauge-caption {
  font-size: 13px;
  color: var(--text-mute);
  text-align: center;
  max-width: 240px;
  line-height: 1.5;
}

/* === Sections === */
.bl-section {
  position: relative;
  z-index: 5;
  max-width: 1100px;
  margin: 0 auto;
  padding: 80px 24px;
}
.bl-section-head {
  text-align: center;
  max-width: 600px;
  margin: 0 auto 48px;
}
.bl-section-eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--cyan);
  margin-bottom: 12px;
}
.bl-h2 {
  font-size: clamp(1.6rem, 3.4vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.01em;
  margin: 0 0 14px;
}
.bl-section-sub {
  color: var(--text-dim);
  font-size: 15.5px;
  line-height: 1.6;
}

.bl-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}
@media (max-width: 860px) { .bl-features { grid-template-columns: 1fr; } }

.bl-feature {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-top: 1px solid rgba(255,255,255,0.16);
  border-radius: 18px;
  padding: 26px;
  position: relative;
  overflow: hidden;
}
.bl-feature::before {
  content: "";
  position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(56,189,248,0.5), transparent);
}
.bl-feature-icon { font-size: 28px; margin-bottom: 14px; display: block; }
.bl-feature h3 { font-size: 16px; font-weight: 700; margin: 0 0 8px; }
.bl-feature p { font-size: 14px; color: var(--text-dim); line-height: 1.55; margin: 0; }

/* === Showcase (screenshots) === */
.bl-showcase {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding: 8px 4px 20px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.bl-showcase::-webkit-scrollbar { height: 6px; }
.bl-showcase::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.3); border-radius: 4px; }
.bl-showcase-item {
  flex: 0 0 auto;
  scroll-snap-align: start;
  width: 220px;
}
.bl-showcase-item img {
  width: 100%;
  border-radius: 20px;
  border: 1px solid var(--border);
  display: block;
  box-shadow: 0 20px 50px rgba(0,0,0,0.4);
}
.bl-showcase-label {
  text-align: center;
  font-size: 13px;
  color: var(--text-mute);
  margin-top: 10px;
}

/* === Steps === */
.bl-steps {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: 640px;
  margin: 0 auto;
}
.bl-step {
  display: flex;
  gap: 20px;
  padding: 22px 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.bl-step:last-child { border-bottom: none; }
.bl-step-num {
  flex-shrink: 0;
  width: 36px; height: 36px;
  border-radius: 10px;
  background: rgba(56,189,248,0.1);
  border: 1px solid rgba(56,189,248,0.3);
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; color: var(--cyan); font-size: 14px;
}
.bl-step h4 { margin: 0 0 4px; font-size: 15.5px; font-weight: 700; }
.bl-step p { margin: 0; font-size: 14px; color: var(--text-dim); line-height: 1.5; }

/* === Footer CTA === */
.bl-final-cta {
  text-align: center;
  padding: 70px 24px 90px;
}
.bl-final-cta h2 { margin-bottom: 14px; }

.bl-footer {
  border-top: 1px solid rgba(255,255,255,0.06);
  padding: 28px 24px;
  text-align: center;
  font-size: 13px;
  color: var(--text-mute);
}
.bl-footer a { color: var(--text-mute); text-decoration: underline; }

@media (prefers-reduced-motion: reduce) {
  .bl-gauge-fill { transition: none; }
}
`;

function Orbs() {
  const orbs = [
    { w: 360, h: 360, top: "-100px", left: "-100px", color: "rgba(56,189,248,0.12)" },
    { w: 280, h: 280, top: "30%", right: "-80px", color: "rgba(129,140,248,0.1)" },
    { w: 240, h: 240, bottom: "10%", left: "5%", color: "rgba(74,222,128,0.07)" },
  ];
  return orbs.map((o, i) => (
    <div
      key={i}
      className="bl-orb"
      style={{
        width: o.w, height: o.h,
        top: o.top, bottom: o.bottom, left: o.left, right: o.right,
        background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
      }}
    />
  ));
}

function BatteryGauge() {
  const [pct, setPct] = useState(20);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setPct(80); },
      { threshold: 0.4 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="bl-gauge-wrap" ref={ref}>
      <div className="bl-gauge">
        <div className="bl-gauge-fill" style={{ height: `${pct}%` }} />
        <div className="bl-gauge-pct">{pct}%</div>
      </div>
      <p className="bl-gauge-caption">
        BatLife vous dit exactement quand débrancher — ni trop tôt, ni trop tard.
      </p>
    </div>
  );
}

const FEATURES = [
  { icon: "⚡", title: "Suivi de charge intelligent", text: "Démarrez un suivi, et BatLife calcule le moment optimal pour débrancher selon votre véhicule et la température." },
  { icon: "🎯", title: "Calibration précise", text: "Étalonnez les tensions de charge selon votre usage : quotidien, longue sortie ou stockage hivernal." },
  { icon: "🧠", title: "Coach personnalisé", text: "Les 7 règles d'or pour doubler la durée de vie de votre batterie, expliquées simplement." },
  { icon: "📊", title: "Statistiques détaillées", text: "Évolution du SoH, autonomie réelle, historique complet — exportable en PDF." },
  { icon: "🔋", title: "Multi-batterie", text: "Gérez plusieurs vélos ou trottinettes électriques depuis la même application." },
  { icon: "🌍", title: "100% privé", text: "Aucune donnée envoyée à un serveur. Tout reste sur votre téléphone, sans inscription." },
];

const STEPS = [
  { title: "Indiquez votre niveau actuel", text: "Pourcentage ou tension selon votre mode (débutant ou expert)." },
  { title: "BatLife calcule le moment exact pour débrancher", text: "Selon votre véhicule, le mode de charge et la température." },
  { title: "Après 30 min de repos, mesurez la valeur réelle", text: "Pour calibrer précisément les futures prévisions." },
];

export default function Landing({ onEnter }) {
  return (
    <div className="bl-landing">
      <style>{STYLE}</style>
      <Orbs />

      <nav className="bl-nav">
        <div className="bl-logo">
          <span>🔋</span>
          <span className="bl-logo-text">BatLife</span>
        </div>
        <button className="bl-nav-cta" onClick={onEnter}>
          Ouvrir l'app
        </button>
      </nav>

      <header className="bl-hero">
        <div>
          <span className="bl-eyebrow">✅ Gratuit · Sans inscription · Données locales</span>
          <h1 className="bl-h1">
            Faites durer la batterie<br />de votre <em>vélo électrique</em>
          </h1>
          <p className="bl-sub">
            BatLife suit chaque charge de votre VAE ou trottinette électrique
            et vous dit précisément quand débrancher pour préserver la santé
            de la batterie sur le long terme.
          </p>
          <div className="bl-cta-row">
            <button className="bl-cta-primary" onClick={onEnter}>
              🚀 Commencer gratuitement
            </button>
            <a className="bl-cta-secondary" href="#comment-ca-marche">
              Comment ça marche ?
            </a>
          </div>
          <div className="bl-trust">
            <span>🔒 Aucune donnée collectée</span>
            <span>📱 Fonctionne hors-ligne</span>
            <span>🌍 FR · EN · ES · DE</span>
          </div>
        </div>

        <BatteryGauge />
      </header>

      <section className="bl-section" id="fonctionnalites">
        <div className="bl-section-head">
          <p className="bl-section-eyebrow">Fonctionnalités</p>
          <h2 className="bl-h2">Tout ce qu'il faut pour préserver votre batterie</h2>
          <p className="bl-section-sub">
            Pensé par un passionné de mobilité électrique, pour les passionnés de mobilité électrique.
          </p>
        </div>
        <div className="bl-features">
          {FEATURES.map((f, i) => (
            <div className="bl-feature" key={i}>
              <span className="bl-feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bl-section" id="apercu">
        <div className="bl-section-head">
          <p className="bl-section-eyebrow">Aperçu</p>
          <h2 className="bl-h2">Une interface claire, pensée pour le mobile</h2>
        </div>
        <div className="bl-showcase">
          <div className="bl-showcase-item">
            <img src="/screenshots/screenshot-dashboard.jpg" alt="Tableau de bord BatLife" loading="lazy" />
            <p className="bl-showcase-label">Tableau de bord</p>
          </div>
          <div className="bl-showcase-item">
            <img src="/screenshots/screenshot-stats.jpg" alt="Statistiques BatLife" loading="lazy" />
            <p className="bl-showcase-label">Statistiques & prévision</p>
          </div>
          <div className="bl-showcase-item">
            <img src="/screenshots/screenshot-coach.jpg" alt="Coach BatLife" loading="lazy" />
            <p className="bl-showcase-label">Coach batterie</p>
          </div>
          <div className="bl-showcase-item">
            <img src="/screenshots/screenshot-badges.jpg" alt="Badges BatLife" loading="lazy" />
            <p className="bl-showcase-label">Badges & progression</p>
          </div>
        </div>
      </section>

      <section className="bl-section" id="comment-ca-marche">
        <div className="bl-section-head">
          <p className="bl-section-eyebrow">Comment ça marche</p>
          <h2 className="bl-h2">Un suivi en 3 étapes simples</h2>
        </div>
        <div className="bl-steps">
          {STEPS.map((s, i) => (
            <div className="bl-step" key={i}>
              <div className="bl-step-num">{i + 1}</div>
              <div>
                <h4>{s.title}</h4>
                <p>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bl-final-cta">
        <h2 className="bl-h2">Prêt à prolonger la vie de votre batterie ?</h2>
        <p className="bl-sub" style={{ margin: "0 auto 28px" }}>
          Gratuit, sans inscription, et vos données restent sur votre téléphone.
        </p>
        <button className="bl-cta-primary" onClick={onEnter}>
          🔋 Lancer BatLife
        </button>
      </section>

      <footer className="bl-footer">
        <p>
          © 2026 Marc P. — BatLife · <a href="mailto:contact.batlife@gmail.com">contact.batlife@gmail.com</a>
        </p>
      </footer>
    </div>
  );
}
