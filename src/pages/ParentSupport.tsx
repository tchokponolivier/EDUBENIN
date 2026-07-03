import React, { useState, useRef } from "react";
import { HelpCircle, CheckCircle2, MessageSquare, AlertTriangle, Send, Camera, X } from "lucide-react";

export function ParentSupport() {
  const [topic, setTopic] = useState("paiment");
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Simulate sending the report to the school administration
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setMessage("");
      setPhoto("");
    }, 4000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-700">Assistance & Signalement</h1>
        <p className="text-xs text-slate-500 mt-1">Signalez un problème ou proposez une amélioration à l'administration</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6">
          {submitted ? (
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">Message envoyé !</h3>
              <p className="text-sm text-emerald-600">Votre signalement a été transmis à l'administration de l'établissement. Nous vous répondrons dans les plus brefs délais.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Type de requête</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`cursor-pointer border rounded-xl p-4 flex items-start gap-4 transition-colors ${topic === 'paiment' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                    <input type="radio" value="paiment" checked={topic === 'paiment'} onChange={() => setTopic('paiment')} className="hidden" />
                    <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${topic === 'paiment' ? 'border-emerald-500' : 'border-slate-300'}`}>
                      {topic === 'paiment' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                    </div>
                    <div>
                      <h4 className={`font-bold ${topic === 'paiment' ? 'text-gray-700' : 'text-gray-700'}`}>Problème de paiement</h4>
                      <p className={`text-xs mt-1 ${topic === 'paiment' ? 'text-emerald-600' : 'text-slate-500'}`}>Erreur de transaction, non reçu, etc.</p>
                    </div>
                  </label>

                  <label className={`cursor-pointer border rounded-xl p-4 flex items-start gap-4 transition-colors ${topic === 'amelioration' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                    <input type="radio" value="amelioration" checked={topic === 'amelioration'} onChange={() => setTopic('amelioration')} className="hidden" />
                    <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${topic === 'amelioration' ? 'border-emerald-500' : 'border-slate-300'}`}>
                      {topic === 'amelioration' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                    </div>
                    <div>
                      <h4 className={`font-bold ${topic === 'amelioration' ? 'text-gray-700' : 'text-gray-700'}`}>Suggestion / Amélioration</h4>
                      <p className={`text-xs mt-1 ${topic === 'amelioration' ? 'text-emerald-600' : 'text-slate-500'}`}>Idées pour améliorer l'école ou l'app</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Votre message</label>
                <textarea
                  required
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre problème ou votre suggestion en détail..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-y mb-4"
                ></textarea>

                <div className="flex flex-col gap-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Photo (Optionnelle)</label>
                  {photo ? (
                    <div className="relative w-32 h-32 rounded-lg border border-slate-200 overflow-hidden">
                      <img src={photo} alt="Aperçu" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhoto("")}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-gray-700 hover:border-slate-400 hover:bg-slate-50 transition-colors text-sm font-medium"
                    >
                      <Camera size={20} />
                      Ajouter une photo
                    </button>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-sm uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                  Envoyer le message
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {!submitted && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-4">
           <div className="text-amber-500 shrink-0 mt-0.5"><AlertTriangle size={20} /></div>
           <div>
             <h4 className="font-bold text-amber-800">Support téléphonique</h4>
             <p className="text-xs text-amber-700 mt-1">Pour toute urgence concernant un paiement Mobile Money, veuillez contacter directement la comptabilité au <span className="font-bold">+229 01 66 82 79 24</span> (Appel ou WhatsApp).</p>
           </div>
        </div>
      )}
    </div>
  );
}
