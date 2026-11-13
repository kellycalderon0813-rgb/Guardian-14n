import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, ArrowRight, Lightbulb, Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import { TRIVIA_QUESTIONS, TriviaQuestion } from '../data/preventionContent';
import { soundFx } from '../utils/audio';

interface TriviaPhaseProps {
  playerName: string;
  arcadeScore: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onFinishTrivia: (results: { triviaScore: number; triviaCorrect: number; triviaTotal: number }) => void;
}

export const TriviaPhase: React.FC<TriviaPhaseProps> = ({
  playerName,
  arcadeScore,
  isMuted,
  onToggleMute,
  onFinishTrivia,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [triviaPoints, setTriviaPoints] = useState(0);

  const currentQ: TriviaQuestion = TRIVIA_QUESTIONS[currentIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;

    setSelectedOptionIndex(index);
    setIsAnswered(true);

    const isCorrect = currentQ.options[index].isCorrect;
    if (isCorrect) {
      soundFx.playCorrect();
      setCorrectAnswersCount(prev => prev + 1);
      setTriviaPoints(prev => prev + 150);
    } else {
      soundFx.playIncorrect();
    }
  };

  const handleNext = () => {
    if (currentIndex < TRIVIA_QUESTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOptionIndex(null);
      setIsAnswered(false);
    } else {
      // Completed all questions
      const finalTriviaPoints = triviaPoints;
      const finalCorrect = correctAnswersCount;
      onFinishTrivia({
        triviaScore: finalTriviaPoints,
        triviaCorrect: finalCorrect,
        triviaTotal: TRIVIA_QUESTIONS.length,
      });
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 overflow-x-hidden">
      
      {/* Top Bar */}
      <header className="w-full max-w-3xl mx-auto flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-blue-500 bg-blue-950 flex items-center justify-center font-bold text-blue-400 text-xs">
            14N
          </div>
          <div>
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Fase 2: Mitos y Prevención
            </div>
            <div className="text-sm font-bold text-white truncate max-w-[160px] sm:max-w-xs">
              {playerName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase block">Puntaje Total</span>
            <span className="font-mono tabular-nums text-base font-extrabold text-blue-400">
              {arcadeScore + triviaPoints} pts
            </span>
          </div>

          <button
            onClick={onToggleMute}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Main Question Card Container */}
      <main className="w-full max-w-2xl mx-auto my-auto py-6 space-y-6">
        
        {/* Progress & Category indicator */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-blue-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Categoría: {currentQ.category}
          </span>
          <span className="font-mono tabular-nums">
            Pregunta {currentIndex + 1} de {TRIVIA_QUESTIONS.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / TRIVIA_QUESTIONS.length) * 100}%` }}
          />
        </div>

        {/* Question Title */}
        <div className="space-y-2">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white leading-snug">
            {currentQ.question}
          </h2>
          <p className="text-xs text-slate-400">
            {currentQ.context}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3 pt-2">
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedOptionIndex === idx;
            let btnStyle = 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-slate-200';

            if (isAnswered) {
              if (option.isCorrect) {
                btnStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-200 font-semibold';
              } else if (isSelected && !option.isCorrect) {
                btnStyle = 'bg-rose-950/70 border-rose-500 text-rose-200';
              } else {
                btnStyle = 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-60';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center justify-between gap-3 text-sm cursor-pointer ${btnStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="leading-relaxed">{option.text}</span>
                </div>

                {isAnswered && option.isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                {isAnswered && isSelected && !option.isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback explanation box after answering */}
        {isAnswered && (
          <div className="p-4 rounded-xl bg-blue-950/50 border border-blue-500/30 text-xs text-slate-200 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-bold text-blue-300">
              <Lightbulb className="w-4 h-4 text-amber-300" />
              <span>¿Por qué es clave para tu salud?</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              {currentQ.explanation}
            </p>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>{currentIndex < TRIVIA_QUESTIONS.length - 1 ? 'Siguiente Pregunta' : 'Ver Resultados & Certificado'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer hint */}
      <footer className="w-full max-w-2xl mx-auto text-center text-xs text-slate-500 pt-4 border-t border-slate-900">
        Cada acierto otorga +150 puntos hacia tu rango de Guardián 14N.
      </footer>
    </div>
  );
};
