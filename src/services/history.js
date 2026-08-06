// Gestion optimisée de l'historique avec pagination
export const HISTORY_KEY = "bl_history_v5";
export const ITEMS_PER_PAGE = 6; // Modifiable selon tes besoins

/**
 * Récupère tout l'historique (pour les stats globales)
 */
export const getFullHistory = () => {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

/**
 * Récupère une page spécifique (pour l'affichage paginé)
 * @param {number} page - Numéro de page (commence à 1)
 * @param {number} itemsPerPage - Nombre d'items par page
 * @returns {Array} Items de la page demandée
 */
export const getHistoryPage = (page = 1, itemsPerPage = ITEMS_PER_PAGE) => {
  const history = getFullHistory();
  const startIndex = (page - 1) * itemsPerPage;
  return history.slice(startIndex, startIndex + itemsPerPage);
};

/**
 * Calcule le nombre total de pages
 */
export const getTotalHistoryPages = (itemsPerPage = ITEMS_PER_PAGE) => {
  const history = getFullHistory();
  return Math.max(1, Math.ceil(history.length / itemsPerPage));
};

/**
 * Sauvegarde une nouvelle entrée (utilisé par ChargeStarter)
 */
export const saveToHistory = (entry) => {
  const history = getFullHistory();
  history.unshift(entry); // Plus récent en premier
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

/**
 * Exporte tout l'historique en JSON (pour backup)
 */
export const exportHistoryToJSON = () => {
  return JSON.stringify(getFullHistory(), null, 2);
};