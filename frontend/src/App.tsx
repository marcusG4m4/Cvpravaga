import { useState, ChangeEvent, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import AtsDashboard from './AtsDashboard'

interface ScanResult {
  match_score: number;
  missing_keywords: string[];
  common_keywords: string[];
  filename: string;
  resume_text?: string;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || !saved; // Default to dark if nothing saved
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleScan = async () => {
    if (!file || !jobDescription) {
      setError('Por favor, faça o upload de um currículo e forneça a descrição da vaga.');
      return;
    }

    setLoading(true);
    setResult(null);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_description', jobDescription);

    try {
      const response = await axios.post('http://localhost:8000/scan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ocorreu um erro ao realizar a análise.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Destrava<span className="text-blue-600">CV</span>
            </h1>
            <p className={`mt-2 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Otimização de currículos com Inteligência Artificial
            </p>
          </div>
          <button 
            onClick={toggleTheme}
            className={`p-4 rounded-3xl transition-all shadow-xl hover:scale-110 active:scale-95 ${isDarkMode ? 'bg-slate-800 text-yellow-400' : 'bg-white text-slate-700'}`}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </header>

        <main>
          <div className={`rounded-[2.5rem] shadow-2xl border p-10 mb-12 transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <section>
                <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                  1. Enviar Currículo
                </h3>
                <div className={`relative w-full h-40 border-2 border-dashed rounded-[2rem] transition-all flex flex-col items-center justify-center gap-3 group ${isDarkMode ? 'bg-slate-800/30 border-slate-700 hover:border-blue-500' : 'bg-slate-50 border-slate-200 hover:border-blue-500 hover:bg-blue-50/50'}`}>
                  <input 
                    type="file" 
                    accept=".pdf,.docx" 
                    onChange={handleFileChange} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className={`text-3xl transition-transform group-hover:scale-125`}>📄</div>
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {file ? file.name : 'PDF ou Word'}
                  </span>
                </div>
              </section>

              <section>
                <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                  2. Descrição da Vaga
                </h3>
                <textarea
                  placeholder="Cole os requisitos aqui..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                  className={`w-full p-6 border rounded-[2rem] outline-none resize-none transition-all font-medium ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:ring-4 focus:ring-blue-500/20' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-4 focus:ring-blue-500/10'}`}
                />
              </section>
            </div>

            <button 
              className="w-full mt-10 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg py-6 rounded-[2rem] transition-all shadow-2xl shadow-blue-600/20 hover:shadow-blue-600/40 active:scale-95 disabled:bg-slate-400 disabled:shadow-none" 
              onClick={handleScan}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Analisando...
                </span>
              ) : '🔍 Analisar Currículo'}
            </button>

            {error && <div className="mt-6 p-4 bg-red-500/10 text-red-500 rounded-2xl text-center font-bold border border-red-500/20">{error}</div>}
          </div>

          {result && (
            <div className="animate-[fadeIn_0.6s_ease-out]">
              <AtsDashboard 
                score={result.match_score} 
                missingKeywords={result.missing_keywords} 
                commonKeywords={result.common_keywords} 
                jobDescription={jobDescription}
                resumeText={result.resume_text}
                isDarkMode={isDarkMode}
              />
            </div>
          )}
        </main>

        <footer className={`text-center py-12 font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          <p>© 2026 DestravaCV • O caminho mais rápido para sua próxima vaga</p>
        </footer>
      </div>
    </div>
  )
}

export default App
