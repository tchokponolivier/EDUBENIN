import React, { useState, useEffect, useRef } from "react";
import { db } from "../lib/db";
import { Student, Payment, LEVELS, SchoolSettings, Announcement } from "../types";
import { useAuth } from "../lib/auth";
import { Plus, User as UserIcon, CreditCard, Edit2, Camera, Calendar, History, CalendarDays, X, FileText, Megaphone } from "lucide-react";
import { Link } from "react-router-dom";

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
  
  const [showCommitmentModal, setShowCommitmentModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [level, setLevel] = useState(LEVELS[0]);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [photo, setPhoto] = useState<string>("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [studentType, setStudentType] = useState<"NEW" | "OLD">("NEW");
  const [previousClass, setPreviousClass] = useState("");
  const [previousSchool, setPreviousSchool] = useState("");
  const [lastYearAttended, setLastYearAttended] = useState("");
  const [status, setStatus] = useState<"PASSING" | "REPEATING" | "EXCLUDED">("PASSING");
  const [educmasterNumber, setEducmasterNumber] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [nationality, setNationality] = useState("Béninoise");
  const [religion, setReligion] = useState("Christianisme");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [fatherProfession, setFatherProfession] = useState("");
  const [motherProfession, setMotherProfession] = useState("");
  const [fatherContact, setFatherContact] = useState("");
  const [motherContact, setMotherContact] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianContact, setGuardianContact] = useState("");
  const [canteenOptions, setCanteenOptions] = useState<string[]>([]);
  const [disciplinaryCommitment, setDisciplinaryCommitment] = useState(false);
  const [disciplinarySignature, setDisciplinarySignature] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const renderContract = () => {
    if (!settings) return "";
    
    let template = settings.enrollmentContractTemplate;
    if (!template) {
      template = `CONTRAT DE SCOLARISATION
Entre :
L'Établissement scolaire {ecole_nom}, situé à {ecole_adresse}, représenté par son Directeur/sa Directrice ........................................, ci-après dénommé « l'Établissement »,
Et
M./Mme {parent_nom},
Profession : {parent_profession},
Téléphone : {parent_telephone},
Adresse : {parent_adresse},
Parent ou tuteur légal de l'élève {eleve_nom},
Classe : {eleve_classe},
Ci-après dénommé « le Parent ».
Il est convenu ce qui suit :
Article 1 : Objet
Le présent contrat fixe les conditions dans lesquelles l'Établissement assure l'éducation et l'encadrement de l'élève pendant l'année scolaire.
Article 2 : Engagement de l'Établissement
L'Établissement s'engage à :
- assurer les enseignements conformément aux programmes officiels ;
- garantir un environnement sécurisé et discipliné ;
- informer régulièrement le parent des résultats et du comportement de l'élève ;
- respecter les textes en vigueur en République du Bénin.
Article 3 : Engagement du Parent
Le Parent s'engage à :
- payer intégralement les frais de scolarité dans les délais convenus ;
- respecter le règlement intérieur ;
- assurer l'assiduité et la ponctualité de son enfant ;
- participer aux réunions de parents d'élèves ;
- collaborer avec l'administration pour la réussite de l'enfant.
Article 4 : Frais de scolarité
Les frais de scolarité sont fixés à :
Montant : {frais_scolarite} FCFA.
Ils doivent être réglés selon l'échéancier suivant :
1er versement : ....................
2e versement : ....................
Solde obligatoire au plus tard le 30 décembre.
Par mesure exceptionnelle, l'Établissement peut accorder un délai de grâce jusqu'au 31 mars, sans que cela constitue un droit acquis pour les années suivantes.
Article 5 : Défaut de paiement
En cas de non-paiement après le 31 mars :
- l'élève peut être suspendu ou radié conformément au règlement intérieur ;
- l'Établissement peut refuser la délivrance des documents internes liés à la poursuite de la scolarité, dans le respect des lois et règlements en vigueur ;
- les sommes dues restent exigibles.
Article 6 : Discipline
Le Parent reconnaît avoir reçu le règlement intérieur et s'engage à le respecter.
Article 7 : Communication
Toute réclamation doit être adressée à la Direction par écrit.
Article 8 : Résiliation
Le présent contrat peut prendre fin :
- à la fin de l'année scolaire ;
- par retrait volontaire de l'élève ;
- par exclusion conformément au règlement intérieur ;
- en cas de non-respect grave des obligations contractuelles.
Article 9 : Règlement des litiges
Les parties privilégient un règlement amiable.
À défaut, les juridictions compétentes de la République du Bénin seront saisies.
Article 10 : Acceptation
Le Parent déclare avoir pris connaissance :
- du règlement intérieur ;
- du calendrier scolaire ;
- des modalités de paiement ;
- des conditions de discipline.
Il accepte sans réserve les dispositions du présent contrat.
Fait à .........................................., Le ...... / ...... / 20......
Le Directeur (Signature et cachet)
Le Parent ou Tuteur légal (Signature précédée de la mention « Lu et approuvé »)`;
    }

    const parentNom = fatherName || motherName || guardianName || "........................................";
    const parentProfession = fatherProfession || motherProfession || "........................................";
    const parentPhone = fatherContact || motherContact || guardianContact || "........................................";
    const eleveNom = `${firstName} ${lastName}`.trim() || "........................................";
    const eleveClasse = level || "........................................";

    const content = template
      .replace(/{ecole_nom}/g, settings.name || "........................................")
      .replace(/{ecole_adresse}/g, settings.address || "........................................")
      .replace(/{parent_nom}/g, parentNom)
      .replace(/{parent_profession}/g, parentProfession)
      .replace(/{parent_telephone}/g, parentPhone)
      .replace(/{parent_adresse}/g, "........................................")
      .replace(/{eleve_nom}/g, eleveNom)
      .replace(/{eleve_classe}/g, eleveClasse)
      .replace(/{frais_scolarite}/g, "....................");
      
    return content;
  };

  const scrollToAnnouncement = (index: number) => {
    if (carouselRef.current) {
      const scrollWidth = carouselRef.current.scrollWidth;
      const amount = announcements.length;
      const targetScroll = (scrollWidth / amount) * index;
      carouselRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  };

  const loadData = () => {
    if (!user) return;
    const kids = db.getStudents({ parentId: user.id });
    setChildren(kids);
    
    const pays: Record<string, Payment[]> = {};
    kids.forEach(k => {
      // Assuming db can filter by studentId, need to ensure db.getPayments supports it or filter locally
      pays[k.id] = db.getPayments({ parentId: user.id }).filter(p => p.studentId === k.id);
    });
    setPayments(pays);
    setSettings(db.getSchoolSettings());
    setAnnouncements(db.getAnnouncements());
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleDisplayForm = (child?: Student) => {
    if (child) {
      setEditingChildId(child.id);
      setFirstName(child.firstName);
      setLastName(child.lastName);
      setLevel(child.level);
      setDateOfBirth(child.dateOfBirth || "");
      setPhoto(child.photo || "");
      setPlaceOfBirth(child.placeOfBirth || "");
      setStudentType(child.studentType || "NEW");
      setPreviousClass(child.previousClass || "");
      setPreviousSchool(child.previousSchool || "");
      setLastYearAttended(child.lastYearAttended || "");
      setStatus(child.status || "PASSING");
      setEducmasterNumber(child.educmasterNumber || "");
      setGender(child.gender || "MALE");
      setNationality(child.nationality || "Béninoise");
      setReligion(child.religion || "Christianisme");
      setFatherName(child.fatherName || "");
      setMotherName(child.motherName || "");
      setFatherProfession(child.fatherProfession || "");
      setMotherProfession(child.motherProfession || "");
      setFatherContact(child.fatherContact || "");
      setMotherContact(child.motherContact || "");
      setGuardianName(child.guardianName || "");
      setGuardianContact(child.guardianContact || "");
      setCanteenOptions(child.canteenOptions || []);
      setDisciplinaryCommitment(child.disciplinaryCommitment || false);
      setDisciplinarySignature(child.disciplinarySignature || "");
    } else {
      setEditingChildId(null);
      setFirstName("");
      setLastName("");
      setLevel(LEVELS[0]);
      setDateOfBirth("");
      setPhoto("");
      setPlaceOfBirth("");
      setStudentType("NEW");
      setPreviousClass("");
      setPreviousSchool("");
      setLastYearAttended("");
      setStatus("PASSING");
      setEducmasterNumber("");
      setGender("MALE");
      setNationality("Béninoise");
      setReligion("Christianisme");
      setFatherName("");
      setMotherName("");
      setFatherProfession("");
      setMotherProfession("");
      setFatherContact("");
      setMotherContact("");
      setGuardianName("");
      setGuardianContact("");
      setCanteenOptions([]);
      setDisciplinaryCommitment(false);
      setDisciplinarySignature("");
    }
    setShowAddForm(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!editingChildId) {
      // Check for duplicates
      const isDuplicate = children.some(c => c.firstName.toLowerCase() === firstName.toLowerCase() && c.lastName.toLowerCase() === lastName.toLowerCase());
      if (isDuplicate) {
        alert(`Un enfant nommé ${firstName} ${lastName} est déjà inscrit.`);
        return;
      }
    }

    let finalStudentType = studentType;
    let finalLastYear = lastYearAttended;

    if (studentType === "OLD") {
      if (!educmasterNumber) {
         alert("Vérification Système : Vous devez obligatoirement fournir le numéro EducMaster ou le Matricule de l'enfant pour réinscrire un ancien élève.");
         return;
      }

      setIsVerifying(true);
      
      // Simulation d'une vérification asynchrone (API vers les archives ou EducMaster)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsVerifying(false);

      const yearStr = lastYearAttended.split("-")[0]; 
      const claimedYear = parseInt(yearStr);
      const currentYear = new Date().getFullYear(); 
      
      // SIMULATION DU CHECK BACKEND
      // Si on détecte un mot clé dans le nom ou matricule, on simule une incohérence
      let actualLastYearInDB = claimedYear;
      if (firstName.toLowerCase() === "menteur" || educmasterNumber === "0000") {
         actualLastYearInDB = 2021; 
      } else if (educmasterNumber === "1234") {
         actualLastYearInDB = 2022; 
      }

      // Règles métiers:
      if (!isNaN(claimedYear)) {
          if (claimedYear !== actualLastYearInDB) {
             const diff = currentYear - actualLastYearInDB;
             if (diff >= 2) {
                 alert(`Vérification Système : Les données nationales indiquent que la dernière année fréquentée par ${firstName} est ${actualLastYearInDB} (et non ${claimedYear}). L'absence étant de ${diff} ans, le statut passe automatiquement à "Nouvel élève" et les frais de réinscription s'appliqueront.`);
                 finalStudentType = "NEW";
             } else {
                 alert(`Vérification Système : Correction de la dernière année fréquentée en ${actualLastYearInDB}. L'élève conserve son statut d'ancien élève.`);
                 finalLastYear = actualLastYearInDB.toString();
             }
          } else {
             const diff = currentYear - actualLastYearInDB;
             if (diff >= 2) {
                 alert(`Vérification Système : L'absence est de ${diff} ans. Conformément au règlement, le statut de l'élève passe automatiquement à "Nouvel élève" et les frais d'inscription seront appliqués.`);
                 finalStudentType = "NEW";
             }
          }
      }
    }

    const studentData = {
      firstName,
      lastName,
      level,
      dateOfBirth,
      photo,
      placeOfBirth,
      studentType: finalStudentType,
      previousClass,
      previousSchool,
      lastYearAttended: finalLastYear,
      status,
      educmasterNumber,
      gender,
      nationality,
      religion,
      fatherName,
      motherName,
      fatherProfession,
      motherProfession,
      fatherContact,
      motherContact,
      guardianName,
      guardianContact,
      canteenOptions,
      disciplinaryCommitment,
      disciplinarySignature,
    };

    if (editingChildId) {
      db.updateStudent(editingChildId, studentData);
    } else {
      db.addStudent({
        ...studentData,
        parentId: user.id,
        schoolId: "school_1"
      });
    }
    
    setShowAddForm(false);
    loadData();
  };

  const isPrimarySchool = (lv: string) => {
    return lv.startsWith("Maternelle") || lv.startsWith("CI") || lv.startsWith("CP") || lv.startsWith("CE") || lv.startsWith("CM");
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4">
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-gray-700 mb-6 pb-2 border-b border-slate-100">{editingChildId ? "Modifier l'inscription" : "Nouvelle Inscription"}</h3>
            <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 1: Informations de l'enfant */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-widest border-l-4 border-emerald-500 pl-2">Informations de l'élève</h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-3 flex items-center gap-4">
                   <div 
                     className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 cursor-pointer hover:bg-slate-100 shrink-0"
                     onClick={() => fileInputRef.current?.click()}
                   >
                     {photo ? <img src={photo} className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-slate-400" />}
                   </div>
                   <div>
                      <p className="text-xs font-bold text-gray-700">Photo de l'enfant</p>
                      <p className="text-[10px] text-slate-500">Cliquez pour ajouter</p>
                      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
                   </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Statut Élève</label>
                  <select value={studentType} onChange={e => setStudentType(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                    <option value="NEW">Nouvel élève</option>
                    <option value="OLD">Ancien élève (Réinscription)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Prénom</label>
                  <input required value={firstName} onChange={e => setFirstName(e.target.value)} type="text" className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Nom</label>
                  <input required value={lastName} onChange={e => setLastName(e.target.value)} type="text" className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Sexe</label>
                  <select value={gender} onChange={e => setGender(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                    <option value="MALE">Masculin</option>
                    <option value="FEMALE">Féminin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Date de naissance</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input required value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} type="date" className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Lieu de naissance</label>
                  <input required value={placeOfBirth} onChange={e => setPlaceOfBirth(e.target.value)} type="text" className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Nationalité</label>
                  <select required value={nationality} onChange={e => setNationality(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                    <option value="Béninoise">Béninoise</option>
                    <option value="Togolaise">Togolaise</option>
                    <option value="Ivoirienne">Ivoirienne</option>
                    <option value="Nigériane">Nigériane</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Religion</label>
                  <select required value={religion} onChange={e => setReligion(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                    <option value="Christianisme">Christianisme</option>
                    <option value="Islam">Islam</option>
                    <option value="Animisme">Animisme</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Parcours scolaire */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-widest border-l-4 border-emerald-500 pl-2">Parcours scolaire</h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Classe demandée</label>
                  <select value={level} onChange={e => setLevel(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Statut</label>
                  <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                    <option value="PASSING">Passant</option>
                    <option value="REPEATING">Redoublant</option>
                    <option value="EXCLUDED">Exclu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">N° EducMaster</label>
                  <input value={educmasterNumber} onChange={e => setEducmasterNumber(e.target.value)} type="text" placeholder="Optionnel" className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-slate-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Dernière année fréquentée</label>
                  <input required placeholder="Ex: 2023 ou 2023-2024" value={lastYearAttended} onChange={e => setLastYearAttended(e.target.value)} type="text" className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Etablissement antérieur</label>
                  <input required={studentType === 'NEW'} value={previousSchool} onChange={e => setPreviousSchool(e.target.value)} type="text" placeholder="Obligatoire si nouvel élève" className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-slate-300" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Classe antérieure</label>
                  <select value={previousClass} onChange={e => setPreviousClass(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-700">
                    <option value="">Sélectionner ou Aucun</option>
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Parents & Tuteurs */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-widest border-l-4 border-emerald-500 pl-2">Parents / Tuteur</h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Père */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h5 className="font-bold text-xs text-slate-500 uppercase">Informations du Père</h5>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Nom & Prénoms</label>
                    <input required value={fatherName} onChange={e => setFatherName(e.target.value)} type="text" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Profession</label>
                    <input required value={fatherProfession} onChange={e => setFatherProfession(e.target.value)} type="text" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">WhatsApp / Contact</label>
                    <input required value={fatherContact} onChange={e => setFatherContact(e.target.value)} type="tel" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                  </div>
                </div>

                {/* Mère */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h5 className="font-bold text-xs text-slate-500 uppercase">Informations de la Mère</h5>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Nom & Prénoms</label>
                    <input required value={motherName} onChange={e => setMotherName(e.target.value)} type="text" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Profession</label>
                    <input required value={motherProfession} onChange={e => setMotherProfession(e.target.value)} type="text" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">WhatsApp / Contact</label>
                    <input required value={motherContact} onChange={e => setMotherContact(e.target.value)} type="tel" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                  </div>
                </div>

                {/* Tuteur */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h5 className="font-bold text-xs text-slate-500 uppercase">Tuteur (Optionnel)</h5>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Nom & Prénom du tuteur</label>
                    <input value={guardianName} onChange={e => setGuardianName(e.target.value)} type="text" placeholder="Si différent des parents" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-slate-300" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">WhatsApp / Contact du tuteur</label>
                    <input value={guardianContact} onChange={e => setGuardianContact(e.target.value)} type="tel" placeholder="Si différent des parents" className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder-slate-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Options */}
            {isPrimarySchool(level) && (
              <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100">
                <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-widest border-l-4 border-emerald-500 pl-2">Services optionnels (Cantine)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    "Garde surveillée (200F / jour)",
                    "Repas cantine (200F / jour)",
                    "Repas cantine (500F / jour)",
                    "Repas cantine (1000F / jour)"
                  ].map(opt => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer bg-white p-3 rounded-lg border border-emerald-100 hover:border-emerald-300 transition-colors shadow-sm">
                      <input 
                        type="checkbox" 
                        checked={canteenOptions.includes(opt)} 
                        onChange={(e) => {
                          if (e.target.checked) setCanteenOptions([...canteenOptions, opt])
                          else setCanteenOptions(canteenOptions.filter(o => o !== opt))
                        }} 
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm font-bold text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {/* Section 4: Engagement Disciplinaire */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-widest border-l-4 border-emerald-500 pl-2">Engagement Disciplinaire</h4>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <p className="text-sm text-slate-600 mb-4">
                  En inscrivant votre enfant, vous vous engagez à ce qu'il/elle respecte le règlement intérieur de l'établissement.
                </p>
                <div className="flex gap-4 mb-4">
                  <button 
                    type="button" 
                    onClick={() => setShowCommitmentModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded text-xs font-bold text-gray-700 hover:bg-slate-50 transition-colors"
                  >
                    <FileText size={16} />
                    Lire & Télécharger la Fiche d'Engagement
                  </button>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      required
                      checked={disciplinaryCommitment}
                      onChange={e => setDisciplinaryCommitment(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm font-bold text-gray-700">
                      Je reconnais avoir lu et j'accepte sans réserve les termes de l'engagement disciplinaire.
                    </span>
                  </label>
                  
                  {disciplinaryCommitment && (
                    <div className="mt-4">
                      <label className="block text-[10px] font-bold text-gray-700 mb-1 uppercase tracking-wide">Signature (Écrivez votre nom complet précédé de "Lu et approuvé")</label>
                      <input 
                        required 
                        value={disciplinarySignature} 
                        onChange={e => setDisciplinarySignature(e.target.value)} 
                        type="text" 
                        placeholder="Lu et approuvé, [Votre Nom]"
                        className="w-full md:w-1/2 px-3 py-2 border border-slate-300 rounded text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" 
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded uppercase tracking-wider transition-colors">Annuler</button>
              <button type="submit" disabled={isVerifying} className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 disabled:cursor-wait rounded shadow-sm uppercase tracking-wider transition-colors">
                 {isVerifying ? "Vérification en cours..." : (editingChildId ? "Enregistrer les modifications" : "Valider l'inscription")}
              </button>
            </div>
          </form>
        </div>
        <div className="hidden lg:block relative rounded-xl border border-slate-200 overflow-hidden shadow-sm h-full max-h-[800px]">
          <img src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800" alt="Prospectus EduBénin" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent flex flex-col justify-end p-6 text-white">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">Inscription 2026-2027</span>
            <h3 className="text-xl font-bold mb-2">Rejoignez l'Excellence</h3>
            <p className="text-sm text-slate-300">Notre équipe pédagogique s'engage à offrir le meilleur encadrement pour la réussite de vos enfants.</p>
          </div>
        </div>
        </div>
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
                    {child.canteenOptions && child.canteenOptions.length > 0 && (
                      <div className="mt-2 text-[10px] text-slate-500 font-semibold flex flex-wrap gap-1">
                        {child.canteenOptions.map((opt, i) => (
                           <span key={i} className="inline-block bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded">{opt}</span>
                        ))}
                      </div>
                    )}
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
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 fade-in">
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
               <div className="space-y-4">
                  {Object.entries(MOCK_TIMETABLE).map(([day, slots]) => (
                    <div key={day} className="border border-slate-200 rounded-lg overflow-hidden">
                       <div className="bg-slate-100 px-4 py-2 font-bold text-gray-700 text-xs uppercase tracking-widest border-b border-slate-200">
                         {day}
                       </div>
                       <div className="divide-y divide-slate-100">
                         {slots.map((slot, idx) => (
                           <div key={idx} className="flex flex-col sm:flex-row sm:items-center p-3 gap-2 hover:bg-slate-50">
                              <div className="w-32 font-mono text-xs font-semibold text-emerald-600 shrink-0">
                                {slot.time}
                              </div>
                              <div className="flex-1">
                                <div className="font-bold text-gray-700 text-sm">{slot.subject}</div>
                                <div className="text-xs text-slate-500">{slot.teacher}</div>
                              </div>
                           </div>
                         ))}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {showCommitmentModal && settings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 fade-in overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 shrink-0">
               <div className="flex items-center gap-3">
                 <button onClick={() => window.print()} className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-slate-700 transition-colors">
                   Imprimer / Télécharger (PDF)
                 </button>
               </div>
               <button onClick={() => setShowCommitmentModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200 transition-colors">
                  <X size={20} />
               </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 bg-white" id="commitment-print-area">
               {/* En-tête */}
               <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-slate-800 pb-6 mb-6">
                 <div className="flex items-center gap-4">
                   {settings.logo && (
                     <img src={settings.logo} alt="Logo" className="w-20 h-20 object-contain rounded" />
                   )}
                   <div>
                     <h2 className="text-xl font-bold text-gray-700 uppercase tracking-wide">{settings.name}</h2>
                     <p className="text-sm text-slate-600 mt-1">{settings.address}</p>
                     <p className="text-sm text-slate-600">{settings.contact}</p>
                   </div>
                 </div>
               </div>

               <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                 {renderContract()}
               </div>
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
                   {settings.logo && (
                     <img src={settings.logo} alt="Logo" className="w-20 h-20 object-contain rounded" />
                   )}
                   <div>
                     <h2 className="text-xl font-bold text-gray-700 uppercase tracking-wide">{settings.name}</h2>
                     <p className="text-sm text-slate-600 mt-1">{settings.address}</p>
                     <p className="text-sm text-slate-600">{settings.contact}</p>
                     <p className="text-xs font-semibold text-slate-500 italic mt-1">{settings.motto}</p>
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
               {/* Absences et Retards */}
               <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-widest">Dossier de Présence</h4>
               <div className="space-y-3 mb-8">
                 {db.getAttendance({ studentId: selectedChildForAttendance.id }).length === 0 ? (
                    <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded text-center border border-slate-100 italic">
                       Aucune absence ou retard enregistré.
                    </div>
                 ) : (
                    db.getAttendance({ studentId: selectedChildForAttendance.id }).map(record => (
                       <div key={record.id} className="flex justify-between items-center bg-white border border-slate-200 p-3 rounded shadow-sm">
                          <div>
                            <div className="flex items-center gap-2">
                               <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${record.type === 'ABSENCE' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                 {record.type === 'ABSENCE' ? 'Absence' : 'Retard'}
                               </span>
                               <span className="text-sm font-medium text-gray-700">{new Date(record.date).toLocaleDateString()}</span>
                            </div>
                            {record.reason && <p className="text-xs text-slate-500 mt-1">{record.reason}</p>}
                          </div>
                          <div>
                             <span className={`text-[10px] font-bold uppercase tracking-widest ${record.isJustified ? 'text-emerald-600' : 'text-slate-400'}`}>
                               {record.isJustified ? 'Justifié' : 'Non justifié'}
                             </span>
                          </div>
                       </div>
                    ))
                 )}
               </div>

               {/* Formulaire de demande spéciale */}
               <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-widest">Signaler / Demande Spéciale</h4>
               <form 
                  onSubmit={async (e) => {
                     e.preventDefault();
                     if (!user) return;
                     
                     db.addSpecialRequest({
                        studentId: selectedChildForAttendance.id,
                        parentId: user.id,
                        type: requestType,
                        date: new Date(requestDate).getTime(),
                        reason: requestReason,
                     });

                     try {
                        const typeFr = requestType === "ABSENCE" ? "Absence" : requestType === "DELAY" ? "Retard" : "Autre";
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
               {db.getSpecialRequests({ studentId: selectedChildForAttendance.id }).length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <h5 className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest">Vos demandes récentes</h5>
                    <div className="space-y-2">
                       {db.getSpecialRequests({ studentId: selectedChildForAttendance.id }).map(req => (
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

