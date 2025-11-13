# PDF Factory

PDF Factory is a TypeScript-powered CLI that turns Markdown files or directories into publish-ready PDF documents using HTML templates and a headless browser renderer.

## Features

- 🧭 **Interactive CLI** with guided prompts for file/directory builds and template management
- 🧱 **HTML/Handlebars templating** with partials, helpers, and bundled default theme
- 🧾 **Markdown enhancements** including front matter, GitHub Flavored Markdown, footnotes, and syntax highlighting
- 📂 **Directory builds** with recursive globbing, ignore patterns, and ordering strategies
- 🖨️ **Chromium-based PDF generation** via Puppeteer with configurable margins, headers, and footers
- ⚙️ **Configurable YAML/JSON settings** plus CLI overrides

## Installation

```bash
npm install
npm run build
```

The CLI entry point is published as `pdf-factory` (see `package.json#bin`). During development you can run it without building:

```bash
npm run dev -- build docs/chapter1.md
```

## Usage

Launch the interactive mode (default when no args are provided):

```bash
pdf-factory
```

Command overview:

```bash
pdf-factory build <input> [options]         # single Markdown file
pdf-factory build-dir <directory> [options] # directory of Markdown files
pdf-factory init [template-name]            # scaffold a new template set
pdf-factory list-templates                  # show available templates
```

### Common options

- `-o, --output <path>` – custom output file path (default uses config naming)
- `-t, --template <name>` – template folder within `templates/`
- `-c, --config <path>` – path to YAML/JSON config file
- `-v, --verbose` – verbose logging
- `--no-cover`, `--no-toc` – skip cover page or TOC generation

Directory builds accept extra switches:

- `-r, --recursive` – include subdirectories
- `--pattern <glob>` – glob for markdown files (default `**/*.md`)
- `--order-by <name|date|custom>` – sorting strategy (custom uses `order` front matter)
- `--ignore <patterns>` – comma-separated glob patterns to skip

## Configuration

Create `pdf-factory.config.yaml` (auto-detected) or pass `--config`:

```yaml
templates:
  directory: "./templates"
  defaults:
    cover: "cover.html"
    title: "title.html"
    toc: "toc.html"
    header: "header.html"
    footer: "footer.html"
    backCover: "back-cover.html"
    frontMatter: "front-matter.html"
    layout: "layout.html"
    styles: "styles.css"

pdf:
  format: "A4"
  margin:
    top: "2cm"
    right: "1.5cm"
    bottom: "2cm"
    left: "1.5cm"
  printBackground: true
  displayHeaderFooter: true

processing:
  markdown:
    gfm: true
    breaks: true
    math: false
    syntaxHighlighting: true
  frontMatter:
    required: false
    strict: false

output:
  directory: "./output"
  naming: "{{title}}.pdf"
```

## Templates

Templates live under `templates/<name>` and may contain any combination of HTML partials plus `layout.html` and `styles.css`. The default template shipped in `templates/default` includes:

- Cover, title, TOC, front-matter, and back-cover pages
- Header/footer partials
- Serif-first print-ready styles

Use `pdf-factory init my-template` to copy the default set and start customizing.

## Development

- `npm run dev` – run the CLI via `tsx`
- `npm run build` – type-check and emit to `dist/`
- `npm run typecheck` – `tsc --noEmit`
- `npm run lint` – ESLint with TypeScript + Prettier
- `npm run format` – Prettier write
- `npm test` – Vitest

## Testing

Vitest is configured for unit tests. Add files under `tests/*.test.ts` and run:

```bash
npm test
```

## License

ISC
