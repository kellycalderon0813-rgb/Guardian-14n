import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Award, Sparkles, Heart, Activity, CheckCircle, Printer } from 'lucide-react';
import { GameResults } from '../types/game';
import { PREVENTION_PILLARS } from '../data/preventionContent';
import { soundFx } from '../utils/audio';
import { persistParticipant } from '../utils/participantStorage';
import diabetesCommunityBg from '../assets/images/diabetes_community_bg.jpg';

interface TeachingAndCertificateProps {
  results: GameResults;
  onOpenAdmin: () => void;
}

export const TeachingAndCertificate: React.FC<TeachingAndCertificateProps> = ({
  results,
}) => {
  const certificateRef = useRef<HTMLDivElement | null>(null);

  // Trigger celebration on mount & persist data to dual storage (server + localStorage)
  useEffect(() => {
    soundFx.playFanfare();

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#38bdf8', '#f59e0b', '#ffffff'],
      });
    } catch (e) {
      console.log('Confetti non-critical fallback', e);
    }

    // Persist participant data reliably so admin sees it immediately and it never gets lost
    persistParticipant({
      name: results.player.name,
      cedula: results.player.cedula,
      area: results.player.area,
      score: results.totalScore,
      stars: results.stars,
      glucoseLevel: results.finalGlucose,
      triviaCorrect: results.triviaCorrect,
      triviaTotal: results.triviaTotal,
      timeSeconds: results.timeSeconds,
    }).catch(err => {
      console.error('Participant persistence error:', err);
    });
  }, [results]);

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 flex flex-col items-center overflow-x-hidden">
      {/* Background Community Participation Photo - Vivid & Evident */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-35 pointer-events-none scale-102"
        style={{ backgroundImage: `url(${diabetesCommunityBg})` }}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-slate-950/90 via-slate-950/80 to-slate-950/95 pointer-events-none" />
      
      {/* Top Breadcrumb & Status (NO admin button visible to players) */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between pb-6 border-b border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full border-2 border-blue-500 bg-blue-950 flex items-center justify-center font-bold text-blue-400 text-[10px]">
            14N
          </div>
          <span className="text-white font-semibold">Desafío Culminado</span>
          <span aria-hidden="true">·</span>
          <span>Participación Registrada</span>
        </div>
        <div className="text-slate-300 text-xs font-mono">
          Área: <span className="text-white font-semibold">{results.player.area}</span>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-4xl space-y-10 py-6">
        
        {/* Hero Score & Praise Lockup */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>¡Misión Cumplida, {results.player.name}!</span>
          </div>
          
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Puntaje Final: <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-300 font-mono tabular-nums">{results.totalScore}</span> pts
          </h1>

          <div className="flex items-center justify-center gap-2 text-2xl">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={i < results.stars ? 'text-amber-400' : 'text-slate-700'}>
                ★
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-slate-300 font-medium">
            <span className="flex items-center gap-1">
              <Activity className="w-4 h-4 text-emerald-400" />
              Glucosa Final: <strong className="font-mono text-white">{results.finalGlucose} mg/dL</strong>
            </span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-blue-400" />
              Aciertos Trivia: <strong className="font-mono text-white">{results.triviaCorrect}/{results.triviaTotal}</strong>
            </span>
          </div>
        </div>

        {/* THE GOLDEN TEACHING SECTION ("La Gran Enseñanza") */}
        <section className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-blue-500/30 space-y-6">
          <div className="space-y-2 text-center max-w-2xl mx-auto">
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Enseñanza Central del 14 de Noviembre
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
              "El Cuidado de la Diabetes está en tus Manos"
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed pt-1">
              La evidencia médica es contundente: <strong className="text-blue-300">8 de cada 10 casos de diabetes tipo 2 se pueden prevenir</strong> o retrasar con hábitos diarios sostenibles. No se trata de dietas restrictivas, sino de decisiones conscientes en hidratación, comida real y movimiento continuo.
            </p>
          </div>

          {/* 5 Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {PREVENTION_PILLARS.map((pillar, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 hover:border-blue-500/40 transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{pillar.icon}</span>
                  <h4 className="font-bold text-sm text-white">{pillar.title}</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            ))}

            {/* Special Highlight Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950 to-slate-900 border border-blue-500/40 space-y-2">
              <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                <Heart className="w-4 h-4 text-blue-400" />
                <span>¿Por qué el 14 de Noviembre?</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Celebramos el natalicio de Frederick Banting, quien descubrió la insulina en 1921. Hoy honramos ese logro protegiendo nuestra salud con prevención activa.
              </p>
            </div>
          </div>
        </section>

        {/* OFFICIAL DIGITAL CERTIFICATE */}
        <section className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              Tu Certificado Oficial de Prevención
            </span>
            <button
              onClick={handlePrintCertificate}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs font-medium cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Guardar en PDF</span>
            </button>
          </div>

          {/* The Certificate Frame */}
          <div
            ref={certificateRef}
            className="relative w-full p-6 sm:p-10 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-blue-500/50 shadow-2xl space-y-6 text-center overflow-hidden"
          >
            {/* Elegant corner accents */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-blue-400" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-blue-400" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-blue-400" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-blue-400" />

            {/* Emblem Header */}
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-14 h-14 rounded-full border-4 border-blue-500 bg-blue-950/60 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Heart className="w-7 h-7 text-blue-400 fill-blue-500/40" />
              </div>
              <div className="text-xs uppercase tracking-widest text-blue-400 font-bold">
                Campaña Oficial de Concientización 14N
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
                CERTIFICADO DE PREVENCIÓN Y SALUD
              </h2>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-400 italic">Se otorga el presente reconocimiento oficial a:</p>
              <p className="font-display text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-white to-cyan-300 py-1">
                {results.player.name}
              </p>
              <div className="flex items-center justify-center gap-3 text-xs text-slate-300 font-mono">
                <span>C.C. {results.player.cedula}</span>
                <span>·</span>
                <span>Área: {results.player.area}</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              Por haber completado con éxito el <strong>Desafío de Hábitos y Glucosa Equilibrada</strong> en el marco del <em>Día Mundial de la Diabetes</em>, demostrando conocimiento y compromiso activo para prevenir la diabetes tipo 2.
            </p>

            {/* Certificate Stats Ribbon */}
            <div className="flex items-center justify-center gap-6 py-3 border-y border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Puntaje</span>
                <span className="font-mono font-bold text-base text-blue-400">{results.totalScore} pts</span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Glucemia Media</span>
                <span className="font-mono font-bold text-base text-emerald-400">{results.finalGlucose} mg/dL</span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Rango</span>
                <span className="font-semibold text-white">Guardián Nivel {results.stars} ★</span>
              </div>
            </div>

            {/* Signatures & Seal */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4 text-left text-xs text-slate-400">
              <div>
                <div className="font-bold text-white text-xs">Comité de Seguridad y Salud en el Trabajo</div>
                <div className="text-[11px] text-slate-400">Día Mundial de la Diabetes · 14 de Noviembre</div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-emerald-400 font-mono text-[11px] font-semibold">REGISTRO VERIFICADO 14N</div>
                <div className="text-[11px] text-slate-400">{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Action Button: Descargar / Imprimir Certificado */}
        <div className="flex items-center justify-center pt-4">
          <button
            onClick={handlePrintCertificate}
            className="w-full sm:w-auto px-10 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Descargar / Imprimir Certificado Oficial</span>
          </button>
        </div>

      </div>
    </div>
  );
};
