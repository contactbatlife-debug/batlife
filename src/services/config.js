/* ============================================================
   BATLIFE - config.js
   Constantes, base de données véhicules, tensions
   ============================================================ */



/* ============================================================
   CONSTANTES GLOBALES
   ============================================================ */
const MAX_SESSION_AGE_MS  = 8  * 60 * 60 * 1000;
const REST_TIMER_MS       = 30 * 60 * 1000;
const REST_READY_MARGIN   = 28 * 60 * 1000;
const MAX_HISTORY_ENTRIES = 200;
const HISTORY_PAGE_SIZE   = 15;
const STORAGE_KEY_V6      = "bl_app_v6";

/* ============================================================
   BASE DE DONNÉES TENSIONS
   ============================================================ */
const VOLTAGE_DATABASE = {
  36: { min: 30.0, max: 42.0, storage: 37.8, daily: 40.0, course: 41.5 },
  48: { min: 40.0, max: 54.6, storage: 47.3, daily: 51.7, course: 54.0 },
  52: { min: 44.0, max: 58.8, storage: 51.4, daily: 55.8, course: 58.2 },
  60: { min: 50.0, max: 67.2, storage: 58.6, daily: 63.8, course: 66.5 },
  72: { min: 60.0, max: 84.0, storage: 72.0, daily: 79.2, course: 83.0 },
};

/* ============================================================
   FACTEURS TEMPÉRATURE
   Impact sur la capacité réelle et la vitesse de charge
   ============================================================ */
const TEMP_FACTORS = {
  // Température °C : { capacityFactor, chargeFactor, warning }
  "-20": { capacityFactor: 0.50, chargeFactor: 0.30, level: "danger",  warning: "danger_frost"   },
  "-10": { capacityFactor: 0.60, chargeFactor: 0.40, level: "danger",  warning: "danger_frost"   },
  "0"  : { capacityFactor: 0.75, chargeFactor: 0.60, level: "danger",  warning: "danger_cold"    },
  "5"  : { capacityFactor: 0.85, chargeFactor: 0.75, level: "warning", warning: "warning_cold"   },
  "10" : { capacityFactor: 0.90, chargeFactor: 0.85, level: "warning", warning: "warning_cold"   },
  "15" : { capacityFactor: 0.95, chargeFactor: 0.95, level: "ok",      warning: null             },
  "20" : { capacityFactor: 1.00, chargeFactor: 1.00, level: "ok",      warning: null             },
  "25" : { capacityFactor: 1.00, chargeFactor: 1.00, level: "ok",      warning: null             },
  "30" : { capacityFactor: 0.98, chargeFactor: 1.00, level: "ok",      warning: null             },
  "35" : { capacityFactor: 0.95, chargeFactor: 0.95, level: "warning", warning: "warning_hot"    },
  "40" : { capacityFactor: 0.90, chargeFactor: 0.85, level: "danger",  warning: "danger_hot"     },
  "45" : { capacityFactor: 0.80, chargeFactor: 0.70, level: "danger",  warning: "danger_veryhot" }
};

/* ============================================================
   CONFIGURATION NOTIFICATIONS
   ============================================================ */
const NOTIF_CONFIG = {
  vibrationMs:  3000,
  snoozeMins:   5,
  reminderDays: 5
};

/* ============================================================
   CONFIGURATION BADGES
   ============================================================ */
 export const BADGES_CONFIG = [
  {
    id:        "first_charge",
    emoji:     "🔋",
    nameKey:   "badge_first_charge",
    descKey:   "badge_first_charge_desc",
    condition: (h) => h.length >= 1
  },
  {
    id:        "ten_charges",
    emoji:     "🔟",
    nameKey:   "badge_ten_charges",
    descKey:   "badge_ten_charges_desc",
    condition: (h) => h.length >= 10
  },
  {
    id:        "fifty_charges",
    emoji:     "🏆",
    nameKey:   "badge_fifty_charges",
    descKey:   "badge_fifty_charges_desc",
    condition: (h) => h.length >= 50
  },
  {
    id:        "eco_master",
    emoji:     "🌱",
    nameKey:   "badge_eco_master",
    descKey:   "badge_eco_master_desc",
    condition: (h) => {
      const r = h.slice(0,10);
      return r.length >= 5 && r.filter(s => s.mode === "daily").length >= 8;
    }
  },
  {
    id:        "precision",
    emoji:     "🎯",
    nameKey:   "badge_precision",
    descKey:   "badge_precision_desc",
    condition: (h) => {
      const r = h.filter(s => s.realMeasure);
      return r.length >= 5 && r.every(s => Math.abs(s.finalV - s.targetV) < 0.5);
    }
  },
  {
    id:        "rest_champion",
    emoji:     "🧊",
    nameKey:   "badge_rest_champion",
    descKey:   "badge_rest_champion_desc",
    condition: (h) => {
      const r = h.slice(0,10);
      return r.length >= 5 &&
        r.filter(s => s.reliability === "rested" || s.reliability === "hours").length >= 5;
    }
  },
  {
    id:        "long_life",
    emoji:     "♾️",
    nameKey:   "badge_long_life",
    descKey:   "badge_long_life_desc",
    condition: (h) => {
      const r = h.slice(0,20);
      return r.length >= 10 && r.filter(s => s.startPct < 20).length === 0;
    }
  },
  {
    id:        "explorer",
    emoji:     "🗺️",
    nameKey:   "badge_explorer",
    descKey:   "badge_explorer_desc",
    condition: (h) => {
      const km = h.reduce((a,s) => a + (s.kmRidden||0), 0);
      return km >= 500;
    }
  },
  {
    id:        "century",
    emoji:     "💯",
    nameKey:   "badge_century",
    descKey:   "badge_century_desc",
    condition: (h) => h.length >= 100
  }
];

/* ============================================================
   BASE DE DONNÉES VÉHICULES
   ============================================================ */
const VEHICLE_DATABASE = [
  /* --- DUOTTS --- */
  { id:"duotts_c29",           brand:"Duotts",      name:"C29 (15Ah)",             type:"velo",        voltage:48, capacity:15,   current:2   },
  { id:"duotts_c29_17",        brand:"Duotts",      name:"C29 (17Ah)",             type:"velo",        voltage:48, capacity:17,   current:2   },
  { id:"duotts_c29l",          brand:"Duotts",      name:"C29L",                   type:"velo",        voltage:48, capacity:15,   current:2   },
  { id:"duotts_s26",           brand:"Duotts",      name:"S26 (20Ah)",             type:"velo",        voltage:48, capacity:20,   current:2   },
  { id:"duotts_f26",           brand:"Duotts",      name:"F26 LG (17.5Ah)",        type:"velo",        voltage:48, capacity:17.5, current:2   },
  { id:"duotts_f26_20",        brand:"Duotts",      name:"F26 Samsung (20Ah)",     type:"velo",        voltage:48, capacity:20,   current:2   },
  { id:"duotts_f26_lite",      brand:"Duotts",      name:"F26 Lite",               type:"velo",        voltage:48, capacity:17.5, current:2   },
  { id:"duotts_n26",           brand:"Duotts",      name:"N26 (20Ah)",             type:"velo",        voltage:48, capacity:20,   current:2   },
  { id:"duotts_e26",           brand:"Duotts",      name:"E26",                    type:"velo",        voltage:48, capacity:15.6, current:2   },
  { id:"duotts_e29",           brand:"Duotts",      name:"E29",                    type:"velo",        voltage:48, capacity:13.5, current:2   },
  { id:"duotts_f20",           brand:"Duotts",      name:"F20",                    type:"velo",        voltage:48, capacity:15,   current:2   },

  /* --- LANKELEISI --- */
  { id:"lanke_xt750plus",      brand:"Lankeleisi",  name:"XT750 PLUS (17.5Ah)",    type:"velo",        voltage:48, capacity:17.5, current:3   },
  { id:"lanke_xt750plus12",    brand:"Lankeleisi",  name:"XT750 PLUS (12.8Ah)",    type:"velo",        voltage:48, capacity:12.8, current:3   },
  { id:"lanke_xt750sport",     brand:"Lankeleisi",  name:"XT750 Sport",            type:"velo",        voltage:48, capacity:12.8, current:3   },
  { id:"lanke_x3000plus",      brand:"Lankeleisi",  name:"X3000 PLUS",             type:"velo",        voltage:48, capacity:17.5, current:3   },
  { id:"lanke_x3000plusup",    brand:"Lankeleisi",  name:"X3000 PLUS-UP",          type:"velo",        voltage:48, capacity:17.5, current:3   },
  { id:"lanke_x3000max",       brand:"Lankeleisi",  name:"X3000 MAX",              type:"velo",        voltage:48, capacity:20,   current:3   },
  { id:"lanke_x2000max",       brand:"Lankeleisi",  name:"X2000 MAX",              type:"velo",        voltage:48, capacity:20,   current:3   },
  { id:"lanke_x2000plus",      brand:"Lankeleisi",  name:"X2000 PLUS",             type:"velo",        voltage:48, capacity:12.8, current:3   },
  { id:"lanke_xblackknight",   brand:"Lankeleisi",  name:"X-Black Knight (20Ah)",  type:"velo",        voltage:48, capacity:20,   current:3   },
  { id:"lanke_xblackknight25", brand:"Lankeleisi",  name:"X-Black Knight (25Ah)",  type:"velo",        voltage:48, capacity:25,   current:3   },
  { id:"lanke_mg740",          brand:"Lankeleisi",  name:"MG740",                  type:"velo",        voltage:48, capacity:20,   current:3   },
  { id:"lanke_mg740plus",      brand:"Lankeleisi",  name:"MG740 PLUS",             type:"velo",        voltage:48, capacity:20,   current:3   },
  { id:"lanke_mg600plus",      brand:"Lankeleisi",  name:"MG600 PLUS",             type:"velo",        voltage:48, capacity:20,   current:3   },
  { id:"lanke_mg800max",       brand:"Lankeleisi",  name:"MG800 MAX",              type:"velo",        voltage:48, capacity:20,   current:3   },
  { id:"lanke_mx600pro",       brand:"Lankeleisi",  name:"MX600 PRO",              type:"velo",        voltage:48, capacity:20,   current:3   },
  { id:"lanke_rv700",          brand:"Lankeleisi",  name:"RV700",                  type:"velo",        voltage:48, capacity:16,   current:3   },
  { id:"lanke_rv800",          brand:"Lankeleisi",  name:"RV800",                  type:"velo",        voltage:48, capacity:20,   current:3   },
  { id:"lanke_rx600pro",       brand:"Lankeleisi",  name:"RX600 PRO",              type:"velo",        voltage:48, capacity:20,   current:3   },
  { id:"lanke_es500pro",       brand:"Lankeleisi",  name:"ES500 PRO",              type:"velo",        voltage:48, capacity:14.5, current:3   },
  { id:"lanke_xc4000",         brand:"Lankeleisi",  name:"XC4000",                 type:"velo",        voltage:48, capacity:17.5, current:3   },
  { id:"lanke_g650",           brand:"Lankeleisi",  name:"G650",                   type:"velo",        voltage:48, capacity:12.8, current:3   },
  { id:"lanke_g660",           brand:"Lankeleisi",  name:"G660",                   type:"velo",        voltage:48, capacity:12.8, current:3   },
  { id:"lanke_golfx",          brand:"Lankeleisi",  name:"GOLF-X",                 type:"velo",        voltage:48, capacity:20,   current:3   },
  { id:"lanke_wombat1",        brand:"Lankeleisi",  name:"Wombat-1",               type:"velo",        voltage:48, capacity:20,   current:3   },
  { id:"lanke_kett8",          brand:"Lankeleisi",  name:"KETT-8",                 type:"velo",        voltage:48, capacity:20,   current:3   },
  { id:"lanke_bst6",           brand:"Lankeleisi",  name:"BST-6",                  type:"velo",        voltage:48, capacity:17.5, current:3   },

  /* --- ELEGLIDE --- */
  { id:"eleglide_m1",          brand:"Eleglide",    name:"M1",                     type:"velo",        voltage:36, capacity:7.5,  current:2   },
  { id:"eleglide_m1plus",      brand:"Eleglide",    name:"M1 Plus / Mopride 1+",   type:"velo",        voltage:36, capacity:12.5, current:2   },
  { id:"eleglide_m2",          brand:"Eleglide",    name:"M2 / Mopride 2",         type:"velo",        voltage:36, capacity:18,   current:2   },
  { id:"eleglide_t1",          brand:"Eleglide",    name:"T1",                     type:"velo",        voltage:36, capacity:12.5, current:2   },
  { id:"eleglide_t1st",        brand:"Eleglide",    name:"T1 Step-Thru",           type:"velo",        voltage:36, capacity:12.5, current:2   },
  { id:"eleglide_citycrosser", brand:"Eleglide",    name:"Citycrosser",            type:"velo",        voltage:36, capacity:10,   current:2   },
  { id:"eleglide_tankroll",    brand:"Eleglide",    name:"Tankroll",               type:"velo",        voltage:36, capacity:14.5, current:2   },

  /* --- ENGWE / FIIDO / ADO --- */
  { id:"engwe_engine_pro2",    brand:"Engwe",       name:"Engine Pro 2.0",         type:"velo",        voltage:48, capacity:16,   current:3   },
  { id:"engwe_ep2pro",         brand:"Engwe",       name:"EP-2 Pro",               type:"velo",        voltage:48, capacity:13,   current:2   },
  { id:"engwe_c20pro",         brand:"Engwe",       name:"C20 Pro",                type:"velo",        voltage:36, capacity:15.6, current:2   },
  { id:"fiido_t1",             brand:"Fiido",       name:"T1 (20Ah)",              type:"velo",        voltage:48, capacity:20,   current:3   },
  { id:"fiido_c11",            brand:"Fiido",       name:"C11",                    type:"velo",        voltage:36, capacity:11.6, current:2   },
  { id:"fiido_x",              brand:"Fiido",       name:"X pliant",               type:"velo",        voltage:36, capacity:11.6, current:2   },
  { id:"ado_a20fplus",         brand:"ADO",         name:"A20F+",                  type:"velo",        voltage:36, capacity:10.4, current:2   },

  /* --- HIMIWAY / HEYBIKE / TSTE --- */
  { id:"himiway_zebra",        brand:"Himiway",     name:"Zebra (20Ah)",           type:"velo",        voltage:48, capacity:20,   current:3   },
  { id:"himiway_cruiser",      brand:"Himiway",     name:"Cruiser (17.5Ah)",       type:"velo",        voltage:48, capacity:17.5, current:3   },
  { id:"heybike_rangers",      brand:"Heybike",     name:"Ranger S",               type:"velo",        voltage:48, capacity:15,   current:3   },
  { id:"tste_flyer",           brand:"TSTE",        name:"Flyer",                  type:"velo",        voltage:48, capacity:15,   current:3   },
  { id:"tste_defender",        brand:"TSTE",        name:"Defender",               type:"velo",        voltage:48, capacity:15,   current:3   },
  { id:"tste_surfer",          brand:"TSTE",        name:"Surfer",                 type:"velo",        voltage:48, capacity:15,   current:3   },

  /* --- RAD POWER / LECTRIC / AVENTON / VELOTRIC --- */
  { id:"rad_radcity5",         brand:"Rad Power",   name:"RadCity 5 Plus",         type:"velo",        voltage:48, capacity:14,   current:2   },
  { id:"rad_radrunner3",       brand:"Rad Power",   name:"RadRunner 3 Plus",       type:"velo",        voltage:48, capacity:14,   current:2   },
  { id:"rad_radwagon4",        brand:"Rad Power",   name:"RadWagon 4 cargo",       type:"velo",        voltage:48, capacity:14,   current:2   },
  { id:"lectric_xp3",          brand:"Lectric",     name:"XP 3.0",                 type:"velo",        voltage:48, capacity:10.4, current:2   },
  { id:"lectric_xpedition",    brand:"Lectric",     name:"XPedition cargo",        type:"velo",        voltage:48, capacity:14,   current:2   },
  { id:"aventon_aventure2",    brand:"Aventon",     name:"Aventure.2",             type:"velo",        voltage:48, capacity:15,   current:3   },
  { id:"aventon_soltera2",     brand:"Aventon",     name:"Soltera.2",              type:"velo",        voltage:36, capacity:9.6,  current:2   },
  { id:"aventon_level2",       brand:"Aventon",     name:"Level.2",                type:"velo",        voltage:48, capacity:14,   current:3   },
  { id:"velotric_nomad1",      brand:"Velotric",    name:"Nomad 1",                type:"velo",        voltage:48, capacity:14.4, current:3   },
  { id:"velotric_discover2",   brand:"Velotric",    name:"Discover 2",             type:"velo",        voltage:48, capacity:14.4, current:3   },

  /* --- URBAIN / LIFESTYLE --- */
  { id:"cowboy_4",             brand:"Cowboy",      name:"Cowboy 4 / 4ST",         type:"velo",        voltage:36, capacity:10,   current:3   },
  { id:"cowboy_cross",         brand:"Cowboy",      name:"Cowboy Cross",           type:"velo",        voltage:36, capacity:10,   current:3   },
  { id:"vanmoof_s3",           brand:"VanMoof",     name:"S3 / X3",                type:"velo",        voltage:36, capacity:14,   current:4   },
  { id:"vanmoof_s5",           brand:"VanMoof",     name:"S5 / A5",                type:"velo",        voltage:48, capacity:10,   current:2.5 },
  { id:"angell_cruiser",       brand:"Angell",      name:"Cruiser",                type:"velo",        voltage:36, capacity:10,   current:2   },
  { id:"urtopia_carbon1",      brand:"Urtopia",     name:"Carbon 1",               type:"velo",        voltage:36, capacity:10,   current:2   },
  { id:"brompton_pline",       brand:"Brompton",    name:"Electric P Line",        type:"velo",        voltage:36, capacity:8.55, current:2   },
  { id:"eovolt_morning",       brand:"Eovolt",      name:"Morning",                type:"velo",        voltage:36, capacity:7,    current:2   },

  /* --- DECATHLON --- */
  { id:"decathlon_riverside_500e",   brand:"Decathlon", name:"Riverside 500E",         type:"velo", voltage:36, capacity:11.6, current:2 },
  { id:"decathlon_riverside_920e",   brand:"Decathlon", name:"Riverside 920E",         type:"velo", voltage:36, capacity:11.6, current:2 },
  { id:"decathlon_rockrider_est500", brand:"Decathlon", name:"Rockrider E-ST 500",     type:"velo", voltage:36, capacity:11.6, current:2 },
  { id:"decathlon_stilus",           brand:"Decathlon", name:"Stilus E-All Mountain",  type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"btwin_tilt_500e",            brand:"B'Twin",    name:"Tilt 500E",              type:"velo", voltage:36, capacity:7.8,  current:2 },
  { id:"nakamura_ecrossover",        brand:"Nakamura",  name:"E-Crossover",            type:"velo", voltage:36, capacity:13,   current:2 },

  /* --- BOSCH --- */
  { id:"bosch_powertube_400", brand:"Bosch", name:"PowerTube 400",        type:"velo", voltage:36, capacity:11,   current:2 },
  { id:"bosch_powertube_500", brand:"Bosch", name:"PowerTube 500",        type:"velo", voltage:36, capacity:13.4, current:2 },
  { id:"bosch_powertube_625", brand:"Bosch", name:"PowerTube 625",        type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"bosch_powertube_750", brand:"Bosch", name:"PowerTube 750",        type:"velo", voltage:36, capacity:20.1, current:4 },
  { id:"bosch_powertube_800", brand:"Bosch", name:"PowerTube 800 Smart",  type:"velo", voltage:36, capacity:22.2, current:6 },

  /* --- SHIMANO / YAMAHA --- */
  { id:"shimano_steps_8035",  brand:"Shimano", name:"STEPS BT-E8035",     type:"velo", voltage:36, capacity:14,   current:4 },
  { id:"yamaha_pwx",          brand:"Yamaha",  name:"PW-X / PW-X2",       type:"velo", voltage:36, capacity:13.8, current:3 },

  /* --- TREK --- */
  { id:"trek_verve3",         brand:"Trek", name:"Verve+ 3",              type:"velo", voltage:36, capacity:13.4, current:2 },
  { id:"trek_allant8s",       brand:"Trek", name:"Allant+ 8S",            type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"trek_domane_slr",     brand:"Trek", name:"Domane+ SLR",           type:"velo", voltage:36, capacity:8.3,  current:2 },
  { id:"trek_rail98",         brand:"Trek", name:"Rail 9.8 VTTAE",        type:"velo", voltage:36, capacity:16.7, current:4 },

  /* --- SPECIALIZED --- */
  { id:"specialized_vado4",   brand:"Specialized", name:"Turbo Vado 4.0",       type:"velo", voltage:48, capacity:14.7, current:4 },
  { id:"specialized_vadosl",  brand:"Specialized", name:"Turbo Vado SL 5.0",    type:"velo", voltage:48, capacity:7,    current:2 },
  { id:"specialized_levo",    brand:"Specialized", name:"Turbo Levo VTTAE",     type:"velo", voltage:48, capacity:14.6, current:4 },
  { id:"specialized_creosl",  brand:"Specialized", name:"Turbo Creo SL",        type:"velo", voltage:48, capacity:7,    current:2 },

  /* --- GIANT / CANNONDALE / SCOTT --- */
  { id:"giant_explore1",      brand:"Giant",      name:"Explore E+ 1 Pro",      type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"giant_trance1",       brand:"Giant",      name:"Trance X E+ 1 VTTAE",   type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"giant_road1",         brand:"Giant",      name:"Road E+ 1 Pro",         type:"velo", voltage:36, capacity:13.8, current:2 },
  { id:"cannondale_topstone", brand:"Cannondale", name:"Topstone Neo 5",        type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"cannondale_moterra",  brand:"Cannondale", name:"Moterra Neo VTTAE",     type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"scott_patron",        brand:"Scott",      name:"Patron eRide 900",      type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"scott_sub",           brand:"Scott",      name:"Sub eRide 20",          type:"velo", voltage:36, capacity:16.7, current:4 },

  /* --- RIESE & MÜLLER --- */
  { id:"rm_charger4",         brand:"Riese & Müller", name:"Charger4 GT",       type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"rm_charger4_hs",      brand:"Riese & Müller", name:"Charger4 HS 45km/h",type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"rm_nevo4",            brand:"Riese & Müller", name:"Nevo4 GT",          type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"rm_homage4",          brand:"Riese & Müller", name:"Homage4",           type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"rm_superdelite",      brand:"Riese & Müller", name:"Superdelite",       type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"rm_multicharger2",    brand:"Riese & Müller", name:"Multicharger2 GT",  type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"rm_load4",            brand:"Riese & Müller", name:"Load4 Cargo",       type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"rm_carrie",           brand:"Riese & Müller", name:"Carrie",            type:"velo", voltage:36, capacity:11,   current:2 },

  /* --- GAZELLE / CUBE / KALKHOFF / MOUSTACHE --- */
  { id:"gazelle_ultimate",    brand:"Gazelle",   name:"Ultimate C380+ HMB",    type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"gazelle_medeo",       brand:"Gazelle",   name:"Medeo T10+ HMB",        type:"velo", voltage:36, capacity:13.4, current:2 },
  { id:"gazelle_arroyo",      brand:"Gazelle",   name:"Arroyo C8 HMB",         type:"velo", voltage:36, capacity:13.4, current:2 },
  { id:"cube_touring",        brand:"Cube",      name:"Touring Hybrid Pro 625", type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"cube_kathmandu",      brand:"Cube",      name:"Kathmandu Hybrid 45",   type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"kalkhoff_endeavour",  brand:"Kalkhoff",  name:"Endeavour 5.B Advance", type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"kalkhoff_image",      brand:"Kalkhoff",  name:"Image 5.B XXL",         type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"moustache_28_7",      brand:"Moustache", name:"Samedi 28.7",           type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"moustache_28_1",      brand:"Moustache", name:"Samedi 28.1",           type:"velo", voltage:36, capacity:11,   current:2 },

  /* --- WINORA / FLYER / HAIBIKE --- */
  { id:"winora_sinus_r8",     brand:"Winora",  name:"Sinus R8",               type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"flyer_gotour6",       brand:"Flyer",   name:"Gotour6",                type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"haibike_allmtn6",     brand:"Haibike", name:"AllMtn 6 VTTAE",         type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"haibike_alltrail5",   brand:"Haibike", name:"AllTrail 5 VTTAE",       type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"haibike_trekking9",   brand:"Haibike", name:"Trekking 9",             type:"velo", voltage:36, capacity:16.7, current:4 },

  /* --- ORBEA / LAPIERRE / MERIDA / CANYON --- */
  { id:"orbea_wild",          brand:"Orbea",    name:"Wild M-LTD VTTAE",      type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"lapierre_overvolt",   brand:"Lapierre", name:"Overvolt TR 5.7",       type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"merida_eonesixty",    brand:"Merida",   name:"eONE-SIXTY 800",        type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"canyon_spectral",     brand:"Canyon",   name:"Spectral:ON CF 8 VTTAE",type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"santacruz_heckler",   brand:"Santa Cruz",name:"Heckler SL VTTAE",     type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"norco_sight",         brand:"Norco",    name:"Sight VLT C1 VTTAE",    type:"velo", voltage:36, capacity:16.7, current:4 },

  /* --- VÉLOS CARGO --- */
  { id:"tern_gsd",            brand:"Tern",        name:"GSD S10 cargo",      type:"velo", voltage:36, capacity:13.4, current:4 },
  { id:"tern_hsd",            brand:"Tern",        name:"HSD P9",             type:"velo", voltage:36, capacity:13.4, current:4 },
  { id:"tern_vektron",        brand:"Tern",        name:"Vektron S10 pliant", type:"velo", voltage:36, capacity:13.4, current:4 },
  { id:"babboe_curve",        brand:"Babboe",      name:"Curve-E cargo",      type:"velo", voltage:36, capacity:13.4, current:2 },
  { id:"urban_arrow_family",  brand:"Urban Arrow", name:"Family cargo",       type:"velo", voltage:36, capacity:13.4, current:4 },
  { id:"yuba_spicy",          brand:"Yuba",        name:"Spicy Curry cargo",  type:"velo", voltage:36, capacity:16.7, current:4 },
  { id:"benno_boost",         brand:"Benno",       name:"Boost E cargo",      type:"velo", voltage:36, capacity:16.7, current:4 },

  /* --- SPEED BIKES 45km/h --- */
  { id:"stromer_st3",         brand:"Stromer", name:"ST3 (45km/h)",           type:"velo", voltage:48, capacity:20.4, current:4.5 },
  { id:"stromer_st5",         brand:"Stromer", name:"ST5 (45km/h)",           type:"velo", voltage:48, capacity:20.4, current:6   },
  { id:"stromer_st7",         brand:"Stromer", name:"ST7 (45km/h)",           type:"velo", voltage:48, capacity:25,   current:6   },
  { id:"klever_xspeed",       brand:"Klever",  name:"X Speed (45km/h)",       type:"velo", voltage:48, capacity:14,   current:4   },

  /* --- XIAOMI --- */
  { id:"xiaomi_essential",    brand:"Xiaomi", name:"Essential",               type:"trottinette", voltage:36, capacity:5.1,  current:1.7 },
  { id:"xiaomi_m365",         brand:"Xiaomi", name:"M365 / 1S",               type:"trottinette", voltage:36, capacity:7.8,  current:1.7 },
  { id:"xiaomi_pro2",         brand:"Xiaomi", name:"Pro 2",                   type:"trottinette", voltage:36, capacity:12.8, current:1.7 },
  { id:"xiaomi_4pro",         brand:"Xiaomi", name:"4 Pro",                   type:"trottinette", voltage:36, capacity:12.4, current:2   },
  { id:"xiaomi_4ultra",       brand:"Xiaomi", name:"4 Ultra",                 type:"trottinette", voltage:48, capacity:12,   current:2.5 },

  /* --- SEGWAY / NINEBOT --- */
  { id:"segway_es",           brand:"Segway", name:"Ninebot ES1/ES2",         type:"trottinette", voltage:36, capacity:5.2,  current:1.7 },
  { id:"segway_f40",          brand:"Segway", name:"Ninebot F40",             type:"trottinette", voltage:36, capacity:10.2, current:2   },
  { id:"segway_g2",           brand:"Segway", name:"Ninebot KickScooter G2",  type:"trottinette", voltage:36, capacity:12.5, current:2.5 },
  { id:"segway_g30",          brand:"Segway", name:"Ninebot Max G30",         type:"trottinette", voltage:36, capacity:15.3, current:3   },
  { id:"segway_p100s",        brand:"Segway", name:"Ninebot P100S",           type:"trottinette", voltage:48, capacity:15.3, current:3   },

  /* --- DUALTRON --- */
  { id:"dualtron_mini",       brand:"Dualtron", name:"Mini",                  type:"trottinette", voltage:52, capacity:13,   current:2 },
  { id:"dualtron_victor",     brand:"Dualtron", name:"Victor",                type:"trottinette", voltage:60, capacity:30,   current:2 },
  { id:"dualtron_thunder",    brand:"Dualtron", name:"Thunder",               type:"trottinette", voltage:60, capacity:35,   current:2 },
  { id:"dualtron_achilleus",  brand:"Dualtron", name:"Achilleus",             type:"trottinette", voltage:60, capacity:35,   current:2 },
  { id:"dualtron_thunder2",   brand:"Dualtron", name:"Thunder 2",             type:"trottinette", voltage:72, capacity:40,   current:3 },
  { id:"dualtron_storm",      brand:"Dualtron", name:"Storm",                 type:"trottinette", voltage:72, capacity:31.5, current:3 },

  /* --- KAABO --- */
  { id:"kaabo_mantis10",      brand:"Kaabo", name:"Mantis 10",               type:"trottinette", voltage:48, capacity:18.2, current:3 },
  { id:"kaabo_mantis_king",   brand:"Kaabo", name:"Mantis King GT",          type:"trottinette", voltage:60, capacity:24,   current:3 },
  { id:"kaabo_wolfwarrior",   brand:"Kaabo", name:"Wolf Warrior 11+",        type:"trottinette", voltage:60, capacity:35,   current:3 },
  { id:"kaabo_wolfking",      brand:"Kaabo", name:"Wolf King GT Pro",        type:"trottinette", voltage:72, capacity:35,   current:5 },

  /* --- VSETT --- */
  { id:"vsett_8",             brand:"VSETT", name:"8",                       type:"trottinette", voltage:48, capacity:15.6, current:3 },
  { id:"vsett_9plus",         brand:"VSETT", name:"9+",                      type:"trottinette", voltage:48, capacity:15.6, current:3 },
  { id:"vsett_10plus",        brand:"VSETT", name:"10+",                     type:"trottinette", voltage:60, capacity:20.8, current:3 },
  { id:"vsett_11plus",        brand:"VSETT", name:"11+",                     type:"trottinette", voltage:60, capacity:28,   current:3 },

  /* --- INOKIM --- */
  { id:"inokim_light2",       brand:"Inokim", name:"Light 2",               type:"trottinette", voltage:36, capacity:10.4, current:2 },
  { id:"inokim_quick4",       brand:"Inokim", name:"Quick 4",               type:"trottinette", voltage:48, capacity:16,   current:2 },
  { id:"inokim_oxo",          brand:"Inokim", name:"OXO",                   type:"trottinette", voltage:60, capacity:17.5, current:2 },

  /* --- E-TWOW --- */
  { id:"etwow_booster_s2",    brand:"E-Twow", name:"Booster S2",            type:"trottinette", voltage:36, capacity:10.5, current:2 },
  { id:"etwow_booster",       brand:"E-Twow", name:"Booster GT",            type:"trottinette", voltage:48, capacity:10.5, current:2 },
  { id:"etwow_gt_se",         brand:"E-Twow", name:"GT SE",                 type:"trottinette", voltage:48, capacity:10.5, current:2 },

  /* --- AUTRES TROTTINETTES --- */
  { id:"kugoo_s1pro",         brand:"Kugoo",      name:"S1 Pro",            type:"trottinette", voltage:36, capacity:7.5,  current:2 },
  { id:"urbanglide_ride100s", brand:"Urbanglide", name:"Ride 100S",         type:"trottinette", voltage:36, capacity:7.5,  current:2 },
  { id:"sxt_light_plus",      brand:"SXT",        name:"Light Plus V",      type:"trottinette", voltage:36, capacity:10.4, current:2 },
  { id:"wegoboard_suprem3",   brand:"Wegoboard",  name:"Suprem 3.0",        type:"trottinette", voltage:36, capacity:12.8, current:2 },
  { id:"wegoboard_rider",     brand:"Wegoboard",  name:"Rider",             type:"trottinette", voltage:48, capacity:13,   current:2 },
  { id:"apollo_city2023",     brand:"Apollo",     name:"City 2023",         type:"trottinette", voltage:48, capacity:17.5, current:3 },
  { id:"apollo_phantom",      brand:"Apollo",     name:"Phantom V3",        type:"trottinette", voltage:52, capacity:23.4, current:3 },
  { id:"kugoo_g_booster",     brand:"Kugoo",      name:"G-Booster",         type:"trottinette", voltage:48, capacity:23,   current:3 },
  { id:"minimotors_speedway5",brand:"Minimotors", name:"Speedway 5",        type:"trottinette", voltage:60, capacity:23.4, current:3 }
];
export {
  MAX_SESSION_AGE_MS,
  REST_TIMER_MS,
  REST_READY_MARGIN,
  MAX_HISTORY_ENTRIES,
  HISTORY_PAGE_SIZE,
  STORAGE_KEY_V6,
  VOLTAGE_DATABASE,
  TEMP_FACTORS,
  NOTIF_CONFIG,
  VEHICLE_DATABASE,
};