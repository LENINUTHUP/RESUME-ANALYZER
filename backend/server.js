import express from "express";
import path from "path";
import cors from "cors";
import multer from "multer";
import fetch from "node-fetch";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3001;

// middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// file upload (memory)
const upload = multer({ storage: multer.memoryStorage() });

// serve shared docs safely
const SHARED_DOCS_PATH = path.join(process.cwd(), "shared-docs");
const CONVERTED_DIR = path.join(SHARED_DOCS_PATH, "converted");

fs.mkdirSync(CONVERTED_DIR, { recursive: true });

app.use("/files", express.static(SHARED_DOCS_PATH));

app.post("/api/convert/pdf-to-docx", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL;
    if (!PDF_SERVICE_URL) {
      return res.status(500).json({
        error: "PDF_SERVICE_URL is not configured on the server"
      });
    }

    const response = await fetch(
      `${PDF_SERVICE_URL}/convert/pdf-to-docx`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/pdf"
        },
        body: req.file.buffer
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: text });
    }

    const disposition = response.headers.get("content-disposition");
    const filename =
      disposition?.split("filename=")[1]?.replace(/"/g, "") ||
      `converted-${Date.now()}.docx`;

    const filePath = path.join(CONVERTED_DIR, filename);
    const buffer = Buffer.from(await response.arrayBuffer());

    fs.writeFileSync(filePath, buffer);

    res.json({
      status: "success",
      docx_filename: filename
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Conversion failed" });
  }
});

app.get("/api/onlyoffice/config", (req, res) => {
  const { filename } = req.query;

  if (!filename) {
    return res.status(400).json({ error: "filename is required" });
  }

  const PUBLIC_BACKEND_URL = process.env.PUBLIC_BACKEND_URL;
  if (!PUBLIC_BACKEND_URL) {
    return res.status(500).json({
      error: "PUBLIC_BACKEND_URL is not configured on the server"
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

app.listen(PORT, () => {
  console.log(`Node backend running on port ${PORT}`);
});
