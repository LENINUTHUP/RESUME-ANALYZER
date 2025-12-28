import express from "express";
import path from "path";
import cors from "cors";
import multer from "multer";
import fetch from "node-fetch";
import fs from "fs";
import FormData from "form-data";

const app = express();
const PORT = process.env.PORT || 3001;

/* =======================
   MIDDLEWARE
======================= */
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* =======================
   FILE UPLOAD (MEMORY)
======================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

/* =======================
   SHARED FILE STORAGE
======================= */
const SHARED_DOCS_PATH = path.join(process.cwd(), "shared-docs");
const CONVERTED_DIR = path.join(SHARED_DOCS_PATH, "converted");

fs.mkdirSync(CONVERTED_DIR, { recursive: true });

app.use("/files", express.static(SHARED_DOCS_PATH));

/* =======================
   PDF → DOCX CONVERSION
======================= */
app.post("/api/convert/pdf-to-docx", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL;
    if (!PDF_SERVICE_URL) {
      return res.status(500).json({
        error: "PDF_SERVICE_URL is not configured"
      });
    }

    // 🔑 SEND AS multipart/form-data (CRITICAL FIX)
    const formData = new FormData();
    formData.append("file", req.file.buffer, req.file.originalname);

    const response = await fetch(
      `${PDF_SERVICE_URL}/convert/pdf-to-docx`,
      {
        method: "POST",
        body: formData,
        headers: formData.getHeaders()
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();

    if (!data.docx_filename) {
      return res.status(500).json({
        error: "Invalid response from PDF service"
      });
    }

    res.json({
      status: "success",
      docx_filename: data.docx_filename
    });

  } catch (err) {
    console.error("PDF → DOCX error:", err);
    res.status(500).json({ error: "Conversion failed" });
  }
});

/* =======================
   ONLYOFFICE CONFIG
======================= */
app.get("/api/onlyoffice/config", (req, res) => {
  const { filename } = req.query;

  if (!filename) {
    return res.status(400).json({ error: "filename is required" });
  }

  const PUBLIC_BACKEND_URL = process.env.PUBLIC_BACKEND_URL;
  if (!PUBLIC_BACKEND_URL) {
    return res.status(500).json({
      error: "PUBLIC_BACKEND_URL is not configured"
    });
  }

  const fileUrl = `${PUBLIC_BACKEND_URL}/files/converted/${filename}`;

  res.json({
    document: {
      fileType: "docx",
      title: filename,
      url: fileUrl,
      key: `${filename}-${Date.now()}`
    },
    documentType: "word",
    editorConfig: {
      mode: "edit",
      user: {
        id: "user-1",
        name: "User"
      }
    }
  });
});

/* =======================
   START SERVER
======================= */
app.listen(PORT, () => {
  console.log(`✅ Node backend running on port ${PORT}`);
});
