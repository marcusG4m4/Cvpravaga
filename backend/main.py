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
    content = await file.read()
    resume_text = extract_text_from_pdf(content) if file.filename.lower().endswith('.pdf') else extract_text_from_docx(content)
    
    # Similarity (TF-IDF)
    vectorizer = TfidfVectorizer()
    tfidf = vectorizer.fit_transform([resume_text.lower(), job_description.lower()])
    match_score = round(cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0] * 100, 2)

    resume_keywords = get_keywords(resume_text)
    jd_keywords = get_keywords(job_description)
    
    return {
        "match_score": match_score,
        "missing_keywords": sorted(list(jd_keywords - resume_keywords))[:20],
        "common_keywords": sorted(list(jd_keywords & resume_keywords))[:20],
        "filename": file.filename,
        "resume_text": resume_text
    }

@app.post("/auto-optimize-resume")
async def auto_optimize_resume(data: dict):
    if not GENIMINI_API_KEY:
        raise HTTPException(status_code=400, detail="IA não configurada.")

    resume_text = data.get('resume_text', '')
    job_description = data.get('job_description', '')

    prompt = f"""
    Você é um especialista em recrutamento e seleção (Tech Recruiter). 
    Sua missão é pegar o currículo do candidato e REESCREVÊ-LO de forma TOTALMENTE OTIMIZADA para a vaga abaixo.
    
    INSTRUÇÕES:
    1. Mantenha os dados reais do candidato (nome, empresas, datas).
    2. Reescreva o resumo profissional para que ele inclua as competências e tecnologias exigidas na vaga.
    3. Reescreva as descrições de experiência para focar em RESULTADOS e incluir requisitos da vaga de forma orgânica.
    4. Adicione as habilidades técnicas (skills) que a vaga pede e que façam sentido para o perfil.
    5. O objetivo é aumentar o score de match com o sistema ATS.
    
    RETORNE APENAS UM JSON VÁLIDO NESSA ESTRUTURA:
    {{
        "name": "nome",
        "email": "email",
        "phone": "telefone",
        "summary": "resumo otimizado",
        "experiences": [
            {{ "title": "cargo", "company": "empresa", "date": "período", "description": "descrição otimizada focada em resultados" }}
        ],
        "skills": ["skill1", "skill2", ...]
    }}

    VAGA: {job_description}
    CURRÍCULO ORIGINAL: {resume_text}
    """

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        json_str = re.search(r'\{.*\}', response.text, re.DOTALL).group()
        return json.loads(json_str)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
