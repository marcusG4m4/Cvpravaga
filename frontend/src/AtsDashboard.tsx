import React, { useState } from 'react';
import ResumeEditor from './ResumeEditor';
import axios from 'axios';

interface AtsDashboardProps {
  score: number;
  missingKeywords: string[];
  commonKeywords: string[];
  jobDescription: string;
  resumeText?: string;
  isDarkMode: boolean;
}

export default function AtsDashboard({ score, missingKeywords, commonKeywords, jobDescription, resumeText, isDarkMode }: AtsDashboardProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  
  const isDark = isDarkMode;

  // Lógica para definir o status com base na nota
  let statusText = "REPROVADO";
  let statusColorClass = "bg-red-100 text-red-600";
  let textColorClass = "text-red-600";
  let riskText = "⚠ Risco de Rejeição: ALTO";
  let descriptionText = "O currículo não atende à maioria dos requisitos da vaga. É altamente recomendável revisar e adicionar as palavras-chave ausentes.";

  if (score >= 80) {
    statusText = "APROVADO";
    statusColorClass = "bg-green-100 text-green-600";
    textColorClass = "text-green-600";
    riskText = "✅ Excelentes Chances";
    descriptionText = "Seu currículo está muito bem alinhado com a vaga! Você possui a maioria das palavras-chave procuradas pelo ATS.";
  } else if (score >= 50) {
    statusText = "ATENÇÃO";
    statusColorClass = "bg-yellow-100 text-yellow-700";
    textColorClass = "text-yellow-600";
    riskText = "⚠ Pode precisar de ajustes";
    descriptionText = "Seu currículo tem boa aderência, mas faltam algumas palavras-chave importantes que podem aumentar suas chances.";
  }

  const handleGenerateCoverLetter = async () => {
    setIsGeneratingLetter(true);
    setCoverLetter(null);
    try {
      const response = await axios.post('http://localhost:8000/generate-cover-letter', {
        resume_text: resumeText,
        job_description: jobDescription
      });
      setCoverLetter(response.data.cover_letter);
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || "Erro ao gerar carta de apresentação.";
      alert(errorMsg);
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  return (
    <div className={`p-10 rounded-[3rem] mt-12 transition-all ${isDark ? 'bg-slate-900/40 border border-slate-800' : 'bg-slate-100 border border-slate-200'}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* RESULTADO */}
        <div className={`col-span-1 md:col-span-2 rounded-[2.5rem] shadow-2xl p-10 transition-all ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-100'}`}>
          <div className="flex justify-between items-center">
            <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>Resultado da Análise</h2>
            <span className={`${statusColorClass} px-5 py-2 rounded-full text-xs font-black tracking-widest uppercase`}>
              {statusText}
            </span>
          </div>

          <div className="flex gap-16 mt-12 items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500">Match Score</p>
              <div className="flex items-baseline gap-1">
                <h1 className={`text-7xl font-black ${textColorClass}`}>{score}</h1>
                <span className="text-slate-400 font-bold text-xl">/100</span>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500">Status ATS</p>
              <p className={`font-black text-xl ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {score >= 50 ? (score >= 80 ? "Alta Aderência" : "Aderência Moderada") : "Baixa Aderência"}
              </p>
              <p className={`text-sm mt-2 font-bold ${textColorClass}`}>
                {riskText}
              </p>
            </div>
          </div>

          <p className={`text-lg mt-12 leading-relaxed font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {descriptionText}
          </p>
        </div>

        {/* MÉTRICAS */}
        <div className={`rounded-[2.5rem] shadow-2xl p-10 transition-all ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-100'}`}>
          <h3 className={`font-black text-lg mb-8 ${isDark ? 'text-white' : 'text-slate-800'}`}>Métricas</h3>

          {[
            ["Match de Palavras", `${score}%`],
            ["Keywords Faltantes", missingKeywords.length.toString()],
            ["Keywords Encontradas", commonKeywords.length.toString()],
          ].map(([label, value]) => (
            <div key={label} className={`flex justify-between mb-6 border-b pb-4 last:border-0 ${isDark ? 'border-slate-700' : 'border-slate-50'}`}>
              <span className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
              <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* KEYWORDS */}
        <div className={`col-span-1 md:col-span-3 rounded-[2.5rem] shadow-2xl p-10 transition-all ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-100'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="font-black text-red-500 text-sm uppercase tracking-widest mb-6">Palavras-chave Ausentes</h3>
              <div className="flex flex-wrap gap-3">
                {missingKeywords.map(tag => (
                  <span key={tag} className={`px-4 py-2 rounded-xl text-xs font-bold border ${isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 bg-red-100 text-red-600'}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-black text-green-500 text-sm uppercase tracking-widest mb-6">Palavras-chave Encontradas</h3>
              <div className="flex flex-wrap gap-3">
                {commonKeywords.map(tag => (
                  <span key={tag} className={`px-4 py-2 rounded-xl text-xs font-bold border ${isDark ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-green-50 bg-green-100 text-green-600'}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className={`col-span-1 md:col-span-3 rounded-[3rem] p-12 text-center shadow-2xl transition-all ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700' : 'bg-gradient-to-br from-blue-600 to-indigo-700'}`}>
          <h2 className={`text-3xl font-black mb-4 ${isDark ? 'text-white' : 'text-white'}`}>Pronto para destravar sua carreira?</h2>
          <p className={`text-lg mb-10 font-medium ${isDark ? 'text-slate-400' : 'text-blue-100'}`}>Utilize nossa IA para reescrever seu currículo ou criar uma carta de apresentação sob medida.</p>

          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <button 
              onClick={() => setIsEditorOpen(true)}
              className={`px-10 py-6 rounded-[2rem] text-lg font-black shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 ${isDark ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-white text-blue-700 hover:bg-blue-50'}`}
            >
              🚀 Otimizar Currículo
            </button>

            <button 
              onClick={handleGenerateCoverLetter}
              disabled={isGeneratingLetter}
              className={`px-10 py-6 rounded-[2rem] text-lg font-black shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100 ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600 border border-slate-600' : 'bg-indigo-800 text-white hover:bg-indigo-900 border border-indigo-500'}`}
            >
              {isGeneratingLetter ? (
                 <span className="flex items-center gap-2">
                   <span className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></span>
                   Gerando...
                 </span>
              ) : '✉️ Gerar Carta de Apresentação'}
            </button>
          </div>
        </div>

        {/* MODAL CARTA DE APRESENTAÇÃO */}
        {coverLetter && (
          <div className="col-span-1 md:col-span-3 mt-4 animate-[fadeIn_0.5s_ease-out]">
            <div className={`p-10 rounded-[2.5rem] shadow-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>Sua Carta de Apresentação</h3>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(coverLetter);
                    alert("Copiado para a área de transferência!");
                  }}
                  className="text-sm font-bold bg-blue-100 text-blue-600 px-4 py-2 rounded-xl hover:bg-blue-200 transition-colors"
                >
                  Copiar Texto
                </button>
              </div>
              <div className={`p-8 rounded-2xl whitespace-pre-wrap leading-relaxed font-medium ${isDark ? 'bg-slate-900/50 text-slate-300' : 'bg-slate-50 text-slate-700'}`}>
                {coverLetter}
              </div>
            </div>
          </div>
        )}

      </div>

      {isEditorOpen && (
        <ResumeEditor 
          initialData={{ missingKeywords, commonKeywords, jobDescription, resumeText, initialScore: score }} 
          onClose={() => setIsEditorOpen(false)} 
        />
      )}
    </div>
  );
}
