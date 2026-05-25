import translations from "../i18n/translations";

function useTranslation(langue) {
  const t = (cle) => {
    const traduction = translations[langue];
    if (traduction && traduction[cle]) {
      return traduction[cle];
    }
    // Fallback sur le français
    return translations["fr"][cle] || cle;
  };

  return { t };
}

export default useTranslation;