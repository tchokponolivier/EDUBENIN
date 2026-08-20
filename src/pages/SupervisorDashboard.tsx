import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { useLocation } from "react-router-dom";
import { Users, Building, BookOpen, Clock, LayoutDashboard, Calendar } from "lucide-react";
import { SecretaryAbsences } from "../components/SecretaryAbsences";

export function SupervisorDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"DASHBOARD" | "ABSENCES" | "TRIPS" | "TEACHER_ABSENCES" | "MATERIALS">(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') as any;
    if (["DASHBOARD", "ABSENCES", "TRIPS", "TEACHER_ABSENCES", "MATERIALS"].includes(tab)) return tab;
    return "DASHBOARD";
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') as any;
    if (["DASHBOARD", "ABSENCES", "TRIPS", "TEACHER_ABSENCES", "MATERIALS"].includes(tab)) setActiveTab(tab);
  }, [location.search]);

  return (
    <div className="p-8 animate-in fade-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-700 mb-2">Espace Surveillant</h1>
          <p className="text-slate-500">Gestion de la discipline, sorties et matériel pédagogique.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto">
          <button 
            onClick={() => setActiveTab("DASHBOARD")}
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors \${activeTab === "DASHBOARD" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Vue d'ensemble
          </button>
          <button 
            onClick={() => setActiveTab("ABSENCES")}
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors \${activeTab === "ABSENCES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Absences Élèves
          </button>
          <button 
            onClick={() => setActiveTab("TEACHER_ABSENCES")}
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors \${activeTab === "TEACHER_ABSENCES" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Absences Profs
          </button>
          <button 
            onClick={() => setActiveTab("TRIPS")}
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors \${activeTab === "TRIPS" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Sorties
          </button>
          <button 
            onClick={() => setActiveTab("MATERIALS")}
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors \${activeTab === "MATERIALS" ? "bg-white shadow-sm text-gray-700" : "text-slate-500 hover:text-gray-700"}`}
          >
            Matériel
          </button>
        </div>
      </div>

      {activeTab === "DASHBOARD" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center"><Clock size={24}/></div>
               <div><p className="text-sm font-bold text-slate-500 uppercase">Retards (Auj.)</p><h3 className="text-2xl font-black text-gray-800">4</h3></div>
             </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center"><Users size={24}/></div>
               <div><p className="text-sm font-bold text-slate-500 uppercase">Absences (Auj.)</p><h3 className="text-2xl font-black text-gray-800">2</h3></div>
             </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><Building size={24}/></div>
               <div><p className="text-sm font-bold text-slate-500 uppercase">Sorties prévues</p><h3 className="text-2xl font-black text-gray-800">1</h3></div>
             </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center"><BookOpen size={24}/></div>
               <div><p className="text-sm font-bold text-slate-500 uppercase">Matériel prêté</p><h3 className="text-2xl font-black text-gray-800">15</h3></div>
             </div>
          </div>
        </div>
      )}

      {activeTab === "ABSENCES" && <SecretaryAbsences />}
      
      {activeTab === "TEACHER_ABSENCES" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">
          <Users size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="font-bold text-gray-700 text-lg mb-2">Gestion des présences professeurs</h3>
          <p>Le module de suivi des professeurs sera bientôt disponible.</p>
        </div>
      )}
      
      {activeTab === "TRIPS" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">
          <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="font-bold text-gray-700 text-lg mb-2">Sorties Pédagogiques</h3>
          <p>La planification des sorties et bus scolaires sera bientôt disponible.</p>
        </div>
      )}
      
      {activeTab === "MATERIALS" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">
          <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="font-bold text-gray-700 text-lg mb-2">Matériel Pédagogique</h3>
          <p>Le gestionnaire d'inventaire du matériel sera bientôt disponible.</p>
        </div>
      )}
    </div>
  );
}
