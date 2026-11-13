import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// CORS configuration for cross-origin mobile/WhatsApp access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve public directory
app.use(express.static(path.resolve(__dirname, 'public')));

// Persistent storage setup
const DATA_DIR = path.resolve(__dirname, 'data');
const PARTICIPANTS_FILE = path.resolve(DATA_DIR, 'participants.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface ParticipantRecord {
  id: string;
  name: string;
  cedula: string;
  area: string;
  phone?: string;
  score: number;
  stars: number;
  glucoseLevel: number; // e.g. 95 mg/dL
  triviaCorrect: number;
  triviaTotal: number;
  timeSeconds: number;
  rank?: number;
  createdAt: string;
  isWinner?: boolean;
}

const DEFAULT_PARTICIPANTS: ParticipantRecord[] = [];

function readParticipants(): ParticipantRecord[] {
  try {
    if (!fs.existsSync(PARTICIPANTS_FILE)) {
      fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const data = fs.readFileSync(PARTICIPANTS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    // Filter out any leftover mock examples with ids 'p-1', 'p-2', 'p-3', 'p-4', 'p-5'
    return parsed.filter((p: ParticipantRecord) => !['p-1', 'p-2', 'p-3', 'p-4', 'p-5'].includes(p.id));
  } catch (err) {
    console.error('Error reading participants file:', err);
    return [];
  }
}

function writeParticipants(records: ParticipantRecord[]) {
  try {
    fs.writeFileSync(PARTICIPANTS_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing participants file:', err);
  }
}

// Compute ranks
function getRankedParticipants(): ParticipantRecord[] {
  const records = readParticipants();
  // Sort descending by score, ascending by timeSeconds
  records.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.timeSeconds - b.timeSeconds;
  });

  return records.map((record, index) => ({
    ...record,
    rank: index + 1,
    isWinner: index < 3 // Top 3 are winners
  }));
}

// API Routes
app.get('/api/participants', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  const ranked = getRankedParticipants();
  res.json({ success: true, count: ranked.length, participants: ranked });
});

app.get('/api/winners', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const ranked = getRankedParticipants();
  const winners = ranked.slice(0, 3);
  res.json({ success: true, winners });
});

app.get('/api/stats', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  const list = readParticipants();
  const total = list.length;
  const avgScore = total > 0 ? Math.round(list.reduce((acc, p) => acc + p.score, 0) / total) : 0;
  const topScore = total > 0 ? Math.max(...list.map(p => p.score)) : 0;
  const avgTrivia = total > 0 ? Math.round((list.reduce((acc, p) => acc + (p.triviaCorrect / p.triviaTotal), 0) / total) * 100) : 0;

  res.json({
    success: true,
    totalPlayers: total,
    averageScore: avgScore,
    highestScore: topScore,
    preventionAccuracyPct: avgTrivia
  });
});

app.post('/api/participants', (req, res) => {
  const { name, cedula, area, phone, score, stars, glucoseLevel, triviaCorrect, triviaTotal, timeSeconds } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ success: false, error: 'Nombre es requerido.' });
  }

  const cleanName = String(name).trim();
  const cleanCedula = cedula && String(cedula).trim() ? String(cedula).trim() : `CC-${Date.now().toString().slice(-6)}`;
  const existing = readParticipants();

  // Match by cédula or by exact name
  const existingIdx = existing.findIndex(p => {
    const pCed = String(p.cedula || '').trim();
    const pNam = String(p.name || '').trim().toLowerCase();
    if (cleanCedula && pCed && pCed === cleanCedula) return true;
    return pNam === cleanName.toLowerCase();
  });

  let recordToSave: ParticipantRecord;

  if (existingIdx >= 0) {
    // Update existing record, keeping the highest score
    const prev = existing[existingIdx];
    const incomingScore = Number(score) || 0;
    const isBetterOrEqual = incomingScore >= prev.score;
    recordToSave = {
      ...prev,
      name: cleanName,
      cedula: cleanCedula || prev.cedula,
      area: area ? String(area).trim() : prev.area,
      score: Math.max(prev.score, incomingScore),
      stars: Math.max(prev.stars, Number(stars) || 1),
      glucoseLevel: isBetterOrEqual ? (Number(glucoseLevel) || prev.glucoseLevel) : prev.glucoseLevel,
      triviaCorrect: Math.max(prev.triviaCorrect, Number(triviaCorrect) || 0),
      triviaTotal: Number(triviaTotal) || prev.triviaTotal || 5,
      timeSeconds: isBetterOrEqual && Number(timeSeconds) > 0 ? Number(timeSeconds) : (prev.timeSeconds || 0),
      createdAt: new Date().toISOString()
    };
    existing[existingIdx] = recordToSave;
  } else {
    recordToSave = {
      id: 'p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: cleanName,
      cedula: cleanCedula,
      area: area ? String(area).trim() : 'General',
      phone: phone ? String(phone).trim() : undefined,
      score: Number(score) || 0,
      stars: Number(stars) || 1,
      glucoseLevel: Number(glucoseLevel) || 100,
      triviaCorrect: Number(triviaCorrect) || 0,
      triviaTotal: Number(triviaTotal) || 5,
      timeSeconds: Number(timeSeconds) || 0,
      createdAt: new Date().toISOString()
    };
    existing.push(recordToSave);
  }

  writeParticipants(existing);

  const ranked = getRankedParticipants();
  const savedWithRank = ranked.find(p => p.id === recordToSave.id) || { ...recordToSave, rank: ranked.length };

  res.json({
    success: true,
    participant: savedWithRank,
    totalPlayers: ranked.length,
    isWinner: (savedWithRank.rank ?? 999) <= 3
  });
});

// Bulk sync endpoint for clients syncing offline or local participants
app.post('/api/participants/bulk-sync', (req, res) => {
  const { participants: incoming } = req.body;
  if (!Array.isArray(incoming)) {
    return res.status(400).json({ success: false, error: 'Expected participants array' });
  }

  const existing = readParticipants();
  const map = new Map<string, ParticipantRecord>();

  // Load existing into map
  existing.forEach(p => {
    const key = p.cedula ? p.cedula.trim() : p.id;
    map.set(key, p);
  });

  // Merge incoming
  incoming.forEach((p: ParticipantRecord) => {
    if (!p.name || !p.cedula) return;
    const key = p.cedula.trim();
    const prev = map.get(key);
    if (!prev) {
      map.set(key, {
        ...p,
        id: p.id || ('p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)),
        createdAt: p.createdAt || new Date().toISOString()
      });
    } else {
      map.set(key, {
        ...prev,
        name: p.name.trim() || prev.name,
        area: p.area?.trim() || prev.area,
        score: Math.max(prev.score, p.score || 0),
        stars: Math.max(prev.stars, p.stars || 1),
        glucoseLevel: p.glucoseLevel || prev.glucoseLevel,
        triviaCorrect: Math.max(prev.triviaCorrect || 0, p.triviaCorrect || 0)
      });
    }
  });

  const merged = Array.from(map.values());
  writeParticipants(merged);

  res.json({ success: true, count: merged.length });
});

// Admin verification (Accepts PIN "1411" for 14 de Noviembre or organizer email "kellycalderon0813@gmail.com")
app.post('/api/admin/auth', (req, res) => {
  const { code } = req.body;
  const validCodes = ['1411', 'diabetes14n', 'kellycalderon0813@gmail.com', 'admin14n'];
  if (validCodes.includes(String(code).trim().toLowerCase())) {
    res.json({ success: true, authorized: true });
  } else {
    res.status(401).json({ success: false, message: 'Código de organizador incorrecto.' });
  }
});

// Admin delete
app.delete('/api/participants/:id', (req, res) => {
  const { id } = req.params;
  const list = readParticipants();
  const filtered = list.filter(p => p.id !== id);
  writeParticipants(filtered);
  res.json({ success: true, count: filtered.length });
});

// Reset participants (clears all)
app.post('/api/participants/reset', (req, res) => {
  writeParticipants([]);
  res.json({ success: true, message: 'Todos los registros han sido borrados con éxito.' });
});

// CSV Export
app.get('/api/export-csv', (req, res) => {
  const ranked = getRankedParticipants();
  let csv = 'Posicion,Nombre,Cedula,Area,Puntaje,Estrellas,Glucosa_mgdL,Aciertos_Trivia,Tiempo_Segundos,Fecha,Estado\r\n';
  ranked.forEach(p => {
    const estado = p.isWinner ? 'GANADOR 🏆' : 'Participante';
    csv += `"${p.rank}","${p.name}","${p.cedula || ''}","${p.area || ''}","${p.score}","${p.stars}","${p.glucoseLevel}","${p.triviaCorrect}/${p.triviaTotal}","${p.timeSeconds}s","${p.createdAt}","${estado}"\r\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="participantes_dia_diabetes_14n.csv"');
  res.send(csv);
});

// Setup Vite or static serving
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
