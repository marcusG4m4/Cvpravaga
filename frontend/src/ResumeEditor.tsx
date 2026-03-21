import React, { useState, useEffect } from 'react';
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
  };
  onClose: () => void;
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

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const isDark = document.documentElement.classList.contains('dark');

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
    } catch (error) {
      console.error(error);
      alert("Erro na otimização automática.");
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
    newExperiences[index] = { ...newExperiences[index], [field]: value };
    setData({ ...data, experiences: newExperiences });
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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className={`rounded-3xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl animate-[fadeIn_0.3s_ease-out] border transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'}`}>
        
        {/* Header */}
        <div className={`p-8 border-b flex justify-between items-center rounded-t-3xl ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50/50 border-gray-100'}`}>
          <div>
            <h2 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Editor <span className="text-blue-500">Inteligente</span>
            </h2>
            <p className={`text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>A IA reescreveu seu currículo para esta vaga específica.</p>
          </div>
          <div className="flex items-center gap-6">
            {isOptimizing && (
              <div className={`flex items-center gap-3 font-black text-xs px-5 py-2.5 rounded-full animate-pulse ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <span className="w-2 h-2 bg-current rounded-full animate-bounce"></span>
                OTIMIZANDO COM IA...
              </div>
            )}
            <button onClick={onClose} className={`text-4xl font-light transition-colors ${isDark ? 'text-slate-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>&times;</button>
          </div>
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
                        className={`input-style ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-gray-200 text-slate-900'}`} 
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
                  Resumo Otimizado
                </h3>
                <textarea 
                  name="summary" 
                  rows={6} 
                  value={data.summary}
                  className={`input-style w-full resize-none leading-relaxed ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-gray-200 text-slate-900'}`} 
                  onChange={handleInputChange} 
                />
              </section>

              <section>
                <h3 className={`text-xl font-black mb-8 flex items-center gap-3 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                  <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                  Experiências Reescritas
                </h3>
                {data.experiences.map((exp, i) => (
                  <div key={i} className={`p-8 rounded-[2rem] mb-10 border space-y-6 transition-all shadow-sm ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Cargo</label>
                        <input type="text" className={`input-style font-bold ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-slate-900'}`} value={exp.title} onChange={(e) => handleExperienceChange(i, 'title', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Empresa</label>
                        <input type="text" className={`input-style font-bold ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-slate-900'}`} value={exp.company} onChange={(e) => handleExperienceChange(i, 'company', e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Descrição Otimizada</label>
                      <textarea 
                        rows={5} 
                        value={exp.description}
                        className={`input-style w-full resize-none leading-relaxed ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-slate-900'}`}
                        onChange={(e) => handleExperienceChange(i, 'description', e.target.value)} 
                      />
                    </div>
                  </div>
                ))}
              </section>
            </div>

            {/* Sidebar Side */}
            <div className="lg:col-span-4 space-y-8">
              <section className={`p-8 rounded-[2.5rem] shadow-2xl ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-slate-900 text-white'}`}>
                <h3 className={`text-lg font-black mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-white'}`}>
                  <span className="text-yellow-400 text-xl">✨</span> 
                  Exportar CV
                </h3>
                <p className={`text-xs mb-8 leading-relaxed font-medium ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                  Seu currículo foi ajustado para atingir a nota máxima nos sistemas de recrutamento.
                </p>
                
                <div className="space-y-4 mb-10">
                  <h4 className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Habilidades Adicionais</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.skills.map((skill, i) => (
                      <span key={i} className="bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-blue-500/30">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <PDFDownloadLink document={<ResumePDF data={data} />} fileName="Curriculo_DestravaCV.pdf">
                    {({ loading }) => (
                      <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[1.5rem] shadow-xl transition-all flex items-center justify-center gap-3">
                        📄 {loading ? 'GERANDO...' : 'BAIXAR EM PDF'}
                      </button>
                    )}
                  </PDFDownloadLink>

                  <button 
                    onClick={downloadDocx}
                    disabled={isGeneratingDocx || isOptimizing}
                    className={`w-full font-black py-5 rounded-[1.5rem] shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-white text-slate-900 hover:bg-gray-100'}`}
                  >
                    <span className="text-xl font-serif">W</span> {isGeneratingDocx ? 'PROCESSANDO...' : 'BAIXAR WORD'}
                  </button>
                </div>
              </section>

              <div className={`p-6 rounded-3xl border transition-all ${isDark ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
                <p className={`text-[11px] leading-relaxed italic font-medium ${isDark ? 'text-blue-400' : 'text-blue-800'}`}>
                  <strong>Dica:</strong> O formato PDF é recomendado para manter o design, enquanto o Word é ideal se você quiser fazer ajustes manuais.
                </p>
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
      `}</style>
    </div>
  );
}
