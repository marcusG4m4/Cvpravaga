import React, { useState } from 'react';
import ResumeEditor from './ResumeEditor';

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

        {/* CTA */}
        <div className="col-span-1 md:col-span-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-12 text-center shadow-2xl shadow-blue-600/30">
          <h2 className="text-3xl font-black text-white mb-4">Pronto para destravar sua carreira?</h2>
          <p className="text-blue-100 text-lg mb-10 font-medium">Deixe nossa IA reescrever seu currículo agora mesmo com foco total nesta vaga.</p>

          <button 
            onClick={() => setIsEditorOpen(true)}
            className="bg-white text-blue-700 hover:bg-blue-50 px-12 py-6 rounded-[2rem] text-xl font-black shadow-2xl transition-all hover:scale-105 active:scale-95"
          >
            🚀 Gerar currículo otimizado com IA
          </button>
        </div>

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
