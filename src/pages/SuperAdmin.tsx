import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { School, Building, Users, AlertCircle } from "lucide-react";

export function SuperAdminDashboard() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select(`
          *,
          profiles(id, email, role, full_name)
        `)
        .order('created_at', { ascending: false });
        
      if (schoolsError) throw schoolsError;
      
      setSchools(schoolsData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Chargement des établissements...</div>;
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Espace Super Admin</h1>
        <p className="text-slate-500 mt-1">Gérez tous les établissements inscrits sur la plateforme EduBénin.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Building size={24} />
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-800">{schools.length}</div>
            <div className="text-xs text-slate-500 uppercase font-semibold">Établissements</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-bold text-gray-800">Liste des Établissements</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
              <tr className="border-b border-slate-100">
                <th className="px-6 py-3">Établissement</th>
                <th className="px-6 py-3">Localité</th>
                <th className="px-6 py-3">Contacts</th>
                <th className="px-6 py-3">Administrateurs</th>
                <th className="px-6 py-3">Total Membres</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schools.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Aucun établissement enregistré.
                  </td>
                </tr>
              ) : (
                schools.map((school) => {
                  const admins = school.profiles?.filter((p: any) => p.role === 'SCHOOL_ADMIN') || [];
                  return (
                    <tr key={school.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{school.name}</div>
                        <div className="text-xs text-slate-500 font-mono mt-1">ID: {school.id}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{school.locality || "-"}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{school.contacts || "-"}</td>
                      <td className="px-6 py-4">
                        {admins.length === 0 ? (
                          <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> Aucun Admin</span>
                        ) : (
                          <ul className="text-xs space-y-1">
                            {admins.map((a: any) => (
                              <li key={a.id} className="font-medium text-slate-700">{a.email} {a.full_name ? `(${a.full_name})` : ''}</li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          <Users size={12} />
                          {school.profiles?.length || 0}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
