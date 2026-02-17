const STORAGE_KEYS = {
  jwt: 'tw.jwt',
  language: 'tw.language',
  lastTeamId: 'tw.lastTeamId',
} as const;

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function getStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getItem(key: StorageKey): string | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function setItem(key: StorageKey, value: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // no-op
  }
}

function removeItem(key: StorageKey): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // no-op
  }
}

export const appStorage = {
  getJwt(): string | null {
    return getItem(STORAGE_KEYS.jwt);
  },
  setJwt(token: string): void {
    setItem(STORAGE_KEYS.jwt, token);
  },
  clearJwt(): void {
    removeItem(STORAGE_KEYS.jwt);
  },
  getLanguage(): string | null {
    const stored = getItem(STORAGE_KEYS.language);
    if (stored) return stored;

    const storage = getStorage();
    if (!storage) return null;
    const legacy = storage.getItem('language');
    if (legacy) {
      setItem(STORAGE_KEYS.language, legacy);
      storage.removeItem('language');
      return legacy;
    }
    return null;
  },
  setLanguage(language: string): void {
    setItem(STORAGE_KEYS.language, language);
  },
  getLastTeamId(): string | null {
    return getItem(STORAGE_KEYS.lastTeamId);
  },
  setLastTeamId(teamId: string): void {
    setItem(STORAGE_KEYS.lastTeamId, teamId);
  },
  clearLastTeamId(): void {
    removeItem(STORAGE_KEYS.lastTeamId);
  },
};

