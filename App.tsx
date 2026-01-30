import React, { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import QuizDisplay from './components/QuizDisplay';
import { generateQuiz, fileToBase64 } from './services/geminiService';
import { generatePPT } from './services/pptService';
import { generatePDF } from './services/pdfService';
import { QuizResponse } from './types';
import { decompressQuizData } from './utils/compression';

const App: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [quizData, setQuizData] = useState<QuizResponse | null>(null);
  const [currentImageBase64, setCurrentImageBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlayerMode, setIsPlayerMode] = useState(false);

  // Check URL for shared quiz data on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('data');
    if (sharedData) {
      const decompressed = decompressQuizData(sharedData);
      if (decompressed) {
        setQuizData(decompressed);
        setIsPlayerMode(true);
      } else {
        setError("無效的測驗連結或資料已損毀。");
      }
    }
  }, []);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setQuizData(null);
    setCurrentImageBase64(null);

    try {
      // 1. Convert image for preview and API
      const base64 = await fileToBase64(file);
      setCurrentImageBase64(base64);

      // 2. Call Gemini
      const result = await generateQuiz(base64);
      setQuizData(result);

    } catch (err) {
      console.error(err);
      setError("發生錯誤：無法生成題目。請確認您的 API Key 是否正確，或是照片是否清晰。");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPPT = () => {
    if (quizData && currentImageBase64) {
      generatePPT(quizData, currentImageBase64);
    }
  };

  const handleDownloadPDF = async () => {
    if (quizData && currentImageBase64) {
      try {
        setIsGeneratingPDF(true);
        await generatePDF(quizData, currentImageBase64);
      } catch (e) {
        console.error("PDF Generation failed", e);
        setError("PDF 製作失敗，請稍後再試。");
      } finally {
        setIsGeneratingPDF(false);
      }
    }
  };

  // Player Mode View (Simplified)
  if (isPlayerMode && quizData) {
    return (
      <div className="min-h-screen bg-slate-100 py-6 px-4">
        <QuizDisplay 
          data={quizData} 
          onDownloadPPT={() => {}} // Players don't need download
          onDownloadPDF={() => {}} 
          isGeneratingPDF={false}
          isPlayerMode={true}
        />
        <div className="text-center mt-8 text-slate-400 text-xs">
            <a href="/" className="underline">建立我自己的測驗</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <header className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
          🇯🇵 日本文化教材生成器
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          上傳一張日本風景或物品照片，AI 老師將自動為您生成適合國小各年級的測驗題目，並製作成 PPT 或 PDF 教材。
        </p>
      </header>

      <main>
        {/* Upload Section */}
        <section className="mb-12">
          <FileUpload 
            onFileSelect={handleFileSelect} 
            isProcessing={isProcessing} 
          />
          
          {/* Error Message */}
          {error && (
            <div className="max-w-xl mx-auto mt-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Loading State */}
          {isProcessing && (
            <div className="max-w-xl mx-auto mt-8 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <h3 className="text-xl font-bold text-slate-800">正在分析照片...</h3>
              <p className="text-slate-500 mt-2">Gemini 老師正在查閱百科全書並設計題目中，請稍候。</p>
            </div>
          )}
        </section>

        {/* Results Section */}
        {quizData && currentImageBase64 && !isProcessing && (
          <section className="animate-fade-in-up">
            <QuizDisplay 
              data={quizData} 
              onDownloadPPT={handleDownloadPPT}
              onDownloadPDF={handleDownloadPDF}
              isGeneratingPDF={isGeneratingPDF}
              isPlayerMode={false}
            />
          </section>
        )}
      </main>

      <footer className="max-w-4xl mx-auto text-center mt-20 text-slate-400 text-sm">
        <p>Powered by Google Gemini API & Tailwind CSS</p>
      </footer>
    </div>
  );
};

export default App;