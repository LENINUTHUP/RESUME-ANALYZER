import React, { useState, useRef } from 'react';
import { Upload, Send, FileText, ChevronDown, ChevronUp, X, Download, Edit3, Sparkles, BarChart3 } from 'lucide-react';
import { parseResume } from './utils/fileParser';
import { analyzeResume } from './utils/geminiAPI';

const ResumeAnalyzer = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editorExpanded, setEditorExpanded] = useState(true);
  const [editorFilename, setEditorFilename] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [editableContent, setEditableContent] = useState('');
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      setUploadedFile(file);
    } else {
      alert('Please upload a PDF or DOCX file');
    }
  };

  const parseFile = async (file) => {
  try {
    console.log('📄 Parsing file:', file.name);
    const result = await parseResume(file);
    console.log('✅ File parsed successfully');
    return result;
  } catch (error) {
    console.error('❌ File parsing error:', error);
    // Fallback to mock data if parsing fails
    return {
      text: "Error parsing resume",
      html: "<p>Could not parse the uploaded resume. Please try a different file.</p>"
    };
  }
};

  const handleOpenEditor = async () => {
    if (!uploadedFile) {
      alert('No file uploaded to open in editor');
      return;
    }

    try {
      const form = new FormData();
      form.append('file', uploadedFile);

      const resp = await fetch('http://localhost:8001/convert/pdf-to-docx', {
        method: 'POST',
        body: form
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Upload failed: ${resp.status} ${txt}`);
      }

      const data = await resp.json();
      if (data && data.docx_filename) {
        setEditorFilename(data.docx_filename);
        setShowEditor(true);
      } else {
        throw new Error('Invalid response from conversion service');
      }
    } catch (err) {
      console.error('Error opening editor:', err);
      alert('Failed to open editor: ' + err.message);
    }
  };

  const analyzeWithGemini = async (jd, resumeText) => {
  // Import the function
  const { analyzeResume } = await import('./utils/geminiAPI');
  
  try {
    const analysis = await analyzeResume(jd, resumeText);
    return analysis;
  } catch (error) {
    console.error('Analysis error:', error);
    // Return mock data as fallback
    return {
      overallScore: 67,
      sections: [
            {
              name: "Skills Match",
              score: 45,
              matched: ["JavaScript", "React", "Node.js"],
              missing: ["TypeScript", "AWS", "Docker"],
              suggestions: "Add TypeScript and cloud technologies like AWS to match job requirements. These are critical skills mentioned in the JD."
            },
            {
              name: "Work Experience",
              score: 75,
              matched: ["5 years experience", "Team leadership"],
              missing: ["Quantifiable achievements", "Specific technologies from JD"],
              suggestions: "Add metrics and numbers to your achievements. For example: 'Increased application performance by 40%' or 'Reduced load time by 2 seconds'."
            },
            {
              name: "ATS Compatibility",
              score: 80,
              matched: ["Standard sections", "Clear formatting"],
              missing: ["Some keywords", "Action verbs"],
              suggestions: "Use more action verbs like 'Developed', 'Implemented', 'Optimized'. Ensure all JD keywords are present."
            },
            {
              name: "Education",
              score: 90,
              matched: ["Relevant degree", "University mentioned"],
              missing: [],
              suggestions: "Education section looks good! Consider adding relevant coursework if applicable."
            },
            {
              name: "Keywords Density",
              score: 55,
              matched: ["React", "JavaScript", "development"],
              missing: ["agile", "CI/CD", "microservices"],
              suggestions: "Include more keywords from the job description naturally throughout your resume."
            }
          ]
    };
  }
};
const handleAnalyze = async () => {
  if (!jobDescription.trim() || !uploadedFile) {
    alert('Please provide both job description and resume');
    return;
  }

  setIsAnalyzing(true);
  
  const userMessage = {
    type: 'user',
    content: `📋 Job Description provided\n📄 Uploaded: ${uploadedFile.name}`
  };
  setMessages([userMessage]);

  // Parse the ACTUAL uploaded resume (not mock data)
  console.log('🔍 Parsing uploaded file...');
  const parsedResume = await parseResume(uploadedFile);  // Use imported function
  setResumeData(parsedResume);
  setEditableContent(parsedResume.html);
  console.log('✅ Resume parsed and set');

  setMessages(prev => [...prev, {
    type: 'ai',
    content: '🔍 Analyzing your resume against the job description...',
    loading: true
  }]);

  // Analyze with Gemini API
  const analysis = await analyzeResume(jobDescription, parsedResume.text);

  setMessages(prev => {
    const withoutLoading = prev.filter(m => !m.loading);
    return [...withoutLoading, {
      type: 'ai',
      content: 'analysis-complete',
      analysis: analysis
    }];
  });

  setIsAnalyzing(false);
};

  const ScoreCircle = ({ score, size = 'large' }) => {
    const radius = size === 'large' ? 40 : 20;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size === 'large' ? 100 : 50} height={size === 'large' ? 100 : 50} className="transform -rotate-90">
          <circle
            cx={size === 'large' ? 50 : 25}
            cy={size === 'large' ? 50 : 25}
            r={radius}
            stroke="#374151"
            strokeWidth={size === 'large' ? 8 : 4}
            fill="none"
          />
          <circle
            cx={size === 'large' ? 50 : 25}
            cy={size === 'large' ? 50 : 25}
            r={radius}
            stroke={color}
            strokeWidth={size === 'large' ? 8 : 4}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <span className={`absolute ${size === 'large' ? 'text-2xl' : 'text-sm'} font-bold`} style={{ color }}>
          {score}
        </span>
      </div>
    );
  };

  const ScoreBoard = ({ analysis }) => {
    return (
      <div className="bg-[#2f2f2f] rounded-lg border border-[#4e4e4e] p-6 mb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-blue-400" size={24} />
            <h3 className="text-xl font-bold text-gray-100">ATS Score Dashboard</h3>
          </div>
          <ScoreCircle score={analysis.overallScore} />
        </div>
        
        <div className="space-y-4">
          {analysis.sections.map((section, idx) => (
            <div key={idx} className="border-b border-[#4e4e4e] last:border-b-0 pb-4 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-200">{section.name}</span>
                <div className="flex items-center gap-2">
                  <ScoreCircle score={section.score} size="small" />
                </div>
              </div>
              
              <div className="w-full bg-[#1f1f1f] rounded-full h-2 mb-3">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    section.score >= 75 ? 'bg-green-500' : 
                    section.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${section.score}%` }}
                />
              </div>

              {section.matched.length > 0 && (
                <div className="mb-2">
                  <p className="text-sm text-gray-400 mb-1">✅ Matched:</p>
                  <div className="flex flex-wrap gap-1">
                    {section.matched.map((item, i) => (
                      <span key={i} className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {section.missing.length > 0 && (
                <div className="mb-2">
                  <p className="text-sm text-gray-400 mb-1">⚠️ Missing:</p>
                  <div className="flex flex-wrap gap-1">
                    {section.missing.map((item, i) => (
                      <span key={i} className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-400 mt-2">
                <span className="font-medium text-gray-300">💡 Suggestion:</span> {section.suggestions}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

const ResumeEditor = () => {
  return (
    <div className={`fixed right-0 top-0 h-full bg-[#1f1f1f] shadow-2xl transition-all duration-300 ${
      editorExpanded ? 'w-1/2' : 'w-16'
    } border-l border-[#4e4e4e] z-50 flex flex-col`}>

      {/* Editor Header */}
      <div className="bg-[#2f2f2f] border-b border-[#4e4e4e] p-4 flex items-center justify-between flex-shrink-0">
        {editorExpanded && (
          <>
            <div className="flex items-center gap-2">
              <Edit3 className="text-blue-400" size={20} />
              <h3 className="font-bold text-lg text-gray-100">Resume Editor</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditorExpanded(false)}
                className="p-2 hover:bg-[#3f3f3f] rounded transition text-gray-300"
              >
                <ChevronDown size={20} />
              </button>
              <button
                onClick={() => setShowEditor(false)}
                className="p-2 hover:bg-[#3f3f3f] rounded transition text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
          </>
        )}
        {!editorExpanded && (
          <button
            onClick={() => setEditorExpanded(true)}
            className="w-full flex justify-center py-2 hover:bg-[#3f3f3f] rounded transition text-gray-300"
          >
            <ChevronUp size={20} />
          </button>
        )}
      </div>

      {editorExpanded && (
        <>
          {/* ONLYOFFICE Editor */}
          <div className="flex-1 bg-[#1a1a1a]">
            {editorFilename ? (
              <iframe
                title="ONLYOFFICE Editor"
                className="w-full h-full border-0"
                src={`https://documentserver.onlyoffice.com/web-apps/apps/documenteditor/main/index.html?configUrl=${encodeURIComponent(
                  `${process.env.REACT_APP_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/onlyoffice/config?filename=${editorFilename}`
                )}`}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                No document loaded
              </div>
            )}
          </div>

          {/* Footer (unchanged) */}
          <div className="border-t border-[#4e4e4e] p-4 bg-[#2f2f2f] flex-shrink-0">
            <div className="flex gap-3">

            </div>
          </div>
        </>
      )}
    </div>
  );
};

  return (
    <div className="min-h-screen bg-[#212121] text-gray-100">
      {/* Header */}
      <header className="bg-[#171717] border-b border-[#2f2f2f] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-100">Resume Analyzer</h1>
              <p className="text-gray-500 text-xs">AI-Powered ATS Optimization</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - With proper spacing to avoid overlap with fixed input */}
      <div className={`transition-all duration-300 ${showEditor && editorExpanded ? 'mr-[50%]' : showEditor ? 'mr-16' : ''}`}>
        <div className="max-w-4xl mx-auto px-6 py-8 pb-64">
          {/* Chat Messages */}
          <div className="space-y-6 mb-6">
            {messages.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="text-white" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-200 mb-2">Welcome to Resume Analyzer</h2>
                <p className="text-gray-500">Upload your resume and paste a job description to get started</p>
              </div>
            )}
            
            {messages.map((message, idx) => (
              <div key={idx} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl ${
                  message.type === 'user' 
                    ? 'bg-[#2f2f2f] border border-[#4e4e4e]' 
                    : 'bg-transparent'
                } rounded-2xl p-5`}>
                  {message.type === 'user' ? (
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-200">{message.content}</pre>
                  ) : message.content === 'analysis-complete' ? (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Sparkles size={18} className="text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-100">Analysis Complete</h3>
                      </div>
                      <p className="text-gray-400 mb-6">Here's your comprehensive ATS compatibility report:</p>
                      
                      <ScoreBoard analysis={message.analysis} />

                      <div className="flex gap-3 mt-6">
                        <button 
                          onClick={handleOpenEditor}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition font-medium flex items-center justify-center gap-2"
                        >
                          <Edit3 size={18} />
                          Edit Resume
                        </button>
                        <button className="flex-1 bg-[#2f2f2f] hover:bg-[#3f3f3f] border border-[#4e4e4e] text-gray-200 py-3 rounded-lg transition font-medium flex items-center justify-center gap-2">
                          <Download size={18} />
                          Download Report
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      {message.loading && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                      )}
                      <p className="text-gray-300">{message.content}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Fixed Input Section at Bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#171717] border-t border-[#2f2f2f] z-30" style={{ right: showEditor && editorExpanded ? '50%' : showEditor ? '64px' : '0' }}>
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="bg-[#2f2f2f] rounded-xl border border-[#4e4e4e] p-4">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste job description here..."
                    className="w-full bg-[#1f1f1f] border border-[#4e4e4e] rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm text-gray-200 placeholder-gray-500"
                    rows={3}
                  />
                  
                  {uploadedFile && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-300 bg-[#1f1f1f] p-2 rounded-lg border border-[#4e4e4e]">
                      <FileText size={16} className="text-blue-400 flex-shrink-0" />
                      <span className="truncate flex-1">{uploadedFile.name}</span>
                      <button 
                        onClick={() => setUploadedFile(null)}
                        className="text-gray-500 hover:text-gray-300 flex-shrink-0"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 flex-shrink-0">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.docx"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#3f3f3f] hover:bg-[#4f4f4f] text-gray-200 p-3 rounded-lg transition border border-[#4e4e4e]"
                    title="Upload Resume"
                  >
                    <Upload size={20} />
                  </button>
                  
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !jobDescription.trim() || !uploadedFile}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Send size={20} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resume Editor */}
      {showEditor && <ResumeEditor />}
    </div>
  );
};

export default ResumeAnalyzer;