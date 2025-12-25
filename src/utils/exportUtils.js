import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

// Export as PDF
export const exportToPDF = async (htmlContent, filename = 'resume.pdf') => {
  try {
    // Create a temporary div to render HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.width = '210mm'; // A4 width
    tempDiv.style.padding = '20mm';
    tempDiv.style.backgroundColor = 'white';
    document.body.appendChild(tempDiv);

    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      backgroundColor: '#ffffff'
    });

    document.body.removeChild(tempDiv);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('PDF export error:', error);
    return false;
  }
};

// Export as DOCX (simplified - enhance as needed)
export const exportToDOCX = async (htmlContent, filename = 'resume.docx') => {
  try {
    // Parse HTML to extract text (simplified version)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const text = tempDiv.textContent || tempDiv.innerText;

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: text,
            spacing: {
              after: 200,
            },
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename);
    
    return true;
  } catch (error) {
    console.error('DOCX export error:', error);
    return false;
  }
};