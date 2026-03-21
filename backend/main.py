from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import fitz  # PyMuPDF
import docx
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
import io
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.corpus import stopwords
import uvicorn
import google.generativeai as genai
import os
import json

# Download stopwords
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

# Configuração da IA (Gemini)
GENIMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GENIMINI_API_KEY:
    genai.configure(api_key=GENIMINI_API_KEY)

app = FastAPI(title="DestravaCV API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text_from_pdf(content: bytes) -> str:
    try:
        doc = fitz.open(stream=content, filetype="pdf")
        text = "".join([page.get_text() for page in doc])
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro PDF: {str(e)}")

def extract_text_from_docx(content: bytes) -> str:
    try:
        doc = docx.Document(io.BytesIO(content))
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro DOCX: {str(e)}")

def get_keywords(text: str):
    words = set(re.findall(r'\b\w+\b', text.lower()))
    stop_words = set(stopwords.words('portuguese')) | set(stopwords.words('english'))
    return {w for w in words if w not in stop_words and len(w) > 2}

@app.post("/scan")
async def scan_resume(file: UploadFile = File(...), job_description: str = Form(...)):
    try:
        content = await file.read()
        filename = file.filename.lower()
        
        if filename.endswith('.pdf'):
            resume_text = extract_text_from_pdf(content)
        elif filename.endswith('.docx'):
            resume_text = extract_text_from_docx(content)
        else:
            # Tentar extrair como texto se for outra extensão ou falhar
            try:
                resume_text = content.decode('utf-8')
            except:
                resume_text = extract_text_from_docx(content) # Fallback

        if not resume_text.strip():
            return {
                "match_score": 0,
                "missing_keywords": sorted(list(get_keywords(job_description)))[:20],
                "common_keywords": [],
                "filename": file.filename,
                "resume_text": ""
            }

        if not job_description.strip():
             return {
                "match_score": 0,
                "missing_keywords": [],
                "common_keywords": [],
                "filename": file.filename,
                "resume_text": resume_text
            }

        # Similarity (TF-IDF)
        try:
            vectorizer = TfidfVectorizer()
            tfidf = vectorizer.fit_transform([resume_text.lower(), job_description.lower()])
            match_score = round(cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0] * 100, 2)
        except ValueError:
            # Caso o vocabulário seja vazio (apenas stop words)
            match_score = 0

        resume_keywords = get_keywords(resume_text)
        jd_keywords = get_keywords(job_description)
        
        return {
            "match_score": match_score,
            "missing_keywords": sorted(list(jd_keywords - resume_keywords))[:20],
            "common_keywords": sorted(list(jd_keywords & resume_keywords))[:20],
            "filename": file.filename,
            "resume_text": resume_text
        }
    except Exception as e:
        print(f"Erro no scan: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auto-optimize-resume")
async def auto_optimize_resume(data: dict):
    if not GENIMINI_API_KEY:
        raise HTTPException(status_code=400, detail="IA não configurada. Defina a variável GEMINI_API_KEY.")

    resume_text = data.get('resume_text', '')
    job_description = data.get('job_description', '')

    prompt = f"""
    Você é um Tech Recruiter Sênior e Especialista em ATS (Applicant Tracking Systems).
    Sua missão é reescrever o currículo fornecido para que ele tenha o MÁXIMO de aderência à vaga descrita, 
    sem inventar experiências que o candidato não teve.

    INSTRUÇÕES RÍGIDAS:
    1. MANTENHA a verdade: Não invente cargos, empresas ou graduações.
    2. RESUMO PROFISSIONAL: Crie um parágrafo de 3-4 linhas, de alto impacto, incluindo as principais palavras-chave da vaga.
    3. EXPERIÊNCIAS: Reescreva os 'bullet points' de cada experiência focando em CONQUISTAS e MÉTRICAS (método STAR: Situação, Tarefa, Ação, Resultado). Incorpore as tecnologias da vaga onde fizer sentido.
    4. SKILLS: Extraia uma lista consolidada das habilidades técnicas e comportamentais mais relevantes para a vaga.
    
    RETORNE ESTRITAMENTE UM JSON VÁLIDO E NADA MAIS. O JSON deve ter este formato exato:
    {{
        "name": "Nome Completo Extraído ou 'Seu Nome'",
        "email": "email@extraido.com",
        "phone": "Telefone Extraído",
        "summary": "Resumo de alto impacto...",
        "experiences": [
            {{ "title": "Cargo", "company": "Empresa", "date": "Período", "description": "• Conquista 1...\\n• Conquista 2..." }}
        ],
        "skills": ["Skill 1", "Skill 2"]
    }}

    VAGA ALVO:
    {job_description}

    CURRÍCULO ORIGINAL:
    {resume_text}
    """

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        # Tenta extrair apenas a parte JSON da resposta
        match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if not match:
            raise ValueError("O modelo não retornou um JSON válido.")
        json_str = match.group()
        return json.loads(json_str)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na IA: {str(e)}")

@app.post("/generate-cover-letter")
async def generate_cover_letter(data: dict):
    if not GENIMINI_API_KEY:
        raise HTTPException(status_code=400, detail="IA não configurada.")

    resume_text = data.get('resume_text', '')
    job_description = data.get('job_description', '')

    prompt = f"""
    Você é um especialista em carreira. Escreva uma Carta de Apresentação (Cover Letter) persuasiva e profissional.
    Ela deve conectar as experiências do currículo do candidato com as necessidades específicas da vaga.
    
    INSTRUÇÕES:
    1. Tom profissional, entusiasmado e confiante.
    2. Estrutura: Introdução (qual vaga e por que o interesse), Corpo (destacando 1-2 conquistas do currículo que provam a capacidade de resolver os problemas da vaga), e Conclusão (chamada para ação para uma entrevista).
    3. Retorne APENAS o texto da carta de apresentação. Não inclua placeholders como '[Seu Nome]' no início, comece com uma saudação ("Prezado(a) responsável pelas contratações,").
    4. Limite a 3 ou 4 parágrafos curtos.

    VAGA: {job_description}
    CURRÍCULO: {resume_text}
    """

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        return {"cover_letter": response.text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar carta: {str(e)}")

@app.post("/generate-docx")
async def generate_docx(data: dict):
    try:
        doc = docx.Document()
        style = doc.styles['Normal']
        style.font.name = 'Arial'
        style.font.size = Pt(11)

        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(data.get('name', 'Seu Nome').upper())
        run.bold = True
        run.font.size = Pt(18)

        def add_section(title, content):
            p = doc.add_paragraph()
            p.space_before = Pt(15)
            run = p.add_run(title.upper())
            run.bold = True
            run.font.color.rgb = RGBColor(37, 99, 235)
            doc.add_paragraph(content)

        add_section("Resumo Profissional", data.get('summary', ''))
        
        p = doc.add_paragraph()
        p.add_run("EXPERIÊNCIA PROFISSIONAL").bold = True
        for exp in data.get('experiences', []):
            doc.add_paragraph(exp.get('title', '')).bold = True
            doc.add_paragraph(f"{exp.get('company', '')} | {exp.get('date', '')}").italic = True
            doc.add_paragraph(exp.get('description', ''))

        add_section("Habilidades", ", ".join(data.get('skills', [])))

        target = io.BytesIO()
        doc.save(target)
        target.seek(0)
        return StreamingResponse(target, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
