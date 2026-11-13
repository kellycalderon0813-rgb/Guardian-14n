import React, { useEffect, useState, useMemo } from 'react';
import {
  Trophy,
  Download,
  Search,
  Trash2,
  ArrowLeft,
  Check,
  Award,
  Users,
  Activity,
  HelpCircle,
  ShieldCheck,
  Copy,
  Share2,
  Lock,
  AlertCircle,
  Printer,
  X,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { ParticipantRecord, StatsResponse } from '../types/game';
import { loadAllParticipants, saveLocalParticipants } from '../utils/participantStorage';

interface AdminDashboardProps {
  onBack: () => void;
  initialAdminAuth?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBack,
  initialAdminAuth = false,
}) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(initialAdminAuth);
  const [authPin, setAuthPin] = useState('');
  const [authError, setAuthError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [stats, setStats] = useState<StatsResponse>({
    totalPlayers: 0,
    averageScore: 0,
    highestScore: 0,
    preventionAccuracyPct: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'winners' | 'high_score'>('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedRawUrl, setCopiedRawUrl] = useState(false);
  const [copiedAdminUrl, setCopiedAdminUrl] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected participant for certificate view/download
  const [selectedCertParticipant, setSelectedCertParticipant] = useState<ParticipantRecord | null>(null);

  // Comprehensive participant loader (Server + LocalStorage merged)
  const fetchParticipants = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const result = await loadAllParticipants();
      setParticipants(result.participants);
      setStats({
        totalPlayers: result.totalPlayers,
        averageScore: result.averageScore,
        highestScore: result.highestScore,
        preventionAccuracyPct: result.preventionAccuracyPct,
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching participants:', err);
    } finally {
      if (showSpinner) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isAdminAuthenticated) return;

    fetchParticipants(true);

    // Auto-poll every 2.5 seconds to detect new participants in real time
    const interval = setInterval(() => {
      fetchParticipants(false);
    }, 2500);

    // Multi-tab BroadcastChannel + localStorage event listeners for instantaneous live updates
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('diabetes_14n_updates');
        channel.onmessage = () => {
          fetchParticipants(false);
        };
      }
    } catch (e) {}

    const handleStorageOrCustomUpdate = () => {
      fetchParticipants(false);
    };
    window.addEventListener('storage', handleStorageOrCustomUpdate);
    window.addEventListener('diabetes_14n_participants_updated', handleStorageOrCustomUpdate);

    return () => {
      clearInterval(interval);
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageOrCustomUpdate);
      window.removeEventListener('diabetes_14n_participants_updated', handleStorageOrCustomUpdate);
    };
  }, [isAdminAuthenticated]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authPin.trim()) {
      setAuthError('Por favor ingresa tu clave o PIN de administrador.');
      return;
    }
    setIsCheckingAuth(true);
    setAuthError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: authPin.trim() }),
      });
      const data = await res.json();
      if (data.success && data.authorized) {
        setIsAdminAuthenticated(true);
        setAuthError('');
      } else {
        setAuthError(data.message || 'Código incorrecto. Intenta nuevamente.');
      }
    } catch (err) {
      setAuthError('Error de red al verificar credenciales.');
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el registro de ${name}?`)) return;
    try {
      const updated = participants.filter(p => p.id !== id);
      setParticipants(updated);
      saveLocalParticipants(updated);

      const res = await fetch(`/api/participants/${id}`, { method: 'DELETE' });
      if (typeof window !== 'undefined' && window.location.origin.includes('ais-dev-')) {
        const preOrigin = window.location.origin.replace('ais-dev-', 'ais-pre-');
        fetch(`${preOrigin}/api/participants/${id}`, { method: 'DELETE' }).catch(() => {});
      }
      const data = await res.json();
      if (data.success) {
        setToastMessage(`Registro de ${name} eliminado.`);
        fetchParticipants(false);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      alert('Error al eliminar registro');
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('¿Deseas vaciar todos los registros para iniciar de cero?')) return;
    try {
      setParticipants([]);
      saveLocalParticipants([]);

      const res = await fetch('/api/participants/reset', { method: 'POST' });
      if (typeof window !== 'undefined' && window.location.origin.includes('ais-dev-')) {
        const preOrigin = window.location.origin.replace('ais-dev-', 'ais-pre-');
        fetch(`${preOrigin}/api/participants/reset`, { method: 'POST' }).catch(() => {});
      }
      const data = await res.json();
      if (data.success) {
        setToastMessage('Todos los registros han sido borrados con éxito.');
        fetchParticipants(false);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      alert('Error al vaciar registros');
    }
  };

  // Converts private Google Cloud Run URL (ais-dev-...) to public shared URL (ais-pre-...)
  const getPublicAppUrl = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    if (origin.includes('ais-dev-')) {
      return origin.replace('ais-dev-', 'ais-pre-');
    }
    return origin;
  };

  const defaultPublicBase = getPublicAppUrl();
  const [selectedUrlType, setSelectedUrlType] = useState<'shared' | 'direct' | 'custom'>('shared');
  const [customInputUrl, setCustomInputUrl] = useState<string>('');

  const effectivePlayerUrl = useMemo(() => {
    if (selectedUrlType === 'custom' && customInputUrl.trim()) {
      return customInputUrl.trim();
    }
    if (selectedUrlType === 'direct') {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      return `${origin}/?participante=true`;
    }
    return `${defaultPublicBase}/?participante=true`;
  }, [selectedUrlType, customInputUrl, defaultPublicBase]);

  const adminSecretUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/?admin=true`;

  const inviteMessage =
    `💙 *¡Campaña Día Mundial de la Diabetes (14 de Noviembre)!* 🩺\n\n` +
    `Te invitamos a participar en el desafío interactivo 'Guardián de la Glucosa'. Aprende jugando las pautas de prevención de la diabetes tipo 2, nutrición y actividad física.\n\n` +
    `📋 Al ingresar, regístrate con tu Nombre, Cédula y Área.\n` +
    `🏆 Al finalizar obtendrás tu Certificado Oficial de Prevención.\n\n` +
    `👉 Ingresa y participa aquí desde tu celular o computador:\n${effectivePlayerUrl}`;

  const handleCopyInvitation = () => {
    navigator.clipboard.writeText(inviteMessage);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyRawUrl = () => {
    navigator.clipboard.writeText(effectivePlayerUrl);
    setCopiedRawUrl(true);
    setTimeout(() => setCopiedRawUrl(false), 2500);
  };

  const handleCopyAdminUrl = () => {
    navigator.clipboard.writeText(adminSecretUrl);
    setCopiedAdminUrl(true);
    setTimeout(() => setCopiedAdminUrl(false), 2500);
  };

  const handleSendInviteWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(inviteMessage)}`, '_blank');
  };

  const handlePrintModalCertificate = () => {
    window.print();
  };

  // Filtered & Searched records
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.cedula && p.cedula.includes(searchQuery)) ||
        (p.area && p.area.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterMode === 'winners') return p.isWinner;
      if (filterMode === 'high_score') return p.score >= 800;
      return true;
    });
  }, [participants, searchQuery, filterMode]);

  const winners = useMemo(() => {
    return participants.slice(0, 3);
  }, [participants]);

  // LOGIN GATE SCREEN (Solid high-contrast, zero blur/opacity)
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-full bg-blue-950 border-2 border-blue-500 flex items-center justify-center">
              <Lock className="w-7 h-7 text-blue-400" />
            </div>
            <div className="text-sm font-bold text-blue-400 uppercase tracking-widest">
              Acceso Exclusivo de Administrador
            </div>
            <h1 className="font-display text-2xl font-extrabold text-white">
              Panel del Organizador
            </h1>
            <p className="text-sm text-slate-300 max-w-sm mx-auto">
              Ingresa tus credenciales para ver los resultados, participantes, descargar certificados y enviar enlaces.
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-950 border border-rose-500 text-rose-200 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Ingresa tu PIN o Clave de Administrador:
              </label>
              <input
                type="password"
                placeholder="Ingresa tu clave de acceso"
                value={authPin}
                onChange={(e) => setAuthPin(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-600 text-white text-base placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center tracking-widest font-mono"
              />
              <span className="text-sm text-slate-400 mt-2 block text-center">
                Acceso restringido y confidencial
              </span>
            </div>

            <button
              type="submit"
              disabled={isCheckingAuth}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>{isCheckingAuth ? 'Verificando...' : 'Acceder al Panel de Control'}</span>
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-sm font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la Pantalla de Inicio</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // AUTHENTICATED ADMIN DASHBOARD (100% Solid backgrounds, high contrast, >= 14px text, zero overlays/blur)
  return (
    <div className="min-h-screen w-full bg-slate-950 text-white py-6 px-4 sm:px-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 border border-emerald-400 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-semibold">
          {toastMessage}
        </div>
      )}

      {/* Header Bar */}
      <header className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition cursor-pointer"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-sm font-bold text-blue-400 uppercase tracking-wider flex flex-wrap items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Rol Administrador Activo</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-900 border border-emerald-500 text-emerald-200 text-sm font-mono normal-case">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                En vivo · {lastUpdated.toLocaleTimeString('es-ES')}
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Panel de Ganadores & Certificados 14N
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchParticipants(true)}
            disabled={isRefreshing}
            className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white border border-blue-500 text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer"
            title="Refrescar lista de participantes ahora"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </button>

          <a
            href="/api/export-csv"
            download="participantes_dia_diabetes.csv"
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500 text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Excel / CSV</span>
          </a>

          <button
            onClick={handleResetData}
            title="Borrar todos los registros"
            className="px-4 py-2.5 rounded-xl bg-rose-900 hover:bg-rose-800 text-white border border-rose-600 text-sm font-semibold transition cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Vaciar Registros</span>
          </button>

          <button
            onClick={() => setIsAdminAuthenticated(false)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 text-sm font-semibold transition cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="w-full max-w-6xl mx-auto space-y-8 py-6">
        {/* 1. WHATSAPP ENLACE GENERATOR */}
        <section className="p-6 rounded-2xl bg-slate-900 border-2 border-emerald-600 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                <span>Generador Oficial de Enlace para WhatsApp</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                Enlace para Participantes (Sin Acceso de Administrador Visible)
              </h2>
              <p className="text-sm sm:text-base text-slate-200">
                Al enviar este enlace, los participantes entrarán a jugar directamente y no verán ningún botón de administrador.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                onClick={handleCopyInvitation}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? '¡Mensaje Copiado!' : 'Copiar Texto y Enlace'}</span>
              </button>

              <button
                onClick={handleSendInviteWhatsApp}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Enviar por WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Message Preview Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-700 text-sm sm:text-base text-slate-100 font-mono whitespace-pre-wrap leading-relaxed select-all">
            {inviteMessage}
          </div>

          {/* URL Mode Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-700">
            <span className="text-sm sm:text-base text-slate-100 font-semibold">Tipo de Enlace:</span>
            <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-700 text-sm flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedUrlType('shared')}
                className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer font-semibold ${
                  selectedUrlType === 'shared'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-slate-200 hover:bg-slate-800'
                }`}
              >
                Público (ais-pre)
              </button>
              <button
                type="button"
                onClick={() => setSelectedUrlType('direct')}
                className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer font-semibold ${
                  selectedUrlType === 'direct'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-slate-200 hover:bg-slate-800'
                }`}
              >
                Directo (ais-dev)
              </button>
              <button
                type="button"
                onClick={() => setSelectedUrlType('custom')}
                className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer font-semibold ${
                  selectedUrlType === 'custom'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-slate-200 hover:bg-slate-800'
                }`}
              >
                Pegar Enlace
              </button>
            </div>
          </div>

          {selectedUrlType === 'custom' && (
            <div className="space-y-2">
              <label className="block text-sm text-slate-200 font-medium">
                Pega aquí el enlace que obtuviste del botón &apos;Share&apos; de Google AI Studio:
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={customInputUrl}
                onChange={(e) => setCustomInputUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-600 text-sm sm:text-base text-white placeholder-slate-400 font-mono"
              />
            </div>
          )}

          {/* Clickable Access Links Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                <span className="font-bold text-white text-sm sm:text-base shrink-0">Enlace actual:</span>
                <a
                  href={effectivePlayerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm sm:text-base font-mono text-emerald-300 underline hover:text-emerald-200 break-all"
                >
                  {effectivePlayerUrl}
                </a>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyRawUrl}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 text-sm font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedRawUrl ? '¡Copiado!' : 'Copiar solo link'}</span>
                </button>
                <a
                  href={effectivePlayerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir</span>
                </a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                <span className="font-bold text-amber-300 text-sm sm:text-base flex items-center gap-1.5 shrink-0">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Tu enlace de admin:</span>
                </span>
                <a
                  href={adminSecretUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm sm:text-base font-mono text-amber-300 underline hover:text-amber-200 break-all"
                >
                  {adminSecretUrl}
                </a>
              </div>
              <button
                type="button"
                onClick={handleCopyAdminUrl}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-600 text-sm font-semibold cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedAdminUrl ? '¡Copiado!' : 'Copiar ?admin=true'}</span>
              </button>
            </div>
          </div>

          {/* AI STUDIO SHARE ACTIVATION GUIDE */}
          <div className="p-4 rounded-xl bg-slate-800 border border-blue-500 text-sm text-slate-100 space-y-2">
            <div className="font-bold flex items-center gap-2 text-blue-300 text-base">
              <AlertCircle className="w-5 h-5 text-cyan-300 shrink-0" />
              <span>Cómo activar el enlace público en Google AI Studio (Para evitar Error 403 y 404):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-100 pl-1 leading-relaxed">
              <li>
                En la barra superior de <strong>Google AI Studio</strong> (arriba a la derecha), haz clic en el botón{' '}
                <strong>&quot;Share&quot;</strong> o <strong>&quot;Publish&quot;</strong>.
              </li>
              <li>
                En la ventana emergente, cambia la privacidad a{' '}
                <strong>&quot;Anyone with the link&quot; (Cualquier persona con el enlace)</strong>.
              </li>
              <li>
                Haz clic en <strong>&quot;Save&quot; / &quot;Done&quot;</strong>. ¡Listo! El enlace público quedará activado y nadie tendrá error 404 ni 403.
              </li>
            </ol>
          </div>
        </section>

        {/* 2. STATS OVERVIEW */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-700">
            <div className="flex items-center justify-between text-slate-200 text-sm font-semibold">
              <span>Participantes</span>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-display font-extrabold text-white mt-2 font-mono tabular-nums">
              {stats.totalPlayers}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-slate-700">
            <div className="flex items-center justify-between text-slate-200 text-sm font-semibold">
              <span>Puntaje Máximo</span>
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-display font-extrabold text-amber-300 mt-2 font-mono tabular-nums">
              {stats.highestScore} pts
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-slate-700">
            <div className="flex items-center justify-between text-slate-200 text-sm font-semibold">
              <span>Promedio General</span>
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-display font-extrabold text-white mt-2 font-mono tabular-nums">
              {stats.averageScore} pts
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-slate-700">
            <div className="flex items-center justify-between text-slate-200 text-sm font-semibold">
              <span>Acierto Preventivo</span>
              <HelpCircle className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-3xl font-display font-extrabold text-cyan-300 mt-2 font-mono tabular-nums">
              {stats.preventionAccuracyPct}%
            </div>
          </div>
        </section>

        {/* 3. PODIO OFICIAL DE GANADORES */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              <span>Podio Oficial de Ganadores</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Mejores puntajes obtenidos por los participantes en el reto preventivo.
            </p>
          </div>

          {winners.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-700 text-center space-y-2">
              <Trophy className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="text-base font-bold text-white">Aún no hay resultados</div>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Cuando las personas jueguen desde el enlace de WhatsApp, aquí verás automáticamente a los ganadores y podrás descargar sus certificados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {winners.map((p, idx) => {
                const medals = ['🥇 1er Lugar (Ganador)', '🥈 2do Lugar (Ganador)', '🥉 3er Lugar (Ganador)'];
                const borders = ['border-amber-400', 'border-slate-400', 'border-amber-600'];
                return (
                  <div
                    key={p.id}
                    className={`p-5 rounded-2xl bg-slate-900 border-2 ${borders[idx] || 'border-slate-700'} space-y-4`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold font-mono text-amber-300">
                        {medals[idx]}
                      </span>
                      <span className="text-sm text-slate-200 font-mono font-bold">
                        #{p.rank}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display text-lg font-bold text-white truncate">
                        {p.name}
                      </h3>
                      <div className="text-sm text-slate-200 flex items-center gap-2 mt-1 font-mono">
                        <span>C.C. {p.cedula}</span>
                        <span>·</span>
                        <span className="text-cyan-300 font-semibold">{p.area}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-700 text-sm">
                      <div>
                        <span className="text-sm text-slate-300 block">Puntaje</span>
                        <span className="font-display font-extrabold text-blue-300 font-mono text-lg">
                          {p.score} pts
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-slate-300 block">Glucosa Final</span>
                        <span className="font-mono text-emerald-300 font-bold text-base">
                          {p.glucoseLevel} mg/dL
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedCertParticipant(p)}
                      className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white border border-blue-500 text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Award className="w-4 h-4" />
                      <span>Descargar Certificado Oficial</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 4. COMPLETE PARTICIPANTS TABLE WITH CERTIFICATE DOWNLOAD */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                Lista de Participantes ({filteredParticipants.length})
              </h2>
              <p className="text-sm sm:text-base text-slate-300">
                Visualiza los resultados individuales y descarga el certificado de cada participante.
              </p>
            </div>

            {/* Filter buttons & Search */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, cédula o área..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 w-64"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-700 text-sm">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                    filterMode === 'all' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterMode('winners')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                    filterMode === 'winners' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Ganadores 🏆
                </button>
                <button
                  onClick={() => setFilterMode('high_score')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
                    filterMode === 'high_score' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  +800 pts
                </button>
              </div>
            </div>
          </div>

          {/* Solid High-Contrast Table */}
          <div className="w-full overflow-x-auto rounded-xl border border-slate-700 bg-slate-900">
            <table className="w-full text-left text-sm sm:text-base text-white border-collapse">
              <thead className="bg-slate-800 text-slate-100 uppercase text-sm font-bold border-b border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Posición</th>
                  <th className="py-3.5 px-4">Participante</th>
                  <th className="py-3.5 px-4">Cédula</th>
                  <th className="py-3.5 px-4">Área</th>
                  <th className="py-3.5 px-4 text-right">Puntaje</th>
                  <th className="py-3.5 px-4 text-center">Glucemia</th>
                  <th className="py-3.5 px-4 text-center">Trivia</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Certificado / Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 bg-slate-900">
                {filteredParticipants.length === 0 ? (
                  <tr className="bg-slate-900">
                    <td colSpan={10} className="py-10 text-center text-base text-slate-200 font-medium">
                      {participants.length === 0
                        ? 'Aún no hay resultados'
                        : 'No se encontraron resultados con los filtros actuales.'}
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p) => {
                    const isTopWinner = (p.rank ?? 99) <= 3;
                    return (
                      <tr key={p.id} className="bg-slate-900 even:bg-slate-800 hover:bg-slate-700 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                          {p.rank === 1 && '🥇 #1'}
                          {p.rank === 2 && '🥈 #2'}
                          {p.rank === 3 && '🥉 #3'}
                          {(p.rank ?? 99) > 3 && `#${p.rank}`}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{p.name}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-100">
                          {p.cedula}
                        </td>
                        <td className="py-3.5 px-4 text-cyan-300 font-medium">
                          {p.area}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-blue-300 whitespace-nowrap">
                          {p.score} pts
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono tabular-nums text-emerald-300 font-semibold whitespace-nowrap">
                          {p.glucoseLevel} mg/dL
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono tabular-nums text-white">
                          {p.triviaCorrect}/{p.triviaTotal}
                        </td>
                        <td className="py-3.5 px-4 text-sm text-slate-200 whitespace-nowrap">
                          {new Date(p.createdAt).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {isTopWinner ? (
                            <span className="text-amber-300 font-bold text-sm inline-flex items-center justify-center gap-1">
                              <Trophy className="w-4 h-4 text-amber-300" />
                              Ganador
                            </span>
                          ) : (
                            <span className="text-slate-200 text-sm">Participante</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedCertParticipant(p)}
                              title="Ver y Descargar Certificado"
                              className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Award className="w-4 h-4" />
                              <span>Certificado</span>
                            </button>

                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              title="Eliminar registro"
                              className="p-2 rounded-lg bg-rose-800 hover:bg-rose-700 text-white transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* 5. MODAL TO VIEW AND DOWNLOAD PARTICIPANT CERTIFICATE */}
      {selectedCertParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-400" />
                <h3 className="font-display text-xl font-bold text-white">
                  Certificado Oficial de {selectedCertParticipant.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCertParticipant(null)}
                className="text-slate-200 hover:text-white p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* The Certificate Frame */}
            <div className="relative w-full p-6 sm:p-10 rounded-2xl bg-slate-950 border-2 border-blue-500 space-y-6 text-center">
              {/* Emblem */}
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-14 h-14 rounded-full border-4 border-blue-500 bg-blue-950 flex items-center justify-center">
                  <Award className="w-7 h-7 text-blue-300" />
                </div>
                <div className="text-sm uppercase tracking-widest text-blue-300 font-bold">
                  Campaña Oficial de Salud · 14 de Noviembre
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
                  CERTIFICADO DE PREVENCIÓN Y SALUD
                </h2>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-300 italic">
                  Se certifica y reconoce oficialmente la participación destacada de:
                </p>
                <p className="font-display text-2xl sm:text-3xl font-black text-white py-1">
                  {selectedCertParticipant.name}
                </p>
                <div className="flex items-center justify-center gap-3 text-sm text-slate-200 font-mono">
                  <span>C.C. {selectedCertParticipant.cedula}</span>
                  <span>·</span>
                  <span>Área: {selectedCertParticipant.area}</span>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-200 max-w-lg mx-auto leading-relaxed">
                Por haber completado satisfactoriamente el <strong>Desafío Interactivo del Día Mundial de la Diabetes</strong>, adquiriendo y demostrando conocimientos esenciales para la prevención activa de la diabetes tipo 2.
              </p>

              {/* Stats Ribbon */}
              <div className="flex items-center justify-center gap-6 py-4 border-y border-slate-700 text-sm">
                <div>
                  <span className="text-sm text-slate-300 block uppercase">Puntaje</span>
                  <span className="font-mono font-bold text-lg text-blue-300">
                    {selectedCertParticipant.score} pts
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-700" />
                <div>
                  <span className="text-sm text-slate-300 block uppercase">Glucemia Media</span>
                  <span className="font-mono font-bold text-lg text-emerald-300">
                    {selectedCertParticipant.glucoseLevel} mg/dL
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-700" />
                <div>
                  <span className="text-sm text-slate-300 block uppercase">Nivel</span>
                  <span className="font-semibold text-base text-white">
                    Guardián {selectedCertParticipant.stars} ★
                  </span>
                </div>
              </div>

              {/* Signatures & Seal */}
              <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4 text-left text-sm text-slate-200">
                <div>
                  <div className="font-bold text-white">Comité de Seguridad y Salud en el Trabajo</div>
                  <div className="text-slate-300">Día Mundial de la Diabetes · 14 de Noviembre</div>
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-emerald-300 font-mono font-semibold">
                    CÓDIGO DE AUTENTICIDAD: 14N-{selectedCertParticipant.id.slice(-6).toUpperCase()}
                  </div>
                  <div className="text-slate-300">
                    {new Date(selectedCertParticipant.createdAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedCertParticipant(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 text-sm font-semibold transition cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handlePrintModalCertificate}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Descargar en PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
