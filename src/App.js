from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import shutil
import os
from pathlib import Path
from .converter import convert_pdf_to_docx
import uuid

app = FastAPI()

# ---------------- CORS (REQUIRED for editor) ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Paths ----------------
BASE_DIR = Path(__file__).resolve().parent.parent
SHARED_DIR = BASE_DIR / "shared-docs"
UPLOAD_DIR = SHARED_DIR / "uploads"
CONVERTED_DIR = SHARED_DIR / "converted"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
CONVERTED_DIR.mkdir(parents=True, exist_ok=True)

# ---------------- PDF → DOCX / DOCX passthrough ----------------
@app.post("/convert/pdf-to-docx")
async def pdf_to_docx(file: UploadFile = File(...)):
    filename_lower = file.filename.lower()

    try:
        # -------- PDF → DOCX --------
        if filename_lower.endswith(".pdf"):
            pdf_path = UPLOAD_DIR / file.filename

            with open(pdf_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            docx_filename = convert_pdf_to_docx(str(pdf_path))
            docx_path = CONVERTED_DIR / docx_filename

            return FileResponse(
                path=docx_path,
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                filename=docx_filename,
            )

        # -------- DOCX passthrough --------
        elif filename_lower.endswith(".docx"):
            new_name = f"{uuid.uuid4().hex}.docx"
            dest_path = CONVERTED_DIR / new_name

            with open(dest_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            return FileResponse(
                path=dest_path,
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                filename=new_name,
            )

        else:
            raise HTTPException(
                status_code=400,
                detail="Only PDF or DOCX files are supported",
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------- ✅ NEW: Serve files for editor (GET) ----------------
@app.get("/files/{filename}")
def get_converted_file(filename: str):
    file_path = CONVERTED_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=filename,
    )

# ---------------- ✅ NEW: Editor save callback (POST) ----------------
@app.post("/files/save")
async def save_from_editor(request: Request):
    """
    Required by document editors (OnlyOffice / similar).
    Even if you don't save yet, this MUST exist.
    """
    data = await request.json()
    print("Editor save callback received:", data)
    return {"error": 0}
