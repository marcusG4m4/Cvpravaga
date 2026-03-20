import React, { useState } from 'react';
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
  };
  onClose: () => void;
}

export default function ResumeEditor({ initialData, onClose }: ResumeEditorProps) {
  const [data, setData] = useState<ResumeData>({
    name: '',
    email: '',
    phone: '',
    summary: '',
    experiences: [
      { title: '', company: '', date: '', description: '' }
    ],
    skills: [...initialData.commonKeywords]
  });

  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData({ ...data, [name]: value });
  };

  const handleExperienceChange = (index: number, field: string, value: string) => {
    const newExperiences = [...data.experiences];
    newExperiences[index] = { ...newExperiences[index], [field]: value };
    setData({ ...data, experiences: newExperiences });
  };

  const addExperience = () => {
    setData({
      ...data,
      experiences: [...data.experiences, { title: '', company: '', date: '', description: '' }]
    });
  };

  const removeExperience = (index: number) => {
    if (data.experiences.length > 1) {
      const newExperiences = data.experiences.filter((_, i) => i !== index);
      setData({ ...data, experiences: newExperiences });
    }
  };

  const addSkill = (skill: string) => {
    if (!data.skills.includes(skill)) {
      setData({ ...data, skills: [...data.skills, skill] });
    }
  };

  const removeSkill = (index: number) => {
    const newSkills = data.skills.filter((_, i) => i !== index);
    setData({ ...data, skills: newSkills });
  };

  const downloadDocx = async () => {
    setIsGeneratingDocx(true);
    try {
      const response = await axios.post('http://localhost:8000/generate-docx', data, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Curriculo_Otimizado_DestravaCV.docx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao gerar DOCX:', error);
      alert('Erro ao gerar o arquivo Word.');
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl animate-[fadeIn_0.3s_ease-out]">
        
        {/* Cabeçalho */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Editor de Currículo <span className="text-blue-600">Otimizado</span></h2>
            <p className="text-gray-500 text-sm">Preencha seus dados e adicione as palavras-chave sugeridas para melhorar seu score.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl font-light">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* Seção de Formulário */}
            <div className="space-y-8">
              <section>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-blue-600 pl-3">Dados Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" name="name" placeholder="Nome Completo" className="input-style" onChange={handleInputChange} />
                  <input type="email" name="email" placeholder="E-mail" className="input-style" onChange={handleInputChange} />
                  <input type="text" name="phone" placeholder="Telefone de Contato" className="input-style" onChange={handleInputChange} />
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-blue-600 pl-3">Resumo Profissional</h3>
                <textarea 
                  name="summary" 
                  rows={4} 
                  placeholder="Escreva um resumo impactante (Dica: tente incluir palavras-chave da vaga de forma natural aqui)" 
                  className="input-style w-full" 
                  onChange={handleInputChange} 
                />
              </section>

              <section>
                <div className="flex justify-between items-center mb-4 border-l-4 border-blue-600 pl-3">
                  <h3 className="text-lg font-bold text-gray-800">Experiência Profissional</h3>
                  <button onClick={addExperience} className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-semibold transition-colors">+ Nova Experiência</button>
                </div>
                {data.experiences.map((exp, i) => (
                  <div key={i} className="p-5 bg-gray-50 rounded-2xl mb-6 space-y-3 border border-gray-100 relative">
                    {data.experiences.length > 1 && (
                      <button 
                        onClick={() => removeExperience(i)} 
                        className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"
                        title="Remover experiência"
                      >
                        Remover
                      </button>
                    )}
                    <input type="text" placeholder="Cargo / Função" className="input-style w-full" onChange={(e) => handleExperienceChange(i, 'title', e.target.value)} />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Empresa" className="input-style" onChange={(e) => handleExperienceChange(i, 'company', e.target.value)} />
                      <input type="text" placeholder="Período (ex: Jan 2021 - Atual)" className="input-style" onChange={(e) => handleExperienceChange(i, 'date', e.target.value)} />
                    </div>
                    <textarea placeholder="Principais conquistas, responsabilidades e tecnologias utilizadas." className="input-style w-full" rows={3} onChange={(e) => handleExperienceChange(i, 'description', e.target.value)} />
                  </div>
                ))}
              </section>
            </div>

            {/* Seção Lateral de Otimização */}
            <div className="space-y-8">
              <section className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                <h3 className="text-blue-800 font-bold mb-4 flex items-center gap-2">
                  <span className="text-xl">🚀</span> Sugestões do ATS
                </h3>
                <p className="text-blue-700 text-sm mb-4">Palavras-chave que faltam no seu perfil original. Clique para adicionar:</p>
                <div className="flex flex-wrap gap-2">
                  {initialData.missingKeywords.length > 0 ? (
                    initialData.missingKeywords.map(kw => (
                      <button 
                        key={kw} 
                        onClick={() => addSkill(kw)}
                        className="bg-white text-blue-600 px-3 py-2 rounded-full text-xs font-bold border border-blue-200 hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-1"
                      >
                        <span className="text-lg">+</span> {kw}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-green-600 font-medium">Você já possui as principais palavras-chave!</p>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Habilidades Selecionadas</h3>
                <div className="flex flex-wrap gap-2 bg-gray-50 p-4 rounded-2xl min-h-[100px] border border-gray-100">
                  {data.skills.map((skill, i) => (
                    <span 
                      key={i} 
                      className="bg-white text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-2 group border border-gray-200"
                    >
                      {skill}
                      <button onClick={() => removeSkill(i)} className="text-gray-300 hover:text-red-500 font-bold">×</button>
                    </span>
                  ))}
                  {data.skills.length === 0 && <p className="text-gray-400 text-sm italic">Nenhuma habilidade adicionada ainda.</p>}
                </div>
              </section>

              {/* Botões de Ação */}
              <div className="pt-10 border-t border-gray-100 space-y-4">
                <PDFDownloadLink document={<ResumePDF data={data} />} fileName="Curriculo_DestravaCV_Otimizado.pdf">
                  {({ loading }) => (
                    <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-10 rounded-2xl shadow-xl transition-all w-full flex items-center justify-center gap-3 transform hover:-translate-y-1">
                      <span className="text-xl">📄</span> {loading ? 'Gerando arquivo...' : 'Baixar em PDF'}
                    </button>
                  )}
                </PDFDownloadLink>

                <button 
                  onClick={downloadDocx}
                  disabled={isGeneratingDocx}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-2xl shadow-xl transition-all w-full flex items-center justify-center gap-3 transform hover:-translate-y-1 disabled:bg-gray-400"
                >
                  <span className="text-xl">W</span> {isGeneratingDocx ? 'Gerando arquivo...' : 'Baixar em Word (.docx)'}
                </button>

                <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                  <p className="text-yellow-800 text-xs leading-relaxed">
                    <strong>Dica DestravaCV:</strong> Ambos os formatos são otimizados. O PDF garante que o layout não mude, enquanto o Word é ideal se você precisar fazer ajustes manuais depois.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      
      <style>{`
        .input-style {
          background-color: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s;
          color: #1e293b;
        }
        .input-style:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
          background-color: #fff;
        }
        .input-style::placeholder {
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}
