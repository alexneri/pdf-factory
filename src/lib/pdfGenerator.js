const fs = require('fs');
const path = require('path');
const pdf = require('html-pdf');

/**
 * Generate PDF from HTML content
 */
async function generatePDF(html, outputPath, options = {}) {
  return new Promise((resolve, reject) => {
    const pdfOptions = {
      format: options.format || 'A4',
      orientation: options.orientation || 'portrait',
      border: {
        top: options.marginTop || '20mm',
        right: options.marginRight || '20mm',
        bottom: options.marginBottom || '20mm',
        left: options.marginLeft || '20mm'
      },
      ...options.pdfOptions
    };

    pdf.create(html, pdfOptions).toFile(outputPath, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
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

/**
 * Save HTML to file (useful for debugging or manual conversion)
 */
function saveHTML(html, outputPath) {
  fs.writeFileSync(outputPath, html, 'utf-8');
}

module.exports = {
  generatePDF,
  generateMultiSectionPDF,
  saveHTML
};
