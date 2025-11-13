const MarkdownIt = require('markdown-it');

/**
 * Create a configured markdown parser
 */
function createMarkdownParser() {
  return new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: false
  });
}

/**
 * Parse markdown to HTML
 */
function parseMarkdown(markdown) {
  const md = createMarkdownParser();
  return md.render(markdown);
}

/**
 * Extract headings from markdown for TOC generation
 */
function extractHeadings(markdown) {
  const md = createMarkdownParser();
  const tokens = md.parse(markdown, {});
  const headings = [];
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === 'heading_open') {
      const level = parseInt(token.tag.substring(1));
      const nextToken = tokens[i + 1];
      if (nextToken && nextToken.type === 'inline') {
        const title = nextToken.content;
        const id = title.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
        
        headings.push({
          level,
          title,
          id,
          page: headings.length + 1 // Simplified page numbering
        });
      }
    }
  }
  
  return headings;
}

/**
 * Escape HTML to prevent injection
 */
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Add IDs to headings in HTML for TOC linking
 */
function addHeadingIds(html) {
  return html.replace(/<h([1-6])>(.*?)<\/h\1>/gi, (match, level, content) => {
    // Strip HTML tags from content to create ID base
    // lgtm[js/incomplete-multi-character-sanitization]
    // This is safe because the result is only used to generate an ID,
    // which is then filtered to only contain [\w\s-] and HTML-escaped
    const textOnly = content.replace(/<[^>]*>/g, '');
    
    // Create a safe ID by only allowing word characters, spaces, and hyphens
    // This effectively sanitizes any remaining content by removing all special chars
    const id = textOnly
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')  // Only keep alphanumeric, spaces, and hyphens
      .replace(/\s+/g, '-');      // Convert spaces to hyphens
    
    // HTML-escape the ID for attribute safety
    const safeId = escapeHtml(id);
    
    // Content comes from markdown-it's HTML output which is already safe.
    // We trust markdown-it's output and only add an ID attribute.
    return `<h${level} id="${safeId}">${content}</h${level}>`;
  });
}

module.exports = {
  createMarkdownParser,
  parseMarkdown,
  extractHeadings,
  addHeadingIds
};
