import { ParticipantRecord } from '../types/game';

const STORAGE_KEY = 'diabetes_14n_persistent_participants_v3';
const LEGACY_KEYS = [
  'diabetes_14n_persistent_participants_v2',
  'diabetes_14n_persistent_participants',
];

interface StoredParticipant extends ParticipantRecord {
  _pendingSync?: boolean;
}

// Get locally stored participants (including migrating any legacy keys)
export function getLocalParticipants(): StoredParticipant[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list: StoredParticipant[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    }

    // Merge any records stored under legacy keys so old sessions aren't orphaned
    if (list.length === 0) {
      for (const oldKey of LEGACY_KEYS) {
        const oldRaw = localStorage.getItem(oldKey);
        if (oldRaw) {
          const oldParsed = JSON.parse(oldRaw);
          if (Array.isArray(oldParsed) && oldParsed.length > 0) {
            list = oldParsed;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
            break;
          }
        }
      }
    }

    return list;
  } catch (err) {
    console.error('Error reading local participants:', err);
    return [];
  }
}

// Save locally and notify any open tabs
export function saveLocalParticipants(records: StoredParticipant[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new Event('diabetes_14n_participants_updated'));
  } catch (err) {
    console.error('Error saving local participants:', err);
  }
}

function normalizeKey(p: { cedula?: string; name?: string; id?: string }): string {
  const ced = String(p.cedula || '').trim();
  if (ced) return `cc:${ced}`;
  const nam = String(p.name || '').trim().toLowerCase();
  if (nam) return `name:${nam}`;
  return `id:${p.id || ''}`;
}

// Save or update a single participant both locally and on the server
export async function persistParticipant(participantData: {
  name: string;
  cedula?: string;
  area?: string;
  score: number;
  stars?: number;
  glucoseLevel?: number;
  triviaCorrect?: number;
  triviaTotal?: number;
  timeSeconds?: number;
}): Promise<ParticipantRecord> {
  const safeName = String(participantData.name || '').trim() || 'Participante';
  const safeCedula = String(participantData.cedula || '').trim() || `CC-${Date.now().toString().slice(-6)}`;
  const safeArea = String(participantData.area || 'General').trim();
  const safeScore = Number(participantData.score) || 0;
  const safeStars = Number(participantData.stars) || (safeScore >= 800 ? 3 : safeScore >= 500 ? 2 : 1);
  const safeGlucose = Number(participantData.glucoseLevel) || 95;
  const safeTriviaCorrect = Number(participantData.triviaCorrect) || 0;
  const safeTriviaTotal = Number(participantData.triviaTotal) || 5;
  const safeTime = Number(participantData.timeSeconds) || 0;

  // 1. Immediately update local storage with pendingSync = true
  const localList = getLocalParticipants();
  const existingIdx = localList.findIndex(p => {
    const pCed = String(p.cedula || '').trim();
    const pNam = String(p.name || '').trim().toLowerCase();
    if (safeCedula && pCed && pCed === safeCedula) return true;
    return pNam === safeName.toLowerCase();
  });

  let savedRecord: StoredParticipant;

  if (existingIdx >= 0) {
    const prev = localList[existingIdx];
    savedRecord = {
      ...prev,
      name: safeName,
      cedula: safeCedula || prev.cedula,
      area: safeArea || prev.area,
      score: Math.max(prev.score || 0, safeScore),
      stars: Math.max(prev.stars || 1, safeStars),
      glucoseLevel: safeScore >= (prev.score || 0) ? safeGlucose : prev.glucoseLevel,
      triviaCorrect: Math.max(prev.triviaCorrect || 0, safeTriviaCorrect),
      triviaTotal: safeTriviaTotal,
      timeSeconds: safeTime > 0 ? safeTime : (prev.timeSeconds || 0),
      createdAt: new Date().toISOString(),
      _pendingSync: true,
    };
    localList[existingIdx] = savedRecord;
  } else {
    savedRecord = {
      id: 'p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: safeName,
      cedula: safeCedula,
      area: safeArea,
      score: safeScore,
      stars: safeStars,
      glucoseLevel: safeGlucose,
      triviaCorrect: safeTriviaCorrect,
      triviaTotal: safeTriviaTotal,
      timeSeconds: safeTime,
      createdAt: new Date().toISOString(),
      _pendingSync: true,
    };
    localList.push(savedRecord);
  }

  saveLocalParticipants(localList);

  // Broadcast to other tabs immediately
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('diabetes_14n_updates');
      channel.postMessage({ type: 'NEW_PARTICIPANT', record: savedRecord });
      channel.close();
    }
  } catch (e) {}

  // 2. Persist to server API
  try {
    const res = await fetch('/api/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: safeName,
        cedula: safeCedula,
        area: safeArea,
        score: savedRecord.score,
        stars: savedRecord.stars,
        glucoseLevel: savedRecord.glucoseLevel,
        triviaCorrect: savedRecord.triviaCorrect,
        triviaTotal: savedRecord.triviaTotal,
        timeSeconds: savedRecord.timeSeconds,
      }),
    });
    const data = await res.json();
    if (data.success && data.participant) {
      // Mark synced in localStorage
      const currentLocal = getLocalParticipants();
      const idx = currentLocal.findIndex(p => normalizeKey(p) === normalizeKey(savedRecord));
      if (idx >= 0) {
        currentLocal[idx] = { ...data.participant, _pendingSync: false };
        saveLocalParticipants(currentLocal);
      }
      return data.participant;
    }
  } catch (err) {
    console.warn('Backend sync temporary offline, safely saved in localStorage:', err);
  }

  return savedRecord;
}

// Fetch all participants with cache-busting timestamp & dual merging (Server + Local)
export async function loadAllParticipants(): Promise<{
  participants: ParticipantRecord[];
  totalPlayers: number;
  highestScore: number;
  averageScore: number;
  preventionAccuracyPct: number;
}> {
  const localList = getLocalParticipants();
  let serverList: ParticipantRecord[] = [];
  let serverReachable = false;

  const originsToFetch: string[] = [''];
  if (typeof window !== 'undefined' && window.location.origin.includes('ais-dev-')) {
    originsToFetch.push(window.location.origin.replace('ais-dev-', 'ais-pre-'));
  }

  const fetchResults = await Promise.allSettled(
    originsToFetch.map(async (base) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      try {
        const url = `${base}/api/participants?_t=${Date.now()}`;
        const res = await fetch(url, {
          cache: 'no-store',
          headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
          signal: controller.signal,
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data.success && Array.isArray(data.participants)) {
          return data.participants as ParticipantRecord[];
        }
        return null;
      } finally {
        clearTimeout(timer);
      }
    })
  );

  fetchResults.forEach((r) => {
    if (r.status === 'fulfilled' && Array.isArray(r.value)) {
      serverReachable = true;
      serverList = serverList.concat(r.value);
    }
  });

  const mergedMap = new Map<string, StoredParticipant>();

  if (serverReachable) {
    // Merge all server lists keeping the highest score per participant
    serverList.forEach(p => {
      const key = normalizeKey(p);
      const prev = mergedMap.get(key);
      if (!prev) {
        mergedMap.set(key, { ...p, _pendingSync: false });
      } else {
        const useIncoming = (p.score || 0) >= (prev.score || 0);
        mergedMap.set(key, {
          ...(useIncoming ? p : prev),
          score: Math.max(prev.score || 0, p.score || 0),
          stars: Math.max(prev.stars || 1, p.stars || 1),
          triviaCorrect: Math.max(prev.triviaCorrect || 0, p.triviaCorrect || 0),
          _pendingSync: false,
        });
      }
    });

    // Also include any pending local-only records (e.g. saved offline or server restarted)
    const unsynced: StoredParticipant[] = [];
    localList.forEach(p => {
      const key = normalizeKey(p);
      const onServer = mergedMap.get(key);
      if (!onServer && p._pendingSync) {
        mergedMap.set(key, p);
        unsynced.push(p);
      } else if (onServer && p._pendingSync && (p.score || 0) > (onServer.score || 0)) {
        const updated = { ...onServer, ...p, score: Math.max(onServer.score, p.score) };
        mergedMap.set(key, updated);
        unsynced.push(updated);
      }
    });

    if (unsynced.length > 0) {
      try {
        fetch('/api/participants/bulk-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participants: unsynced }),
        }).catch(() => {});
      } catch (e) {}
    }
  } else {
    localList.forEach(p => {
      mergedMap.set(normalizeKey(p), p);
    });
  }

  const merged = Array.from(mergedMap.values());

  // Sort descending by score, ascending by timeSeconds
  merged.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.timeSeconds - b.timeSeconds;
  });

  const ranked: StoredParticipant[] = merged.map((p, index) => ({
    ...p,
    rank: index + 1,
    isWinner: index < 3,
  }));

  saveLocalParticipants(ranked);

  const total = ranked.length;
  const highest = total > 0 ? Math.max(...ranked.map(p => p.score)) : 0;
  const avg = total > 0 ? Math.round(ranked.reduce((acc, p) => acc + p.score, 0) / total) : 0;
  const avgTrivia =
    total > 0
      ? Math.round(
          (ranked.reduce((acc, p) => acc + (p.triviaCorrect || 0) / (p.triviaTotal || 5), 0) /
            total) *
            100
        )
      : 0;

  return {
    participants: ranked,
    totalPlayers: total,
    highestScore: highest,
    averageScore: avg,
    preventionAccuracyPct: avgTrivia,
  };
}
