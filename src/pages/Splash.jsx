function Splash({ onChoixLangue }) {
  const langues = [
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "de", label: "Deutsch", flag: "🇩🇪" }
  ];

  return (
    <div className="min-h-screen bg-[#0d1f3a] flex flex-col p-6">
      
      {/* Contenu principal */}
      <div className="flex-1 flex flex-col items-center justify-center">
        
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-7xl mb-4">🔋</div>
          <h1 className="text-4xl font-bold text-white">BatLife</h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Battery optimizer for e-bikes & scooters
          </p>
        </div>

        {/* Choix de langue */}
        <div className="w-full max-w-xs space-y-3">
          <p className="text-zinc-400 text-center text-sm mb-4">
            Choose your language
          </p>

          {langues.map((l) => (
            <button
              key={l.code}
              onClick={() => onChoixLangue(l.code)}
              className="w-full flex items-center gap-4 bg-[#152642] hover:bg-[#1f3460] border border-[#1f3460] hover:border-blue-500 text-white py-4 px-6 rounded-2xl font-medium transition-all"
            >
              <span className="text-3xl">{l.flag}</span>
              <span className="text-lg">{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bloc version / copyright */}
      <div className="pb-4 text-center opacity-80">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xl">🔋</span>
          <span className="text-lg font-semibold text-zinc-400">BatLife</span>
        </div>

        <p className="text-zinc-500 text-sm">v2.0 React</p>
        <p className="text-zinc-600 text-xs mt-1">
          © 2026 - Tous droits réservés
        </p>
      </div>

    </div>
  );
}

export default Splash;