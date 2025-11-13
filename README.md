# pdf-factory

A CLI utility to create publish-ready PDFs from Markdown content with an HTML-based templating engine.

## Features

- ✨ **Markdown to PDF**: Convert markdown files to beautifully formatted PDFs
- 📁 **Directory Publishing**: Combine multiple markdown files from a directory into a single PDF
- 🎨 **HTML Templates**: Fully customizable HTML-based templates for:
  - Book covers
  - Title pages
  - Table of contents
  - Content styling
  - Back covers
- 📑 **Auto-generated TOC**: Automatic table of contents from document headings
- 🎯 **Default Templates**: Professional-looking default templates included
- ⚙️ **Customizable**: Override any template with your own HTML/CSS

## Installation

```bash
npm install -g pdf-factory
```

Or use locally in a project:

```bash
npm install pdf-factory
```

## Quick Start

### Publish a Single File

```bash
pdf-factory publish document.md
```

This will generate:
- `document.pdf` - The PDF output
- `document.html` - Intermediate HTML (useful for debugging)

### Publish a Directory

```bash
pdf-factory publish ./my-docs
```

This will:
1. Find all `.md` files in the directory
2. Combine them in order (alphabetically, maintaining directory structure)
3. Generate a single PDF with all content

### Initialize Templates

```bash
pdf-factory init
```

This creates a `templates/` directory with all default templates that you can customize.

## Usage

### Basic Commands

```bash
# Publish a single markdown file
pdf-factory publish document.md

# Publish with custom title and author
pdf-factory publish document.md --title "My Book" --author "John Doe"

# Publish a directory
pdf-factory publish ./docs --output book.pdf

# Initialize templates for customization
pdf-factory init
```

### Options

- `-o, --output <path>` - Specify output PDF path
- `-t, --title <title>` - Document title
- `-a, --author <author>` - Document author
- `--cover-template <path>` - Custom cover template
- `--title-template <path>` - Custom title page template
- `--toc` / `--no-toc` - Enable/disable table of contents (enabled by default)
- `--header-template <path>` - Custom header template
- `--footer-template <path>` - Custom footer template

### Examples

```bash
# Publish with custom metadata
pdf-factory publish book.md \
  --title "The Great Novel" \
  --author "Jane Smith" \
  --output "great-novel.pdf"

# Publish directory without TOC
pdf-factory publish ./chapters --no-toc

# Use custom templates
pdf-factory publish report.md \
  --cover-template ./my-templates/cover.html \
  --title-template ./my-templates/title.html
```

## Templates

### Default Templates

pdf-factory includes beautiful default templates:

- **cover.html** - Eye-catching gradient cover page
- **title.html** - Professional title page with metadata
- **toc.html** - Clean table of contents
- **content.html** - Well-formatted content with syntax highlighting support
- **back-cover.html** - Elegant back cover

### Customizing Templates

1. Initialize templates:
   ```bash
   pdf-factory init
   ```

2. Edit the templates in the `templates/` directory

3. Use your custom templates:
   ```bash
   pdf-factory publish book.md --cover-template ./templates/cover.html
   ```

### Template Variables

Templates use Mustache-like syntax:

- `{{title}}` - Document title
- `{{author}}` - Author name
- `{{date}}` - Publication date
- `{{subtitle}}` - Subtitle
- `{{version}}` - Version number
- `{{content}}` - Main content (content.html only)

#### Conditional Blocks

```html
{{#author}}
<div class="author">by {{author}}</div>
{{/author}}
```

## Directory Publishing

When publishing a directory, pdf-factory:

1. Finds all `.md` files recursively
2. Sorts them alphabetically (files in root before subdirectories)
3. Combines them into a single document
4. Generates a unified table of contents
5. Maintains proper heading hierarchy

Example directory structure:

```
my-book/
├── 01-introduction.md
├── 02-getting-started.md
├── chapters/
│   ├── 01-basics.md
│   ├── 02-advanced.md
│   └── 03-expert.md
└── 99-conclusion.md
```

## Output Formats

pdf-factory generates two files:

1. **PDF** - The final PDF document (requires phantomjs or can fail gracefully)
2. **HTML** - Intermediate HTML file (always generated)

The HTML file can be:
- Opened in a browser and printed to PDF
- Converted using other tools (wkhtmltopdf, Chrome headless, etc.)
- Used for preview and debugging

## Requirements

- Node.js >= 14.0.0

## License

Apache-2.0

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please use the [GitHub Issues](https://github.com/alexneri/pdf-factory/issues) page.
