import { useState, ChangeEvent } from 'react'
import axios from 'axios'
import './App.css'
import AtsDashboard from './AtsDashboard'

interface ScanResult {
  match_score: number;
  missing_keywords: string[];
  common_keywords: string[];
  filename: string;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');

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
    <div className="container mx-auto max-w-5xl">
      <header className="text-center mb-10 mt-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Destrava<span className="text-blue-600">CV</span></h1>
        <p className="text-gray-500 text-lg">Otimize seu currículo para qualquer descrição de vaga</p>
      </header>

      <main>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">1. Enviar Currículo</h3>
              <div className="relative w-full h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center">
                <input 
                  type="file" 
                  accept=".pdf,.docx" 
                  onChange={handleFileChange} 
                  id="resume-file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span className="text-gray-500 font-medium">
                  {file ? file.name : 'Clique para escolher PDF ou Word'}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">2. Descrição da Vaga</h3>
              <textarea
                placeholder="Cole os requisitos da vaga aqui..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={5}
                className="w-full p-4 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-shadow"
              />
            </div>
          </div>

          <button 
            className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors disabled:bg-gray-400" 
            onClick={handleScan}
            disabled={loading}
          >
            {loading ? 'Analisando...' : 'Analisar Currículo'}
          </button>

          {error && <p className="text-red-500 text-center mt-4 font-medium">{error}</p>}
        </div>

        {result && (
          <div className="animate-[fadeIn_0.5s_ease-out]">
            <AtsDashboard 
              score={result.match_score} 
              missingKeywords={result.missing_keywords} 
              commonKeywords={result.common_keywords} 
            />
          </div>
        )}
      </main>

      <footer className="text-center py-10 text-gray-500">
        <p>© 2026 DestravaCV - Impulsione sua carreira</p>
      </footer>
    </div>
  )
}

export default App
