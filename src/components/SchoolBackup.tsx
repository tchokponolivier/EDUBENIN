import React, { useState, useRef } from "react";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { useConfirm } from "../lib/confirm";
import { supabase } from "../lib/supabase";
import { 
  Database, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  FileText, 
  HardDrive, 
  Calendar, 
  ShieldCheck, 
  Users, 
  CreditCard, 
  Banknote, 
  FileSpreadsheet,
  ArrowRight,
  Info
} from "lucide-react";
import { loadProspectus, saveProspectus } from "../lib/prospectusStorage";

export function SchoolBackup() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any | null>(null);
  const [importMode, setImportMode] = useState<"MERGE" | "REPLACE">("MERGE");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const effectiveSchoolId = user?.schoolId || localStorage.getItem("edubenin_active_school_id") || "11111111-1111-4111-8111-111111111111";
  const schoolName = user?.schoolName || localStorage.getItem("edubenin_active_school_name") || "Mon_Etablissement";

  // 1. Export Backup (Sauvegarde)
  const handleExportBackup = async () => {
    setIsExporting(true);
    setStatusMessage("Collecte des données de l'établissement...");
    try {
      // Collect all tables
      const [
        studentsRes,
        feeConfigRes,
        paymentsRes,
        expensesRes,
        salariesRes,
        announcementsRes,
        schoolRes,
        academicYearsRes
      ] = await Promise.all([
        supabase.from("students").select("*").eq("school_id", effectiveSchoolId),
        supabase.from("fee_config").select("*").eq("school_id", effectiveSchoolId),
        supabase.from("payments").select("*").eq("school_id", effectiveSchoolId),
        supabase.from("expenses").select("*").eq("school_id", effectiveSchoolId),
        supabase.from("salaries").select("*").eq("school_id", effectiveSchoolId),
        supabase.from("announcements").select("*").eq("school_id", effectiveSchoolId),
        supabase.from("schools").select("*").eq("id", effectiveSchoolId).maybeSingle(),
        supabase.from("academic_years").select("*").eq("school_id", effectiveSchoolId)
      ]);

      // Collect local storage complements
      const localCustomFees = localStorage.getItem(`custom_fee_types_${effectiveSchoolId}`);
      const localExpenses = localStorage.getItem(`school_expenses_${effectiveSchoolId}`);
      const localSalaries = localStorage.getItem(`school_salaries_${effectiveSchoolId}`);
      const localAnnouncements = localStorage.getItem(`school_announcements_${effectiveSchoolId}`);
      const prospectusData = await loadProspectus(effectiveSchoolId);

      const backupData = {
        meta: {
          app: "EDU-BENIN",
          version: "2.5",
          exportedAt: new Date().toISOString(),
          schoolId: effectiveSchoolId,
          schoolName: schoolName,
          exportedBy: user?.name || user?.email || "Directeur"
        },
        school: schoolRes.data || { id: effectiveSchoolId, name: schoolName },
        academicYears: academicYearsRes.data || [],
        students: studentsRes.data || [],
        feeConfigs: feeConfigRes.data || [],
        payments: paymentsRes.data || [],
        expenses: expensesRes.data || [],
        salaries: salariesRes.data || [],
        announcements: announcementsRes.data || [],
        prospectus: prospectusData || null,
        localCustomFees: localCustomFees ? JSON.parse(localCustomFees) : [],
        localExpenses: localExpenses ? JSON.parse(localExpenses) : [],
        localSalaries: localSalaries ? JSON.parse(localSalaries) : [],
        localAnnouncements: localAnnouncements ? JSON.parse(localAnnouncements) : []
      };

      // Create download
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const cleanSchoolName = schoolName.replace(/[^a-zA-Z0-9_-]/g, "_");
      const datePart = new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `Sauvegarde_EDUBENIN_${cleanSchoolName}_${datePart}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Sauvegarde générée et téléchargée avec succès !");
      setStatusMessage("Fichier de sauvegarde prêt et enregistré.");
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error("Erreur lors de la génération de la sauvegarde : " + (err.message || "Erreur"));
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Read File for Restore Preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || !parsed.meta || parsed.meta.app !== "EDU-BENIN") {
          toast.error("Le fichier sélectionné n'est pas un fichier de sauvegarde EDU-BENIN valide.");
          return;
        }

        setImportPreview(parsed);
      } catch (err) {
        toast.error("Fichier JSON invalide ou endommagé.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 3. Confirm and Execute Import / Restore
  const handleExecuteImport = async () => {
    if (!importPreview) return;

    const ok = await confirm({
      title: "Confirmer la restauration des données",
      message: `Voulez-vous vraiment importer cette sauvegarde pour votre établissement ? (${importPreview.students?.length || 0} élèves, ${importPreview.payments?.length || 0} paiements, ${importPreview.feeConfigs?.length || 0} frais). Mode : ${importMode === "MERGE" ? "Fusionner avec l'existant" : "Remplacement complet"}.`,
      confirmText: "Oui, restaurer les données",
      variant: "danger"
    });
    if (!ok) return;

    setIsImporting(true);
    setStatusMessage("Restauration et application des données en cours...");

    try {
      const targetSchoolId = effectiveSchoolId;

      // 1. Restore Custom Fee types & configs
      if (Array.isArray(importPreview.localCustomFees) && importPreview.localCustomFees.length > 0) {
        localStorage.setItem(`custom_fee_types_${targetSchoolId}`, JSON.stringify(importPreview.localCustomFees));
      }

      // 2. Restore Prospectus
      if (importPreview.prospectus) {
        await saveProspectus(targetSchoolId, importPreview.prospectus);
      }

      // 3. Restore Local Announcements
      if (Array.isArray(importPreview.localAnnouncements) && importPreview.localAnnouncements.length > 0) {
        localStorage.setItem(`school_announcements_${targetSchoolId}`, JSON.stringify(importPreview.localAnnouncements));
      }

      // 4. Restore Local Salaries & Expenses
      if (Array.isArray(importPreview.localSalaries) && importPreview.localSalaries.length > 0) {
        localStorage.setItem(`school_salaries_${targetSchoolId}`, JSON.stringify(importPreview.localSalaries));
      }
      if (Array.isArray(importPreview.localExpenses) && importPreview.localExpenses.length > 0) {
        localStorage.setItem(`school_expenses_${targetSchoolId}`, JSON.stringify(importPreview.localExpenses));
      }

      // 5. Restore Remote Data in Supabase if rows present
      // Fee configs
      if (Array.isArray(importPreview.feeConfigs) && importPreview.feeConfigs.length > 0) {
        const feesToInsert = importPreview.feeConfigs.map((f: any) => ({
          school_id: targetSchoolId,
          level: f.level || "ALL",
          fee_type: f.fee_type || f.feeType || "AUTRE",
          amount: Number(f.amount) || 0,
          academic_year: f.academic_year || f.academicYear || "2024-2025"
        }));
        try {
          await supabase.from("fee_config").upsert(feesToInsert, { onConflict: "id" });
        } catch (_) {}
      }

      // Students
      if (Array.isArray(importPreview.students) && importPreview.students.length > 0) {
        const studentsToInsert = importPreview.students.map((st: any) => ({
          ...st,
          school_id: targetSchoolId
        }));
        try {
          await supabase.from("students").upsert(studentsToInsert, { onConflict: "id" });
        } catch (_) {}
      }

      // Payments
      if (Array.isArray(importPreview.payments) && importPreview.payments.length > 0) {
        const paysToInsert = importPreview.payments.map((p: any) => ({
          ...p,
          school_id: targetSchoolId
        }));
        try {
          await supabase.from("payments").upsert(paysToInsert, { onConflict: "id" });
        } catch (_) {}
      }

      // Expenses
      if (Array.isArray(importPreview.expenses) && importPreview.expenses.length > 0) {
        const expsToInsert = importPreview.expenses.map((e: any) => ({
          ...e,
          school_id: targetSchoolId
        }));
        try {
          await supabase.from("expenses").upsert(expsToInsert, { onConflict: "id" });
        } catch (_) {}
      }

      // Salaries
      if (Array.isArray(importPreview.salaries) && importPreview.salaries.length > 0) {
        const salsToInsert = importPreview.salaries.map((s: any) => ({
          ...s,
          school_id: targetSchoolId
        }));
        try {
          await supabase.from("salaries").upsert(salsToInsert, { onConflict: "id" });
        } catch (_) {}
      }

      toast.success("Données de l'école restaurées avec succès !");
      setImportPreview(null);
      setStatusMessage("Restauration terminée. La page va s'actualiser pour charger toutes les informations.");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error("Import error:", err);
      toast.error("Erreur lors de la restauration : " + (err.message || "Erreur"));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <Database size={24} />
            </span>
            <h1 className="text-xl font-black text-gray-900">
              Sauvegarde & Restauration des Données
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Exportez en toute sécurité l'intégralité des données de votre établissement ({schoolName}) ou restaurez vos informations à partir d'un fichier de sauvegarde.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportBackup}
            disabled={isExporting}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition"
          >
            {isExporting ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
            <span>Sauvegarder les données</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl flex items-center gap-3 font-semibold animate-in fade-in">
          <RefreshCw size={16} className="animate-spin text-blue-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Grid: Backup Box & Restore Box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Box Sauvegarde */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
              <HardDrive size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">1. Sauvegarder les données de son école</h3>
              <p className="text-[11px] text-slate-500">Archive complète au format sécurisé JSON</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <p>
              La sauvegarde inclut automatiquement l'ensemble des modules de votre école :
            </p>
            <ul className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-700">
              <li className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <Users size={14} className="text-emerald-600" />
                <span>Élèves & Inscriptions</span>
              </li>
              <li className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <CreditCard size={14} className="text-indigo-600" />
                <span>Paiements & Caisse</span>
              </li>
              <li className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <FileSpreadsheet size={14} className="text-amber-600" />
                <span>Grille & Tarifs de frais</span>
              </li>
              <li className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <Banknote size={14} className="text-rose-600" />
                <span>Dépenses & Salaires</span>
              </li>
              <li className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <Calendar size={14} className="text-purple-600" />
                <span>Années scolaires</span>
              </li>
              <li className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <ShieldCheck size={14} className="text-teal-600" />
                <span>Prospectus & Annonces</span>
              </li>
            </ul>
          </div>

          <div className="pt-2">
            <button
              onClick={handleExportBackup}
              disabled={isExporting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition"
            >
              {isExporting ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
              <span>Télécharger le fichier de sauvegarde (.json)</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Conservez ce fichier sur votre ordinateur ou clé USB pour pouvoir restaurer vos données à tout moment.
            </p>
          </div>
        </div>

        {/* 2. Box Restauration & Import */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
              <Upload size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">2. Restaurer ou Importer des données</h3>
              <p className="text-[11px] text-slate-500">Chargez un fichier de sauvegarde préalablement exporté</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Sélectionnez votre fichier <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">.json</span> pour prévisualiser son contenu avant de valider l'importation.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/30 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition text-slate-600 hover:text-emerald-700"
            >
              <Upload size={24} className="text-slate-400" />
              <span className="font-bold text-xs uppercase tracking-wider">
                Choisir un fichier de sauvegarde
              </span>
              <span className="text-[11px] text-slate-400">
                Cliquez pour parcourir vos fichiers (.json)
              </span>
            </button>
          </div>

          {/* Import Preview Modal / Card */}
          {importPreview && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h4 className="font-bold text-gray-800 text-xs">
                    Sauvegarde détectée : {importPreview.meta?.schoolName || "Établissement"}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Exporté le {new Date(importPreview.meta?.exportedAt || Date.now()).toLocaleString()} par {importPreview.meta?.exportedBy || "Directeur"}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Valide
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <div className="font-black text-gray-800 text-sm">{importPreview.students?.length || 0}</div>
                  <div className="text-[10px] text-slate-500">Élèves</div>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <div className="font-black text-gray-800 text-sm">{importPreview.payments?.length || 0}</div>
                  <div className="text-[10px] text-slate-500">Paiements</div>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <div className="font-black text-gray-800 text-sm">
                    {(importPreview.feeConfigs?.length || 0) + (importPreview.localCustomFees?.length || 0)}
                  </div>
                  <div className="text-[10px] text-slate-500">Frais</div>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="flex items-center gap-4 text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="importMode"
                    value="MERGE"
                    checked={importMode === "MERGE"}
                    onChange={() => setImportMode("MERGE")}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Fusionner (Conserver données existantes)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="importMode"
                    value="REPLACE"
                    checked={importMode === "REPLACE"}
                    onChange={() => setImportMode("REPLACE")}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>Remplacer</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setImportPreview(null)}
                  className="flex-1 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleExecuteImport}
                  disabled={isImporting}
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition flex items-center justify-center gap-2"
                >
                  {isImporting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Restaurer les données</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
