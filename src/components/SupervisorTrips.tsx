import React, { useState } from "react";
import { Plus, Calendar, MapPin, Bus } from "lucide-react";

export function SupervisorTrips() {
  const [trips, setTrips] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [classes, setClasses] = useState("");
  const [buses, setBuses] = useState("1");
  const [status, setStatus] = useState("PLANNED");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setTrips([{
      id: Date.now().toString(),
      destination, date, classes, buses, status,
      createdAt: new Date().toISOString()
    }, ...trips]);
    setShowAdd(false);
    setDestination(""); setDate(""); setClasses(""); setBuses("1");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="font-bold text-gray-700 text-lg flex items-center gap-2">
          <Calendar className="text-emerald-600" />
          Sorties Pédagogiques & Bus
        </h2>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm">
          <Plus size={14} /> Planifier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
             Aucune sortie planifiée.
          </div>
        ) : trips.map(t => (
          <div key={t.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-start">
               <div>
                 <h3 className="font-bold text-gray-800">{t.destination}</h3>
                 <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><Calendar size={14}/> {new Date(t.date).toLocaleDateString()}</p>
               </div>
               <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider \${t.status === 'PLANNED' ? 'bg-blue-100 text-blue-700' : t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                 {t.status === 'PLANNED' ? 'Planifiée' : t.status === 'COMPLETED' ? 'Terminée' : 'Annulée'}
               </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><MapPin size={14} /></div>
                <div><span className="block text-[10px] font-bold text-slate-400 uppercase">Classes</span>{t.classes}</div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><Bus size={14} /></div>
                <div><span className="block text-[10px] font-bold text-slate-400 uppercase">Bus requis</span>{t.buses}</div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-2">
              <button onClick={() => {
                setTrips(trips.map(trip => trip.id === t.id ? { ...trip, status: 'COMPLETED' } : trip))
              }} className="flex-1 py-2 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors">Terminer</button>
              <button onClick={() => {
                setTrips(trips.map(trip => trip.id === t.id ? { ...trip, status: 'CANCELLED' } : trip))
              }} className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors">Annuler</button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">Planifier une sortie</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Destination</label>
                <input required type="text" value={destination} onChange={e => setDestination(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Date</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Classes concernées</label>
                <input required type="text" value={classes} onChange={e => setClasses(e.target.value)} placeholder="Ex: 6ème A, 5ème B" className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Nombre de bus</label>
                <input required type="number" min="1" value={buses} onChange={e => setBuses(e.target.value)} className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase hover:bg-slate-200">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded text-xs font-bold uppercase hover:bg-emerald-700">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
