import React, { useState } from "react";
import { useAuth } from "../lib/auth";
import { BookOpen, Calendar, FileText, Users, Activity, BarChart, Settings, UserCheck, Search, Plus } from "lucide-react";
import { DirectorPrograms } from "../components/director/DirectorPrograms";
import { DirectorAcademic } from "../components/director/DirectorAcademic";
import { DirectorTeachers } from "../components/director/DirectorTeachers";
import { DirectorExams } from "../components/director/DirectorExams";
import { DirectorResults } from "../components/director/DirectorResults";
import { DirectorOrientation } from "../components/director/DirectorOrientation";
import { SharedCalendar } from "../components/SharedCalendar";

export function DirectorDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "PROGRAMS" | "ACADEMIC" | "TEACHERS" | "EXAMS" | "RESULTS" | "ORIENTATION" | "CALENDAR"
  >("PROGRAMS");

  return (
    <div className="animate-in fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-700">Direction des Études</h1>
          <p className="text-slate-500">Gestion pédagogique et académique globale</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab("PROGRAMS")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === "PROGRAMS" ? "bg-white shadow-sm border border-slate-200 text-emerald-700" : "text-slate-500 hover:text-gray-700 hover:bg-slate-100"}`}
          >
            Programmes & Compétences
          </button>
          <button
            onClick={() => setActiveTab("ACADEMIC")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === "ACADEMIC" ? "bg-white shadow-sm border border-slate-200 text-emerald-700" : "text-slate-500 hover:text-gray-700 hover:bg-slate-100"}`}
          >
            Planification Académique
          </button>
          <button
            onClick={() => setActiveTab("TEACHERS")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === "TEACHERS" ? "bg-white shadow-sm border border-slate-200 text-emerald-700" : "text-slate-500 hover:text-gray-700 hover:bg-slate-100"}`}
          >
            Enseignants & Évaluations
          </button>
          <button
            onClick={() => setActiveTab("EXAMS")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === "EXAMS" ? "bg-white shadow-sm border border-slate-200 text-emerald-700" : "text-slate-500 hover:text-gray-700 hover:bg-slate-100"}`}
          >
            Sessions d'Examen
          </button>
          <button
            onClick={() => setActiveTab("RESULTS")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === "RESULTS" ? "bg-white shadow-sm border border-slate-200 text-emerald-700" : "text-slate-500 hover:text-gray-700 hover:bg-slate-100"}`}
          >
            Résultats & Délibérations
          </button>
          <button
            onClick={() => setActiveTab("ORIENTATION")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === "ORIENTATION" ? "bg-white shadow-sm border border-slate-200 text-emerald-700" : "text-slate-500 hover:text-gray-700 hover:bg-slate-100"}`}
          >
            Orientation & Sanctions
          </button>
          <button
            onClick={() => setActiveTab("CALENDAR")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === "CALENDAR" ? "bg-white shadow-sm border border-slate-200 text-emerald-700" : "text-slate-500 hover:text-gray-700 hover:bg-slate-100"}`}
          >
            Calendrier
          </button>
        </div>

        <div className="p-4 md:p-6 bg-slate-50/50">
          {activeTab === "PROGRAMS" && <DirectorPrograms />}
          {activeTab === "ACADEMIC" && <DirectorAcademic />}
          {activeTab === "TEACHERS" && <DirectorTeachers />}
          {activeTab === "EXAMS" && <DirectorExams />}
          {activeTab === "RESULTS" && <DirectorResults />}
          {activeTab === "ORIENTATION" && <DirectorOrientation />}
          {activeTab === "CALENDAR" && <SharedCalendar userRole={user?.role || "DIRECTOR_OF_STUDIES"} />}
        </div>
      </div>
    </div>
  );
}
