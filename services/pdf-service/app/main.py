from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
from pathlib import Path
from .converter import convert_pdf_to_docx
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
SHARED_DIR = WORKSPACE_ROOT / "shared-docs"
UPLOAD_DIR = str(SHARED_DIR / "uploads")
Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)


@app.post("/convert/pdf-to-docx")
async def pdf_to_docx(file: UploadFile = File(...)):
    filename_lower = file.filename.lower()

    # Accept both PDF (convert) and DOCX (save directly to converted)
    try:
        if filename_lower.endswith('.pdf'):
            pdf_path = os.path.join(UPLOAD_DIR, file.filename)
            with open(pdf_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            docx_filename = convert_pdf_to_docx(pdf_path)

            return {"status": "success", "docx_filename": docx_filename}

        elif filename_lower.endswith('.docx'):
            # Save the uploaded DOCX directly into the converted folder with a unique name
            converted_dir = SHARED_DIR / "converted"
            converted_dir.mkdir(parents=True, exist_ok=True)
            new_name = f"{uuid.uuid4().hex}.docx"
            dest_path = converted_dir / new_name
            with open(dest_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            return {"status": "success", "docx_filename": new_name}

        else:
            raise HTTPException(status_code=400, detail="Only PDF or DOCX files are supported")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
