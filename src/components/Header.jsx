import React from "react";

function Header({ langue, setLangue }) {
  const langues = [
    { code: "fr", flag: "🇫🇷", nom: "Français" },
    { code: "en", flag: "🇬🇧", nom: "English" },
    { code: "es", flag: "🇪🇸", nom: "Español" },
    { code: "de", flag: "🇩🇪", nom: "Deutsch" },
    { code: "nl", flag: "🇳🇱", nom: "Nederlands" },
  ];

  return (
    <header className="sticky top-0 z-40"
      style={{
        background: "rgba(10,20,40,0.75)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "0.5px solid rgba(255,255,255,0.08)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}
    >
      <div className="flex justify-between items-center w-full px-5 py-4 gap-3">
        <h1 className="text-xl font-bold flex items-center gap-2 shrink-0"
          style={{ color: "#38bdf8" }}
        >
          <span className="text-2xl">🔋</span>
          <span>BatLife</span>
        </h1>

        <select
          value={langue}
          onChange={(e) => setLangue(e.target.value)}
          className="text-white text-sm rounded-xl px-3 py-2 outline-none cursor-pointer max-w-[170px]"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "0.5px solid rgba(255,255,255,0.15)",
          }}
        >
          {langues.map((l) => (
            <option key={l.code} value={l.code} style={{ background: "#0d1f3c" }}>
              {l.flag} {l.nom}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}

export default Header;
