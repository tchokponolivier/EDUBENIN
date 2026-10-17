import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { FeeConfig, LEVELS } from "../types";
import { useAuth } from "../lib/auth";
import { 
  X, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Copy, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  Maximize2, 
  Table as TableIcon,
  Sparkles
} from "lucide-react";

export interface FeeColumnDef {
  key: string;
  label: string;
  type: "MANDATORY" | "OPTIONAL";
  isTranche?: boolean;
  isTotalScolarite?: boolean;
  isCustom?: boolean;
}

export const DEFAULT_TABLE_COLUMNS: FeeColumnDef[] = [
  { key: "INSCRIPTION_NEW", label: "Inscription nouveau élève", type: "MANDATORY", isTranche: false },
  { key: "INSCRIPTION_OLD", label: "Inscription ancien élève", type: "MANDATORY", isTranche: false },
  { key: "MONTHLY", label: "Scolarité", type: "MANDATORY", isTranche: false, isTotalScolarite: true },
  { key: "tranche1", label: "Tranche 1", type: "MANDATORY", isTranche: true },
  { key: "tranche2", label: "Tranche 2", type: "MANDATORY", isTranche: true },
  { key: "tranche3", label: "Tranche 3", type: "MANDATORY", isTranche: true },
  { key: "TD", label: "TD", type: "MANDATORY", isTranche: false },
  { key: "ID_CARD", label: "Carte scolaire", type: "MANDATORY", isTranche: false },
  { key: "BOOKS", label: "Livres scolaires", type: "OPTIONAL", isTranche: false },
  { key: "UNIFORMS", label: "Uniforme", type: "MANDATORY", isTranche: false },
  { key: "SPORTS_WEAR", label: "Tenue de sport", type: "MANDATORY", isTranche: false },
  { key: "EVALUATION", label: "Frais d'évaluation", type: "MANDATORY", isTranche: false },
  { key: "CANTEEN", label: "Cantine", type: "OPTIONAL", isTranche: false },
  { key: "VACATION_CLASSES", label: "Cours de vacances", type: "OPTIONAL", isTranche: false },
  { key: "REINFORCEMENT_CLASSES", label: "Cours de renforcement", type: "OPTIONAL", isTranche: false },
  { key: "SUPERVISED_CARE", label: "Garde surveillée", type: "OPTIONAL", isTranche: false },
];

interface FeeTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  academicYears: { id?: string; name: string }[];
  currentYear: string;
  onSaved: () => void;
  embedded?: boolean;
}

export function FeeTableModal({ 
  isOpen, 
  onClose, 
  academicYears, 
  currentYear, 
  onSaved,
  embedded = false 
}: FeeTableModalProps) {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState(currentYear || (academicYears[0]?.name ?? "2024-2025"));
  const [copyFromYear, setCopyFromYear] = useState("");
  
  // Columns state (allows adding custom columns and renaming labels)
  const [columns, setColumns] = useState<FeeColumnDef[]>(DEFAULT_TABLE_COLUMNS);
  
  // Rename state
  const [editingColKey, setEditingColKey] = useState<string | null>(null);
  const [editingColLabel, setEditingColLabel] = useState<string>("");

  // Add custom fee modal state
  const [showAddFeeModal, setShowAddFeeModal] = useState(false);
  const [newFeeName, setNewFeeName] = useState("");
  const [newFeeType, setNewFeeType] = useState<"MANDATORY" | "OPTIONAL">("MANDATORY");

  // grid: level -> columnKey -> number
  const [gridData, setGridData] = useState<Record<string, Record<string, number>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const effectiveSchoolId = user?.schoolId || localStorage.getItem("edubenin_active_school_id") || "11111111-1111-4111-8111-111111111111";

  // Load column customizations from localStorage
  useEffect(() => {
    try {
      const savedLabels = JSON.parse(localStorage.getItem(`school_fee_column_labels_${effectiveSchoolId}`) || "{}");
      const savedCustom = JSON.parse(localStorage.getItem(`school_fee_custom_columns_${effectiveSchoolId}`) || "[]");

      let updatedCols: FeeColumnDef[] = DEFAULT_TABLE_COLUMNS.map(c => ({
        ...c,
        label: savedLabels[c.key] || c.label
      }));

      if (Array.isArray(savedCustom) && savedCustom.length > 0) {
        savedCustom.forEach((cc: FeeColumnDef) => {
          if (!updatedCols.some(col => col.key === cc.key)) {
            updatedCols.push({
              ...cc,
              label: savedLabels[cc.key] || cc.label,
              isCustom: true
            });
          }
        });
      }

      setColumns(updatedCols);
    } catch (e) {
      console.warn("Could not load fee columns customization:", e);
    }
  }, [effectiveSchoolId]);

  useEffect(() => {
    if (currentYear) setSelectedYear(currentYear);
  }, [currentYear]);

  // Load fees for selected year
  useEffect(() => {
    if ((!isOpen && !embedded) || !effectiveSchoolId || !selectedYear) return;
    loadYearData(selectedYear);
  }, [isOpen, embedded, effectiveSchoolId, selectedYear]);

  const loadYearData = async (year: string) => {
    setIsLoading(true);
    setMessage(null);
    try {
      const { data, error } = await supabase
        .from("fee_config")
        .select("*")
        .eq("school_id", effectiveSchoolId)
        .eq("academic_year", year);

      if (error) {
        console.error("Error loading fees:", error);
      }

      // Check for any fee_types present in DB that aren't yet in columns
      const savedLabels = JSON.parse(localStorage.getItem(`school_fee_column_labels_${effectiveSchoolId}`) || "{}");
      const currentKeys = new Set(columns.map(c => c.key));
      const discoveredCols: FeeColumnDef[] = [];

      if (data && data.length > 0) {
        data.forEach((row: any) => {
          const ft = row.fee_type;
          if (ft && !currentKeys.has(ft) && ft !== "INSCRIPTION" && ft !== "MONTHLY") {
            currentKeys.add(ft);
            const humanLabel = savedLabels[ft] || ft.replace(/^CUSTOM_/, "").replace(/_/g, " ").toLowerCase().replace(/^\w/, c => c.toUpperCase());
            discoveredCols.push({
              key: ft,
              label: humanLabel,
              type: "MANDATORY",
              isCustom: true
            });
          }
        });
      }

      let activeCols = columns;
      if (discoveredCols.length > 0) {
        activeCols = [...columns, ...discoveredCols];
        setColumns(activeCols);
      }

      const initialGrid: Record<string, Record<string, number>> = {};
      LEVELS.forEach(lvl => {
        initialGrid[lvl] = {};
        activeCols.forEach(col => {
          initialGrid[lvl][col.key] = 0;
        });
      });

      if (data && data.length > 0) {
        data.forEach((row: any) => {
          const lvls = row.level === "ALL" ? LEVELS : [row.level];
          lvls.forEach(lvl => {
            if (!initialGrid[lvl]) initialGrid[lvl] = {};
            const feeType = row.fee_type;
            
            // Map legacy INSCRIPTION to INSCRIPTION_NEW if not set
            if (feeType === "INSCRIPTION") {
              if (!initialGrid[lvl]["INSCRIPTION_NEW"]) {
                initialGrid[lvl]["INSCRIPTION_NEW"] = Number(row.amount) || 0;
              }
            } else if (feeType === "MONTHLY") {
              initialGrid[lvl]["MONTHLY"] = Number(row.amount) || 0;
              if (Array.isArray(row.tranches)) {
                row.tranches.forEach((t: any, idx: number) => {
                  const key = `tranche${idx + 1}`;
                  if (initialGrid[lvl] && key in initialGrid[lvl]) {
                    initialGrid[lvl][key] = Number(t.amount) || 0;
                  }
                });
              }
            } else {
              if (initialGrid[lvl]) {
                initialGrid[lvl][feeType] = Number(row.amount) || 0;
              }
            }
          });
        });
      }

      setGridData(initialGrid);
    } catch (err: any) {
      console.error(err);
      setMessage({ text: "Erreur lors du chargement des frais : " + err.message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCellChange = (level: string, colKey: string, value: string) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    setGridData(prev => {
      const levelRow = { ...(prev[level] || {}) };
      levelRow[colKey] = num;

      // If user edits tranche 1, 2, or 3, auto-calculate total Scolarité
      if (colKey === "tranche1" || colKey === "tranche2" || colKey === "tranche3") {
        const t1 = colKey === "tranche1" ? num : (levelRow.tranche1 || 0);
        const t2 = colKey === "tranche2" ? num : (levelRow.tranche2 || 0);
        const t3 = colKey === "tranche3" ? num : (levelRow.tranche3 || 0);
        const sum = t1 + t2 + t3;
        if (sum > 0) {
          levelRow.MONTHLY = sum;
        }
      }

      return {
        ...prev,
        [level]: levelRow,
      };
    });
  };

  // Add a new fee column
  const handleAddNewFeeColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeeName.trim()) return;

    const trimmed = newFeeName.trim();
    const cleanKey = "CUSTOM_" + trimmed.toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 24) + "_" + Math.floor(Math.random() * 1000);
    
    const newCol: FeeColumnDef = {
      key: cleanKey,
      label: trimmed,
      type: newFeeType,
      isCustom: true
    };

    const updatedCols = [...columns, newCol];
    setColumns(updatedCols);

    // Save custom columns in local storage
    const customList = updatedCols.filter(c => c.isCustom);
    localStorage.setItem(`school_fee_custom_columns_${effectiveSchoolId}`, JSON.stringify(customList));

    const savedLabels = JSON.parse(localStorage.getItem(`school_fee_column_labels_${effectiveSchoolId}`) || "{}");
    savedLabels[cleanKey] = trimmed;
    localStorage.setItem(`school_fee_column_labels_${effectiveSchoolId}`, JSON.stringify(savedLabels));

    // Update grid data with 0 for every level
    setGridData(prev => {
      const updated = { ...prev };
      LEVELS.forEach(lvl => {
        if (!updated[lvl]) updated[lvl] = {};
        updated[lvl][cleanKey] = 0;
      });
      return updated;
    });

    setNewFeeName("");
    setShowAddFeeModal(false);
    setMessage({ text: `Frais "${trimmed}" ajouté avec succès ! Vous pouvez maintenant saisir ses montants par classe.`, type: "success" });
  };

  // Save renamed column label
  const handleSaveColumnRename = (colKey: string) => {
    if (!editingColLabel.trim()) {
      setEditingColKey(null);
      return;
    }

    const updatedLabel = editingColLabel.trim();
    const updatedCols = columns.map(c => c.key === colKey ? { ...c, label: updatedLabel } : c);
    setColumns(updatedCols);

    // Save label map
    const savedLabels = JSON.parse(localStorage.getItem(`school_fee_column_labels_${effectiveSchoolId}`) || "{}");
    savedLabels[colKey] = updatedLabel;
    localStorage.setItem(`school_fee_column_labels_${effectiveSchoolId}`, JSON.stringify(savedLabels));

    // Also update custom columns if applicable
    const customList = updatedCols.filter(c => c.isCustom);
    localStorage.setItem(`school_fee_custom_columns_${effectiveSchoolId}`, JSON.stringify(customList));

    setEditingColKey(null);
    setEditingColLabel("");
  };

  // Delete a custom column
  const handleDeleteCustomColumn = (colKey: string, colLabel: string) => {
    if (!confirm(`Supprimer la colonne de frais "${colLabel}" ?`)) return;

    const updatedCols = columns.filter(c => c.key !== colKey);
    setColumns(updatedCols);

    const customList = updatedCols.filter(c => c.isCustom);
    localStorage.setItem(`school_fee_custom_columns_${effectiveSchoolId}`, JSON.stringify(customList));

    const savedLabels = JSON.parse(localStorage.getItem(`school_fee_column_labels_${effectiveSchoolId}`) || "{}");
    delete savedLabels[colKey];
    localStorage.setItem(`school_fee_column_labels_${effectiveSchoolId}`, JSON.stringify(savedLabels));

    setGridData(prev => {
      const updated = { ...prev };
      LEVELS.forEach(lvl => {
        if (updated[lvl]) {
          delete updated[lvl][colKey];
        }
      });
      return updated;
    });
  };

  // Copy from previous year
  const handleCopyFromPreviousYear = async () => {
    if (!copyFromYear) {
      alert("Veuillez choisir une année scolaire source.");
      return;
    }
    if (copyFromYear === selectedYear) {
      alert("L'année source et l'année de destination sont identiques.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("fee_config")
        .select("*")
        .eq("school_id", effectiveSchoolId)
        .eq("academic_year", copyFromYear);

      if (error) throw error;
      if (!data || data.length === 0) {
        alert(`Aucun frais trouvé pour l'année scolaire ${copyFromYear}.`);
        setIsLoading(false);
        return;
      }

      const importedGrid: Record<string, Record<string, number>> = {};
      LEVELS.forEach(lvl => {
        importedGrid[lvl] = {};
        columns.forEach(col => {
          importedGrid[lvl][col.key] = 0;
        });
      });

      data.forEach((row: any) => {
        const lvls = row.level === "ALL" ? LEVELS : [row.level];
        lvls.forEach(lvl => {
          if (!importedGrid[lvl]) importedGrid[lvl] = {};
          const feeType = row.fee_type;
          if (feeType === "INSCRIPTION") {
            importedGrid[lvl]["INSCRIPTION_NEW"] = Number(row.amount) || 0;
          } else if (feeType === "MONTHLY") {
            importedGrid[lvl]["MONTHLY"] = Number(row.amount) || 0;
            if (Array.isArray(row.tranches)) {
              row.tranches.forEach((t: any, idx: number) => {
                const key = `tranche${idx + 1}`;
                if (importedGrid[lvl] && key in importedGrid[lvl]) {
                  importedGrid[lvl][key] = Number(t.amount) || 0;
                }
              });
            }
          } else {
            if (importedGrid[lvl] && feeType in importedGrid[lvl]) {
              importedGrid[lvl][feeType] = Number(row.amount) || 0;
            }
          }
        });
      });

      setGridData(importedGrid);
      setMessage({
        text: `Frais importés depuis ${copyFromYear} ! Vous pouvez modifier les valeurs souhaitées puis cliquer sur Sauvegarder.`,
        type: "success",
      });
    } catch (err: any) {
      console.error(err);
      setMessage({ text: "Erreur lors de la copie : " + err.message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (!effectiveSchoolId) return;
    setIsSaving(true);
    setMessage(null);

    try {
      // 1. Delete existing configs for this school and selectedYear to cleanly replace with new table state
      await supabase
        .from("fee_config")
        .delete()
        .eq("school_id", effectiveSchoolId)
        .eq("academic_year", selectedYear);

      const rowsToInsert: any[] = [];

      LEVELS.forEach(level => {
        const row = gridData[level] || {};

        // Inscription Nouveau
        if (row.INSCRIPTION_NEW && row.INSCRIPTION_NEW > 0) {
          rowsToInsert.push({
            school_id: effectiveSchoolId,
            level,
            fee_type: "INSCRIPTION_NEW",
            amount: row.INSCRIPTION_NEW,
            academic_year: selectedYear,
          });
        }

        // Inscription Ancien
        if (row.INSCRIPTION_OLD && row.INSCRIPTION_OLD > 0) {
          rowsToInsert.push({
            school_id: effectiveSchoolId,
            level,
            fee_type: "INSCRIPTION_OLD",
            amount: row.INSCRIPTION_OLD,
            academic_year: selectedYear,
          });
        }

        // Scolarité (MONTHLY) + tranches
        const monthlyAmount = row.MONTHLY || 0;
        const t1 = row.tranche1 || 0;
        const t2 = row.tranche2 || 0;
        const t3 = row.tranche3 || 0;

        if (monthlyAmount > 0 || t1 > 0 || t2 > 0 || t3 > 0) {
          const totalMonthly = monthlyAmount > 0 ? monthlyAmount : (t1 + t2 + t3);
          const tranchesArray = [];
          if (t1 > 0) tranchesArray.push({ id: "tranche1", name: "Tranche 1", limit: "", amount: t1 });
          if (t2 > 0) tranchesArray.push({ id: "tranche2", name: "Tranche 2", limit: "", amount: t2 });
          if (t3 > 0) tranchesArray.push({ id: "tranche3", name: "Tranche 3", limit: "", amount: t3 });

          const monthlyItem: any = {
            school_id: effectiveSchoolId,
            level,
            fee_type: "MONTHLY",
            amount: totalMonthly,
            academic_year: selectedYear,
          };
          if (tranchesArray.length > 0) {
            monthlyItem.tranches = tranchesArray;
          }
          rowsToInsert.push(monthlyItem);
        }

        // All other columns (both standard and user-created custom columns)
        columns.forEach(col => {
          if (col.key === "INSCRIPTION_NEW" || col.key === "INSCRIPTION_OLD" || col.key === "MONTHLY" || col.isTranche) {
            return;
          }
          const val = row[col.key];
          if (val && val > 0) {
            rowsToInsert.push({
              school_id: effectiveSchoolId,
              level,
              fee_type: col.key,
              amount: val,
              academic_year: selectedYear,
            });
          }
        });
      });

      if (rowsToInsert.length > 0) {
        let res = await supabase.from("fee_config").insert(rowsToInsert);
        // If tranches column fails in remote DB, fallback without tranches column
        if (res.error && (res.error.code === "PGRST204" || res.error.message?.includes("tranches"))) {
          const fallback = rowsToInsert.map(({ tranches: _t, ...rest }) => rest);
          res = await supabase.from("fee_config").insert(fallback);
        }

        if (res.error) {
          throw res.error;
        }
      }

      // Save custom columns and labels to local storage
      const customList = columns.filter(c => c.isCustom);
      localStorage.setItem(`school_fee_custom_columns_${effectiveSchoolId}`, JSON.stringify(customList));

      setMessage({ text: "Grille tarifaire sauvegardée avec succès !", type: "success" });
      onSaved();
      if (!embedded) {
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      console.error("Save error:", err);
      setMessage({ text: "Erreur lors de la sauvegarde : " + (err.message || err), type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen && !embedded) return null;

  const content = (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden ${
      embedded ? "w-full" : "w-full max-w-[98vw] xl:max-w-7xl h-[92vh] shadow-2xl"
    }`}>
      
      {/* Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
              Grille Directoire
            </span>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TableIcon size={18} className="text-emerald-400" />
              Tableau Général des Frais de Scolarité
            </h3>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Modifiez directement les montants dans les cases, ajoutez d'autres frais personnalisés et renommez-les à votre convenance.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={() => setShowAddFeeModal(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition shadow-xs"
            title="Ajouter un autre frais personnalisé (nouvelle colonne)"
          >
            <Plus size={15} />
            <span>Ajouter d'autres frais</span>
          </button>

          {!embedded && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-2"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Toolbar: Academic Year + Copy from previous year + Actions */}
      <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-700 uppercase">Année scolaire :</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none shadow-xs"
            >
              {academicYears.map((y, idx) => (
                <option key={y.id || y.name || idx} value={y.name}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Reconduction / Copy from previous year */}
          <div className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-200 px-3 py-1 rounded-lg">
            <Copy size={14} className="text-emerald-700 shrink-0" />
            <span className="text-xs font-semibold text-emerald-900 hidden sm:inline">Reconduire depuis :</span>
            <select
              value={copyFromYear}
              onChange={e => setCopyFromYear(e.target.value)}
              className="px-2 py-1 bg-white border border-emerald-300 rounded text-xs text-gray-700 outline-none"
            >
              <option value="">Sélectionner une année précédente...</option>
              {academicYears.map((y, idx) => (
                <option key={y.id || y.name || idx} value={y.name}>
                  {y.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleCopyFromPreviousYear}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
              title="Charger les frais de l'année précédente pour cette année"
            >
              Reconduire
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => loadYearData(selectedYear)}
            disabled={isLoading || isSaving}
            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Réinitialiser"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Actualiser</span>
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isSaving || isLoading}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs disabled:opacity-50"
          >
            <Save size={16} />
            <span>{isSaving ? "Sauvegarde..." : "Sauvegarder"}</span>
          </button>
        </div>
      </div>

      {/* Message notification */}
      {message && (
        <div
          className={`p-3 text-xs font-semibold flex items-center justify-between border-b shrink-0 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="p-0.5 hover:opacity-75">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Excel-like Table View */}
      <div className={`flex-1 overflow-auto bg-slate-100 p-2 sm:p-4 ${embedded ? "max-h-[650px]" : ""}`}>
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden inline-block min-w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-800 text-white uppercase text-[10px] font-bold sticky top-0 z-20 shadow-xs">
              <tr>
                <th className="px-3 py-3 border-r border-slate-700 sticky left-0 z-30 bg-slate-900 min-w-28 text-center">
                  CLASSE
                </th>
                {columns.map(col => {
                  const isEditingThis = editingColKey === col.key;
                  return (
                    <th
                      key={col.key}
                      className={`px-3 py-2.5 border-r border-slate-700 whitespace-nowrap min-w-36 text-center group ${
                        col.isTranche ? "bg-slate-800/90 text-amber-300" : ""
                      } ${col.key === "MONTHLY" ? "bg-slate-800 text-emerald-300 font-extrabold" : ""} ${
                        col.isCustom ? "bg-indigo-950 text-indigo-200" : ""
                      }`}
                    >
                      {isEditingThis ? (
                        <div className="flex items-center gap-1 justify-center py-0.5">
                          <input
                            type="text"
                            value={editingColLabel}
                            onChange={e => setEditingColLabel(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter") handleSaveColumnRename(col.key);
                              if (e.key === "Escape") setEditingColKey(null);
                            }}
                            autoFocus
                            className="px-2 py-1 bg-white text-gray-900 text-xs font-semibold rounded outline-none border border-emerald-400 w-32 shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveColumnRename(col.key)}
                            className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition"
                            title="Confirmer le nouveau nom"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingColKey(null)}
                            className="p-1 bg-slate-600 hover:bg-slate-700 text-white rounded transition"
                            title="Annuler"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <span 
                            className="cursor-pointer hover:underline"
                            title="Cliquez sur le crayon pour renommer ce frais"
                            onClick={() => {
                              setEditingColKey(col.key);
                              setEditingColLabel(col.label);
                            }}
                          >
                            {col.label}
                          </span>
                          
                          {/* Rename button */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingColKey(col.key);
                              setEditingColLabel(col.label);
                            }}
                            className="opacity-60 group-hover:opacity-100 hover:text-emerald-400 p-0.5 transition"
                            title="Renommer ce frais"
                          >
                            <Edit2 size={11} />
                          </button>

                          {/* Delete if custom column */}
                          {col.isCustom && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomColumn(col.key, col.label)}
                              className="opacity-60 group-hover:opacity-100 hover:text-rose-400 p-0.5 transition ml-0.5"
                              title="Supprimer cette colonne de frais"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {LEVELS.map((lvl, rIdx) => {
                const row = gridData[lvl] || {};
                const isEven = rIdx % 2 === 0;
                return (
                  <tr key={lvl} className={`hover:bg-amber-50/40 transition-colors ${isEven ? "bg-white" : "bg-slate-50/60"}`}>
                    {/* Sticky level name */}
                    <td className="px-3 py-2 font-bold text-gray-800 border-r border-slate-200 sticky left-0 z-10 bg-inherit whitespace-nowrap text-center shadow-[1px_0_0_0_#e2e8f0]">
                      {lvl}
                    </td>

                    {/* Inputs for each column */}
                    {columns.map(col => {
                      const val = row[col.key] || 0;
                      const isScolariteTotal = col.key === "MONTHLY";
                      return (
                        <td
                          key={col.key}
                          className={`p-1 border-r border-slate-200 text-right ${
                            col.isTranche ? "bg-amber-50/20" : ""
                          } ${isScolariteTotal ? "bg-emerald-50/30" : ""} ${
                            col.isCustom ? "bg-indigo-50/20" : ""
                          }`}
                        >
                          <input
                            type="number"
                            min="0"
                            step="500"
                            value={val === 0 ? "" : val}
                            placeholder="0"
                            onChange={e => handleCellChange(lvl, col.key, e.target.value)}
                            className={`w-full text-right px-2 py-1 border rounded text-xs outline-none transition-all ${
                              val > 0
                                ? "font-semibold text-gray-900 border-slate-300 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                : "text-slate-400 border-transparent hover:border-slate-300 focus:border-emerald-500 bg-transparent"
                            }`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Scolarité = Somme automatique des tranches 1, 2 et 3
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            Tranches d'échéances
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            Frais personnalisés (survolez le titre pour renommer)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!embedded && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
            >
              Fermer
            </button>
          )}
          <button
            onClick={handleSaveAll}
            disabled={isSaving || isLoading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs disabled:opacity-50"
          >
            <Save size={16} />
            <span>{isSaving ? "Enregistrement..." : "Sauvegarder les modifications"}</span>
          </button>
        </div>
      </div>

      {/* Modal: Ajouter un frais personnalisé */}
      {showAddFeeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Plus size={16} className="text-emerald-600" />
                Ajouter un frais à la grille
              </h4>
              <button 
                onClick={() => setShowAddFeeModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddNewFeeColumn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Nom du frais <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Frais de dossier, Assurance, Sortie..."
                  value={newFeeName}
                  onChange={e => setNewFeeName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  autoFocus
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Vous pourrez renommer ce frais à tout moment en cliquant sur son en-tête.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Type de frais
                </label>
                <select
                  value={newFeeType}
                  onChange={e => setNewFeeType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="MANDATORY">Frais Obligatoire (Scolaire)</option>
                  <option value="OPTIONAL">Frais Optionnel (Service)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddFeeModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-xs"
                >
                  Créer la colonne
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      {content}
    </div>
  );
}
