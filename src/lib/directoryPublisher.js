const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const { parseMarkdown, extractHeadings, addHeadingIds } = require('./markdownProcessor');
const { loadTemplate, getDefaultTemplatePath } = require('./templateRenderer');
const { generatePDF, saveHTML } = require('./pdfGenerator');

/**
 * Get all markdown files in a directory recursively, maintaining order
 */
function getMarkdownFiles(directory) {
  const pattern = path.join(directory, '**/*.md');
  const files = glob.sync(pattern, { nodir: true });
  
  // Sort files to maintain consistent ordering
  // Files at the same level are sorted alphabetically
  // Files in subdirectories come after files in parent directories
  return files.sort((a, b) => {
    const aDepth = a.split(path.sep).length;
    const bDepth = b.split(path.sep).length;
    
    if (aDepth !== bDepth) {
      return aDepth - bDepth;
    }
    
    return a.localeCompare(b);
  });
}

/**
 * Publish all markdown files in a directory to a single PDF
 */
async function publishDirectory(directory, options = {}) {
  // Get all markdown files
  const markdownFiles = getMarkdownFiles(directory);
  
  if (markdownFiles.length === 0) {
    throw new Error(`No markdown files found in directory: ${directory}`);
  }
  
  console.log(`Found ${markdownFiles.length} markdown file(s):`);
  markdownFiles.forEach(file => console.log(`  - ${path.relative(directory, file)}`));
  
  // Prepare metadata
  const title = options.title || path.basename(directory);
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
  
  // Collect all headings for TOC
  let allHeadings = [];
  const contentParts = [];
  
  // Process each markdown file
  for (const file of markdownFiles) {
    const markdown = fs.readFileSync(file, 'utf-8');
    const headings = extractHeadings(markdown);
    
    // Add file name as a context for headings
    const relativeFileName = path.relative(directory, file);
    headings.forEach(h => {
      h.file = relativeFileName;
    });
    
    allHeadings = allHeadings.concat(headings);
    
    let html = parseMarkdown(markdown);
    html = addHeadingIds(html);
    
    // Add file separator comment
    contentParts.push(`<!-- File: ${relativeFileName} -->\n${html}`);
  }
  
  // Add table of contents if enabled
  if (options.toc !== false && allHeadings.length > 0) {
    const tocTemplate = getDefaultTemplatePath('toc');
    const tocHtml = loadTemplate(tocTemplate, {
      items: allHeadings
    });
    sections.push(tocHtml);
  }
  
  // Combine all content
  const combinedContent = contentParts.join('\n<hr style="page-break-before: always; visibility: hidden; margin: 0;">\n');
  
  // Add main content
  const contentTemplate = getDefaultTemplatePath('content');
  const finalContent = loadTemplate(contentTemplate, {
    content: combinedContent
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
  const defaultOutput = path.join(directory, `${path.basename(directory)}.pdf`);
  const outputPath = options.output || defaultOutput;
  const htmlOutputPath = outputPath.replace(/\.pdf$/, '.html');
  
  // Save HTML for debugging or manual conversion
  saveHTML(combinedHtml, htmlOutputPath);
  console.log(`✓ HTML saved to: ${htmlOutputPath}`);
  
  // Generate PDF
  try {
    await generatePDF(combinedHtml, outputPath, options);
    console.log(`✓ PDF saved to: ${outputPath}`);
  } catch (error) {
    console.warn('⚠ PDF generation failed, but HTML was saved successfully');
    console.warn('  You can manually convert the HTML to PDF using a browser or other tools');
    console.warn('  Error:', error.message);
  }
  
  return {
    html: htmlOutputPath,
    pdf: outputPath,
    files: markdownFiles
  };
}

module.exports = {
  publishDirectory,
  getMarkdownFiles
};
