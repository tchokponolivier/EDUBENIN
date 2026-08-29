import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { AcademicYear, LEVELS } from "../types";
import { useAuth } from "../lib/auth";
import { Calendar, Plus, Archive, Settings } from "lucide-react";

export function SchoolAdminAcademic() {
  const { user } = useAuth();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchYears = async () => {
    if (!user?.schoolId) return;
    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .eq('school_id', user.schoolId)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
       setAcademicYears(data.map(d => ({
         id: d.id,
         schoolId: d.school_id,
         name: d.name,
         startDate: d.start_date,
         endDate: d.end_date,
         status: d.status,
         createdAt: new Date(d.created_at).getTime()
       })));
    }
  };

  useEffect(() => {
    fetchYears(); window.location.reload();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;
    
    const { error } = await supabase.from('academic_years').insert({
       school_id: user.schoolId,
       name,
       start_date: startDate,
       end_date: endDate,
       status: 'ACTIVE'
    });
    
    if (!error) {
       await supabase.from('schools').update({ academic_year: name }).eq('id', user.schoolId);
    }
    
    if (!error) {
       setShowForm(false);
       setName("");
       setStartDate("");
       setEndDate("");
       fetchYears(); window.location.reload();
    } else {
       alert("Erreur lors de la création: " + error.message);
    }
  };

  const handleCloseYear = async (id: string) => {
    if (window.confirm("Attention: Clôturer l'année basculera les effectifs. Continuer?")) {
      const { error } = await supabase.from('academic_years').update({ status: 'CLOSED' }).eq('id', id);
      if (!error) {
        fetchYears(); window.location.reload();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-700">Gestion des Années Scolaires</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Nouvelle Année
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Nom (ex: 2023-2024)</label>
            <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full px-3 py-2 border rounded" />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Date de début</label>
            <input required value={startDate} onChange={e => setStartDate(e.target.value)} type="date" className="w-full px-3 py-2 border rounded" />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Date de fin</label>
            <input required value={endDate} onChange={e => setEndDate(e.target.value)} type="date" className="w-full px-3 py-2 border rounded" />
          </div>
          <button type="submit" className="px-6 py-2 bg-slate-900 text-white rounded font-bold">Créer</button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {academicYears.map(year => (
          <div key={year.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${year.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{year.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <Calendar size={12} /> {year.startDate} - {year.endDate}
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-bold ${year.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {year.status}
              </span>
            </div>
            
            {year.status === 'ACTIVE' && (
              <button 
                onClick={() => handleCloseYear(year.id)}
                className="w-full mt-2 px-3 py-1.5 border border-amber-200 bg-amber-50 text-amber-700 rounded text-xs font-bold hover:bg-amber-100 flex items-center justify-center gap-2"
              >
                <Archive size={14} /> Clôturer l'année
              </button>
            )}
          </div>
        ))}
        {academicYears.length === 0 && (
          <p className="text-slate-500 text-sm">Aucune année scolaire configurée.</p>
        )}
      </div>
    </div>
  );
}
