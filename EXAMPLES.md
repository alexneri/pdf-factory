# Usage Examples

This document provides detailed examples of using pdf-factory for various scenarios.

## Basic Publishing

### Single File

Convert a simple markdown file to HTML:

```bash
pdf-factory publish README.md
```

This creates `README.html` with default cover, title page, and TOC.

### With Metadata

Add custom title and author:

```bash
pdf-factory publish document.md \
  --title "My Technical Guide" \
  --author "Jane Developer"
```

### Custom Output Path

Specify where to save the output:

```bash
pdf-factory publish notes.md --output ~/Documents/my-notes.html
```

### Disable Table of Contents

For short documents, you might want to skip the TOC:

```bash
pdf-factory publish short-doc.md --no-toc
```

## Directory Publishing

### Basic Directory

Publish all markdown files in a directory:

```bash
pdf-factory publish ./my-book
```

This finds all `.md` files and combines them into `./my-book/my-book.html`.

### With Custom Output

Specify the output file:

```bash
pdf-factory publish ./documentation --output complete-docs.html
```

### Example Directory Structure

For best results, organize your files like this:

```
my-book/
├── 00-preface.md
├── 01-introduction.md
├── 02-getting-started.md
├── chapters/
│   ├── 01-basics.md
│   ├── 02-intermediate.md
│   └── 03-advanced.md
└── 99-appendix.md
```

Files are processed alphabetically, with files in the root before subdirectories.

## Template Customization

### Initialize Templates

Copy default templates to your project:

```bash
pdf-factory init
```

This creates a `templates/` directory with all default templates.

### Use Custom Templates

After customizing templates:

```bash
pdf-factory publish book.md \
  --cover-template ./templates/cover.html \
  --title-template ./templates/title.html
```

### Template Variables

Templates support these variables:

- `{{title}}` - Document title
- `{{author}}` - Author name
- `{{date}}` - Current date
- `{{subtitle}}` - Document subtitle
- `{{version}}` - Document version
- `{{content}}` - Main content (content.html only)

### Conditional Sections

Use conditional blocks in templates:

```html
{{#author}}
<div class="author-section">
  <h2>About the Author</h2>
  <p>{{author}}</p>
</div>
{{/author}}
```

This section only appears if `author` is provided.

## Converting to PDF

### Browser Method (Easiest)

1. Open the generated HTML file in Chrome, Firefox, or Safari
2. Press `Ctrl+P` (Windows/Linux) or `Cmd+P` (Mac)
3. Select "Save as PDF" as the destination
4. Adjust margins if needed (usually "Default" or "Minimum")
5. Save the PDF

### Chrome Headless

```bash
chrome --headless --print-to-pdf=output.pdf input.html
```

Or with options:

```bash
chrome --headless \
  --print-to-pdf=output.pdf \
  --print-to-pdf-no-header \
  input.html
```

### wkhtmltopdf

```bash
wkhtmltopdf input.html output.pdf
```

With options:

```bash
wkhtmltopdf \
  --page-size A4 \
  --margin-top 20mm \
  --margin-right 20mm \
  --margin-bottom 20mm \
  --margin-left 20mm \
  input.html output.pdf
```

### WeasyPrint (Python)

```bash
weasyprint input.html output.pdf
```

## Advanced Use Cases

### Documentation Website

Generate documentation from a wiki structure:

```bash
# Organize docs with numbers for ordering
wiki/
├── 01-Home.md
├── 02-Installation.md
├── 03-API/
│   ├── 01-Overview.md
│   ├── 02-Endpoints.md
│   └── 03-Examples.md
└── 04-FAQ.md

# Generate
pdf-factory publish wiki --title "API Documentation" --author "Dev Team"
```

### Technical Book

```bash
# Create book structure
mkdir my-book
cd my-book
pdf-factory init

# Add chapters
echo "# Chapter 1" > 01-chapter-one.md
echo "# Chapter 2" > 02-chapter-two.md

# Customize templates/cover.html if desired

# Generate
pdf-factory publish . \
  --title "My Technical Book" \
  --author "Your Name" \
  --output book.html
```

### Report Generation

```bash
# Generate monthly report
pdf-factory publish monthly-report.md \
  --title "Monthly Status Report - $(date +%B\ %Y)" \
  --author "Team Lead" \
  --no-toc
```

## Tips and Best Practices

### File Naming

- Use numeric prefixes for ordering: `01-`, `02-`, etc.
- Use descriptive names: `01-introduction.md` not `01.md`
- Avoid special characters in filenames

### Markdown Best Practices

- Use heading levels consistently (don't skip levels)
- Start documents with `# Title` (h1)
- Use h2 for major sections, h3 for subsections
- Include code block language for syntax highlighting:
  ```javascript
  // Good
  ```

### Template Tips

- Keep custom templates in version control
- Test templates with sample content first
- Use CSS print media queries for print-specific styling
- Set appropriate page breaks with `page-break-before` and `page-break-after`

### PDF Conversion Tips

- Preview HTML in browser before converting
- Use browser print preview to check page breaks
- Adjust CSS margins if content is cut off
- For best quality, use Chrome/Chromium-based browsers
- Consider setting specific page size in CSS: `@page { size: A4; }`

## Troubleshooting

### Output looks wrong

1. Open HTML in a browser first to verify
2. Check for custom CSS conflicts
3. Try different PDF conversion tools

### Missing content

1. Check that all markdown files are in the directory
2. Verify file extensions are `.md`
3. Check file permissions

### TOC not generating

1. Ensure you have headings in your markdown
2. Check that `--no-toc` flag is not set
3. Verify headings use proper markdown syntax (`#`, `##`, etc.)

### Templates not applying

1. Verify template file paths are correct
2. Check template syntax (use `{{variable}}` format)
3. Ensure template files are readable

## Getting Help

- Check the [README](README.md) for general information
- See [QUICKSTART](QUICKSTART.md) for quick introduction
- View template documentation in `templates/README.md`
- Review examples in the `examples/` directory
