const fs = require('fs');
const path = require('path');
const { parseMarkdown, extractHeadings, addHeadingIds } = require('./markdownProcessor');
const { loadTemplate, getDefaultTemplatePath, renderTemplate } = require('./templateRenderer');
const { generatePDF, saveHTML } = require('./pdfGenerator');

/**
 * Publish a single markdown file to PDF
 */
async function publishFile(inputPath, options = {}) {
  // Read the markdown file
  const markdown = fs.readFileSync(inputPath, 'utf-8');
  
  // Parse markdown to HTML
  let contentHtml = parseMarkdown(markdown);
  contentHtml = addHeadingIds(contentHtml);
  
  // Prepare metadata
  const title = options.title || path.basename(inputPath, '.md');
  const author = options.author || '';
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Build sections
  const sections = [];
  
  // Add cover page if needed
  if (options.cover !== false) {
    const coverTemplate = options.coverTemplate 
      ? options.coverTemplate 
      : getDefaultTemplatePath('cover');
    const coverHtml = loadTemplate(coverTemplate, {
      title,
      author,
      subtitle: options.subtitle || '',
      date
    });
    sections.push(coverHtml);
  }
  
  // Add title page if needed
  if (options.titlePage !== false) {
    const titleTemplate = options.titleTemplate 
      ? options.titleTemplate 
      : getDefaultTemplatePath('title');
    const titleHtml = loadTemplate(titleTemplate, {
      title,
      author,
      subtitle: options.subtitle || '',
      date,
      version: options.version || ''
    });
    sections.push(titleHtml);
  }
  
  // Add table of contents if enabled
  if (options.toc !== false) {
    const headings = extractHeadings(markdown);
    if (headings.length > 0) {
      const tocTemplate = getDefaultTemplatePath('toc');
      const tocHtml = loadTemplate(tocTemplate, {
        items: headings
      });
      sections.push(tocHtml);
    }
  }
  
  // Add main content
  const contentTemplate = getDefaultTemplatePath('content');
  const finalContent = loadTemplate(contentTemplate, {
    content: contentHtml
  });
  sections.push(finalContent);
  
  // Combine all sections
  const combinedHtml = sections.map((section, index) => {
    const pageBreak = index < sections.length - 1 
      ? '<div style="page-break-after: always;"></div>' 
      : '';
    return `${section}${pageBreak}`;
  }).join('\n');
  
  // Determine output path
  const outputPath = options.output || inputPath.replace(/\.md$/, '.pdf');
  const htmlOutputPath = outputPath.replace(/\.pdf$/, '.html');
  
  // Save HTML for debugging or manual conversion
  saveHTML(combinedHtml, htmlOutputPath);
  console.log(`✓ HTML saved to: ${htmlOutputPath}`);
  
  console.log('\nTo convert to PDF, you can:');
  console.log('  1. Open the HTML file in a browser and use Print > Save as PDF');
  console.log('  2. Use Chrome headless: chrome --headless --print-to-pdf=' + outputPath + ' ' + htmlOutputPath);
  console.log('  3. Use wkhtmltopdf: wkhtmltopdf ' + htmlOutputPath + ' ' + outputPath);
  
  return {
    html: htmlOutputPath,
    pdf: outputPath
  };
}

module.exports = {
  publishFile
};
