# Quick Start Guide

This guide will help you get started with pdf-factory.

## Installation

```bash
npm install -g pdf-factory
```

## Your First PDF

1. Create a markdown file:

```bash
echo "# My First Document" > document.md
echo "" >> document.md
echo "This is my first PDF created with pdf-factory!" >> document.md
```

2. Generate the HTML:

```bash
pdf-factory publish document.md --title "My First PDF" --author "Your Name"
```

3. Convert to PDF:
   - Open `document.html` in your browser
   - Press Ctrl+P (or Cmd+P on Mac)
   - Select "Save as PDF"
   - Save it!

## Publishing a Book

For a multi-chapter book:

1. Create your directory structure:

```
my-book/
├── 01-introduction.md
├── 02-chapter-one.md
├── 03-chapter-two.md
└── 04-conclusion.md
```

2. Publish the entire directory:

```bash
pdf-factory publish my-book --title "My Book" --author "Your Name"
```

This will create `my-book/my-book.html` with all chapters combined.

## Customizing Templates

1. Initialize templates:

```bash
pdf-factory init
```

2. Edit the templates in the `templates/` directory

3. Use your custom templates:

```bash
pdf-factory publish document.md --cover-template ./templates/cover.html
```

## Tips

- Use numbered prefixes (01-, 02-) for chapter ordering
- The `--no-toc` flag disables table of contents
- Templates support variables like `{{title}}`, `{{author}}`, `{{date}}`
- The generated HTML is print-optimized with proper page breaks

## Next Steps

- Read the full [README](../README.md) for all options
- Check the [examples](../examples/) directory
- Customize the [templates](../src/templates/) to match your style
