import { useState } from "react";

function useLocalStorage(cle, valeurInitiale) {
  const [valeur, setValeur] = useState(() => {
    try {
      const item = localStorage.getItem(cle);
      return item ? JSON.parse(item) : valeurInitiale;
    } catch (erreur) {
      return valeurInitiale;
    }
  });

  const sauvegarder = (nouvelleValeur) => {
    try {
      setValeur(nouvelleValeur);
      localStorage.setItem(cle, JSON.stringify(nouvelleValeur));
    } catch (erreur) {
      console.log("Erreur localStorage :", erreur);
    }
  };

  return [valeur, sauvegarder];
}

export default useLocalStorage;