import React, { useState } from 'react';
import { QuizResponse } from '../types';
import { compressQuizData } from '../utils/compression';

interface QuizDisplayProps {
  data: QuizResponse;
  onDownloadPPT: () => void;
  onDownloadPDF: () => void;
  isGeneratingPDF: boolean;
  isPlayerMode: boolean;
}

type GameState = 'intro' | 'playing' | 'feedback' | 'result';

const QuizDisplay: React.FC<QuizDisplayProps> = ({ data, onDownloadPPT, onDownloadPDF, isGeneratingPDF, isPlayerMode }) => {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [showQR, setShowQR] = useState(false);

  // Helper colors and shapes for Kahoot style
  const optionStyles = [
    { bg: 'bg-red-500', hover: 'hover:bg-red-600', border: 'border-red-700', shape: '▲' },     // Red
    { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', border: 'border-blue-700', shape: '◆' },    // Blue
    { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', border: 'border-yellow-700', text: 'text-black', shape: '●' }, // Yellow
    { bg: 'bg-green-500', hover: 'hover:bg-green-600', border: 'border-green-700', shape: '■' },  // Green
  ];

  const currentQuestion = data.questions[currentQIndex];

  // Generate Player Link
  const getPlayerUrl = () => {
    const compressed = compressQuizData(data);
    const url = new URL(window.location.href);
    url.search = ''; // Clear existing params
    url.searchParams.set('data', compressed);
    return url.toString();
  };

  const handleStart = () => {
    setGameState('playing');
    setScore(0);
    setCurrentQIndex(0);
  };

  const handleAnswer = (optionIdx: number) => {
    setSelectedOptionIdx(optionIdx);
    const isCorrect = currentQuestion.options[optionIdx] === currentQuestion.answer;
    if (isCorrect) {
      setScore(prev => prev + 100); // 100 points per question
    }
    setGameState('feedback');
  };

  const handleNext = () => {
    if (currentQIndex + 1 < data.questions.length) {
      setCurrentQIndex(prev => prev + 1);
      setSelectedOptionIdx(null);
      setGameState('playing');
    } else {
      setGameState('result');
    }
  };

  // --- RENDER: INTRO SCREEN ---
  if (gameState === 'intro') {
    return (
      <div className="w-full max-w-4xl mx-auto bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border-4 border-slate-800 text-white text-center p-6 md:p-10 relative">
        <div className="mb-6 md:mb-8 animate-bounce">
          <span className="text-5xl md:text-6xl">🎮</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          {data.locationName}
        </h1>
        <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
          {data.description}
        </p>
        
        <div className="bg-slate-800 rounded-xl p-4 md:p-6 mb-8 inline-block">
          <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">測驗資訊</p>
          <div className="flex gap-8 justify-center">
            <div>
              <span className="block text-2xl md:text-3xl font-bold text-white">{data.questions.length}</span>
              <span className="text-sm text-slate-400">題目數</span>
            </div>
            <div>
              <span className="block text-2xl md:text-3xl font-bold text-white">100</span>
              <span className="text-sm text-slate-400">每題分數</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 items-center">
          <button 
            onClick={handleStart}
            className="w-full md:w-auto bg-purple-600 hover:bg-purple-500 text-white text-xl md:text-2xl font-bold py-4 px-12 rounded-full shadow-[0_4px_0_rgb(88,28,135)] active:shadow-none active:translate-y-1 transition-all"
          >
            {isPlayerMode ? "開始挑戰！" : "試玩測驗"}
          </button>
          
          {!isPlayerMode && (
            <button 
              onClick={() => setShowQR(true)}
              className="w-full md:w-auto bg-white text-slate-900 border-2 border-slate-200 hover:bg-slate-50 text-lg font-bold py-3 px-8 rounded-full transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
              讓挑戰者加入 (QR Code)
            </button>
          )}
        </div>

        {/* QR Code Modal (Only for Host) */}
        {showQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full text-slate-900 text-center relative animate-fade-in-up">
              <button 
                onClick={() => setShowQR(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-2"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              
              <h3 className="text-2xl font-bold mb-2">邀請挑戰者</h3>
              <p className="text-slate-500 mb-6 text-sm md:text-base">
                請挑戰者拿出手機掃描此 QR Code<br/>即可在自己的手機上進行獨立作答！
              </p>
              
              <div className="bg-white border-4 border-slate-100 rounded-xl p-2 inline-block mb-4 shadow-inner">
                 <img 
                   src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(getPlayerUrl())}`} 
                   alt="Player Join QR Code" 
                   className="w-48 h-48 md:w-64 md:h-64"
                 />
              </div>

              <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-lg text-left leading-relaxed">
                <strong>💡 說明：</strong><br/>
                此 QR Code 包含完整的題目資料，挑戰者無需連上相同 Wi-Fi 即可遊玩。最後請他們出示手機上的分數畫面讓您記錄。
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- RENDER: RESULTS SCREEN ---
  if (gameState === 'result') {
    const totalScore = data.questions.length * 100;
    const percentage = Math.round((score / totalScore) * 100);
    
    return (
      <div className="w-full max-w-4xl mx-auto bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border-4 border-slate-800 text-white text-center p-8 flex flex-col items-center">
        <h2 className="text-3xl font-bold mb-2">挑戰結束！</h2>
        
        <div className="relative my-8">
          <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-slate-800 flex items-center justify-center border-4 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.6)]">
            <div className="text-center">
              <div className="text-sm text-slate-400 uppercase font-bold tracking-widest">總分</div>
              <div className="text-6xl md:text-7xl font-black text-white">{score}</div>
              <div className="text-sm text-slate-500 mt-1">滿分 {totalScore}</div>
            </div>
          </div>
          {percentage >= 80 && (
            <div className="absolute -top-2 -right-2 bg-yellow-400 text-black font-bold px-4 py-2 rounded-full text-base animate-pulse shadow-lg">
              太強了！🏆
            </div>
          )}
        </div>

        {isPlayerMode ? (
          <div className="bg-slate-800 p-6 rounded-xl mb-8 border border-slate-700 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-2">請向主持人出示此畫面</h3>
            <p className="text-slate-400">等待紀錄完成後，您可以下載測驗卷回家複習。</p>
          </div>
        ) : (
          <p className="text-slate-300 mb-8 max-w-md">
            {percentage === 100 ? "完美！你是日本文化達人！" : "很棒的成績！繼續保持！"}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mb-8">
           {!isPlayerMode && (
             <button
              onClick={onDownloadPPT}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-6 rounded-xl font-bold transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              下載 PPT 教材
            </button>
           )}
          
          <button
            onClick={onDownloadPDF}
            disabled={isGeneratingPDF}
            className={`flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white py-3 px-6 rounded-xl font-bold transition-colors w-full ${isGeneratingPDF ? 'opacity-50 cursor-wait' : ''}`}
          >
            {isGeneratingPDF ? "製作中..." : (
               <>
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              下載 PDF 測驗卷
              </>
            )}
          </button>
        </div>
        
        <button 
          onClick={handleStart}
          className="text-slate-500 hover:text-white underline decoration-slate-600 underline-offset-4 transition-colors"
        >
          {isPlayerMode ? "重新挑戰" : "重新試玩"}
        </button>
      </div>
    );
  }

  // --- RENDER: QUESTION & FEEDBACK ---
  const isFeedback = gameState === 'feedback';
  const currentAnswer = currentQuestion.answer;
  const isCorrect = selectedOptionIdx !== null && currentQuestion.options[selectedOptionIdx] === currentAnswer;

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Top Bar: Progress & Score */}
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="bg-white/80 backdrop-blur rounded-full px-4 py-1 text-slate-800 font-bold shadow-sm text-sm md:text-base">
           Q{currentQIndex + 1} / {data.questions.length}
        </div>
        <div className="bg-slate-900 text-white rounded-full px-4 py-1 font-mono font-bold shadow-sm">
          {score} pts
        </div>
      </div>

      {/* Main Game Card */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-slate-200">
        
        {/* Question Area */}
        <div className="p-6 md:p-10 text-center bg-slate-50 border-b border-slate-200">
           {/* Level Badge */}
           <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${
                currentQuestion.level === '低年級' ? 'bg-green-100 text-green-700' :
                currentQuestion.level === '中高年級' ? 'bg-blue-100 text-blue-700' :
                'bg-red-100 text-red-700'
              }`}>
              {currentQuestion.level}
            </span>
          <h2 className="text-xl md:text-3xl font-black text-slate-800 leading-snug">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Game Area */}
        <div className="p-4 md:p-6 bg-slate-100">
          
          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {currentQuestion.options.map((opt, idx) => {
              // Logic to dim other options during feedback
              const style = optionStyles[idx];
              const isSelected = selectedOptionIdx === idx;
              const isThisAnswerCorrect = opt === currentAnswer;
              
              let cardClass = `
                relative min-h-[5rem] md:h-32 rounded-xl flex items-center p-3 md:p-4 cursor-pointer transition-all transform 
                shadow-[0_4px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-1 select-none
                ${style.bg} ${style.border}
              `;

              if (isFeedback) {
                cardClass += ' cursor-default ';
                if (isThisAnswerCorrect) {
                  cardClass += ' ring-4 ring-offset-2 ring-green-400 opacity-100 scale-[1.02] ';
                } else if (isSelected && !isThisAnswerCorrect) {
                  cardClass += ' opacity-50 grayscale '; 
                } else {
                  cardClass += ' opacity-30 ';
                }
              } else {
                cardClass += ` ${style.hover} text-white hover:scale-[1.01] `;
              }

              return (
                <div 
                  key={idx} 
                  onClick={() => !isFeedback && handleAnswer(idx)}
                  className={cardClass}
                >
                  <div className={`mr-3 md:absolute md:top-3 md:left-3 md:mr-0 w-8 h-8 rounded bg-black/20 flex items-center justify-center text-sm flex-shrink-0 ${style.text || 'text-white'}`}>
                    {style.shape}
                  </div>
                  <div className={`flex-1 md:w-full md:text-center font-bold text-lg md:text-xl shadow-black drop-shadow-md leading-tight ${style.text || 'text-white'}`}>
                    {opt}
                  </div>

                  {isFeedback && isThisAnswerCorrect && (
                    <div className="absolute top-2 right-2 bg-white text-green-600 rounded-full p-1 shadow-lg">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                   {isFeedback && isSelected && !isThisAnswerCorrect && (
                    <div className="absolute top-2 right-2 bg-white text-red-500 rounded-full p-1 shadow-lg">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Feedback & Next Button Area */}
          {isFeedback && (
            <div className="mt-6 animate-fade-in-up">
              <div className={`p-4 md:p-6 rounded-xl border-l-8 shadow-lg bg-white mb-6 ${isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                <div className="flex items-center gap-3 mb-2">
                   <div className={`text-xl md:text-2xl font-black uppercase ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {isCorrect ? "答對了！" : "答錯了..."}
                   </div>
                </div>
                <div className="text-slate-600 text-base md:text-lg leading-relaxed">
                  <span className="font-bold text-slate-800">解析：</span>{currentQuestion.explanation}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  className="w-full md:w-auto bg-slate-800 hover:bg-slate-700 text-white text-xl font-bold py-4 px-10 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  {currentQIndex + 1 === data.questions.length ? "查看結果" : "下一題 ➜"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default QuizDisplay;