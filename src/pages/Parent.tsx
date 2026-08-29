import React, { useState, useEffect, useRef } from "react";
import { Student, Payment, LEVELS, SchoolSettings, Announcement } from "../types";
import { useAuth } from "../lib/auth";
import { Plus, User as UserIcon, CreditCard, Edit2, Camera, Calendar, History, CalendarDays, X, FileText, Megaphone } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import { ParentTimetable } from "../components/ParentTimetable";
import { AddStudentModal } from "../components/AddStudentModal";
import { ParentAttendance } from "../components/ParentAttendance";

// Mock timetable data
const MOCK_TIMETABLE: Record<string, { time: string; subject: string; teacher: string; }[]> = {
  "Lundi": [
    { time: "08:00 - 10:00", subject: "Mathématiques", teacher: "M. Koto" },
    { time: "10:00 - 12:00", subject: "Français", teacher: "Mme. Sossa" },
    { time: "15:00 - 17:00", subject: "SVT", teacher: "M. Dossou" }
  ],
  "Mardi": [
    { time: "08:00 - 10:00", subject: "Physique-Chimie", teacher: "M. Koto" },
    { time: "10:00 - 12:00", subject: "Anglais", teacher: "M. Johnson" },
    { time: "15:00 - 17:00", subject: "EPS", teacher: "M. Zola" }
  ],
  "Mercredi": [
    { time: "08:00 - 12:00", subject: "Histoire-Géo", teacher: "Mme. Bio" }
  ],
  "Jeudi": [
    { time: "08:00 - 10:00", subject: "Philosophie / ECM", teacher: "M. Agbota" },
    { time: "10:00 - 12:00", subject: "Français", teacher: "Mme. Sossa" },
    { time: "15:00 - 17:00", subject: "Mathématiques", teacher: "M. Koto" }
  ],
  "Vendredi": [
    { time: "08:00 - 10:00", subject: "SVT", teacher: "M. Dossou" },
    { time: "10:00 - 12:00", subject: "Anglais", teacher: "M. Johnson" }
  ]
};

// Mock grades data
const MOCK_GRADES = [
  { subject: "Mathématiques", score: 14.5, outOf: 20, coefficient: 4, teacher: "M. Koto", appreciation: "Bon travail" },
  { subject: "Français", score: 12, outOf: 20, coefficient: 3, teacher: "Mme. Sossa", appreciation: "Assez bien" },
  { subject: "Physique-Chimie", score: 16, outOf: 20, coefficient: 3, teacher: "M. Koto", appreciation: "Très bien" },
  { subject: "SVT", score: 9.5, outOf: 20, coefficient: 2, teacher: "M. Dossou", appreciation: "Juste, attention" },
  { subject: "Anglais", score: 15, outOf: 20, coefficient: 2, teacher: "M. Johnson", appreciation: "Bon trimestre" },
  { subject: "Histoire-Géo", score: 11, outOf: 20, coefficient: 2, teacher: "Mme. Bio", appreciation: "Moyen" },
];

export function ParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [payments, setPayments] = useState<Record<string, Payment[]>>({});
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      const { data: schools } = await supabase.from('schools').select('*').limit(1);
      if (schools && schools.length > 0) {
        let extra = {};
        try {
          const savedExtra = localStorage.getItem('schoolSettings_extra_' + schools[0].id);
          if (savedExtra) extra = JSON.parse(savedExtra);
        } catch(e){}
        setSettings({
          ...schools[0],
          enrollmentContractTemplate: (extra as any).enrollmentContractTemplate || ""
        });
      }
    };
    fetchSettings();
  }, [user]);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeAnnouncementIndex, setActiveAnnouncementIndex] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  
  const [selectedChildForTimetable, setSelectedChildForTimetable] = useState<Student | null>(null);
  const [selectedChildForBulletin, setSelectedChildForBulletin] = useState<Student | null>(null);
  const [selectedChildForAttendance, setSelectedChildForAttendance] = useState<Student | null>(null);
  
  // Custom states for Attendance Request
  const [requestType, setRequestType] = useState<"ABSENCE" | "DELAY" | "OTHER">("ABSENCE");
  const [requestDate, setRequestDate] = useState("");
  const [requestReason, setRequestReason] = useState("");
  

  // Form states
  
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [user]);


  const loadData = async () => {
    if (!user) return;
    try {
      const { data: studentsData } = await supabase.from('students').select('*').eq('parent_id', user.id);
      if (studentsData) {
        setChildren(studentsData.map(s => ({
          id: s.id,
          firstName: s.first_name,
          lastName: s.last_name,
          level: s.level,
          status: s.status,
          dateOfBirth: s.date_of_birth,
          placeOfBirth: s.place_of_birth,
          gender: s.gender,
          studentType: s.student_type,
          previousClass: s.previous_class,
          previousSchool: s.previous_school,
          lastYearAttended: s.last_year_attended,
          educmasterNumber: s.educmaster_number,
          nationality: s.nationality,
          religion: s.religion,
          fatherName: s.father_name,
          motherName: s.mother_name,
          fatherProfession: s.father_profession,
          motherProfession: s.mother_profession,
          fatherContact: s.father_contact,
          fatherAddress: s.father_address,
          motherContact: s.mother_contact,
          motherAddress: s.mother_address,
          guardianName: s.guardian_name,
          guardianContact: s.guardian_contact,
          guardianAddress: s.guardian_address,
          canteenOptions: s.canteen_options ? s.canteen_options.split(', ') : [],
          disciplinaryCommitment: s.disciplinary_commitment,
          disciplinarySignature: s.disciplinary_signature,
          photo: s.photo || "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop"
        })));
      }
      
      const { data: annData } = await supabase.from('announcements').select('*').in('target_audience', ['Parents', 'ALL']).order('created_at', { ascending: false });
      if (annData) {
        setAnnouncements(annData.map(a => ({
          id: a.id,
          title: a.title,
          content: a.content,
          date: a.date,
          author: a.author,
          targetAudience: a.target_audience
        })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const scrollToAnnouncement = (index: number) => {
    setActiveAnnouncementIndex(index);
    if (carouselRef.current) {
      const width = carouselRef.current.offsetWidth;
      carouselRef.current.scrollTo({
        left: width * index,
        behavior: 'smooth'
      });
    }
  };

  const handleDisplayForm = (child?: Student) => {
    if (child) {
      setEditingChildId(child.id);
    } else {
      setEditingChildId(null);
    }
    setShowAddForm(true);
  };

return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-700">Mes Enfants</h1>
          <p className="text-xs text-slate-500 mt-1">Gérez la scolarité de vos enfants et suivez leurs paiements</p>
        </div>
        <button 
          onClick={() => handleDisplayForm()}
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Inscrire un enfant
        </button>
      </div>

      {announcements.length > 0 && !showAddForm && (
        <div className="mb-2 relative">
          <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-widest flex items-center gap-2">
            <Megaphone size={16} className="text-emerald-600" />
            Annonces de l'école
          </h2>
          <div 
            ref={carouselRef}
            className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            onScroll={(e) => {
              const target = e.target as HTMLDivElement;
              const index = Math.round(target.scrollLeft / target.offsetWidth);
              setActiveAnnouncementIndex(index);
            }}
          >
            {announcements.map((ann, idx) => (
              <div key={ann.id} className="min-w-[85vw] sm:min-w-[400px] shrink-0 bg-emerald-50 border border-emerald-100 p-5 rounded-2xl shadow-sm snap-center flex flex-col">
                <div className="flex justify-between items-start gap-4 mb-3">
                  <h3 className="font-bold text-gray-700 text-lg leading-tight">{ann.title}</h3>
                  <span className="text-[10px] text-gray-700 font-bold uppercase tracking-widest shrink-0 bg-emerald-100/50 px-2 py-1 rounded">
                    {new Date(ann.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap flex-1">{ann.content}</p>
                <div className="mt-4 pt-3 border-t border-emerald-100 flex justify-between items-center text-xs text-slate-500 italic">
                  <span>Publié par: {ann.authorName}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Dots Indicator */}
          {announcements.length > 1 && (
             <div className="flex justify-center gap-1.5 mt-2">
                {announcements.map((_, idx) => (
                   <div 
                      key={idx} 
                      onClick={() => scrollToAnnouncement(idx)}
                      className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${activeAnnouncementIndex === idx ? 'w-6 bg-emerald-600' : 'w-2 bg-emerald-200 hover:bg-emerald-400'}`}
                   />
                ))}
             </div>
          )}
        </div>
      )}

      {showAddForm && (
        <AddStudentModal
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
             setShowAddForm(false);
             loadData();
          }}
          initialData={editingChildId ? children.find(c => c.id === editingChildId) : null}
        />
      )}

      {children.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded flex items-center justify-center mx-auto mb-3">
            <UserIcon className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-700">Aucun enfant inscrit</h3>
          <p className="mt-1 text-xs text-slate-500">Commencez par inscrire votre enfant à la plateforme.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {children.map(child => {
             const childPayments = payments[child.id] || [];
             const totalPaid = childPayments.reduce((sum, p) => sum + p.amount, 0);
             const recentPayments = [...childPayments].sort((a,b) => b.date - a.date).slice(0, 2);

             return (
              <div key={child.id} className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <div className="p-5 flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-100 text-gray-700 rounded-full flex items-center justify-center font-bold shrink-0 overflow-hidden">
                    {child.photo ? (
                       <img src={child.photo} alt={child.firstName} className="w-full h-full object-cover" />
                    ) : (
                       <span>{child.firstName.charAt(0)}{child.lastName.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-700 truncate">{child.firstName} {child.lastName}</h3>
                    <div className="text-xs font-medium text-slate-500 mt-0.5 flex gap-2">
                       <span>{child.level}</span>
                       {child.dateOfBirth && <span className="text-slate-300">•</span>}
                       {child.dateOfBirth && <span>Né(e) le {new Date(child.dateOfBirth).toLocaleDateString()}</span>}
                    </div>
                    <div className="mt-2 text-[10px] text-slate-500 font-semibold flex flex-wrap gap-1">
                      {child.canteenOptions && child.canteenOptions.length > 0 ? (
                        child.canteenOptions.map((opt, i) => (
                           <span key={i} className="inline-block bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded">{opt}</span>
                        ))
                      ) : (
                        <span className="inline-block bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded">Garde surveillée & Cantine : Non intéressé</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleDisplayForm(child)} className="p-2 text-slate-400 hover:text-emerald-600 rounded hover:bg-emerald-50 transition-colors">
                     <Edit2 size={16} />
                  </button>
                </div>
                
                <div className="px-5 pb-5">
                   <div className="bg-slate-50 rounded border border-slate-100 p-3">
                     <div className="flex justify-between items-center mb-3">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Payé</span>
                       <span className="font-bold text-gray-700">{totalPaid.toLocaleString()} FCFA</span>
                     </div>
                     
                     <div className="space-y-2">
                       {recentPayments.length > 0 ? (
                         recentPayments.map(p => (
                            <div key={p.id} className="flex justify-between text-xs items-center">
                              <span className="text-slate-500 flex items-center gap-1.5"><History size={12}/> {new Date(p.date).toLocaleDateString()}</span>
                              <span className="font-semibold text-gray-700">{p.amount.toLocaleString()} F</span>
                            </div>
                         ))
                       ) : (
                         <div className="text-xs text-slate-400 italic">Aucun paiement récent</div>
                       )}
                     </div>
                   </div>
                </div>

                <div className="p-4 bg-slate-50 flex flex-wrap gap-2 justify-between items-center rounded-b-xl border-t border-slate-100 mt-auto">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setSelectedChildForTimetable(child)} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 uppercase tracking-wider">
                       <CalendarDays size={14} /> Emploi du temps
                    </button>
                    <button onClick={() => setSelectedChildForBulletin(child)} className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 uppercase tracking-wider">
                       <FileText size={14} /> Bulletin
                    </button>
                    <button onClick={() => setSelectedChildForAttendance(child)} className="text-xs font-bold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 uppercase tracking-wider">
                       <History size={14} /> Absences & Retards
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link to={`/parent/payments`} className="text-xs font-bold text-slate-500 hover:text-gray-700 uppercase tracking-wider">
                       Historique
                    </Link>
                    <Link to="/parent/payments" className="text-xs font-bold text-emerald-600 hover:text-gray-700 inline-flex items-center gap-1 uppercase tracking-wider">
                      Payer <CreditCard size={14} />
                    </Link>
                  </div>
                </div>
              </div>
             )
          })}
        </div>
      )}

      {selectedChildForTimetable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 fade-in">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 rounded-t-xl shrink-0">
               <div>
                 <h3 className="text-lg font-bold text-gray-700">Emploi du temps</h3>
                 <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">{selectedChildForTimetable.firstName} {selectedChildForTimetable.lastName} • {selectedChildForTimetable.level}</p>
               </div>
               <button onClick={() => setSelectedChildForTimetable(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200 transition-colors">
                  <X size={20} />
               </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
               <ParentTimetable student={selectedChildForTimetable} />
            </div>
          </div>
        </div>
      )}

      {selectedChildForBulletin && settings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 fade-in overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 shrink-0">
               <div className="flex items-center gap-3">
                 <button onClick={() => window.print()} className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-slate-700 transition-colors">
                   Imprimer
                 </button>
               </div>
               <button onClick={() => setSelectedChildForBulletin(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200 transition-colors">
                  <X size={20} />
               </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 bg-white" id="bulletin-print-area">
               {/* En-tête */}
               <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-800 pb-6 mb-6">
                 <div className="flex items-center gap-4">
                   {settings?.logo && (
                     <img src={settings?.logo} alt="Logo" className="w-20 h-20 object-contain rounded" />
                   )}
                   <div>
                     <h2 className="text-xl font-bold text-gray-700 uppercase tracking-wide">{settings?.name}</h2>
                     <p className="text-sm text-slate-600 mt-1">{settings?.address}</p>
                     <p className="text-sm text-slate-600">{settings?.contact}</p>
                     <p className="text-xs font-semibold text-slate-500 italic mt-1">{settings?.motto}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <h1 className="text-2xl font-black text-gray-700 uppercase tracking-widest mb-1">Bulletin</h1>
                   <p className="text-sm font-bold text-gray-700 uppercase">1er Trimestre</p>
                   <p className="text-xs text-slate-500">Année : {settings.academicYear}</p>
                 </div>
               </div>

               {/* Infos Elève */}
               <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg mb-8 flex flex-wrap gap-x-12 gap-y-4">
                 <div>
                   <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nom & Prénoms</span>
                   <span className="font-bold text-sm text-gray-700">{selectedChildForBulletin.lastName} {selectedChildForBulletin.firstName}</span>
                 </div>
                 <div>
                   <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Classe</span>
                   <span className="font-bold text-sm text-gray-700">{selectedChildForBulletin.level}</span>
                 </div>
                 <div>
                   <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sexe</span>
                   <span className="font-bold text-sm text-gray-700">{selectedChildForBulletin.gender === 'MALE' ? 'M' : 'F'}</span>
                 </div>
               </div>

               {/* Notes */}
               <div className="overflow-x-auto">
               <table className="w-full border-collapse mb-6">
                 <thead>
                   <tr className="bg-slate-800 text-white text-[10px] uppercase tracking-wider">
                     <th className="p-3 text-left border border-slate-700">Matière</th>
                     <th className="p-3 text-center border border-slate-700 w-16">Coef</th>
                     <th className="p-3 text-center border border-slate-700 w-24">Note / 20</th>
                     <th className="p-3 text-left border border-slate-700">Appréciation</th>
                     <th className="p-3 text-left border border-slate-700">Professeur</th>
                   </tr>
                 </thead>
                 <tbody>
                   {MOCK_GRADES.map((grade, idx) => (
                     <tr key={idx} className="text-sm">
                       <td className="p-3 border border-slate-300 font-bold text-gray-700">{grade.subject}</td>
                       <td className="p-3 border border-slate-300 text-center font-mono">{grade.coefficient}</td>
                       <td className={`p-3 border border-slate-300 text-center font-mono font-bold ${grade.score < 10 ? 'text-red-600' : 'text-gray-700'}`}>
                         {grade.score.toFixed(2)}
                       </td>
                       <td className="p-3 border border-slate-300 text-gray-700">{grade.appreciation}</td>
                       <td className="p-3 border border-slate-300 text-slate-600 text-xs">{grade.teacher}</td>
                     </tr>
                   ))}
                   <tr className="bg-slate-100 font-bold">
                     <td className="p-3 text-right uppercase text-xs tracking-wider border-t-2 border-slate-800">Moyenne Générale</td>
                     <td className="p-3 text-center border-t-2 border-slate-800 font-mono">
                       {MOCK_GRADES.reduce((sum, g) => sum + g.coefficient, 0)}
                     </td>
                     <td className="p-3 text-center border-t-2 border-slate-800 font-mono text-lg text-gray-700">
                       {(MOCK_GRADES.reduce((sum, g) => sum + (g.score * g.coefficient), 0) / MOCK_GRADES.reduce((sum, g) => sum + g.coefficient, 0)).toFixed(2)}
                     </td>
                     <td colSpan={2} className="p-3 border-t-2 border-slate-800 text-gray-700 text-sm italic">
                       Félicitations, bon trimestre dans l'ensemble.
                     </td>
                   </tr>
                 </tbody>
               </table>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-12">
                 <div className="text-center pt-8 border-t border-slate-200">
                   <p className="font-bold text-xs uppercase tracking-widest text-slate-500 mb-8">Le Titulaire</p>
                   <p className="text-slate-300 italic text-sm">Signature</p>
                 </div>
                 <div className="text-center pt-8 border-t border-slate-200">
                   <p className="font-bold text-xs uppercase tracking-widest text-slate-500 mb-8">Le Directeur</p>
                   <p className="text-slate-300 italic text-sm">Cachet & Signature</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
      
      {selectedChildForAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 fade-in overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 shrink-0">
               <div>
                 <h3 className="text-lg font-bold text-gray-700">Absences & Retards</h3>
                 <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">{selectedChildForAttendance.firstName} {selectedChildForAttendance.lastName} • {selectedChildForAttendance.level}</p>
               </div>
               <button onClick={() => setSelectedChildForAttendance(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200 transition-colors">
                  <X size={20} />
               </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-white">
               <ParentAttendance student={selectedChildForAttendance} />

               {/* Formulaire de demande spéciale */}
               <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-widest mt-8">Signaler / Demande Spéciale</h4>
               <form 
                  onSubmit={async (e) => {
                     e.preventDefault();
                     if (!user) return;
                     
                     /* db.addSpecialRequest removed */

                     try {
                        const typeFr = requestType === "ABSENCE" ? "Absence" : requestType === "DELAY" ? "Retard" : "Autre";
                        
                        // Insert into notifications
                        if (user?.schoolId) {
                          await supabase.from('notifications').insert({
                            school_id: user.schoolId,
                            title: `Nouveau Signalement: ${typeFr}`,
                            message: `${selectedChildForAttendance.firstName} ${selectedChildForAttendance.lastName} - ${requestReason}`,
                            type: 'SUPPORT'
                          });
                        }
                        
                        await fetch("https://formsubmit.co/ajax/gcservice00@gmail.com", {
                           method: "POST",
                           headers: {
                             'Content-Type': 'application/json',
                             'Accept': 'application/json'
                           },
                           body: JSON.stringify({
                             _subject: `Nouvelle demande: ${typeFr} pour ${selectedChildForAttendance.firstName} ${selectedChildForAttendance.lastName}`,
                             Élève: `${selectedChildForAttendance.firstName} ${selectedChildForAttendance.lastName}`,
                             Classe: selectedChildForAttendance.level,
                             Parent: user.name,
                             Type: typeFr,
                             Date: new Date(requestDate).toLocaleDateString("fr-FR"),
                             Motif: requestReason
                           })
                        });
                     } catch (err) {
                        console.error("Erreur d'envoi d'email:", err);
                     }

                     setRequestDate("");
                     setRequestReason("");
                     alert("Votre demande a été enregistrée et envoyée automatiquement à l'administration.");
                  }}
                  className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl space-y-4"
               >
                  <p className="text-xs text-gray-700 mb-2">Utilisez ce formulaire pour signaler une absence prévue, un retard, ou déposer une justification médicale.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Type</label>
                       <select value={requestType} onChange={e => setRequestType(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                         <option value="ABSENCE">Absence</option>
                         <option value="DELAY">Retard</option>
                         <option value="OTHER">Autre</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Date concernée</label>
                       <input required type="date" value={requestDate} onChange={e => setRequestDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                     </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Motif / Justification</label>
                    <textarea required rows={3} value={requestReason} onChange={e => setRequestReason(e.target.value)} placeholder="Ex: Rendez-vous médical..." className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"></textarea>
                  </div>
                  <button type="submit" className="w-full px-4 py-2 bg-emerald-600 text-white rounded text-sm font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors">
                     Envoyer la demande
                  </button>
               </form>
               
               {/* Liste des demandes récentes */}
               {[].length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <h5 className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest">Vos demandes récentes</h5>
                    <div className="space-y-2">
                       {[].map(req => (
                         <div key={req.id} className="text-xs flex justify-between items-center border border-slate-200 bg-white p-2 rounded">
                           <div>
                              <span className="font-bold text-gray-700">{req.type === 'ABSENCE' ? 'Absence' : req.type === 'DELAY' ? 'Retard' : 'Autre'}</span>
                              <span className="text-slate-500 ml-2">Pour le {new Date(req.date).toLocaleDateString()}</span>
                              <span className={`ml-3 font-bold uppercase tracking-widest text-[10px] ${req.status === 'APPROVED' ? 'text-emerald-600' : req.status === 'REJECTED' ? 'text-red-500' : 'text-orange-500'}`}>
                                 {req.status === 'PENDING' ? 'En cours' : req.status === 'APPROVED' ? 'Approuvé' : 'Refusé'}
                              </span>
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>
               )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

