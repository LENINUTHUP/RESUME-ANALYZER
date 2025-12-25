from pdf2docx import Converter
import os
import uuid
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Determine workspace root relative to this file and use shared-docs from there.
# This is robust to the current working directory used to start the service.
WORKSPACE_ROOT = Path(__file__).resolve().parents[3]
SHARED_DIR = WORKSPACE_ROOT / "shared-docs"
UPLOAD_DIR = SHARED_DIR / "uploads"
CONVERTED_DIR = SHARED_DIR / "converted"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
CONVERTED_DIR.mkdir(parents=True, exist_ok=True)


def convert_pdf_to_docx(pdf_path: str) -> str:
    filename = f"{uuid.uuid4().hex}.docx"
    docx_path = str(CONVERTED_DIR / filename)

    try:
        cv = Converter(pdf_path)
        cv.convert(docx_path)
        cv.close()
    except Exception as e:
        logger.exception("PDF to DOCX conversion failed for %s", pdf_path)
        raise RuntimeError(f"Conversion failed for {pdf_path}: {e}") from e

    return filename
