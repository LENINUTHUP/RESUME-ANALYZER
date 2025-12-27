import express from "express";
import path from "path";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

// middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// serve shared docs safely
const SHARED_DOCS_PATH = path.join(process.cwd(), "shared-docs");
app.use("/files", express.static(SHARED_DOCS_PATH));

// ONLYOFFICE config endpoint
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
