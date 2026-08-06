<div align="center">

# 🔋 BatLife

### L'app qui prolonge la vie de votre batterie e-bike & trottinette

[![Website](https://img.shields.io/badge/🌐_Site-batlife.app-38bdf8?style=for-the-badge)](https://batlife.app)
[![PWA](https://img.shields.io/badge/PWA-Installable-4ade80?style=for-the-badge)](https://batlife.app)
[![Languages](https://img.shields.io/badge/Langues-5-a78bfa?style=for-the-badge)](#-langues-supportées)
[![License](https://img.shields.io/badge/Licence-MIT-facc15?style=for-the-badge)](LICENSE)

**Suivez, comprenez et optimisez la durée de vie de votre batterie Li-ion**  
*Gratuit • Sans pub • Sans tracking • 100% local*

[🚀 Essayer maintenant](https://batlife.app) • [📖 Documentation](#-fonctionnalités) • [☕ Soutenir le projet](https://buymeacoffee.com/VOTRE_LIEN)

</div>

---

## 📸 Aperçu

<div align="center">

<table>
  <tr>
    <td align="center"><b>🏠 Dashboard</b></td>
    <td align="center"><b>📊 Statistiques</b></td>
    <td align="center"><b>🧠 Coach</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/01-dashboard.png" width="250" alt="Dashboard"/></td>
    <td><img src="docs/screenshots/02-stats.png" width="250" alt="Stats"/></td>
    <td><img src="docs/screenshots/03-coach.png" width="250" alt="Coach"/></td>
  </tr>
  <tr>
    <td align="center"><b>🔋 Charge active</b></td>
    <td align="center"><b>🏅 Badges</b></td>
    <td align="center"><b>⚙️ Réglages</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/04-charge.png" width="250" alt="Charge active"/></td>
    <td><img src="docs/screenshots/05-badges.png" width="250" alt="Badges"/></td>
    <td><img src="docs/screenshots/06-settings.png" width="250" alt="Réglages"/></td>
  </tr>
</table>

</div>

---

## 💡 Pourquoi BatLife ?

Une batterie Li-ion mal utilisée peut perdre **50% de sa capacité en 2 ans**.  
BatLife est né d'un simple fichier Excel créé par un passionné pour suivre ses trajets et sa batterie.  
Aujourd'hui, c'est une **PWA moderne** qui vous aide à :

- 📈 **Comprendre** votre consommation réelle (Wh/km)
- 🔋 **Optimiser** vos habitudes de charge
- ⏳ **Prolonger** la durée de vie de votre batterie
- 🌍 **Économiser** de l'énergie et de l'argent

---

## ✨ Fonctionnalités

### 🎯 Cœur de l'app
- 🔋 **Suivi de charge intelligent** avec repos de stabilisation
- 📊 **Autonomie réelle** calculée sur vos vrais trajets
- ⚡ **Consommation Wh/km** précise (jamais celle du constructeur)
- 🌡️ **Conseils dynamiques selon la température** (gel, chaud, idéal...)
- 📈 **État de santé (SoH)** et prévision de remplacement

### 🧠 Intelligence
- 💬 **Coach intégré** avec 7 règles d'or
- 🔔 **Rappels intelligents** (charge d'équilibrage mensuelle, absence de charge)
- 🏅 **Système de badges** pour progresser
- 📋 **Journal d'entretien** (pneus, chaîne, freins...)

### 🛠️ Outils
- 📏 **Calibration voltmètre → capacité**
- ❄️ **Diagnostic hivernage** personnalisé
- 💾 **Export/Import JSON** (sauvegarde complète)
- 🔄 **Migration depuis les anciennes versions**

### 🔒 Éthique & vie privée
- ✅ **Aucune donnée collectée** — tout reste sur votre appareil
- ✅ **Aucune publicité**, aucun tracker
- ✅ **Code open source**
- ✅ **Fonctionne hors-ligne** (PWA)

---

## 🌍 Langues supportées

| 🇫🇷 Français | 🇬🇧 English | 🇪🇸 Español | 🇩🇪 Deutsch | 🇳🇱 Nederlands |
|:-:|:-:|:-:|:-:|:-:|
| ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🚀 Installation

### 📱 Installer sur votre téléphone (recommandé)

BatLife est une **Progressive Web App (PWA)** — pas besoin du Play Store ou App Store !

1. Ouvrez [**batlife.app**](https://batlife.app) sur votre téléphone
2. Menu navigateur → **"Ajouter à l'écran d'accueil"**
3. C'est prêt ! L'app fonctionne comme une vraie application ✨

### 💻 Utilisation sur ordinateur

Ouvrez simplement [**batlife.app**](https://batlife.app) dans votre navigateur.

---

## 🛠️ Stack technique

- ⚛️ **React 18** + Vite
- 🎨 **Tailwind CSS** avec design glassmorphism
- 📊 **Recharts** pour les graphiques
- 💾 **LocalStorage** pour la persistance (zéro serveur)
- 🌐 **PWA** avec Service Worker
- ☁️ Hébergé sur **Cloudflare Pages**

---

## 🏗️ Développement local

```bash
# Cloner le projet
git clone https://github.com/VOTRE_USERNAME/batlife.git
cd batlife

# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build de production
npm run build