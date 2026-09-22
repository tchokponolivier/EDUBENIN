import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { useLocation } from "react-router-dom";
import { Users, Building, BookOpen, Clock, ShieldAlert, Award, FileText } from "lucide-react";
import { SecretaryAbsences } from "../components/SecretaryAbsences";
import { SupervisorTeacherAbsences } from "../components/SupervisorTeacherAbsences";
import { SupervisorTrips } from "../components/SupervisorTrips";
import { SupervisorMaterials } from "../components/SupervisorMaterials";
import { SupervisorDiscipline } from "../components/SupervisorDiscipline";

export function SupervisorDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"DASHBOARD" | "DISCIPLINE" | "ABSENCES" | "TRIPS" | "TEACHER_ABSENCES" | "MATERIALS">(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') as any;
    if (["DASHBOARD", "DISCIPLINE", "ABSENCES", "TRIPS", "TEACHER_ABSENCES", "MATERIALS"].includes(tab)) return tab;
    return "DASHBOARD";
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') as any;
    if (["DASHBOARD", "DISCIPLINE", "ABSENCES", "TRIPS", "TEACHER_ABSENCES", "MATERIALS"].includes(tab)) setActiveTab(tab);
  }, [location.search]);

  return (
    <div className="p-4 md:p-8 animate-in fade-in max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Espace Vie Scolaire & Surveillance</h1>
          <p className="text-xs md:text-sm text-slate-500">
            Contrôle disciplinaire, convocations des familles, suivi des mouvements d'élèves et tenue des registres.
          </p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto whitespace-nowrap max-w-full hide-scrollbar shadow-inner">
          <button 
            onClick={() => setActiveTab("DASHBOARD")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "DASHBOARD" ? "bg-white shadow-sm text-emerald-800" : "text-slate-500 hover:text-gray-700"}`}
          >
            Vue d'ensemble
          </button>
          <button 
            onClick={() => setActiveTab("DISCIPLINE")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${activeTab === "DISCIPLINE" ? "bg-emerald-600 text-white shadow-sm" : "text-emerald-700 hover:text-emerald-900 bg-emerald-50"}`}
          >
            <ShieldAlert size={14} />
            <span>Discipline & Sanctions</span>
          </button>
          <button 
            onClick={() => setActiveTab("ABSENCES")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "ABSENCES" ? "bg-white shadow-sm text-emerald-800" : "text-slate-500 hover:text-gray-700"}`}
          >
            Absences Élèves
          </button>
          <button 
            onClick={() => setActiveTab("TEACHER_ABSENCES")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "TEACHER_ABSENCES" ? "bg-white shadow-sm text-emerald-800" : "text-slate-500 hover:text-gray-700"}`}
          >
            Absences Profs
          </button>
          <button 
            onClick={() => setActiveTab("TRIPS")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "TRIPS" ? "bg-white shadow-sm text-emerald-800" : "text-slate-500 hover:text-gray-700"}`}
          >
            Sorties & Mouvements
          </button>
          <button 
            onClick={() => setActiveTab("MATERIALS")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "MATERIALS" ? "bg-white shadow-sm text-emerald-800" : "text-slate-500 hover:text-gray-700"}`}
          >
            Matériel
          </button>
        </div>
      </div>

      {activeTab === "DASHBOARD" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shrink-0"><ShieldAlert size={24}/></div>
               <div>
                 <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sanctions actives</p>
                 <h3 className="text-2xl font-black text-gray-800">4</h3>
               </div>
             </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0"><Users size={24}/></div>
               <div>
                 <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Absences (Auj.)</p>
                 <h3 className="text-2xl font-black text-gray-800">2</h3>
               </div>
             </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><Building size={24}/></div>
               <div>
                 <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sorties autorisées</p>
                 <h3 className="text-2xl font-black text-gray-800">1</h3>
               </div>
             </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0"><Clock size={24}/></div>
               <div>
                 <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Retards (Auj.)</p>
                 <h3 className="text-2xl font-black text-gray-800">4</h3>
               </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === "DISCIPLINE" && <SupervisorDiscipline />}
      {activeTab === "ABSENCES" && <SecretaryAbsences />}
      {activeTab === "TEACHER_ABSENCES" && <SupervisorTeacherAbsences />}
      {activeTab === "TRIPS" && <SupervisorTrips />}
      {activeTab === "MATERIALS" && <SupervisorMaterials />}
    </div>
  );
}
