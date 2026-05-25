import { useApp } from "../context/AppContext";
import { vdb } from "../services/calculs";

function DiagnosticHivernage() {
  const { profile } = useApp();

  // 1. On récupère la tension nominale de la batterie active (48V ou 36V)
  const tensionNominale = profile?.nominalVoltage || 48;
  const nomBatterie = profile?.customName || "Batterie";

  // 2. On récupère les valeurs de calibration idéales via ton service vdb
  // d.storage nous donne la tension parfaite de stockage !
  const d = vdb(tensionNominale);
  const tensionStockageIdeale = d?.storage || (tensionNominale === 48 ? 46.8 : 35.1);

  return (
    <div className="bg-[#152642] rounded-2xl p-5 border border-[#1f3460] shadow-lg space-y-4">
      
      {/* Entête */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">❄️</span>
        <div>
          <h3 className="text-white font-bold text-base">Diagnostic Hivernage</h3>
          <p className="text-zinc-400 text-xs">Préparer le stockage longue durée</p>
        </div>
      </div>

      <hr className="border-[#1f3460]" />

      {/* Infos et Conseils */}
      <div className="space-y-3">
        <p className="text-sm text-zinc-300 leading-relaxed">
          Vous n'allez pas utiliser votre batterie <span className="text-emerald-400 font-bold">{nomBatterie} ({tensionNominale}V)</span> pendant un moment ? Ne la stockez jamais pleine (100%) ni complètement vide (0%).
        </p>

        {/* La cible de tension magique */}
        <div className="bg-[#1f3460] p-4 rounded-xl text-center border border-blue-500/20">
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            Tension idéale de stockage :
          </p>
          <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mt-1">
            {tensionStockageIdeale} V
          </p>
          <p className="text-zinc-400 text-[11px] mt-1">
            (Soit environ 40% à 50% de capacité)
          </p>
        </div>

        {/* Règle d'or de l'hivernage */}
        <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-3 text-xs text-blue-300 space-y-1">
          <p className="font-bold">💡 Conseils du Coach BatLife :</p>
          <ul className="list-disc pl-4 space-y-1 text-zinc-300">
            <li>Stockez la batterie dans un endroit sec, idéalement entre 10°C et 20°C.</li>
            <li>Vérifiez sa tension au voltmètre une fois par mois.</li>
            <li>Si la tension descend trop bas, remettez un petit coup de charge jusqu'à atteindre à nouveau les <span className="font-bold text-white">{tensionStockageIdeale}V</span>.</li>
          </ul>
        </div>
      </div>

    </div>
  );
}

export default DiagnosticHivernage;