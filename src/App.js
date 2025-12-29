import React, { useState, useRef } from "react";
import {
  Upload,
  Send,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  Edit3,
  Sparkles,
  BarChart3
} from "lucide-react";
import { parseResume } from "./utils/fileParser";
import { analyzeResume } from "./utils/geminiAPI";

const ResumeAnalyzer = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editorExpanded, setEditorExpanded] = useState(true);
  const [editorFilename, setEditorFilename] = useState(null);

  const fileInputRef = useRef(null);

  /* ======================
     FILE UPLOAD
  ====================== */
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (
      file &&
      (file.type === "application/pdf" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    ) {
      setUploadedFile(file);
    } else {
      alert("Please upload a PDF or DOCX file");
    }
  };

  /* ======================
     OPEN EDITOR (PDF → DOCX)
  ====================== */
  const handleOpenEditor = async () => {
    if (!uploadedFile) {
      alert("No file uploaded");
      return;
    }

    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      if (!BACKEND_URL) {
        throw new Error("REACT_APP_BACKEND_URL is not configured");
      }

      const form = new FormData();
      form.append("file", uploadedFile);

      const resp = await fetch(
        `${BACKEND_URL}/api/convert/pdf-to-docx`,
        {
          method: "POST",
          body: form
        }
      );

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Upload failed: ${resp.status} ${txt}`);
      }

      const data = await resp.json();
      if (!data.docx_filename) {
        throw new Error("Invalid response from backend");
      }

      setEditorFilename(data.docx_filename);
      setShowEditor(true);
    } catch (err) {
      console.error("Error opening editor:", err);
      alert(err.message);
    }
  };

  /* ======================
     ANALYZE RESUME
  ====================== */
  const handleAnalyze = async () => {
    if (!jobDescription.trim() || !uploadedFile) {
      alert("Provide job description and resume");
      return;
    }

    setIsAnalyzing(true);
    setMessages([
      {
        type: "user",
        content: `📋 Job Description provided\n📄 Uploaded: ${uploadedFile.name}`
      }
    ]);

    try {
      const parsed = await parseResume(uploadedFile);

      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          content: "🔍 Analyzing resume...",
          loading: true
        }
      ]);

      const analysis = await analyzeResume(
        jobDescription,
        parsed.text
      );

      setMessages([
        {
          type: "user",
          content: `📋 Job Description provided\n📄 Uploaded: ${uploadedFile.name}`
        },
        {
          type: "ai",
          content: "analysis-complete",
          analysis
        }
      ]);
    } catch (err) {
      console.error(err);
      setMessages([
        {
          type: "ai",
          content: `❌ ${err.message}`
        }
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ======================
     SCORE COMPONENTS
  ====================== */
  const ScoreCircle = ({ score }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
      <svg width="100" height="100" className="-rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="#374151"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="#3b82f6"
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
        <text
          x="50"
          y="55"
          textAnchor="middle"
          className="fill-white rotate-90 text-xl font-bold"
        >
          {score}
        </text>
      </svg>
    );
  };

  /* ======================
     RESUME EDITOR (ONLYOFFICE)
  ====================== */
  const ResumeEditor = () => (
    <div
      className={`fixed right-0 top-0 h-full bg-[#1f1f1f] transition-all ${
        editorExpanded ? "w-1/2" : "w-16"
      } border-l border-[#4e4e4e] z-50`}
    >
      <div className="p-4 bg-[#2f2f2f] flex justify-between">
        <h3 className="font-bold">Resume Editor</h3>
        <button onClick={() => setShowEditor(false)}>
          <X />
        </button>
      </div>

      {editorFilename && (
        <iframe
          title="ONLYOFFICE"
          className="w-full h-full"
          src={`https://documentserver.onlyoffice.com/web-apps/apps/documenteditor/main/index.html?configUrl=${encodeURIComponent(
            `${process.env.REACT_APP_BACKEND_URL}/api/onlyoffice/config?filename=${editorFilename}`
          )}`}
        />
      )}
    </div>
  );

  /* ======================
     UI
  ====================== */
  return (
    <div className="min-h-screen bg-[#212121] text-white p-6">
      <h1 className="text-2xl font-bold mb-4">Resume Analyzer</h1>

      <textarea
        className="w-full p-3 text-black"
        placeholder="Paste job description..."
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
      />

      <div className="flex gap-3 mt-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          hidden
        />
        <button onClick={() => fileInputRef.current.click()}>
          <Upload />
        </button>
        <button onClick={handleAnalyze} disabled={isAnalyzing}>
          <Send />
        </button>
      </div>

      {messages.map((m, i) =>
        m.content === "analysis-complete" ? (
          <ScoreCircle key={i} score={m.analysis.overallScore} />
        ) : (
          <p key={i}>{m.content}</p>
        )
      )}

      {messages.some((m) => m.content === "analysis-complete") && (
        <button onClick={handleOpenEditor} className="mt-4">
          <Edit3 /> Edit Resume
        </button>
      )}

      {showEditor && <ResumeEditor />}
    </div>
  );
};

export default ResumeAnalyzer;
