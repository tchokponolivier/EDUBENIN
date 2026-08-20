import React, { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon, Clock } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";

interface CalendarEvent {
  id: string;
  school_id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: "EXAM" | "HOLIDAY" | "KEY_DATE" | "MEETING";
  created_by: string;
}

export function SharedCalendar({ userRole }: { userRole: string }) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    type: "KEY_DATE",
    time: "08:00"
  });

  const canEdit = userRole === "DIRECTOR_OF_STUDIES" || userRole === "SCHOOL_ADMIN";

  useEffect(() => {
    if (user?.schoolId) {
      fetchEvents();
    }
  }, [user?.schoolId, currentDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const start = startOfMonth(currentDate).toISOString();
      const end = endOfMonth(currentDate).toISOString();
      
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('school_id', user?.schoolId)
        .gte('date', start)
        .lte('date', end);

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !user?.schoolId) return;

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert([{
          school_id: user.schoolId,
          title: newEvent.title,
          description: newEvent.description,
          date: selectedDate.toISOString(),
          time: newEvent.time,
          type: newEvent.type,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setEvents([...events, data]);
      }
      setShowAddModal(false);
      setNewEvent({ title: "", description: "", type: "KEY_DATE", time: "08:00" });
    } catch (err) {
      console.error("Error adding event:", err);
      alert("Erreur lors de l'ajout de l'événement.");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet événement ?")) return;
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setEvents(events.filter(e => e.id !== id));
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = monthStart; // we might need to pad
  
  // Pad the start
  const startDay = getDay(monthStart);
  // Pad the end
  
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Create padded array for the grid (starting from Sunday = 0)
  const paddingDays = Array.from({ length: startDay }).map((_, i) => null);
  const gridDays = [...paddingDays, ...daysInMonth];

  const getEventsForDay = (date: Date) => {
    return events.filter(e => isSameDay(new Date(e.date), date));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'EXAM': return 'bg-red-100 text-red-800 border-red-200';
      case 'HOLIDAY': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEETING': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'EXAM': return 'Examen';
      case 'HOLIDAY': return 'Jour férié';
      case 'MEETING': return 'Réunion';
      default: return 'Date clé';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600" />
            Calendrier Scolaire
          </h2>
          <p className="text-sm text-slate-500">Dates clés, examens et événements de l'établissement</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 p-1">
            <button onClick={prevMonth} className="p-1.5 rounded hover:bg-white hover:shadow-sm text-slate-600 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 font-bold text-gray-700 w-32 text-center capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: fr })}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded hover:bg-white hover:shadow-sm text-slate-600 transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden border border-slate-200">
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
            <div key={day} className="bg-slate-50 py-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
          
          {gridDays.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} className="bg-white min-h-[100px] sm:min-h-[120px] p-2 opacity-50"></div>;
            }
            
            const dayEvents = getEventsForDay(date);
            const isCurrentMonth = isSameMonth(date, currentDate);
            const isTodayDate = isToday(date);
            
            return (
              <div 
                key={date.toISOString()} 
                className={`bg-white min-h-[100px] sm:min-h-[120px] p-2 border-t border-slate-100 transition-colors ${canEdit ? 'hover:bg-slate-50 cursor-pointer' : ''} ${!isCurrentMonth ? 'opacity-50' : ''}`}
                onClick={() => {
                  if (canEdit) {
                    setSelectedDate(date);
                    setShowAddModal(true);
                  }
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${isTodayDate ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-700'}`}>
                    {format(date, 'd')}
                  </span>
                </div>
                
                <div className="space-y-1.5 overflow-y-auto max-h-[80px] no-scrollbar">
                  {dayEvents.map(event => (
                    <div 
                      key={event.id} 
                      className={`text-[10px] sm:text-xs p-1.5 rounded border ${getTypeColor(event.type)} group relative`}
                      onClick={(e) => { e.stopPropagation(); /* show details maybe */ }}
                      title={event.description}
                    >
                      <div className="font-bold truncate">{event.title}</div>
                      {event.time && <div className="flex items-center gap-1 opacity-80 mt-0.5"><Clock className="w-2.5 h-2.5" /> {event.time}</div>}
                      
                      {canEdit && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}
                          className="absolute top-1 right-1 p-0.5 rounded-sm bg-white/50 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-200"></div><span className="text-slate-600">Date clé</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-100 border border-red-200"></div><span className="text-slate-600">Examen</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-200"></div><span className="text-slate-600">Réunion</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-100 border border-orange-200"></div><span className="text-slate-600">Jour férié</span></div>
        </div>
      </div>

      {showAddModal && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Ajouter un événement</h3>
                <p className="text-sm text-slate-500">{format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                  Titre
                </label>
                <input
                  type="text"
                  required
                  value={newEvent.title}
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Conseil de classe, Brevet blanc..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                    Type
                  </label>
                  <select
                    value={newEvent.type}
                    onChange={e => setNewEvent({...newEvent, type: e.target.value as any})}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="KEY_DATE">Date clé</option>
                    <option value="EXAM">Examen</option>
                    <option value="MEETING">Réunion</option>
                    <option value="HOLIDAY">Jour férié</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                    Heure (optionnel)
                  </label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none h-24"
                  placeholder="Détails de l'événement..."
                ></textarea>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
