import React, { useState } from 'react';
import { Play, Heart, Sparkles, User, CreditCard, Building2, Volume2, VolumeX, ArrowRight, Lock, ShieldCheck } from 'lucide-react';
import { PlayerInfo } from '../types/game';
import { soundFx } from '../utils/audio';
import { persistParticipant } from '../utils/participantStorage';
import diabetesHeroImg from '../assets/images/diabetes_day_hero.jpg';
import diabetesCommunityBg from '../assets/images/diabetes_community_bg.jpg';

interface TitleScreenProps {
  onStartGame: (player: PlayerInfo) => void;
  onOpenAdmin: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenAdmin,
  isMuted,
  onToggleMute,
}) => {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [name, setName] = useState('');
  const [cedula, setCedula] = useState('');
  const [area, setArea] = useState('');
  const [error, setError] = useState('');

  // Detect if user entered via the public participant WhatsApp link
  const isParticipantLink = typeof window !== 'undefined' && (
    window.location.search.includes('participante=true') || 
    window.location.search.includes('ref=wa')
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor escribe tu Nombre y Apellido completo.');
      return;
    }
    if (!cedula.trim()) {
      setError('Por favor ingresa tu número de Cédula o Documento.');
      return;
    }
    if (!area.trim()) {
      setError('Por favor indica tu Área o Dependencia.');
      return;
    }
    setError('');
    soundFx.playCatchGood();

    const cleanPlayer = {
      name: name.trim(),
      cedula: cedula.trim(),
      area: area.trim(),
    };

    // Save immediately so admin sees participant registered in live dashboard
    persistParticipant({
      name: cleanPlayer.name,
      cedula: cleanPlayer.cedula,
      area: cleanPlayer.area,
      score: 0,
      stars: 1,
      glucoseLevel: 95,
      triviaCorrect: 0,
      triviaTotal: 5,
      timeSeconds: 0,
    }).catch(err => {
      console.warn('Live registration notice:', err);
    });

    onStartGame(cleanPlayer);
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden">
      {/* Background Community Participation Photo - Soft & Evident without distracting text */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-45 scale-102 transition-transform duration-1000"
        style={{ backgroundImage: `url(${diabetesCommunityBg})` }}
        aria-hidden="true"
      />
      {/* Atmospheric dark gradient so background letters do NOT bleed into foreground text */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-slate-950/90 via-slate-950/80 to-slate-950/95 pointer-events-none" />

      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-blue-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-500/10 blur-[100px] pointer-events-none" />

      {/* Top Header / Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Blue Circle Icon of World Diabetes Day */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-full border-[3.5px] border-blue-500 bg-blue-950/60 shadow-lg shadow-blue-500/30">
            <span className="text-xs font-bold text-blue-400 select-none">14N</span>
          </div>
          <div>
            <span className="font-display font-bold text-base sm:text-lg tracking-tight text-white block leading-none">
              Día Mundial de la Diabetes
            </span>
            <span className="text-xs text-blue-300/90 font-medium tracking-wide">
              14 de Noviembre · Prevención y Salud
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-1.5 text-xs font-medium cursor-pointer backdrop-blur-sm"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span className="hidden sm:inline">{isMuted ? 'Silenciado' : 'Sonido'}</span>
          </button>

          {/* ADMIN BUTTON: Visible for you as Creator (hidden only if user opens via WhatsApp link ?participante=true) */}
          {!isParticipantLink && (
            <button
              onClick={onOpenAdmin}
              className="px-3.5 py-1.5 rounded-lg bg-blue-950/90 hover:bg-blue-900 text-blue-300 hover:text-white border border-blue-700/70 shadow-md shadow-blue-950/40 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer backdrop-blur-sm"
              title="Panel del Creador / Organizador"
            >
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>Acceso Administrador</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Title Lockup & Primary CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Clean Kicker */}
            <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-medium tracking-wide text-blue-400 uppercase">
              <span>Campaña Oficial de Salud</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>14 de Noviembre</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Desafío Preventivo</span>
            </div>

            {/* Bespoke Title */}
            <div className="space-y-2">
              <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
                Guardián de la <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-300">Glucosa</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-200 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                El <span className="text-blue-300 font-semibold">80% de la diabetes tipo 2 se puede prevenir</span> con hábitos diarios. Pon a prueba tus reflejos equilibrando el azúcar en sangre y aprende jugando.
              </p>
            </div>

            {/* Interactive Feature Highlights */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto lg:mx-0 py-2">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-left backdrop-blur-sm">
                <div className="text-lg">💧</div>
                <div className="text-xs font-bold text-white mt-1">Atrapa Hábitos</div>
                <div className="text-[11px] text-slate-400">Agua, fibra y deporte</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-left backdrop-blur-sm">
                <div className="text-lg">🩺</div>
                <div className="text-xs font-bold text-white mt-1">Mitos 14N</div>
                <div className="text-[11px] text-slate-400">Trivia preventiva</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-left backdrop-blur-sm">
                <div className="text-lg">📜</div>
                <div className="text-xs font-bold text-white mt-1">Certificado</div>
                <div className="text-[11px] text-slate-400">Oficial institucional</div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={() => setShowRegisterModal(true)}
                className="w-full sm:w-auto px-10 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-base shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
                <span>Iniciar Desafío Preventivo</span>
                <ArrowRight className="w-4 h-4 ml-1 opacity-80 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Controls hint */}
            <div className="text-xs text-slate-400 flex items-center justify-center lg:justify-start gap-4 pt-1">
              <span>💻 Computador: Teclas de flechas o A/D</span>
              <span aria-hidden="true">·</span>
              <span>📱 Celular: Desliza con el dedo</span>
            </div>
          </div>

          {/* Right Column: Hero Visual Asset Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md rounded-2xl overflow-hidden border-2 border-blue-500/40 shadow-2xl shadow-blue-500/25 bg-slate-900/90 group backdrop-blur-md">
              <img
                src={diabetesHeroImg}
                alt="Día Mundial de la Diabetes 14 de Noviembre - Prevención y Salud"
                className="w-full h-auto aspect-video object-cover transition-transform duration-500 group-hover:scale-102 block"
              />
              <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-900/95 to-slate-950 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
                    <Heart className="w-3.5 h-3.5 fill-blue-400 text-blue-400" />
                    Círculo Azul Oficial 14N
                  </span>
                  <span className="font-mono tabular-nums text-emerald-400">Meta: 70 - 130 mg/dL</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "El cuidado de la diabetes comienza con la prevención activa. Bebe agua, elige alimentos naturales y muévete 30 minutos al día."
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 border-t border-slate-900 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <div>
          Conmemoración 14 de Noviembre · Basado en las pautas de prevención de la Federación Internacional de Diabetes (FID) y OMS
        </div>

        {/* Footer Admin Link for Creator */}
        {!isParticipantLink && (
          <div>
            <button
              onClick={onOpenAdmin}
              className="text-slate-500 hover:text-blue-400 transition cursor-pointer flex items-center gap-1 mx-auto sm:mx-0 text-[11px]"
            >
              <Lock className="w-3 h-3 text-slate-500" />
              <span>Panel Administrador</span>
            </button>
          </div>
        )}
      </footer>

      {/* FLOATING ADMIN BUTTON FOR CREATOR (Bottom-right corner) */}
      {!isParticipantLink && (
        <button
          onClick={onOpenAdmin}
          className="fixed bottom-4 right-4 z-40 px-3 py-2 rounded-xl bg-slate-900/95 hover:bg-blue-900/80 text-blue-300 hover:text-white border border-blue-500/50 shadow-2xl transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer backdrop-blur-md hover:scale-105"
          title="Panel de Administrador (Creador)"
        >
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Acceso Admin</span>
        </button>
      )}

      {/* Player Registration Modal (Nombre, Cédula, Área) */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                  Registro de Participante
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
                  Ingresa tus Datos
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tu nombre y datos se incluirán en tu Certificado Oficial de Prevención 14N.
                </p>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  Nombre Completo:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Laura Sofía Martínez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  Cédula / Documento de Identidad:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 1085244123"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  Área / Dependencia:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Recursos Humanos, Operaciones, Ventas, Calidad..."
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  ¡Entrar al Reto!
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
