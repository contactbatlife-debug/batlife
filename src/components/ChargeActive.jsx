import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { calculerProgression } from "../services/charge";
import { fmt, v2p, p2v } from "../services/calculs";
import Tooltip from "../components/Tooltip";

import {
  startRestTimer, getRestTimeRemaining, getRestEndTs,
  getRestChargeSnapshot, clearRestTimer, formatMMSS,
  triggerRestNotificationOnce,
} from "../services/restTimer";

const REST_NOTIFIED_KEY = "bl_rest_notified_for_end_ts";

const g = {
  card: {
    background:"rgba(255,255,255,0.04)",
    border:"0.5px solid rgba(255,255,255,0.1)",
    borderTop:"0.5px solid rgba(255,255,255,0.18)",
    borderRadius:"18px",
  },
  inner: {
    background:"rgba(255,255,255,0.03)",
    border:"0.5px solid rgba(255,255,255,0.06)",
    borderRadius:"10px",
  },
  label: { fontSize:"12px", color:"rgba(148,197,240,0.5)" },
  value: { fontSize:"13px", fontWeight:600, color:"white" },
};

function ChargeActive({ t }) {
  const { activeCharge, setActiveCharge, addToHistory, history, profile, showToast } = useApp();

  const [tick, setTick] = useState(0);
  const [alerteDeclenchee, setAlerteDeclenchee] = useState(false);
  const [enRepos, setEnRepos] = useState(false);
  const [reposTermine, setReposTermine] = useState(false);
  const [restRemainingMs, setRestRemainingMs] = useState(0);
  const [tensionReelleSaisie, setTensionReelleSaisie] = useState("");
  const [valide, setValide] = useState(false);

  const estExpert = profile?.level === "expert";
  const nominalVoltage = profile?.nominalVoltage || 48;
  const capacityAh = profile?.capacityAh || 15;

  const tr = (key, fallback) => { const v = t?.(key); return v && v !== key ? v : fallback; };
  const progression = activeCharge ? calculerProgression(activeCharge) : null;

  // Ticker 1s
  useEffect(() => {
    const interval = setInterval(() => setTick(v => v + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialisation au montage
  useEffect(() => {
    if (valide) return;

    const endTs = getRestEndTs();
    if (!endTs) return;

    const snapshot = getRestChargeSnapshot();
    const remaining = getRestTimeRemaining();

    if (!activeCharge && snapshot && remaining > 0) {
      setActiveCharge(snapshot);
    }

    setEnRepos(true);
    setAlerteDeclenchee(true);

    if (remaining <= 0) {
      setReposTermine(true);
      setRestRemainingMs(0);
      const alreadyNotified = localStorage.getItem(REST_NOTIFIED_KEY);
      if (String(alreadyNotified) !== String(endTs)) {
        triggerRestNotificationOnce({
          endTs,
          title: tr("repos_termine_notification_title", "BatLife : repos terminé"),
          body:  tr("repos_termine_notification_body", "Les 30 minutes de repos sont écoulées."),
        });
      }
    } else {
      setRestRemainingMs(remaining);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown du repos
  useEffect(() => {
    if (!enRepos || reposTermine) return;
    const interval = setInterval(() => {
      const remaining = getRestTimeRemaining();
      setRestRemainingMs(remaining);
      if (remaining <= 0) {
        setReposTermine(true);
        setRestRemainingMs(0);
        triggerRestNotificationOnce({
          endTs: getRestEndTs(),
          title: tr("repos_termine_notification_title", "BatLife : repos terminé"),
          body:  tr("repos_termine_notification_body", "Les 30 minutes de repos sont écoulées."),
        });
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [enRepos, reposTermine, t]);

  // Alerte fin de charge
  useEffect(() => {
    if (!progression?.isComplete || alerteDeclenchee || enRepos) return;
    setAlerteDeclenchee(true);
    setTimeout(() => {
      if ("vibrate" in navigator) navigator.vibrate([500,200,500,200,500]);
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      } catch {}
      if ("serviceWorker" in navigator && Notification.permission === "granted") {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification("BatLife", {
            body: t("charge_terminee"),
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
          });
        }).catch(() => {});
      }
    }, 0);
  }, [progression, alerteDeclenchee, enRepos, t]);

  if (valide) return null;
  if (!activeCharge || !progression || !profile) return null;

  function demanderPermissionNotification() {
    if ("Notification" in window && Notification.permission === "default")
      Notification.requestPermission().catch(() => {});
  }

  function debrancher() {
    if (!activeCharge) return;
    demanderPermissionNotification();
    startRestTimer(activeCharge);
    setEnRepos(true); setReposTermine(false); setAlerteDeclenchee(true);
    const remaining = getRestTimeRemaining();
    setRestRemainingMs(remaining);
    if (remaining <= 0) setReposTermine(true);
  }

  function validerTensionReelle() {
    if (!reposTermine) { showToast?.(tr("repos_pas_termine","Attendez que les 30 minutes soient écoulées.")); return; }
    const val = parseFloat(tensionReelleSaisie);
    let realVAfterRest, realPctAfterRest;
    if (estExpert) {
      realVAfterRest = !isNaN(val) ? val : progression.currentV;
      realPctAfterRest = v2p(realVAfterRest, nominalVoltage);
    } else {
      realPctAfterRest = !isNaN(val) ? val : progression.currentPct;
      realVAfterRest = p2v(realPctAfterRest, nominalVoltage);
    }
    const deltaV   = Number((realVAfterRest - activeCharge.targetV).toFixed(2));
    const deltaPct = Number((realPctAfterRest - activeCharge.targetPct).toFixed(1));
    const session = {
      date:Date.now(), startTs:activeCharge.startTs, endTs:Date.now(),
      vehicle:activeCharge.vehicle, nominal:activeCharge.nominal,
      nominalVoltage:activeCharge.nominalVoltage||nominalVoltage,
      mode:activeCharge.mode, startV:activeCharge.startV, startPct:activeCharge.startPct,
      targetV:activeCharge.targetV, targetPct:activeCharge.targetPct,
      finalV:progression.currentV, finalPct:progression.currentPct,
      duration:Date.now()-activeCharge.startTs, durationMs:Date.now()-activeCharge.startTs,
      realMeasure:true, typeSaisie:estExpert?"réelle_voltage":"réelle_pourcentage",
      realVAfterRest, realPctAfterRest, voltageReal:realVAfterRest, pctReal:realPctAfterRest,
      voltageGap:deltaV, deltaV, delta:deltaPct,
      kmRidden:activeCharge.kmRidden, kilometres:activeCharge.kmRidden,
      temperature:activeCharge.temperature,
    };
    addToHistory(session);

    const ecartAbs = Math.abs(deltaPct);
    const ecartV   = Math.abs(deltaV);
    let confirmMsg, confirmVariant;

    if (estExpert) {
      if (ecartV <= 0.2) {
  confirmMsg = "✅ Session enregistrée\n🎯 Écart parfait : " + (deltaV >= 0 ? "+" : "") + deltaV + "V";
  confirmVariant = "success";
} else if (ecartV <= 0.6) {
  confirmMsg = "✅ Session enregistrée\n📐 Écart normal : " + (deltaV >= 0 ? "+" : "") + deltaV + "V";
  confirmVariant = "default";
} else {
  confirmMsg = "✅ Session enregistrée\n📊 Estimation à affiner : " + (deltaV >= 0 ? "+" : "") + deltaV + "V";
  confirmVariant = "warning";
}
    } else {
      if (ecartAbs <= 2) {
  confirmMsg = "✅ Session enregistrée\n🎯 Écart parfait : " + (deltaPct >= 0 ? "+" : "") + deltaPct + "%";
  confirmVariant = "success";
} else if (ecartAbs <= 5) {
  confirmMsg = "✅ Session enregistrée\n📐 Écart normal : " + (deltaPct >= 0 ? "+" : "") + deltaPct + "%";
  confirmVariant = "default";
} else {
  confirmMsg = "✅ Session enregistrée\n📊 Estimation à affiner : " + (deltaPct >= 0 ? "+" : "") + deltaPct + "%";
  confirmVariant = "warning";
}
    }

    clearRestTimer();
    localStorage.removeItem("bl_rest_charge_snapshot");
    localStorage.removeItem("bl_rest_end_ts");
    localStorage.removeItem("bl_rest_notified_for_end_ts");
    localStorage.removeItem("bl_active_v5");

    showToast?.({ text: confirmMsg, variant: confirmVariant });

    setValide(true);
    setEnRepos(false);
    setReposTermine(false);
    setTensionReelleSaisie("");
    setActiveCharge(null);
  }

  function annuler() {
    if (!confirm(t("annuler_confirm"))) return;
    clearRestTimer();
    localStorage.removeItem("bl_rest_charge_snapshot");
    localStorage.removeItem("bl_rest_end_ts");
    localStorage.removeItem("bl_rest_notified_for_end_ts");
    localStorage.removeItem("bl_active_v5");
    setValide(true);
    setEnRepos(false); setReposTermine(false); setTensionReelleSaisie(""); setActiveCharge(null);
  }

  const rayon=60, circonference=2*Math.PI*rayon;
  const offset=circonference-progression.ratio*circonference;
  const heureFin=activeCharge.endTs
    ? new Date(activeCharge.endTs).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})
    : "--:--";

  // === MODE REPOS ===
  if (enRepos) {
    return (
      <div className="p-6 space-y-4 text-center" style={{ ...g.card, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute",top:0,left:0,right:0,height:"1px",
          background:"linear-gradient(90deg,transparent,rgba(56,189,248,0.7),rgba(139,92,246,0.5),transparent)" }} />

        <div style={{ fontSize:"48px", marginBottom:"4px" }}>🧊</div>
        <div className="text-xl font-bold text-white flex items-center justify-center gap-2">
          {tr("restTitle","Stabilisation thermique...")}
          <Tooltip text="Après débranchement, la tension remonte artificiellement. 30 min de repos permettent d'obtenir la vraie valeur stabilisée." position="bottom" />
        </div>
        <p className="text-sm" style={{ color:"rgba(148,197,240,0.55)", lineHeight:1.5 }}>
          {tr("restText","La chimie interne se stabilise. Attends si possible la fin du minuteur avant de mesurer.")}
        </p>

        <div style={{
          fontFamily:"monospace", fontSize:"clamp(1.6rem, 8vw, 2.5rem)", fontWeight:900, letterSpacing:"2px",
          background:"rgba(0,0,0,0.4)", border:"0.5px solid rgba(255,255,255,0.1)",
          borderRadius:"12px", padding:"14px 16px", width:"100%", boxSizing:"border-box",
          color:reposTermine?"#4ade80":"#38bdf8",
          boxShadow:reposTermine?"0 0 20px rgba(74,222,128,0.2)":"0 0 20px rgba(56,189,248,0.15)",
        }}>
          {reposTermine ? "✅ Stabilisée !" : formatMMSS(restRemainingMs)}
        </div>

        {!reposTermine && (
          <>
            <div style={{
              textAlign:"left", fontSize:"0.85rem", lineHeight:1.5,
              background:"rgba(56,189,248,0.08)", border:"0.5px solid rgba(56,189,248,0.25)",
              borderLeft:"3px solid rgba(56,189,248,0.6)", borderRadius:"10px", padding:"12px 14px",
              color:"rgba(200,235,255,0.8)",
            }}>
              {tr("restAlert","💡 Tu peux fermer l'app. À ton retour, elle se rouvrira sur la saisie finale.")}
            </div>

            <div className="text-center py-2 px-3 rounded-xl" style={{
              background:"rgba(168,85,247,0.08)", border:"0.5px solid rgba(168,85,247,0.25)",
              color:"#c084fc", fontSize:"0.85rem",
            }}>
              ⏰ {tr("fin_estimee_alarme", "Fin estimée à")} {new Date(Date.now() + restRemainingMs).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
              {" — "}{tr("pensez_alarme", "pensez à mettre une alarme")}
            </div>
          </>
        )}

        {reposTermine && (
          <div className="p-4 space-y-3 rounded-xl" style={{
            background:"rgba(0,0,0,0.2)", border:"0.5px solid rgba(255,255,255,0.08)",
          }}>
            <div className="flex items-center justify-center gap-1.5" style={{ color:"rgba(148,197,240,0.7)" }}>
              <span className="text-sm font-medium">
                {estExpert ? t("tension_apres_repos") : tr("pourcentage_reel_apres_repos","Pourcentage réel après repos (%)")}
              </span>
              <Tooltip text={estExpert
                ? "Mesurez la tension avec un voltmètre sur la prise de charge. C'est la valeur la plus précise."
                : "Lisez le pourcentage affiché sur l'écran de votre vélo ou trottinette après 30 min de repos."
              } position="top" />
            </div>
            <input type="number" step={estExpert?"0.1":"1"}
              placeholder={estExpert?`${activeCharge.targetV} V`:`${activeCharge.targetPct} %`}
              value={tensionReelleSaisie} onChange={(e)=>setTensionReelleSaisie(e.target.value)}
              className="w-full text-white font-bold text-center text-lg py-2 px-3 rounded-xl outline-none"
              style={{ background:"rgba(255,255,255,0.06)", border:"0.5px solid rgba(56,189,248,0.4)" }}
            />
          </div>
        )}

        <button onClick={validerTensionReelle}
          className="w-full py-3 rounded-xl font-semibold transition-all"
          style={{ background:"linear-gradient(135deg,rgba(56,189,248,0.25),rgba(99,102,241,0.2))",
            border:"0.5px solid rgba(56,189,248,0.4)", color:"#38bdf8", boxShadow:"0 0 16px rgba(56,189,248,0.1)" }}>
          📏 {tr("btnMeasureNow","Mesurer immédiatement")}
        </button>

        
      </div>
    );
  }

  // === MODE CHARGE EN COURS ===
  return (
    <div className="p-6 space-y-5" style={{ ...g.card, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute",top:0,left:0,right:0,height:"1px",
        background:"linear-gradient(90deg,transparent,rgba(129,140,248,0.7),rgba(56,189,248,0.9),transparent)" }} />

      <div className="text-center">
        <h2 className="text-xl font-bold text-white">⚡ {t("charge_en_cours")}</h2>
        <p className="text-sm mt-1" style={{ color:"rgba(148,197,240,0.5)" }}>{nominalVoltage}V • {capacityAh}Ah</p>
      </div>

      <div className="flex flex-col items-center">
        <svg width="160" height="160" style={{ transform:"rotate(-90deg)" }}>
          <defs>
            <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#818cf8"/>
              <stop offset="100%" stopColor="#38bdf8"/>
            </linearGradient>
          </defs>
          <circle cx="80" cy="80" r={rayon} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12"/>
          <circle cx="80" cy="80" r={rayon} fill="none"
            stroke={progression.isComplete?"#4ade80":"url(#progressGrad)"}
            strokeWidth="12" strokeDasharray={circonference} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition:"stroke-dashoffset 1s linear",
              filter:`drop-shadow(0 0 10px ${progression.isComplete?"rgba(74,222,128,0.6)":"rgba(56,189,248,0.5)"})` }}
          />
        </svg>
        <div style={{ marginTop:"-110px", textAlign:"center" }}>
          <p className="text-4xl font-black" style={{
            color: progression.isComplete ? "#4ade80" : "#38bdf8",
          }}>
            {Math.round(progression.ratio*100)}%
          </p>
          <p className="text-sm mt-1" style={{ color:"rgba(148,197,240,0.5)" }}>{t("progression")}</p>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        {[
          { label:`🔋 ${t("depart")}`, val:estExpert?`${activeCharge.startV}V`:`${activeCharge.startPct}%`, tip:"Niveau de batterie au moment du démarrage du suivi." },
          { label:`🎯 ${t("cible")}`, val:estExpert?`${activeCharge.targetV}V`:`${activeCharge.targetPct}%`, tip:"Valeur d'arrêt recommandée. Configurée dans Réglages > Étalonnage." },
          { label:`📊 ${t("en_cours")}`, val:estExpert?`${progression.currentV}V`:`${progression.currentPct}%`, tip:"Valeur estimée en temps réel par interpolation linéaire." },
          { label:`⏱️ ${t("temps_ecoule")}`, val:fmt(progression.elapsed), tip:null },
          { label:`⏳ ${t("temps_restant")}`, val:progression.isComplete?t("termine"):fmt(progression.remaining), tip:"Temps estimé calculé en fonction de votre capacité, courant de charge et température." },
          { label:`🕐 ${t("fin_estimee")}`, val:heureFin, tip:null },
        ].map((row,i)=>(
          <div key={i} className="flex justify-between items-center px-4 py-3" style={g.inner}>
            <span className="flex items-center gap-1.5" style={g.label}>
              {row.label}
              {row.tip && <Tooltip text={row.tip} position="top" />}
            </span>
            <span style={g.value}>{row.val}</span>
          </div>
        ))}
      </div>

      {progression.isComplete && (
        <div className="p-3 rounded-xl text-center animate-bounce" style={{
          background:"linear-gradient(135deg,rgba(74,222,128,0.15),rgba(56,189,248,0.1))",
          border:"0.5px solid rgba(74,222,128,0.3)", color:"#4ade80",
        }}>
          {t("charge_terminee")}
        </div>
      )}

      {!progression.isComplete && progression.remaining > 0 && (
        <div className="text-center py-2 px-3 rounded-xl" style={{
          background:"rgba(168,85,247,0.08)", border:"0.5px solid rgba(168,85,247,0.25)",
          color:"#c084fc", fontSize:"0.85rem",
        }}>
          ⏰ {tr("fin_estimee_alarme", "Fin estimée à")} {heureFin}
          {" — "}{tr("pensez_alarme", "pensez à mettre une alarme")}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={annuler} className="flex-1 py-3 rounded-xl font-medium transition-all"
          style={{ background:"linear-gradient(135deg,rgba(239,68,68,0.15),rgba(239,68,68,0.08))",
            border:"0.5px solid rgba(239,68,68,0.3)", color:"#f87171" }}>
          ❌ {t("annuler")}
        </button>
        <div className="flex-1 flex flex-col gap-1">
          <button onClick={debrancher} className="w-full py-3 rounded-xl font-semibold transition-all"
            style={{ background:"linear-gradient(135deg,rgba(56,189,248,0.25),rgba(99,102,241,0.2))",
              border:"0.5px solid rgba(56,189,248,0.4)", color:"#38bdf8", boxShadow:"0 0 20px rgba(56,189,248,0.12)" }}>
            🔌 {t("debrancher")}
          </button>
          <div className="flex items-center justify-center gap-1" style={{ fontSize:"11px", color:"rgba(148,197,240,0.4)" }}>
            <Tooltip text="Démarrez le timer de repos de 30 min. Après ce délai, mesurez la tension réelle pour calibrer précisément." position="top" />
            <span>Info</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChargeActive;
