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

# Download stopwords
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

app = FastAPI(title="ATS Scanner Pro API")

# Enable CORS
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
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar PDF: {str(e)}")

def extract_text_from_docx(content: bytes) -> str:
    try:
        doc = docx.Document(io.BytesIO(content))
        text = "\n".join([para.text for para in doc.paragraphs])
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar DOCX: {str(e)}")

def preprocess_text(text: str) -> str:
    # Lowercase, remover caracteres especiais e remover stopwords
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', '', text)
    # Suporte para stopwords em Português e Inglês
    stop_words = set(stopwords.words('portuguese')) | set(stopwords.words('english'))
    words = text.split()
    words = [w for w in words if w not in stop_words]
    return " ".join(words)

def get_keywords(text: str):
    # Extração simples de palavras-chave
    words = set(re.findall(r'\b\w+\b', text.lower()))
    stop_words = set(stopwords.words('portuguese')) | set(stopwords.words('english'))
    return {w for w in words if w not in stop_words and len(w) > 2}

@app.post("/scan")
async def scan_resume(
    file: UploadFile = File(...),
    job_description: str = Form(...)
):
    content = await file.read()
    
    if file.filename.lower().endswith('.pdf'):
        resume_text = extract_text_from_pdf(content)
    elif file.filename.lower().endswith('.docx'):
        resume_text = extract_text_from_docx(content)
    else:
        raise HTTPException(status_code=400, detail="Formato de arquivo não suportado. Por favor, envie um PDF ou DOCX.")

    # Preprocessamento
    clean_resume = preprocess_text(resume_text)
    clean_jd = preprocess_text(job_description)

    if not clean_resume.strip() or not clean_jd.strip():
        raise HTTPException(status_code=400, detail="Não foi possível extrair texto suficiente para análise.")

    # Score de Similaridade
    try:
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform([clean_resume, clean_jd])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        match_score = round(similarity * 100, 2)
    except Exception:
        match_score = 0

    # Palavras-chave
    resume_keywords = get_keywords(resume_text)
    jd_keywords = get_keywords(job_description)
    
    missing_keywords = list(jd_keywords - resume_keywords)
    common_keywords = list(jd_keywords & resume_keywords)

    return {
        "match_score": match_score,
        "missing_keywords": sorted(missing_keywords)[:20],  # Aumentado para 20
        "common_keywords": sorted(common_keywords)[:20],   # Aumentado para 20
        "filename": file.filename
    }

@app.post("/generate-docx")
async def generate_docx(data: dict):
    try:
        doc = docx.Document()
        
        # Estilo global
        style = doc.styles['Normal']
        font = style.font
        font.name = 'Arial'
        font.size = Pt(11)

        # Cabeçalho
        name = data.get('name', 'Seu Nome')
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(name.upper())
        run.bold = True
        run.font.size = Pt(20)
        run.font.color.rgb = RGBColor(30, 41, 59)

        contact = doc.add_paragraph()
        contact.alignment = WD_ALIGN_PARAGRAPH.CENTER
        contact_info = f"{data.get('email', '')} | {data.get('phone', '')}"
        contact.add_run(contact_info).font.size = Pt(10)

        def add_section_title(title):
            p = doc.add_paragraph()
            p.space_before = Pt(15)
            run = p.add_run(title.upper())
            run.bold = True
            run.font.size = Pt(12)
            run.font.color.rgb = RGBColor(37, 99, 235)

        # Resumo
        if data.get('summary'):
            add_section_title("Resumo Profissional")
            doc.add_paragraph(data.get('summary', ''))

        # Experiência
        if data.get('experiences'):
            add_section_title("Experiência Profissional")
            for exp in data.get('experiences', []):
                p = doc.add_paragraph()
                p.space_before = Pt(10)
                run = p.add_run(exp.get('title', ''))
                run.bold = True
                
                p = doc.add_paragraph()
                company_date = f"{exp.get('company', '')} | {exp.get('date', '')}"
                run = p.add_run(company_date)
                run.italic = True
                run.font.size = Pt(10)
                
                doc.add_paragraph(exp.get('description', ''))

        # Habilidades
        if data.get('skills'):
            add_section_title("Habilidades e Competências")
            skills = ", ".join(data.get('skills', []))
            doc.add_paragraph(skills)

        target = io.BytesIO()
        doc.save(target)
        target.seek(0)

        return StreamingResponse(
            target,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": "attachment; filename=Curriculo_Otimizado_DestravaCV.docx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar DOCX: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
