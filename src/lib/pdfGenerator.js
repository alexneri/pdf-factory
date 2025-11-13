const fs = require('fs');
const path = require('path');

/**
 * Save HTML to file
 */
function saveHTML(html, outputPath) {
  fs.writeFileSync(outputPath, html, 'utf-8');
}

/**
 * Generate PDF from HTML content
 * Note: This function saves HTML that is optimized for PDF conversion.
 * Use a browser (File > Print > Save as PDF) or command-line tools like:
 * - Chrome headless: chrome --headless --print-to-pdf=output.pdf input.html
 * - wkhtmltopdf: wkhtmltopdf input.html output.pdf
 */
async function generatePDF(html, outputPath, options = {}) {
  const htmlPath = outputPath.replace(/\.pdf$/, '.html');
  saveHTML(html, htmlPath);
  
  return {
    html: htmlPath,
    message: 'HTML generated successfully. Convert to PDF using a browser or command-line tool.'
  };
}

/**
 * Generate PDF with multiple sections
 */
async function generateMultiSectionPDF(sections, outputPath, options = {}) {
  // Combine all sections into one HTML document
  const combinedHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>
${sections.map((section, index) => {
  const pageBreak = index < sections.length - 1 ? '<div class="page-break"></div>' : '';
  return `<div class="section">${section}</div>${pageBreak}`;
}).join('\n')}
</body>
</html>
  `;

  return generatePDF(combinedHtml, outputPath, options);
}

module.exports = {
  generatePDF,
  generateMultiSectionPDF,
  saveHTML
};
