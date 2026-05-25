import { useState, useEffect } from "react";

function SplashScreen({ onEnter }) {
  const [fadeClose, setFadeClose] = useState(false);
  const [indexLangue, setIndexLangue] = useState(0);

  // Les 4 traductions du sous-titre qui défilent
  const defilementSousTitres = [
    "Préservez vos Batteries",
    "Preserve your Batteries",
    "Preserve sus Baterías",
    "Schonen Sie Ihre Batterien"
  ];

  // Défilement automatique toutes les 2 secondes
  useEffect(() => {
    const intervalle = setInterval(() => {
      setIndexLangue((prevIndex) => (prevIndex + 1) % defilementSousTitres.length);
    }, 2000);

    return () => clearInterval(intervalle);
  }, []);

  const handleEnterClick = () => {
    setFadeClose(true);
    setTimeout(() => {
      if (onEnter) onEnter();
    }, 500);
  };

  return (
    <div className={`fixed inset-0 bg-[#0d1f3a] z-50 flex flex-col justify-between items-center p-8 transition-opacity duration-500 ease-in-out ${fadeClose ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Zone haute libre */}
      <div></div>

      {/* BLOC CENTRAL : LOGO + TITRE EN DÉGRADÉ */}
      <div className="flex flex-col items-center text-center space-y-5 w-full max-w-sm">
        {/* Icône Batterie */}
        <div className="text-7xl select-none animate-pulse">
          🔋
        </div>
        
        {/* Titre avec le gros dégradé Vert/Bleu et sous-titre */}
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-normal bg-gradient-to-r from-green-400 via-emerald-400 to-blue-500 bg-clip-text text-transparent font-sans">
            BatLife
          </h1>
          
          {/* Sous-titre qui défile dans les 4 langues */}
          <p className="text-zinc-400 text-base italic transition-all duration-500 min-h-[24px]">
            {defilementSousTitres[indexLangue]}
          </p>
        </div>

        {/* Les 3 petits points animés au centre */}
        <div className="flex items-center gap-1.5 pt-2">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce"></span>
        </div>
      </div>

      {/* 🟢 ZONE BASSE : LE BOUTON EN VERT DÉGRADÉ PLACÉ TOUT EN BAS */}
      <div className="w-full max-w-xs mb-4">
        <button
          onClick={handleEnterClick}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 active:scale-95 text-white font-extrabold rounded-2xl transition-all text-base tracking-widest uppercase shadow-xl shadow-green-950/50 border border-green-400/20"
        >
          ENTRER
        </button>
      </div>

    </div>
  );
}

export default SplashScreen;