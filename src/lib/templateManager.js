const fs = require('fs');
const path = require('path');

/**
 * Initialize templates in a directory
 */
function initTemplates(targetDirectory) {
  const templatesDir = path.join(targetDirectory, 'templates');
  
  // Create templates directory if it doesn't exist
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }
  
  // Copy default templates
  const defaultTemplatesDir = path.join(__dirname, '..', 'templates');
  const templateFiles = fs.readdirSync(defaultTemplatesDir);
  
  templateFiles.forEach(file => {
    const src = path.join(defaultTemplatesDir, file);
    const dest = path.join(templatesDir, file);
    
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dest);
      console.log(`  ✓ Created: ${path.relative(targetDirectory, dest)}`);
    }
  });
  
  // Create a sample markdown file
  const sampleMd = `# Sample Document

Welcome to pdf-factory! This is a sample markdown document.

## Getting Started

You can write your content in Markdown and convert it to a beautiful PDF.

### Features

- **Markdown to PDF conversion**: Write in Markdown, get a professional PDF
- **Custom templates**: Customize the look and feel with HTML templates
- **Directory publishing**: Combine multiple markdown files into one document
- **Table of contents**: Automatically generated from headings

## Code Examples

Here's a code example:

\`\`\`javascript
function hello() {
  console.log("Hello, world!");
}
\`\`\`

## Lists

### Unordered List
- First item
- Second item
- Third item

### Ordered List
1. First step
2. Second step
3. Third step

## Quotes

> "The best way to predict the future is to invent it."
> - Alan Kay

## Tables

| Feature | Description |
|---------|-------------|
| Templates | Customizable HTML templates |
| TOC | Auto-generated table of contents |
| Styling | Beautiful default styling |

## Conclusion

Happy publishing with pdf-factory!
`;

  const samplePath = path.join(targetDirectory, 'sample.md');
  if (!fs.existsSync(samplePath)) {
    fs.writeFileSync(samplePath, sampleMd, 'utf-8');
    console.log(`  ✓ Created: sample.md`);
  }
  
  // Create a README
  const readme = `# PDF Factory Templates

This directory contains custom templates for your PDF publications.

## Template Files

- \`cover.html\` - Book cover page template
- \`title.html\` - Title page template
- \`toc.html\` - Table of contents template
- \`content.html\` - Main content wrapper template
- \`back-cover.html\` - Back cover template

## Usage

You can customize these templates by editing the HTML and CSS.

### Using Custom Templates

\`\`\`bash
# Use custom cover template
pdf-factory publish document.md --cover-template ./templates/cover.html

# Use custom title template
pdf-factory publish document.md --title-template ./templates/title.html
\`\`\`

## Template Variables

Templates support Mustache-like syntax for variable substitution:

- \`{{title}}\` - Document title
- \`{{author}}\` - Author name
- \`{{date}}\` - Publication date
- \`{{subtitle}}\` - Document subtitle
- \`{{version}}\` - Document version
- \`{{content}}\` - Main content (content.html only)

### Conditional Blocks

\`\`\`html
{{#author}}
<div>Author: {{author}}</div>
{{/author}}
\`\`\`

This block will only render if the author variable is provided.
`;

  const readmePath = path.join(templatesDir, 'README.md');
  fs.writeFileSync(readmePath, readme, 'utf-8');
  console.log(`  ✓ Created: ${path.relative(targetDirectory, readmePath)}`);
}

module.exports = {
  initTemplates
};
