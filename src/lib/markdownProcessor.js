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
 * Add IDs to headings in HTML for TOC linking
 */
function addHeadingIds(html) {
  return html.replace(/<h([1-6])>(.*?)<\/h\1>/gi, (match, level, content) => {
    const id = content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    return `<h${level} id="${id}">${content}</h${level}>`;
  });
}

module.exports = {
  createMarkdownParser,
  parseMarkdown,
  extractHeadings,
  addHeadingIds
};
