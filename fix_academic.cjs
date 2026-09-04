const fs = require('fs');
let code = fs.readFileSync('src/components/SchoolAdminAcademic.tsx', 'utf8');

// Add edit/delete state
code = code.replace(
  `const [endDate, setEndDate] = useState("");`,
  `const [endDate, setEndDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);`
);

// Rewrite handleCreate
code = code.replace(
  `const handleCreate = async (e: React.FormEvent) => {
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
  };`,
  `const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId) return;
    
    let error;
    if (editingId) {
       const res = await supabase.from('academic_years').update({
           name,
           start_date: startDate,
           end_date: endDate
       }).eq('id', editingId);
       error = res.error;
    } else {
       // Set all others to CLOSED first
       await supabase.from('academic_years').update({ status: 'CLOSED' }).eq('school_id', user.schoolId);
       const res = await supabase.from('academic_years').insert({
           school_id: user.schoolId,
           name,
           start_date: startDate,
           end_date: endDate,
           status: 'ACTIVE'
       });
       error = res.error;
       
       if (!error) {
          await supabase.from('schools').update({ academic_year: name }).eq('id', user.schoolId);
       }
    }
    
    if (!error) {
       setShowForm(false);
       setName("");
       setStartDate("");
       setEndDate("");
       setEditingId(null);
       fetchYears(); window.location.reload();
    } else {
       alert("Erreur lors de l'enregistrement: " + error.message);
    }
  };
  
  const handleEdit = (year: AcademicYear) => {
      setName(year.name);
      setStartDate(year.startDate);
      setEndDate(year.endDate);
      setEditingId(year.id);
      setShowForm(true);
  };
  
  const handleDelete = async (id: string) => {
      if(window.confirm("Êtes-vous sûr de vouloir supprimer cette année scolaire ?")) {
          await supabase.from('academic_years').delete().eq('id', id);
          fetchYears(); window.location.reload();
      }
  };
  
  const handleMakeActive = async (year: AcademicYear) => {
      if(window.confirm("Activer cette année scolaire ? Cela rendra toutes les autres inactives.")) {
          await supabase.from('academic_years').update({ status: 'CLOSED' }).eq('school_id', user!.schoolId);
          await supabase.from('academic_years').update({ status: 'ACTIVE' }).eq('id', year.id);
          await supabase.from('schools').update({ academic_year: year.name }).eq('id', user!.schoolId);
          fetchYears(); window.location.reload();
      }
  };`
);

// Fix "Nouvelle Année" button to reset form
code = code.replace(
  `onClick={() => setShowForm(!showForm)}`,
  `onClick={() => { setShowForm(!showForm); setEditingId(null); setName(""); setStartDate(""); setEndDate(""); }}`
);

// Fix button in form
code = code.replace(
  `<button type="submit" className="px-6 py-2 bg-slate-900 text-white rounded font-bold">Créer</button>`,
  `<button type="submit" className="px-6 py-2 bg-slate-900 text-white rounded font-bold">{editingId ? "Enregistrer" : "Créer"}</button>`
);

// Update rendering of cards to include Edit/Delete and set active
code = code.replace(
  `{year.status === 'ACTIVE' && (
              <button 
                onClick={() => handleCloseYear(year.id)}
                className="w-full mt-2 px-3 py-1.5 border border-amber-200 bg-amber-50 text-amber-700 rounded text-xs font-bold hover:bg-amber-100 flex items-center justify-center gap-2"
              >
                <Archive size={14} /> Clôturer l'année
              </button>
            )}`,
  `{year.status === 'ACTIVE' && (
              <button 
                onClick={() => handleCloseYear(year.id)}
                className="w-full mt-2 px-3 py-1.5 border border-amber-200 bg-amber-50 text-amber-700 rounded text-xs font-bold hover:bg-amber-100 flex items-center justify-center gap-2 mb-2"
              >
                <Archive size={14} /> Clôturer l'année
              </button>
            )}
            {year.status !== 'ACTIVE' && (
              <button 
                onClick={() => handleMakeActive(year)}
                className="w-full mt-2 px-3 py-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded text-xs font-bold hover:bg-emerald-100 flex items-center justify-center gap-2 mb-2"
              >
                Activer
              </button>
            )}
            <div className="flex gap-2">
                <button onClick={() => handleEdit(year)} className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-xs font-bold transition">Éditer</button>
                <button onClick={() => handleDelete(year.id)} className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs font-bold transition">Supprimer</button>
            </div>`
);

fs.writeFileSync('src/components/SchoolAdminAcademic.tsx', code);
