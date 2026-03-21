import React, { useState, useEffect, useRef } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ResumePDF } from './ResumePDF';
import axios from 'axios';

interface ResumeData {
  name: string;
  email: string;
  phone: string;
  summary: string;
  experiences: {
    title: string;
    company: string;
    date: string;
    description: string;
  }[];
  skills: string[];
}

interface ResumeEditorProps {
  initialData: {
    missingKeywords: string[];
    commonKeywords: string[];
    jobDescription: string;
    resumeText?: string;
    initialScore: number;
  };
  onClose: () => void;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info';
}

export default function ResumeEditor({ initialData, onClose }: ResumeEditorProps) {
  const [data, setData] = useState<ResumeData>({
    name: '',
    email: '',
    phone: '',
    summary: '',
    experiences: [{ title: '', company: '', date: '', description: '' }],
    skills: []
  });

  const [currentScore, setCurrentScore] = useState(initialData.initialScore);
  const [foundKeywords, setFoundKeywords] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  
  const isDark = document.documentElement.classList.contains('dark');
  const prevScoreRef = useRef(initialData.initialScore);

  // Sistema de Toasts (Feedback Visual)
  const addToast = (message: string, type: 'success' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Efeito para calcular o score em tempo real
  useEffect(() => {
    const allText = (
      data.summary + ' ' + 
      data.experiences.map(e => e.title + ' ' + e.description).join(' ') + ' ' +
      data.skills.join(' ')
    ).toLowerCase();

    const newlyFound = initialData.missingKeywords.filter(kw => 
      allText.includes(kw.toLowerCase())
    );

    setFoundKeywords(newlyFound);

    // Cálculo de score dinâmico: score base + pontos por keywords recuperadas
    // Cada keyword nova vale um percentual do que falta para 100
    const remainingTo100 = 100 - initialData.initialScore;
    const pointsPerKeyword = initialData.missingKeywords.length > 0 
      ? remainingTo100 / initialData.missingKeywords.length 
      : 0;
    
    const bonusScore = newlyFound.length * pointsPerKeyword;
    const finalScore = Math.min(Math.round(initialData.initialScore + bonusScore), 100);
    
    if (finalScore > prevScoreRef.current) {
      const diff = finalScore - prevScoreRef.current;
      addToast(`✨ +${diff} pontos! Compatibilidade melhorou.`, 'success');
    }
    
    setCurrentScore(finalScore);
    prevScoreRef.current = finalScore;
  }, [data, initialData.missingKeywords, initialData.initialScore]);

  useEffect(() => {
    if (initialData.resumeText) {
      handleAutoOptimize();
    }
  }, [initialData.resumeText]);

  const handleAutoOptimize = async () => {
    setIsOptimizing(true);
    try {
      const response = await axios.post('http://localhost:8000/auto-optimize-resume', {
        resume_text: initialData.resumeText,
        job_description: initialData.jobDescription
      });
      setData(response.data);
      addToast("🚀 IA completou a otimização inicial!", "info");
    } catch (error) {
      console.error(error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
  };

  const handleExperienceChange = (index: number, field: string, value: string) => {
    const newExperiences = [...data.experiences];
    (newExperiences[index] as any)[field] = value;
    setData({ ...data, experiences: newExperiences });
  };

  const addSkill = (skill: string) => {
    if (!data.skills.includes(skill)) {
      setData({ ...data, skills: [...data.skills, skill] });
      addToast(`✅ Habilidade '${skill}' adicionada!`);
    }
  };

  const downloadDocx = async () => {
    setIsGeneratingDocx(true);
    try {
      const response = await axios.post('http://localhost:8000/generate-docx', data, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Curriculo_Otimizado.docx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Erro ao gerar Word.');
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  // Níveis de Gamificação
  const getLevel = () => {
    if (currentScore >= 95) return { label: '🏆 Destravado!', color: 'text-yellow-400' };
    if (currentScore >= 85) return { label: '🟢 Expert', color: 'text-green-400' };
    if (currentScore >= 70) return { label: '🔵 Competitivo', color: 'text-blue-400' };
    return { label: '🟠 Iniciante', color: 'text-orange-400' };
  };

  const level = getLevel();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      
      {/* Sistema de Toasts flutuantes */}
      <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-[fadeIn_0.3s_ease-out] flex items-center gap-3">
            <span className="text-lg">{toast.type === 'success' ? '✅' : 'ℹ️'}</span>
            <span className="font-bold text-sm">{toast.message}</span>
          </div>
        ))}
      </div>

      <div className={`rounded-3xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl animate-[fadeIn_0.3s_ease-out] border transition-all ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-100'}`}>
        
        {/* Header com Score Gamer */}
        <div className={`p-8 border-b flex flex-col md:flex-row justify-between items-center rounded-t-3xl gap-6 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-gray-50/50 border-gray-100'}`}>
          <div className="flex-1 text-center md:text-left">
            <h2 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Editor <span className="text-blue-500">DestravaCV</span>
            </h2>
            <p className={`text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Turbine seu currículo em tempo real.</p>
          </div>

          <div className="flex items-center gap-8 bg-black/20 p-4 rounded-[2rem] border border-white/5 shadow-inner">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Nível</p>
              <p className={`text-sm font-black uppercase tracking-tighter ${level.color}`}>{level.label}</p>
            </div>
            <div className="h-10 w-px bg-white/10"></div>
            <div className="flex flex-col items-center">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Live Score</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-black transition-all ${currentScore >= 80 ? 'text-green-500' : 'text-blue-500'}`}>{currentScore}</span>
                <span className="text-slate-500 font-bold text-sm">/100</span>
              </div>
            </div>
            <button onClick={onClose} className={`text-4xl font-light ml-4 transition-colors ${isDark ? 'text-slate-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>&times;</button>
          </div>
        </div>

        {/* Barra de Progresso superior */}
        <div className="w-full h-1.5 bg-slate-800 overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(37,99,235,0.5)] ${currentScore >= 80 ? 'bg-green-500' : 'bg-blue-600'}`}
            style={{ width: `${currentScore}%` }}
          ></div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Form Side */}
            <div className="lg:col-span-8 space-y-12">
              <section>
                <h3 className={`text-xl font-black mb-8 flex items-center gap-3 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                  <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                  Dados Pessoais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Nome Completo', name: 'name', type: 'text' },
                    { label: 'E-mail', name: 'email', type: 'email' },
                    { label: 'Telefone', name: 'phone', type: 'text' },
                  ].map(field => (
                    <div key={field.name} className="space-y-2">
                      <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{field.label}</label>
                      <input 
                        type={field.type} 
                        name={field.name} 
                        className={`input-style ${isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-blue-500' : 'bg-white border-gray-200 text-slate-900'}`} 
                        value={(data as any)[field.name]} 
                        onChange={handleInputChange} 
                      />
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className={`text-xl font-black mb-8 flex items-center gap-3 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                  <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                  Resumo Profissional
                </h3>
                <textarea 
                  name="summary" 
                  rows={6} 
                  value={data.summary}
                  placeholder="Dica: Use as palavras sugeridas à direita para subir seu score!"
                  className={`input-style w-full resize-none leading-relaxed ${isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-blue-500' : 'bg-white border-gray-200 text-slate-900'}`} 
                  onChange={handleInputChange} 
                />
              </section>

              <section>
                <h3 className={`text-xl font-black mb-8 flex items-center gap-3 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                  <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                  Experiências
                </h3>
                {data.experiences.map((exp, i) => (
                  <div key={i} className={`p-8 rounded-[2rem] mb-10 border space-y-6 transition-all shadow-sm ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Cargo</label>
                        <input type="text" className={`input-style font-bold ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-slate-900'}`} value={exp.title} onChange={(e) => handleExperienceChange(i, 'title', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Empresa</label>
                        <input type="text" className={`input-style font-bold ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-slate-900'}`} value={exp.company} onChange={(e) => handleExperienceChange(i, 'company', e.target.value)} />
                      </div>
                    </div>
                    <textarea 
                      rows={5} 
                      value={exp.description}
                      className={`input-style w-full resize-none leading-relaxed ${isDark ? 'bg-slate-900 border-slate-800 text-white focus:border-blue-500' : 'bg-white border-gray-200 text-slate-900'}`}
                      onChange={(e) => handleExperienceChange(i, 'description', e.target.value)} 
                    />
                  </div>
                ))}
              </section>
            </div>

            {/* Sidebar Gamificada Side */}
            <div className="lg:col-span-4 space-y-8">
              <section className={`p-8 rounded-[2.5rem] shadow-2xl ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-slate-900 text-white'}`}>
                <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                  <span className="text-blue-500">💎</span> 
                  Sugestões do ATS
                </h3>
                
                <div className="space-y-6">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Palavras-chave faltantes</p>
                  <div className="flex flex-wrap gap-3">
                    {initialData.missingKeywords.map(kw => {
                      const isFound = foundKeywords.includes(kw);
                      return (
                        <button 
                          key={kw} 
                          onClick={() => addSkill(kw)}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all border flex items-center gap-2 ${
                            isFound 
                              ? 'bg-green-500/20 border-green-500/50 text-green-400 cursor-default' 
                              : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:scale-105 active:scale-95'
                          }`}
                        >
                          {isFound ? '✅' : '+'} {kw}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-12 space-y-4">
                  <PDFDownloadLink document={<ResumePDF data={data} />} fileName="Curriculo_Otimizado.pdf">
                    {({ loading }) => (
                      <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[1.5rem] shadow-xl transition-all flex items-center justify-center gap-3">
                        📄 {loading ? 'GERANDO...' : 'BAIXAR EM PDF'}
                      </button>
                    )}
                  </PDFDownloadLink>

                  <button 
                    onClick={downloadDocx}
                    disabled={isGeneratingDocx || isOptimizing}
                    className={`w-full font-black py-5 rounded-[1.5rem] shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 ${isDark ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700' : 'bg-white text-slate-900 hover:bg-gray-100'}`}
                  >
                    <span className="text-xl font-serif">W</span> {isGeneratingDocx ? 'PROCESSANDO...' : 'BAIXAR WORD'}
                  </button>
                </div>
              </section>

              <div className={`p-8 rounded-[2rem] border transition-all ${isDark ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
                <div className="flex items-start gap-4">
                  <span className="text-2xl">💡</span>
                  <p className={`text-xs leading-relaxed font-bold ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
                    DICA MESTRE: Tente atingir o nível Expert (85+) para garantir que seu currículo não seja barrado por nenhum filtro automático.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      
      <style>{`
        .input-style {
          border-radius: 1.2rem;
          padding: 16px 24px;
          font-size: 0.95rem;
          outline: none;
          width: 100%;
          transition: all 0.2s;
          border-width: 2px;
        }
        .input-style:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px) translateX(-50%); }
          to { opacity: 1; transform: translateY(0) translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
