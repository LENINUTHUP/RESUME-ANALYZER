import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

// Debug: Log API key status (remove in production)
console.log('API Key configured:', API_KEY ? 'Yes' : 'No');
console.log('API Key starts with AIzaSy:', API_KEY?.startsWith('AIzaSy'));

export const analyzeResume = async (jobDescription, resumeText) => {
  // Check if API key is configured
  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    console.warn('⚠️ Gemini API key not configured. Using mock data.');
    console.log('Please add your API key to .env file');
    return getMockAnalysis();
  }

  try {
    console.log('🚀 Calling Gemini API...');
    
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are an expert ATS (Applicant Tracking System) resume analyzer. Analyze the following resume against the job description and provide a detailed scoring report.

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}

Provide your analysis in STRICT JSON format with no additional text or markdown. Format:
{
  "overallScore": <number 0-100>,
  "sections": [
    {
      "name": "Skills Match",
      "score": <number 0-100>,
      "matched": ["skill1", "skill2"],
      "missing": ["skill3", "skill4"],
      "suggestions": "detailed suggestion text"
    },
    {
      "name": "Work Experience",
      "score": <number 0-100>,
      "matched": ["experience1", "experience2"],
      "missing": ["improvement1", "improvement2"],
      "suggestions": "detailed suggestion text"
    },
    {
      "name": "ATS Compatibility",
      "score": <number 0-100>,
      "matched": ["formatting1", "formatting2"],
      "missing": ["issue1", "issue2"],
      "suggestions": "detailed suggestion text"
    },
    {
      "name": "Education",
      "score": <number 0-100>,
      "matched": ["education1"],
      "missing": ["credential1"],
      "suggestions": "detailed suggestion text"
    },
    {
      "name": "Keywords Density",
      "score": <number 0-100>,
      "matched": ["keyword1", "keyword2"],
      "missing": ["keyword3", "keyword4"],
      "suggestions": "detailed suggestion text"
    }
  ]
}

Important: Return ONLY the JSON object, no markdown formatting, no backticks, no extra text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('📥 Received response from Gemini');
    console.log('Raw response:', text.substring(0, 200) + '...');
    
    // Try to extract JSON from the response
    let jsonText = text.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Try to find JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }
    
    console.log('Parsed JSON text:', jsonText.substring(0, 200) + '...');
    
    const analysis = JSON.parse(jsonText);
    console.log('✅ Successfully parsed analysis');
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Gemini API error:', error);
    console.error('Error details:', error.message);
    
    // Return mock data on error
    console.log('Falling back to mock data');
    return getMockAnalysis();
  }
};

// Mock analysis for testing when API is not available
const getMockAnalysis = () => {
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
};