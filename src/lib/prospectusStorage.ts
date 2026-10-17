/**
 * Robust IndexedDB & LocalStorage persistence for School Prospectus
 * Prevents loss of uploaded images on reload or navigation.
 */

const DB_NAME = "EduBeninProspectusDB";
const STORE_NAME = "prospectus_store";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not supported"));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "schoolId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface ProspectusData {
  imageUrl: string;
  bottomImageUrl?: string;
  sections: any[];
  updatedAt?: number;
}

export async function saveProspectus(schoolId: string, data: ProspectusData): Promise<void> {
  const record = { schoolId, ...data, updatedAt: Date.now() };

  // 1. Save in IndexedDB (handles large Base64 images seamlessly)
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB save failed, falling back to localStorage", err);
  }

  // 2. Also save to localStorage as quick fallback
  try {
    localStorage.setItem(`school_prospectus_${schoolId}`, JSON.stringify(record));
    localStorage.setItem("school_prospectus_latest", JSON.stringify(record));
  } catch (err) {
    console.warn("localStorage quota exceeded for full prospectus image, indexedDB retains it.", err);
    try {
      // If full image too big for localStorage, save metadata and sections to localStorage
      const lightweight = { ...record, imageUrl: record.imageUrl.slice(0, 500) };
      localStorage.setItem(`school_prospectus_meta_${schoolId}`, JSON.stringify(lightweight));
    } catch (_) {}
  }
}

export async function loadProspectus(schoolId: string): Promise<ProspectusData | null> {
  // 1. Try IndexedDB first
  try {
    const db = await openDB();
    const result = await new Promise<any>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(schoolId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (result && (result.imageUrl || result.sections)) {
      return result;
    }
  } catch (err) {
    console.warn("IndexedDB read error:", err);
  }

  // 2. Try localStorage
  try {
    const raw = localStorage.getItem(`school_prospectus_${schoolId}`) || localStorage.getItem("school_prospectus_latest");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) return parsed;
    }
  } catch (err) {
    console.warn("localStorage read error:", err);
  }

  return null;
}
