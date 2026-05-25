import React, { useState, useEffect } from 'react';

function Entretien({ t }) {
  const [log, setLog] = useState(() => JSON.parse(localStorage.getItem("bl_entretien_log")) || []);
  const [formData, setFormData] = useState({ type: 'Pneus', date: new Date().toISOString().split('T')[0], km: '', notes: '' });

  useEffect(() => {
    localStorage.setItem("bl_entretien_log", JSON.stringify(log));
  }, [log]);

  const addEntry = () => {
    if (!formData.km) return;
    setLog([formData, ...log]);
    setFormData({ ...formData, km: '' });
  };

  const exportCSV = () => {
    const header = ["Date", "Type", "KM", "Notes"];
    const csvContent = [header, ...log.map(item => [item.date, item.type, item.km, item.notes])].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'entretien_vtt.csv';
    a.click();
  };

  return (
    <div className="space-y-4 pb-20">
      <h2 className="text-lg font-semibold text-zinc-300">🔧 Journal d'Entretien</h2>

      <div className="bg-[#152642] p-4 rounded-2xl border border-[#1f3460] space-y-3">
        <select className="w-full bg-[#0d1f3a] text-white p-2 rounded-lg" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
          <option>Pneus</option><option>Chaîne</option><option>Freins</option><option>Batterie</option><option>Autre</option>
        </select>
        <input type="date" className="w-full bg-[#0d1f3a] text-white p-2 rounded-lg" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
        <input type="number" placeholder="Kilométrage" className="w-full bg-[#0d1f3a] text-white p-2 rounded-lg" value={formData.km} onChange={e => setFormData({...formData, km: e.target.value})} />
        <button onClick={addEntry} className="w-full bg-blue-600 py-2 rounded-lg font-bold text-white">Ajouter au journal</button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-zinc-400 font-semibold">Historique</h3>
          <button onClick={exportCSV} className="text-xs bg-[#1f3460] px-3 py-1 rounded-full text-blue-400">Exporter CSV 📥</button>
        </div>
        {log.map((item, i) => (
          <div key={i} className="bg-[#152642] p-3 rounded-xl border border-[#1f3460] flex justify-between items-center text-sm">
            <div>
              <p className="font-bold text-white">{item.type}</p>
              <p className="text-xs text-zinc-400">{item.date}</p>
            </div>
            <p className="font-bold text-green-400">{item.km} km</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Entretien; // C'est ici que le lien se fait avec App.jsx