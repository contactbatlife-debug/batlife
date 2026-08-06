// src/services/backup.js

const BACKUP_VERSION = 1;
const APP_NAME = "BatLife";

function isBatLifeKey(key) {
  return key.startsWith("bl_") || key.startsWith("batlife_");
}

function getBatLifeStorage() {
  const storage = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (key && isBatLifeKey(key)) {
      storage[key] = localStorage.getItem(key);
    }
  }

  return storage;
}

function removeCurrentBatLifeStorage() {
  const keysToRemove = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (key && isBatLifeKey(key)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

function downloadJson(filename, data) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportBackupJson() {
  const now = new Date();

  const backup = {
    app: APP_NAME,
    backupVersion: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    storage: getBatLifeStorage(),
  };

  const date = now.toISOString().slice(0, 10);
  const filename = `batlife-backup-${date}.json`;

  downloadJson(filename, backup);

  return backup;
}

function normalizeImportedBackup(data) {
  // Format actuel BatLife
  if (data && data.app === APP_NAME && data.storage && typeof data.storage === "object") {
    return data.storage;
  }

  // Ancien format possible : tableau d'historique seul
  if (Array.isArray(data)) {
    return {
      bl_history_v5: JSON.stringify(data),
    };
  }

  // Ancien format possible : { history: [...] }
  if (data && Array.isArray(data.history)) {
    return {
      bl_history_v5: JSON.stringify(data.history),
    };
  }

  // Ancien format possible : { data: { history: [...] } }
  if (data && data.data && Array.isArray(data.data.history)) {
    return {
      bl_history_v5: JSON.stringify(data.data.history),
    };
  }

  throw new Error("FORMAT_INVALIDE");
}

export function importBackupJson(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("AUCUN_FICHIER"));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const content = reader.result;
        const parsed = JSON.parse(content);
        const storage = normalizeImportedBackup(parsed);

        removeCurrentBatLifeStorage();

        Object.entries(storage).forEach(([key, value]) => {
          if (!isBatLifeKey(key)) return;

          if (typeof value === "string") {
            localStorage.setItem(key, value);
          } else {
            localStorage.setItem(key, JSON.stringify(value));
          }
        });

        resolve({
          restoredKeys: Object.keys(storage).length,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("LECTURE_IMPOSSIBLE"));
    };

    reader.readAsText(file);
  });
}