import { VOLTAGE_DATABASE } from "./config";

// Récupère les données de tension d'une batterie
export function vdb(n) {
  return VOLTAGE_DATABASE[n] || VOLTAGE_DATABASE[48];
}

// Convertit Volts → Pourcentage
export function v2p(v, n) {
  const d = vdb(n);
  return Math.max(0, Math.min(100, Math.round((v - d.min) / (d.max - d.min) * 100)));
}

// Convertit Pourcentage → Volts
export function p2v(p, n) {
  const d = vdb(n);
  return +(d.min + (p / 100) * (d.max - d.min)).toFixed(1);
}

// Met une majuscule
export function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Formate millisecondes → HH:MM:SS
export function fmt(ms) {
  const s = Math.floor(ms / 1000);
  return [
    Math.floor(s / 3600),
    Math.floor((s % 3600) / 60),
    s % 60
  ].map(v => String(v).padStart(2, "0")).join(":");
}

// Formate millisecondes → MM:SS
export function fmtMS(ms) {
  const s = Math.floor(ms / 1000);
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}