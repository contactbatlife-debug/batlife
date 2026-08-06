import { useState, useEffect } from "react";

function SplashScreen({ onEnter }) {
  const [fadeClose, setFadeClose] = useState(false);
  const [indexLangue, setIndexLangue] = useState(0);

  const defilementSousTitres = [
    "Préservez vos Batteries",
    "Preserve your Batteries",
    "Preserve sus Baterías",
    "Schonen Sie Ihre Batterien"
  ];

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
        <div className="relative flex items-center justify-center w-48 h-48">
          <div className="absolute w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl animate-pulse" style={{animationDuration: '3s'}}></div>
          <div className="absolute w-36 h-36 rounded-full bg-emerald-400/15 blur-2xl animate-pulse" style={{animationDuration: '2s'}}></div>
          <div className="absolute w-24 h-24 rounded-full bg-emerald-300/20 blur-xl animate-pulse" style={{animationDuration: '1.5s'}}></div>
          <div className="text-9xl select-none animate-pulse relative z-10">
            🔋
          </div>
        </div>
        
        {/* Titre avec dégradé */}
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-normal bg-gradient-to-r from-green-400 via-emerald-400 to-blue-500 bg-clip-text text-transparent font-sans">
            BatLife
          </h1>
          
          <p className="text-zinc-400 text-base italic transition-all duration-500 min-h-[24px]">
            {defilementSousTitres[indexLangue]}
          </p>
        </div>

        {/* Les 3 petits points animés */}
        <div className="flex items-center gap-1.5 pt-2">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce"></span>
        </div>
      </div>

      {/* ZONE BASSE : BOUTON + FOOTER */}
      <div className="w-full max-w-xs mb-4 space-y-6">
        {/* Bouton ENTRER */}
        <button
          onClick={handleEnterClick}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 active:scale-95 text-white font-extrabold rounded-2xl transition-all text-base tracking-widest uppercase shadow-xl shadow-green-950/50 border border-green-400/20"
        >
          ENTRER
        </button>

        {/* === FOOTER VERSION === */}
        <div className="text-center pt-2">
          <p className="text-zinc-400 text-xs">v2.0 React · © 2026 Marc P. — Tous droits réservés</p>
        </div>
      </div>

    </div>
  );
}

export default SplashScreen;