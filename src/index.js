/**
 * pdf-factory
 * A CLI utility to create publish-ready PDFs from Markdown content
 * 
 * This is the main entry point for the library when used as a module
 */

const { publishFile } = require('./lib/publisher');
const { publishDirectory, getMarkdownFiles } = require('./lib/directoryPublisher');
const { initTemplates } = require('./lib/templateManager');
const { parseMarkdown, extractHeadings } = require('./lib/markdownProcessor');
const { loadTemplate, renderTemplate, getDefaultTemplatePath } = require('./lib/templateRenderer');
const { generatePDF, saveHTML } = require('./lib/pdfGenerator');

module.exports = {
  // Publishing functions
  publishFile,
  publishDirectory,
  
  // Utility functions
  getMarkdownFiles,
  initTemplates,
  parseMarkdown,
  extractHeadings,
  
  // Template functions
  loadTemplate,
  renderTemplate,
  getDefaultTemplatePath,
  
  // PDF generation
  generatePDF,
  saveHTML
};
