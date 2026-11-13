import React, { useState, useEffect } from 'react';
import { GameStage, PlayerInfo, GameResults } from '../types/game';
import { TitleScreen } from './TitleScreen';
import { ArcadeCanvas } from './ArcadeCanvas';
import { TriviaPhase } from './TriviaPhase';
import { TeachingAndCertificate } from './TeachingAndCertificate';
import { AdminDashboard } from './AdminDashboard';
import { soundFx } from '../utils/audio';
import { persistParticipant } from '../utils/participantStorage';

export const GameShell: React.FC = () => {
  const [stage, setStage] = useState<GameStage>('TITLE');
  const [isMuted, setIsMuted] = useState<boolean>(soundFx.getMuted());
  const [startTime, setStartTime] = useState<number>(0);

  // Player state
  const [player, setPlayer] = useState<PlayerInfo>({
    name: '',
    cedula: '',
    area: '',
  });

  // Intermediate game metrics
  const [arcadeScore, setArcadeScore] = useState<number>(0);
  const [finalGlucose, setFinalGlucose] = useState<number>(95);

  // Completed results
  const [gameResults, setGameResults] = useState<GameResults | null>(null);

  // Check URL query param or hash for admin entry (?admin=true or #admin)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const isAdminInQuery = searchParams.get('admin') === 'true' || searchParams.has('organizador');
      const isAdminInHash = window.location.hash === '#admin';
      if (isAdminInQuery || isAdminInHash) {
        setStage('ADMIN_PANEL');
      }
    }
  }, []);

  const handleToggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  // Start new game run
  const handleStartGame = (info: PlayerInfo) => {
    setPlayer(info);
    setArcadeScore(0);
    setFinalGlucose(95);
    setStartTime(Date.now());
    setStage('PLAYING_ARCADE');
  };

  // Finish arcade phase -> proceed to trivia
  const handleFinishArcade = (res: { arcadeScore: number; finalGlucose: number }) => {
    setArcadeScore(res.arcadeScore);
    setFinalGlucose(res.finalGlucose);
    setStage('PLAYING_TRIVIA');
  };

  // Finish trivia phase -> calculate total & grand teaching
  const handleFinishTrivia = (res: { triviaScore: number; triviaCorrect: number; triviaTotal: number }) => {
    const totalScore = arcadeScore + res.triviaScore;
    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    // Calculate stars: 3 stars for >= 800 pts, 2 stars for >= 500 pts, 1 star otherwise
    let stars = 1;
    if (totalScore >= 800) stars = 3;
    else if (totalScore >= 500) stars = 2;

    const finalResults: GameResults = {
      player,
      arcadeScore,
      triviaScore: res.triviaScore,
      totalScore,
      finalGlucose,
      triviaCorrect: res.triviaCorrect,
      triviaTotal: res.triviaTotal,
      stars,
      timeSeconds: timeTaken,
    };

    // Immediately persist so Admin Dashboard updates instantly in background
    persistParticipant({
      name: player.name,
      cedula: player.cedula,
      area: player.area,
      score: totalScore,
      stars,
      glucoseLevel: finalGlucose,
      triviaCorrect: res.triviaCorrect,
      triviaTotal: res.triviaTotal,
      timeSeconds: timeTaken,
    }).catch(err => {
      console.warn('Initial persistence note:', err);
    });

    setGameResults(finalResults);
    setStage('TEACHING_RESULTS');
  };

  const handlePlayAgain = () => {
    setStage('TITLE');
  };

  const handleOpenAdmin = () => {
    setStage('ADMIN_PANEL');
  };

  const handleBackFromAdmin = () => {
    if (gameResults) {
      setStage('TEACHING_RESULTS');
    } else {
      setStage('TITLE');
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 font-sans antialiased text-slate-100">
      {stage === 'TITLE' && (
        <TitleScreen
          onStartGame={handleStartGame}
          onOpenAdmin={handleOpenAdmin}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {stage === 'PLAYING_ARCADE' && (
        <ArcadeCanvas
          playerName={player.name}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onFinishArcade={handleFinishArcade}
        />
      )}

      {stage === 'PLAYING_TRIVIA' && (
        <TriviaPhase
          playerName={player.name}
          arcadeScore={arcadeScore}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onFinishTrivia={handleFinishTrivia}
        />
      )}

      {stage === 'TEACHING_RESULTS' && gameResults && (
        <TeachingAndCertificate
          results={gameResults}
          onOpenAdmin={handleOpenAdmin}
        />
      )}

      {stage === 'ADMIN_PANEL' && (
        <AdminDashboard
          onBack={handleBackFromAdmin}
          initialAdminAuth={false}
        />
      )}
    </div>
  );
};
