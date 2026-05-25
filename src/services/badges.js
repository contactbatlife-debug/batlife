// Vérifie quels badges sont débloqués selon l'historique
export function checkBadges(historique) {

  const badges = {
    first_charge: false,
    ten_charges: false,
    fifty_charges: false,
    century: false,
    eco_master: false,
    precision: false,
    rest_champion: false,
    long_life: false,
    explorer: false,
  };

  const total = historique.length;

  // 🔋 Première charge
  if (total >= 1) badges.first_charge = true;

  // 🔟 10 charges
  if (total >= 10) badges.ten_charges = true;

  // 🏆 50 charges
  if (total >= 50) badges.fifty_charges = true;

  // 💯 100 charges
  if (total >= 100) badges.century = true;

  return badges;
}