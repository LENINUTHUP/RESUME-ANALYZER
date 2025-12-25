import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import mammoth from 'mammoth';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// PDF Parser
export const parsePDF = async (file) => {
  try {
    console.log('📄 Parsing PDF:', file.name);
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    let allItems = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      textContent.items.forEach(item => {
        allItems.push({
          text: item.str,
          height: item.height,
          y: item.transform[5]
        });
      });
      
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    console.log('✅ PDF parsed, length:', fullText.length);
    
    return {
      text: fullText,
      html: formatResumeHTML(fullText, allItems)
    };
  } catch (error) {
    console.error('❌ PDF parsing error:', error);
    throw new Error('Failed to parse PDF file: ' + error.message);
  }
};

// DOCX Parser
export const parseDOCX = async (file) => {
  try {
    console.log('📄 Parsing DOCX:', file.name);
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    
    const plainText = result.value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    console.log('✅ DOCX parsed, length:', plainText.length);
    
    return {
      text: plainText,
      html: formatDOCXHTML(result.value)
    };
  } catch (error) {
    console.error('❌ DOCX parsing error:', error);
    throw new Error('Failed to parse DOCX file: ' + error.message);
  }
};

// Format DOCX HTML for dark theme editor
const formatDOCXHTML = (html) => {
  // Wrap in a styled container with proper colors for dark theme
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 100%;">
      ${html}
    </div>
  `;
};

// Format plain text into structured HTML for dark theme
const formatResumeHTML = (text, items = []) => {
  const lines = text.split('\n').filter(line => line.trim());
  
  let html = '<div style="font-family: \'Segoe UI\', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 100%;">';
  
  // Detect common resume sections
  const sectionPatterns = [
    /^(EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT)/i,
    /^(EDUCATION|ACADEMIC|QUALIFICATIONS)/i,
    /^(SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES)/i,
    /^(SUMMARY|PROFESSIONAL SUMMARY|PROFILE|OBJECTIVE)/i,
    /^(CERTIFICATIONS?|LICENSES?)/i,
    /^(PROJECTS?|PORTFOLIO)/i,
    /^(ACHIEVEMENTS?|AWARDS?|HONORS?)/i
  ];
  
  let inBulletList = false;
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;
    
    // Check if it's a section header
    const isSection = sectionPatterns.some(pattern => pattern.test(trimmedLine));
    
    // Check if it's a name (first line, all caps or title case, short)
    const isName = index === 0 && trimmedLine.length < 50 && (
      trimmedLine === trimmedLine.toUpperCase() || 
      /^[A-Z][a-z]+ [A-Z][a-z]+/.test(trimmedLine)
    );
    
    // Check if it's contact info (contains email, phone, etc.)
    const isContact = /@|phone|email|linkedin|github|\+?\d{10}|\(\d{3}\)/i.test(trimmedLine);
    
    // Check if it's a date (year pattern)
    const hasDate = /\b(20\d{2}|19\d{2})\b/.test(trimmedLine);
    
    // Check if it's a bullet point
    const isBullet = /^[•\-\*·]/.test(trimmedLine) || trimmedLine.startsWith('○') || trimmedLine.startsWith('▪');
    
    if (isName) {
      html += `<h1 style="margin: 0 0 8px 0; font-size: 32px; color: #111827; font-weight: 700; text-align: center;">${trimmedLine}</h1>`;
    } else if (isContact && index < 5) {
      html += `<p style="margin: 4px 0; color: #4b5563; font-size: 14px; text-align: center;">${trimmedLine}</p>`;
    } else if (isSection) {
      if (inBulletList) {
        html += '</ul>';
        inBulletList = false;
      }
      html += `<h2 style="color: #1f2937; border-bottom: 2px solid #2563eb; padding-bottom: 6px; font-size: 20px; margin: 24px 0 12px 0; font-weight: 600;">${trimmedLine}</h2>`;
    } else if (isBullet) {
      if (!inBulletList) {
        html += '<ul style="margin: 8px 0; padding-left: 20px; color: #374151; font-size: 14px;">';
        inBulletList = true;
      }
      const bulletText = trimmedLine.replace(/^[•\-\*·○▪]\s*/, '');
      html += `<li style="margin-bottom: 6px;">${bulletText}</li>`;
    } else if (hasDate && trimmedLine.length < 100) {
      if (inBulletList) {
        html += '</ul>';
        inBulletList = false;
      }
      // Likely a job title or education with dates
      html += `<div style="display: flex; justify-content: space-between; align-items: baseline; margin: 12px 0 4px 0;">
        <h3 style="margin: 0; font-size: 17px; color: #111827; font-weight: 600;">${trimmedLine}</h3>
      </div>`;
    } else {
      if (inBulletList) {
        html += '</ul>';
        inBulletList = false;
      }
      html += `<p style="margin: 6px 0; color: #374151; font-size: 14px;">${trimmedLine}</p>`;
    }
  });
  
  if (inBulletList) {
    html += '</ul>';
  }
  
  html += '</div>';
  return html;
};

// Main parser function
export const parseResume = async (file) => {
  const fileType = file.type;
  
  console.log('📄 File type:', fileType);
  
  if (fileType === 'application/pdf') {
    return await parsePDF(file);
  } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return await parseDOCX(file);
  } else {
    throw new Error('Unsupported file type. Please upload PDF or DOCX.');
  }
};