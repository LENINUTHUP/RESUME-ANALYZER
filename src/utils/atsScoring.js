// ATS Scoring Algorithm

export const calculateATSScore = (resumeText, jobDescription) => {
  const scores = {
    keywordMatch: calculateKeywordMatch(resumeText, jobDescription),
    formatting: calculateFormattingScore(resumeText),
    sectionCompleteness: calculateSectionScore(resumeText),
    experienceRelevance: calculateExperienceScore(resumeText, jobDescription),
  };

  const weights = {
    keywordMatch: 0.35,
    formatting: 0.20,
    sectionCompleteness: 0.25,
    experienceRelevance: 0.20,
  };

  const overallScore = Object.keys(scores).reduce((total, key) => {
    return total + (scores[key] * weights[key]);
  }, 0);

  return {
    overallScore: Math.round(overallScore),
    details: scores
  };
};

// Calculate keyword match percentage
const calculateKeywordMatch = (resumeText, jobDescription) => {
  const resumeLower = resumeText.toLowerCase();
  const jdLower = jobDescription.toLowerCase();
  
  // Extract important keywords from JD (simplified - enhance with NLP)
  const keywords = jdLower
    .split(/\W+/)
    .filter(word => word.length > 3)
    .filter(word => !commonWords.includes(word));
  
  const uniqueKeywords = [...new Set(keywords)];
  const matchedKeywords = uniqueKeywords.filter(keyword => 
    resumeLower.includes(keyword)
  );
  
  return Math.round((matchedKeywords.length / uniqueKeywords.length) * 100);
};

// Calculate formatting score
const calculateFormattingScore = (resumeText) => {
  let score = 100;
  
  // Check for standard sections
  const requiredSections = [
    /experience|work history/i,
    /education/i,
    /skills/i,
    /contact|email|phone/i
  ];
  
  requiredSections.forEach(section => {
    if (!section.test(resumeText)) {
      score -= 15;
    }
  });
  
  // Check for bullet points
  if (!/[•\-\*]/.test(resumeText)) {
    score -= 10;
  }
  
  // Check for dates
  if (!/\d{4}/.test(resumeText)) {
    score -= 10;
  }
  
  return Math.max(0, score);
};

// Calculate section completeness
const calculateSectionScore = (resumeText) => {
  const sections = {
    contact: /email|phone|linkedin/i.test(resumeText),
    summary: /summary|objective|profile/i.test(resumeText),
    experience: /experience|work|employment/i.test(resumeText),
    education: /education|degree|university/i.test(resumeText),
    skills: /skills|technologies|technical/i.test(resumeText),
  };
  
  const presentSections = Object.values(sections).filter(Boolean).length;
  return Math.round((presentSections / Object.keys(sections).length) * 100);
};

// Calculate experience relevance
const calculateExperienceScore = (resumeText, jobDescription) => {
  const resumeLower = resumeText.toLowerCase();
  const jdLower = jobDescription.toLowerCase();
  
  // Extract key skills/technologies from JD
  const techKeywords = [
    'react', 'node', 'python', 'java', 'javascript', 'typescript',
    'aws', 'docker', 'kubernetes', 'sql', 'mongodb', 'api', 'agile'
  ];
  
  const matchedTech = techKeywords.filter(tech => 
    resumeLower.includes(tech) && jdLower.includes(tech)
  );
  
  const score = (matchedTech.length / techKeywords.length) * 100;
  return Math.round(score);
};

// Common words to ignore
const commonWords = [
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have',
  'will', 'your', 'their', 'what', 'about', 'which', 'when',
  'where', 'who', 'how', 'all', 'each', 'other', 'some', 'these'
];

export const extractKeywords = (text) => {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter(word => word.length > 3)
    .filter(word => !commonWords.includes(word))
    .reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});
};