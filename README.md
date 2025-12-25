# Resume Analyzer - AI-Powered ATS Optimizer

An intelligent resume analysis tool that helps you optimize your resume for Applicant Tracking Systems (ATS) using AI.

## Features

- 📄 Upload PDF/DOCX resumes
- 🤖 AI-powered analysis using Google Gemini
- 📊 Comprehensive ATS scoring
- ✏️ Built-in resume editor
- 📥 Export edited resumes
- 💬 ChatGPT-style interface

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Key

1. Get your Gemini API key from: https://makersuite.google.com/app/apikey
2. Copy `.env.example` to `.env`
3. Add your API key to `.env`:
  - Make sure `.env` contains `REACT_APP_PUBLIC_BACKEND_URL` pointing to a public HTTPS URL when using ONLYOFFICE cloud. For local testing you can leave this empty and the app will use `http://localhost:3001`.

### Quick start (local)

1. Start the PDF service (in a separate terminal):

```powershell
cd "C:\Users\lenin\Resume Analyzer\services\pdf-service"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

2. Start the backend (separate terminal):

```powershell
cd "C:\Users\lenin\Resume Analyzer\backend"
#$env:PUBLIC_BACKEND_URL = "https://<your-public-url>"  # set this if your document server requires a public URL
npm install
npm start
```

3. Start the frontend (separate terminal):

```powershell
cd "C:\Users\lenin\Resume Analyzer"
npm start
```

Or use the included helper to open three windows automatically (Windows PowerShell):

```powershell
.\scripts\start-all.ps1
```

### Push to GitHub

1. Create a repository on GitHub (via the website) named e.g. `resume-analyzer`.
2. Push local repo:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin git@github.com:<your-username>/resume-analyzer.git
git push -u origin main
```

If you prefer HTTPS remote, use:

```bash
git remote add origin https://github.com/<your-username>/resume-analyzer.git
git push -u origin main
```

### Notes on ONLYOFFICE editor

 - The ONLYOFFICE cloud document server must be able to reach your backend file URLs. If you want ONLYOFFICE cloud to access documents hosted by your backend, expose the backend with a public HTTPS URL and set `PUBLIC_BACKEND_URL` (backend) and `REACT_APP_PUBLIC_BACKEND_URL` (frontend) to that URL. For local testing this is not required.
 - If iframe shows "refused to connect", ensure the `configUrl` encoded in the iframe points to an HTTPS public URL accessible by `documentserver.onlyoffice.com`.

### Cleaning & Organization performed

- Added `.gitignore` to exclude node_modules, virtualenvs, logs and env files.
- Normalized `services/pdf-service/requirements.txt`.
- Added `scripts/start-all.ps1` to simplify local development on Windows.

If you want, I can also add a GitHub Actions workflow to automatically run tests or deploy this project.