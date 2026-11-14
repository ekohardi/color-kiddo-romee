import { ColoringTemplate, SavedArtwork } from '../types/coloring';

const DB_NAME = 'kiddocolor-studio-db';
const DB_VERSION = 1;
const STORE_DESIGNS = 'customDesigns';
const STORE_ARTWORKS = 'savedArtworks';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_DESIGNS)) {
        db.createObjectStore(STORE_DESIGNS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_ARTWORKS)) {
        db.createObjectStore(STORE_ARTWORKS, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getCustomDesigns(): Promise<ColoringTemplate[]> {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DESIGNS, 'readonly');
      const req = tx.objectStore(STORE_DESIGNS).getAll();
      req.onsuccess = () => {
        const items = (req.result as ColoringTemplate[]) || [];
        resolve(items.sort((a, b) => b.createdAt - a.createdAt));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function saveCustomDesign(design: ColoringTemplate): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_DESIGNS, 'readwrite');
    tx.objectStore(STORE_DESIGNS).put(design);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteCustomDesign(id: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_DESIGNS, 'readwrite');
    tx.objectStore(STORE_DESIGNS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSavedArtworks(): Promise<SavedArtwork[]> {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ARTWORKS, 'readonly');
      const req = tx.objectStore(STORE_ARTWORKS).getAll();
      req.onsuccess = () => {
        const items = (req.result as SavedArtwork[]) || [];
        resolve(items.sort((a, b) => b.updatedAt - a.updatedAt));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function saveArtwork(artwork: SavedArtwork): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_ARTWORKS, 'readwrite');
    tx.objectStore(STORE_ARTWORKS).put(artwork);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteSavedArtwork(id: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_ARTWORKS, 'readwrite');
    tx.objectStore(STORE_ARTWORKS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
