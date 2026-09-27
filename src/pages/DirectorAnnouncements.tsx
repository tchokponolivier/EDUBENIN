import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { Megaphone, Plus, Trash2, Users, Calendar, Search, Filter, CheckCircle2, AlertCircle } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  authorName: string;
  targetAudience: string;
  date: number;
}

export function DirectorAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAudience, setFilterAudience] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  
  // New announcement form state
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementTarget, setAnnouncementTarget] = useState("Tous");
  const [isPublishing, setIsPublishing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    if (!user?.schoolId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('school_id', user.schoolId)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setAnnouncements(data.map((d: any) => ({
          id: d.id,
          title: d.title,
          content: d.content,
          authorName: d.author_name || "Direction des Études",
          targetAudience: d.target_audience || "Tous",
          date: new Date(d.created_at || Date.now()).getTime()
        })));
      } else {
        // Fallback local storage
        try {
          const raw = localStorage.getItem(`school_announcements_${user.schoolId}`);
          if (raw) setAnnouncements(JSON.parse(raw));
        } catch (e) {}
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [user?.schoolId]);

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId || !announcementTitle.trim() || !announcementContent.trim()) return;
    setIsPublishing(true);
    try {
      const author = user.name || "Directeur des Études";
      const payload = {
        school_id: user.schoolId,
        title: announcementTitle.trim(),
        content: announcementContent.trim(),
        author_name: author,
        target_audience: announcementTarget
      };

      const { data, error } = await supabase
        .from('announcements')
        .insert(payload)
        .select()
        .single();

      const newAnn: Announcement = {
        id: data?.id || `ann_${Date.now()}`,
        title: announcementTitle.trim(),
        content: announcementContent.trim(),
        authorName: author,
        targetAudience: announcementTarget,
        date: Date.now()
      };

      setAnnouncements(prev => [newAnn, ...prev]);

      // Cache locally
      try {
        const raw = localStorage.getItem(`school_announcements_${user.schoolId}`);
        const existing = raw ? JSON.parse(raw) : [];
        localStorage.setItem(`school_announcements_${user.schoolId}`, JSON.stringify([newAnn, ...existing]));
      } catch (e) {}

      setAnnouncementTitle("");
      setAnnouncementContent("");
      setFeedback("Annonce publiée avec succès auprès des destinataires !");
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      alert("Erreur lors de la publication : " + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) return;
    try {
      await supabase.from('announcements').delete().eq('id', id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      if (user?.schoolId) {
        try {
          const raw = localStorage.getItem(`school_announcements_${user.schoolId}`);
          if (raw) {
            const list = JSON.parse(raw).filter((a: any) => a.id !== id);
            localStorage.setItem(`school_announcements_${user.schoolId}`, JSON.stringify(list));
          }
        } catch (e) {}
      }
    } catch (err: any) {
      alert("Erreur lors de la suppression : " + err.message);
    }
  };

  const filteredAnnouncements = announcements.filter(a => {
    if (filterAudience !== "ALL" && a.targetAudience !== filterAudience && a.targetAudience !== "Tous") {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q) || a.authorName.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Megaphone className="text-emerald-600" />
            Annonces & Communications Scolaires
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Publiez et diffusez les notes d'information officielles à destination des parents, professeurs et de l'administration.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire de publication */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
          <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2 text-base">
            <Plus size={18} className="text-emerald-600" />
            Publier une nouvelle annonce
          </h3>
          <form onSubmit={handleAddAnnouncement} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
                Destinataires ciblés
              </label>
              <select 
                value={announcementTarget} 
                onChange={e => setAnnouncementTarget(e.target.value)} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                <option value="Tous">Tous (Parents, Professeurs, Administration)</option>
                <option value="Parents">Parents d'élèves</option>
                <option value="Professeurs">Corps Enseignant (Professeurs)</option>
                <option value="Administration">Personnel Administratif</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
                Titre de l'annonce
              </label>
              <input 
                required
                value={announcementTitle}
                onChange={e => setAnnouncementTitle(e.target.value)}
                type="text" 
                placeholder="Ex: Calendrier des compositions du 1er trimestre"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">
                Message & Détails
              </label>
              <textarea 
                required
                value={announcementContent}
                onChange={e => setAnnouncementContent(e.target.value)}
                rows={6}
                placeholder="Rédigez ici le contenu de l'annonce officielle..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-none" 
              />
            </div>

            <button 
              type="submit" 
              disabled={isPublishing}
              className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPublishing ? (
                <span>Publication en cours...</span>
              ) : (
                <>
                  <Megaphone size={15} />
                  <span>Diffuser l'annonce</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Liste des annonces */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Rechercher une annonce..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500">Filtrer :</span>
              <select
                value={filterAudience}
                onChange={e => setFilterAudience(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-emerald-500 outline-none bg-white"
              >
                <option value="ALL">Toutes les audiences</option>
                <option value="Tous">Tous</option>
                <option value="Parents">Parents</option>
                <option value="Professeurs">Professeurs</option>
                <option value="Administration">Administration</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm text-center text-slate-400">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Chargement des annonces...
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm text-center">
              <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-gray-700 text-base mb-1">Aucune annonce trouvée</h4>
              <p className="text-slate-500 text-xs">
                {searchTerm || filterAudience !== "ALL" 
                  ? "Aucune annonce ne correspond aux filtres de recherche." 
                  : "Aucune annonce n'a encore été diffusée pour cet établissement."}
              </p>
            </div>
          ) : (
            filteredAnnouncements.map(announcement => (
              <div key={announcement.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        announcement.targetAudience === "Parents" ? "bg-blue-100 text-blue-800" :
                        announcement.targetAudience === "Professeurs" ? "bg-purple-100 text-purple-800" :
                        announcement.targetAudience === "Administration" ? "bg-amber-100 text-amber-800" :
                        "bg-emerald-100 text-emerald-800"
                      }`}>
                        {announcement.targetAudience}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(announcement.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <h4 className="font-bold text-base text-gray-800">{announcement.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Diffusé par : <strong>{announcement.authorName}</strong>
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Supprimer cette annonce"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50/70 p-3.5 rounded-lg border border-slate-100">
                  {announcement.content}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
