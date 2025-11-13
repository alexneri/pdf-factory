# PDF Factory - System Design Document

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Architecture](#architecture)
4. [Core Components](#core-components)
5. [Data Flow](#data-flow)
6. [Template System](#template-system)
7. [CLI Interface](#cli-interface)
8. [File Processing](#file-processing)
9. [PDF Generation](#pdf-generation)
10. [Default Templates](#default-templates)
11. [Configuration](#configuration)
12. [Error Handling](#error-handling)
13. [Performance Considerations](#performance-considerations)
14. [Security Considerations](#security-considerations)
15. [Testing Strategy](#testing-strategy)
16. [Implementation Plan](#implementation-plan)
17. [Future Enhancements](#future-enhancements)

---

## Executive Summary

**PDF Factory** is a command-line utility designed to transform Markdown content into professional, publish-ready PDF documents. The system leverages HTML-based templating to provide extensive customization capabilities for book covers, title pages, table of contents, headers, footers, and other document elements.

### Key Features

- **File-based Publishing**: Process individual Markdown files or entire directories
- **Directory-based Publishing**: Automatically bind all Markdown files in a directory while preserving order and nesting structure
- **HTML Templating Engine**: Flexible template system for all document components
- **Default Templates**: Production-ready default templates for immediate use
- **Pagination Support**: Automatic page numbering and layout management
- **Front Matter Support**: YAML front matter for metadata and configuration

---

## System Overview

### Purpose

PDF Factory addresses the need for a reliable, flexible tool to convert Markdown documentation into professionally formatted PDF documents suitable for publishing, distribution, or archival purposes.

### Target Users

- Technical writers and documentation teams
- Authors creating e-books or print-ready books
- Developers generating API documentation
- Content creators producing reports and whitepapers

### Technology Stack

- **Language**: TypeScript (Node.js)
- **Markdown Processing**: `marked` or `markdown-it` with plugins
- **HTML to PDF**: `puppeteer` or `playwright` (headless browser)
- **Template Engine**: `handlebars` or `mustache` for HTML templating
- **CLI Framework**: `commander.js` or `yargs`
- **File System**: Node.js `fs/promises`
- **YAML Parsing**: `js-yaml` for front matter

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI Interface                         │
│  (commander.js/yargs - Command parsing and validation)      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Command Router                            │
│  (Routes commands to appropriate handlers)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  No arguments? → Launch Interactive Mode             │   │
│  └──────────────────────────────────────────────────────┘   │
└───────┬───────────────────────────────┬─────────────────────┘
        │                               │
        ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│  Interactive CLI │          │  Command Handler │
│  (Guided prompts)│          │  (Direct exec)   │
│                  │          │                  │
│  Collects user   │          │  Uses provided   │
│  input via menus │          │  arguments       │
└────────┬─────────┘          └────────┬─────────┘
         │                              │
         └──────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│  File Processor  │          │ Directory        │
│                  │          │ Processor        │
└────────┬─────────┘          └────────┬─────────┘
         │                              │
         └──────────────┬───────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Markdown Parser & Processor                     │
│  (Parse markdown, extract front matter, process content)     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  Template Engine                             │
│  (Load templates, inject data, render HTML)                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  PDF Generator                               │
│  (Headless browser, render HTML to PDF)                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Output Manager                            │
│  (Save PDF, handle file naming, error reporting)            │
└─────────────────────────────────────────────────────────────┘
```

### Component Layers

1. **Presentation Layer**: CLI interface, interactive prompts, and user interaction
   - Command-line argument parsing
   - Interactive mode with arrow key navigation
   - User input collection and validation
2. **Application Layer**: Command routing, orchestration, and business logic
   - Route commands to appropriate handlers
   - Interactive workflow orchestration
   - Settings collection and validation
3. **Processing Layer**: Markdown parsing, template rendering, and content transformation
4. **Generation Layer**: PDF creation using headless browser
5. **I/O Layer**: File system operations and output management

---

## Core Components

### 1. CLI Interface (`src/cli/index.ts`)

**Responsibilities**:
- Parse command-line arguments
- Validate input parameters
- Display help and usage information
- Handle user errors gracefully
- Route to interactive mode when no arguments provided

**Commands**:
```typescript
pdf-factory                    // Launches interactive mode
pdf-factory build <input> [options]
pdf-factory build-dir <directory> [options]
pdf-factory init [template-name]
pdf-factory list-templates
```

**Options**:
- `--output, -o`: Output file path
- `--template, -t`: Template directory path
- `--config, -c`: Configuration file path
- `--verbose, -v`: Verbose output
- `--watch, -w`: Watch mode for development
- `--interactive, -i`: Force interactive mode

**Interactive Mode**:
- Automatically invoked when no commands/arguments provided
- See [Interactive Mode](#interactive-mode) section for detailed design

### 1a. Interactive CLI (`src/cli/interactive/interactive-cli.ts`)

**Responsibilities**:
- Provide interactive user interface with arrow key navigation
- Guide users through PDF generation workflow
- Collect user input via prompts and menus
- Validate inputs in real-time
- Display progress and results

**Interface**:
```typescript
interface InteractiveCLI {
  start(): Promise<void>;
  showMainMenu(): Promise<MainMenuOption>;
  promptForFile(): Promise<string>;
  promptForDirectory(): Promise<string>;
  promptForOutput(defaultPath: string): Promise<string>;
  selectTemplate(): Promise<string>;
  promptForOptions(): Promise<BuildOptions>;
  confirmSettings(settings: BuildSettings): Promise<boolean>;
  showProgress(message: string): void;
  showSuccess(message: string, filePath?: string): void;
  showError(error: Error): void;
}
```

**Dependencies**:
- `inquirer` or `prompts`: Interactive prompt library
- `inquirer-file-tree-selection-prompt`: File browser component
- `chalk` or `colors`: Terminal colors and styling
- `ora`: Spinner and progress indicators

**Key Features**:
- Arrow key navigation for menus
- File/directory browser with tree view
- Input validation with helpful error messages
- Settings review and confirmation screen
- Progress indicators during processing
- Configuration persistence

### 2. File Processor (`src/processors/file-processor.ts`)

**Responsibilities**:
- Read Markdown files from filesystem
- Extract YAML front matter
- Parse Markdown content to HTML
- Handle file encoding and errors

**Interface**:
```typescript
interface FileProcessor {
  processFile(filePath: string): Promise<ProcessedFile>;
  processFiles(filePaths: string[]): Promise<ProcessedFile[]>;
}

interface ProcessedFile {
  path: string;
  frontMatter: Record<string, any>;
  content: string; // HTML
  metadata: FileMetadata;
}

interface FileMetadata {
  title?: string;
  author?: string;
  date?: string;
  order?: number;
  [key: string]: any;
}
```

### 3. Directory Processor (`src/processors/directory-processor.ts`)

**Responsibilities**:
- Scan directory for Markdown files
- Maintain file order (alphabetical or custom)
- Preserve directory structure and nesting
- Generate unified document structure

**Interface**:
```typescript
interface DirectoryProcessor {
  processDirectory(dirPath: string, options: DirectoryOptions): Promise<DocumentStructure>;
}

interface DirectoryOptions {
  recursive?: boolean;
  pattern?: string; // File pattern (default: "**/*.md")
  orderBy?: 'name' | 'date' | 'custom';
  ignore?: string[]; // Patterns to ignore
}

interface DocumentStructure {
  files: ProcessedFile[];
  sections: Section[];
  toc: TableOfContentsEntry[];
}

interface Section {
  title: string;
  level: number;
  file: ProcessedFile;
  children: Section[];
}
```

### 4. Template Engine (`src/templates/template-engine.ts`)

**Responsibilities**:
- Load HTML templates from filesystem
- Inject data into templates
- Support template inheritance and partials
- Handle template compilation and caching

**Interface**:
```typescript
interface TemplateEngine {
  loadTemplate(name: string): Promise<Template>;
  render(template: Template, data: TemplateData): Promise<string>;
  registerPartial(name: string, content: string): void;
}

interface Template {
  name: string;
  content: string;
  compiled: CompiledTemplate;
}

interface TemplateData {
  document: DocumentData;
  metadata: DocumentMetadata;
  toc: TableOfContentsEntry[];
  pages: PageData[];
  [key: string]: any;
}

interface DocumentData {
  title: string;
  author?: string;
  date?: string;
  content: string;
  frontMatter: Record<string, any>;
}
```

### 5. PDF Generator (`src/generators/pdf-generator.ts`)

**Responsibilities**:
- Launch headless browser instance
- Render HTML to PDF
- Handle page breaks and layout
- Manage browser resources

**Interface**:
```typescript
interface PDFGenerator {
  generate(html: string, options: PDFOptions): Promise<Buffer>;
  generateFromFile(htmlPath: string, options: PDFOptions): Promise<Buffer>;
}

interface PDFOptions {
  format?: 'A4' | 'Letter' | 'Legal' | CustomSize;
  margin?: MarginOptions;
  printBackground?: boolean;
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  scale?: number;
  preferCSSPageSize?: boolean;
}

interface MarginOptions {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}
```

### 6. Configuration Manager (`src/config/config-manager.ts`)

**Responsibilities**:
- Load configuration from files
- Merge default and user configurations
- Validate configuration schema
- Provide configuration access throughout application

**Interface**:
```typescript
interface ConfigManager {
  load(configPath?: string): Promise<Config>;
  get(key: string): any;
  merge(config: Partial<Config>): void;
}

interface Config {
  templates: {
    directory: string;
    defaults: {
      cover: string;
      title: string;
      toc: string;
      header: string;
      footer: string;
      backCover: string;
    };
  };
  pdf: PDFOptions;
  processing: {
    markdown: MarkdownOptions;
    frontMatter: FrontMatterOptions;
  };
  output: {
    directory: string;
    naming: string; // Pattern for output files
  };
}
```

---

## Data Flow

### Single File Processing Flow

```
1. User Command
   └─> CLI.parse() → { input: "file.md", output: "file.pdf" }

2. File Reading
   └─> FileProcessor.processFile("file.md")
       ├─> Read file from filesystem
       ├─> Extract YAML front matter
       └─> Parse Markdown → HTML

3. Template Loading
   └─> TemplateEngine.loadTemplate("default")
       ├─> Load cover.html
       ├─> Load title.html
       ├─> Load toc.html
       ├─> Load header.html
       ├─> Load footer.html
       └─> Load backCover.html

4. Template Rendering
   └─> TemplateEngine.render(template, data)
       ├─> Inject document metadata
       ├─> Inject content
       ├─> Generate TOC
       └─> Combine all templates

5. PDF Generation
   └─> PDFGenerator.generate(html, options)
       ├─> Launch headless browser
       ├─> Load HTML
       ├─> Apply CSS styles
       └─> Generate PDF buffer

6. Output
   └─> Write PDF buffer to filesystem
       └─> "file.pdf" created
```

### Directory Processing Flow

```
1. User Command
   └─> CLI.parse() → { input: "docs/", output: "book.pdf" }

2. Directory Scanning
   └─> DirectoryProcessor.processDirectory("docs/")
       ├─> Find all .md files (recursive)
       ├─> Sort files (by name/date/custom)
       └─> Build document structure

3. File Processing (Parallel)
   └─> For each file:
       ├─> FileProcessor.processFile()
       ├─> Extract front matter
       └─> Parse Markdown → HTML

4. Structure Assembly
   └─> Build unified document:
       ├─> Combine all content
       ├─> Generate hierarchical TOC
       ├─> Assign page numbers
       └─> Create section breaks

5. Template Rendering
   └─> TemplateEngine.render(template, unifiedData)
       └─> Single HTML document with all content

6. PDF Generation
   └─> PDFGenerator.generate(html, options)
       └─> Single PDF with all chapters

7. Output
   └─> Write "book.pdf"
```

---

## Template System

### Template Structure

Templates are HTML files with embedded template syntax (Handlebars/Mustache) that support:

- **Variables**: `{{title}}`, `{{author}}`
- **Conditionals**: `{{#if condition}}...{{/if}}`
- **Loops**: `{{#each items}}...{{/each}}`
- **Partials**: `{{> partial-name}}`
- **Helpers**: Custom functions for formatting

### Template Types

#### 1. Cover Template (`templates/default/cover.html`)

**Purpose**: Front cover of the document/book

**Available Variables**:
- `title`: Document title
- `subtitle`: Document subtitle
- `author`: Author name(s)
- `publisher`: Publisher name
- `coverImage`: Path to cover image
- `date`: Publication date

**Example**:
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .cover {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
    }
    .cover h1 { font-size: 4em; margin: 0.5em 0; }
    .cover h2 { font-size: 2em; opacity: 0.9; }
    .cover .author { font-size: 1.5em; margin-top: 2em; }
  </style>
</head>
<body>
  <div class="cover">
    <h1>{{title}}</h1>
    {{#if subtitle}}<h2>{{subtitle}}</h2>{{/if}}
    {{#if author}}<div class="author">{{author}}</div>{{/if}}
    {{#if date}}<div class="date">{{date}}</div>{{/if}}
  </div>
</body>
</html>
```

#### 2. Title Page Template (`templates/default/title.html`)

**Purpose**: Internal title page with publication information

**Available Variables**:
- `title`, `subtitle`, `author`
- `publisher`, `publisherAddress`
- `copyright`: Copyright notice
- `isbn`: ISBN number
- `edition`: Edition information

#### 3. Table of Contents Template (`templates/default/toc.html`)

**Purpose**: Generate table of contents from document structure

**Available Variables**:
- `toc`: Array of TOC entries
- `title`: "Table of Contents"

**TOC Entry Structure**:
```typescript
interface TableOfContentsEntry {
  title: string;
  level: number; // 1-6 (h1-h6)
  page: number;
  anchor: string; // Link anchor
  children?: TableOfContentsEntry[];
}
```

**Example**:
```html
<div class="toc">
  <h1>Table of Contents</h1>
  <ul>
    {{#each toc}}
    <li class="level-{{level}}">
      <a href="#{{anchor}}">{{title}}</a>
      <span class="page-number">{{page}}</span>
      {{#if children}}
      <ul>
        {{#each children}}
        <li class="level-{{level}}">
          <a href="#{{anchor}}">{{title}}</a>
          <span class="page-number">{{page}}</span>
        </li>
        {{/each}}
      </ul>
      {{/if}}
    </li>
    {{/each}}
  </ul>
</div>
```

#### 4. Header Template (`templates/default/header.html`)

**Purpose**: Page header (repeated on each page)

**Available Variables**:
- `title`: Document title
- `chapterTitle`: Current chapter/section title
- `pageNumber`: Current page number
- `totalPages`: Total page count

**Example**:
```html
<div class="header">
  <div class="header-left">{{title}}</div>
  <div class="header-right">{{chapterTitle}}</div>
</div>
```

#### 5. Footer Template (`templates/default/footer.html`)

**Purpose**: Page footer (repeated on each page)

**Available Variables**:
- `pageNumber`: Current page number
- `totalPages`: Total page count
- `author`: Author name

**Example**:
```html
<div class="footer">
  <div class="footer-left">{{author}}</div>
  <div class="footer-center"></div>
  <div class="footer-right">{{pageNumber}} / {{totalPages}}</div>
</div>
```

#### 6. Back Cover Template (`templates/default/back-cover.html`)

**Purpose**: Back cover with summary, author bio, or other information

**Available Variables**:
- `summary`: Book/document summary
- `authorBio`: Author biography
- `isbn`: ISBN barcode
- `reviews`: Array of review quotes

#### 7. Front Matter Template (`templates/default/front-matter.html`)

**Purpose**: Dedication, acknowledgments, foreword, etc.

**Available Variables**:
- `dedication`: Dedication text
- `acknowledgments`: Acknowledgments text
- `foreword`: Foreword content
- `preface`: Preface content

### Template Directory Structure

```
templates/
├── default/
│   ├── cover.html
│   ├── title.html
│   ├── toc.html
│   ├── header.html
│   ├── footer.html
│   ├── back-cover.html
│   ├── front-matter.html
│   └── styles.css
├── academic/
│   └── ...
├── book/
│   └── ...
└── report/
    └── ...
```

### Template Inheritance

Templates can extend base templates:

```html
<!-- base.html -->
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  {{> header}}
  <main>{{{content}}}</main>
  {{> footer}}
</body>
</html>
```

---

## CLI Interface

### Interactive Mode

When PDF Factory is invoked without any arguments or commands, it launches an **Interactive CLI Mode** that guides users through the PDF generation process using arrow key navigation and text prompts.

**Invocation**:
```bash
pdf-factory
# or
pdf-factory --interactive
# or
pdf-factory -i
```

#### Interactive Mode Flow

The interactive mode presents a series of menus and prompts to collect all necessary information for PDF generation:

```
┌─────────────────────────────────────────────────────────┐
│  Welcome to PDF Factory                                 │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  What would you like to do?                             │
│                                                          │
│  ❯ Build PDF from single file                          │
│    Build PDF from directory                             │
│    Initialize new template                              │
│    List available templates                             │
│    View configuration                                   │
│    Exit                                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Main Menu Options

1. **Build PDF from single file**
   - Guides user through single file processing
   - Prompts for input file, output path, template selection, etc.

2. **Build PDF from directory**
   - Guides user through directory processing
   - Prompts for directory path, recursive option, sorting method, etc.

3. **Initialize new template**
   - Interactive template creation wizard
   - Prompts for template name, base template, customization options

4. **List available templates**
   - Displays all available template sets
   - Allows selection to view details

5. **View configuration**
   - Shows current configuration
   - Allows editing configuration values

6. **Exit**
   - Exits the interactive mode

#### Single File Build Flow

When "Build PDF from single file" is selected:

```
Step 1: Input File Selection
┌─────────────────────────────────────────────────────────┐
│  Select input Markdown file:                            │
│                                                          │
│  [Type path or press Enter to browse]                   │
│  > chapter1.md                                          │
│                                                          │
│  [Browse Files]  [Use Current Directory]                │
└─────────────────────────────────────────────────────────┘

Step 2: Output File
┌─────────────────────────────────────────────────────────┐
│  Output PDF file path:                                  │
│                                                          │
│  > output/chapter1.pdf                                  │
│                                                          │
│  [Use default: chapter1.pdf]                            │
└─────────────────────────────────────────────────────────┘

Step 3: Template Selection
┌─────────────────────────────────────────────────────────┐
│  Select template set:                                   │
│                                                          │
│  ❯ default                                              │
│    academic                                             │
│    book                                                 │
│    report                                               │
│    custom...                                            │
│                                                          │
└─────────────────────────────────────────────────────────┘

Step 4: Advanced Options
┌─────────────────────────────────────────────────────────┐
│  Advanced Options:                                      │
│                                                          │
│  ☑ Include cover page                                   │
│  ☑ Include table of contents                            │
│  ☐ Verbose output                                       │
│  ☐ Use custom configuration file                        │
│                                                          │
│  [Continue]  [Back]                                     │
└─────────────────────────────────────────────────────────┘

Step 5: Configuration File (if selected)
┌─────────────────────────────────────────────────────────┐
│  Configuration file path:                               │
│                                                          │
│  > pdf-factory.config.yaml                              │
│                                                          │
│  [Browse]  [Skip]                                       │
└─────────────────────────────────────────────────────────┘

Step 6: Review and Confirm
┌─────────────────────────────────────────────────────────┐
│  Review Settings:                                       │
│                                                          │
│  Input:        chapter1.md                              │
│  Output:       output/chapter1.pdf                      │
│  Template:     default                                  │
│  Cover:        Yes                                      │
│  TOC:          Yes                                      │
│  Verbose:      No                                       │
│                                                          │
│  [Generate PDF]  [Edit Settings]  [Cancel]              │
└─────────────────────────────────────────────────────────┘
```

#### Directory Build Flow

When "Build PDF from directory" is selected:

```
Step 1: Directory Selection
┌─────────────────────────────────────────────────────────┐
│  Select directory containing Markdown files:            │
│                                                          │
│  [Type path or press Enter to browse]                   │
│  > ./docs                                               │
│                                                          │
│  [Browse Directories]  [Use Current Directory]          │
└─────────────────────────────────────────────────────────┘

Step 2: Processing Options
┌─────────────────────────────────────────────────────────┐
│  Processing Options:                                    │
│                                                          │
│  ☑ Process subdirectories recursively                   │
│                                                          │
│  File pattern:                                          │
│  > **/*.md                                              │
│                                                          │
│  Sort files by:                                         │
│  ❯ Name (alphabetical)                                 │
│    Date (modified date)                                 │
│    Custom (front matter order)                          │
│                                                          │
│  [Continue]  [Back]                                     │
└─────────────────────────────────────────────────────────┘

Step 3: Ignore Patterns (Optional)
┌─────────────────────────────────────────────────────────┐
│  Files/patterns to ignore (comma-separated):            │
│                                                          │
│  > node_modules/**, .git/**, draft-*.md                 │
│                                                          │
│  [Continue]  [Skip]                                     │
└─────────────────────────────────────────────────────────┘

Step 4: Output and Template
┌─────────────────────────────────────────────────────────┐
│  Output PDF file path:                                  │
│  > book.pdf                                             │
│                                                          │
│  Select template set:                                   │
│  ❯ default                                              │
│    academic                                             │
│    book                                                 │
│                                                          │
│  [Continue]  [Back]                                     │
└─────────────────────────────────────────────────────────┘

Step 5: Preview File List
┌─────────────────────────────────────────────────────────┐
│  Files to be processed (5 files found):                 │
│                                                          │
│  ✓ docs/chapter1.md                                     │
│  ✓ docs/chapter2.md                                     │
│  ✓ docs/chapter3.md                                     │
│  ✓ docs/appendix/a.md                                   │
│  ✓ docs/appendix/b.md                                   │
│                                                          │
│  [Continue]  [Edit Options]  [Cancel]                   │
└─────────────────────────────────────────────────────────┘
```

#### Template Initialization Flow

When "Initialize new template" is selected:

```
Step 1: Template Name
┌─────────────────────────────────────────────────────────┐
│  Template name:                                         │
│                                                          │
│  > my-custom-template                                   │
│                                                          │
│  [Continue]  [Cancel]                                   │
└─────────────────────────────────────────────────────────┘

Step 2: Base Template
┌─────────────────────────────────────────────────────────┐
│  Select base template to extend:                        │
│                                                          │
│  ❯ default (start from scratch)                        │
│    academic                                             │
│    book                                                 │
│    report                                               │
│                                                          │
└─────────────────────────────────────────────────────────┘

Step 3: Template Directory
┌─────────────────────────────────────────────────────────┐
│  Template directory:                                    │
│                                                          │
│  > ./templates/my-custom-template                       │
│                                                          │
│  [Use default]  [Browse]                                │
└─────────────────────────────────────────────────────────┘

Step 4: Customization Options
┌─────────────────────────────────────────────────────────┐
│  Which templates would you like to customize?           │
│                                                          │
│  ☑ Cover                                                │
│  ☑ Title page                                           │
│  ☑ Table of contents                                    │
│  ☐ Header                                               │
│  ☐ Footer                                               │
│  ☐ Back cover                                           │
│  ☐ Front matter                                         │
│                                                          │
│  [Create Template]  [Back]                              │
└─────────────────────────────────────────────────────────┘
```

#### Interactive Component Interface

**Component**: `src/cli/interactive/interactive-cli.ts`

```typescript
interface InteractiveCLI {
  start(): Promise<void>;
  showMainMenu(): Promise<MainMenuOption>;
  promptForFile(): Promise<string>;
  promptForDirectory(): Promise<string>;
  promptForOutput(defaultPath: string): Promise<string>;
  selectTemplate(): Promise<string>;
  promptForOptions(): Promise<BuildOptions>;
  confirmSettings(settings: BuildSettings): Promise<boolean>;
  showProgress(message: string): void;
  showSuccess(message: string, filePath?: string): void;
  showError(error: Error): void;
}

interface MainMenuOption {
  type: 'build-file' | 'build-dir' | 'init-template' | 'list-templates' | 'config' | 'exit';
}

interface BuildOptions {
  includeCover: boolean;
  includeTOC: boolean;
  verbose: boolean;
  customConfig?: string;
  recursive?: boolean;
  pattern?: string;
  orderBy?: 'name' | 'date' | 'custom';
  ignore?: string[];
}

interface BuildSettings {
  input: string;
  output: string;
  template: string;
  options: BuildOptions;
}
```

#### Interactive UI Components

**Component**: `src/cli/interactive/components/`

1. **Menu Component** (`menu.ts`)
   - Arrow key navigation
   - Multi-select support
   - Search/filter functionality

2. **Prompt Component** (`prompt.ts`)
   - Text input with validation
   - File/directory path completion
   - History support (up/down arrows)

3. **File Browser** (`file-browser.ts`)
   - Directory navigation
   - File selection
   - Filter by extension

4. **Progress Indicator** (`progress.ts`)
   - Spinner animations
   - Progress bars
   - Status messages

5. **Review Screen** (`review.ts`)
   - Settings display
   - Editable fields
   - Confirmation prompts

#### User Experience Features

1. **Keyboard Shortcuts**:
   - `↑/↓`: Navigate menu options
   - `Enter`: Select/Confirm
   - `Esc`: Go back/Cancel
   - `Tab`: Auto-complete paths
   - `Ctrl+C`: Exit at any time

2. **Input Validation**:
   - Real-time validation of file paths
   - Check file existence before proceeding
   - Validate output directory permissions
   - Verify template availability

3. **Auto-completion**:
   - File path completion (Tab key)
   - Template name suggestions
   - Configuration file suggestions

4. **History**:
   - Remember recently used paths
   - Quick access to previous selections
   - Persistent across sessions (optional)

5. **Visual Feedback**:
   - Color-coded messages (success, error, warning)
   - Loading indicators during processing
   - Progress bars for long operations
   - Clear error messages with suggestions

6. **Contextual Help**:
   - `?` key shows help for current step
   - Tooltips for options
   - Examples for path inputs

#### Implementation Details

**Library**: Use `inquirer` or `prompts` for interactive prompts

**Example Implementation**:
```typescript
import inquirer from 'inquirer';
import { fileTree } from 'inquirer-file-tree-selection-prompt';

inquirer.registerPrompt('file-tree', fileTree);

async function showMainMenu(): Promise<MainMenuOption> {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Build PDF from single file', value: 'build-file' },
        { name: 'Build PDF from directory', value: 'build-dir' },
        { name: 'Initialize new template', value: 'init-template' },
        { name: 'List available templates', value: 'list-templates' },
        { name: 'View configuration', value: 'config' },
        { name: 'Exit', value: 'exit' }
      ]
    }
  ]);
  
  return { type: action };
}

async function promptForFile(): Promise<string> {
  const { filePath } = await inquirer.prompt([
    {
      type: 'file-tree',
      name: 'filePath',
      message: 'Select input Markdown file:',
      onlyShowValid: true,
      enableGoUpperDirectory: true,
      root: process.cwd(),
      validate: (input: string) => {
        return input.endsWith('.md') || 'Please select a Markdown file';
      }
    }
  ]);
  
  return filePath;
}

async function selectTemplate(): Promise<string> {
  const templates = await getAvailableTemplates();
  
  const { template } = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Select template set:',
      choices: [
        ...templates.map(t => ({ name: t, value: t })),
        { name: 'Custom...', value: 'custom' }
      ]
    }
  ]);
  
  if (template === 'custom') {
    return await promptForCustomTemplate();
  }
  
  return template;
}
```

#### Error Handling in Interactive Mode

- **Invalid Input**: Show error message, allow retry
- **File Not Found**: Suggest similar files, allow browsing
- **Permission Errors**: Show clear message with fix suggestions
- **Template Errors**: List available templates, offer to create new one
- **Processing Errors**: Show detailed error, offer to retry or edit settings

#### Accessibility

- Support for screen readers (where possible in terminal)
- Clear visual indicators
- Keyboard-only navigation
- High contrast mode option
- Clear error messages

#### Configuration Persistence

Interactive mode can save user preferences:
- Default template selection
- Common output directories
- Preferred options (cover, TOC, etc.)
- Recent file paths

Saved in: `~/.pdf-factory/interactive-config.json`

---

### Command: `build`

Build a PDF from a single Markdown file.

**Usage**:
```bash
pdf-factory build <input> [options]
```

**Arguments**:
- `input`: Path to Markdown file

**Options**:
- `-o, --output <path>`: Output PDF file path (default: `<input>.pdf`)
- `-t, --template <name>`: Template set name (default: "default")
- `-c, --config <path>`: Path to configuration file
- `-v, --verbose`: Enable verbose output
- `--no-cover`: Skip cover page
- `--no-toc`: Skip table of contents

**Example**:
```bash
pdf-factory build chapter1.md -o output/chapter1.pdf -t book
```

### Command: `build-dir`

Build a PDF from all Markdown files in a directory.

**Usage**:
```bash
pdf-factory build-dir <directory> [options]
```

**Arguments**:
- `directory`: Path to directory containing Markdown files

**Options**:
- `-o, --output <path>`: Output PDF file path (default: `<directory-name>.pdf`)
- `-t, --template <name>`: Template set name
- `-r, --recursive`: Process subdirectories recursively
- `--pattern <glob>`: File pattern to match (default: "**/*.md")
- `--order-by <method>`: Sort method: "name", "date", or "custom" (default: "name")
- `--ignore <patterns>`: Comma-separated patterns to ignore

**Example**:
```bash
pdf-factory build-dir ./docs -o book.pdf -r --order-by name
```

### Command: `init`

Initialize a new template set.

**Usage**:
```bash
pdf-factory init [template-name]
```

**Options**:
- `-d, --directory <path>`: Directory to create template in (default: `./templates/<name>`)

**Example**:
```bash
pdf-factory init my-template
```

### Command: `list-templates`

List available template sets.

**Usage**:
```bash
pdf-factory list-templates
```

---

## File Processing

### Markdown Processing

**Parser Configuration**:
- Support CommonMark specification
- GitHub Flavored Markdown (GFM) extensions
- Math equations (LaTeX) support
- Syntax highlighting for code blocks
- Custom extensions for cross-references

**Processing Steps**:
1. Read file content
2. Extract YAML front matter (if present)
3. Parse Markdown to HTML AST
4. Transform AST (apply plugins, process custom syntax)
5. Render HTML
6. Apply post-processing (link resolution, image optimization)

### Front Matter Support

YAML front matter at the beginning of Markdown files:

```yaml
---
title: "Chapter 1: Introduction"
author: "John Doe"
date: "2024-01-15"
order: 1
chapter: true
toc: true
---

# Chapter 1: Introduction

Content here...
```

**Standard Front Matter Fields**:
- `title`: Document title
- `author`: Author name
- `date`: Publication date
- `order`: Custom ordering (for directory processing)
- `chapter`: Mark as chapter (affects TOC)
- `toc`: Include in table of contents
- `pageBreakBefore`: Force page break before this content
- `pageBreakAfter`: Force page break after this content

### Directory Processing Logic

**File Discovery**:
1. Scan directory for `.md` files
2. Apply ignore patterns (`.gitignore`-style)
3. Filter by pattern if specified
4. Sort files according to `order-by` option

**Sorting Methods**:
- **name**: Alphabetical by filename
- **date**: By file modification date
- **custom**: Use `order` field from front matter

**Structure Preservation**:
- Maintain directory hierarchy in TOC
- Create sections based on directory structure
- Preserve relative paths for asset references

---

## PDF Generation

### Headless Browser Configuration

**Browser Options**:
- Use Chromium-based browser (Puppeteer/Playwright)
- Enable PDF generation capabilities
- Configure viewport size
- Set up font rendering

**PDF Options**:
```typescript
{
  format: 'A4',
  margin: {
    top: '2cm',
    right: '1.5cm',
    bottom: '2cm',
    left: '1.5cm'
  },
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div>...</div>',
  footerTemplate: '<div>...</div>',
  scale: 1.0,
  preferCSSPageSize: false
}
```

### Page Break Management

**CSS Page Break Rules**:
```css
/* Force page break before */
.page-break-before {
  page-break-before: always;
}

/* Force page break after */
.page-break-after {
  page-break-after: always;
}

/* Avoid page break inside */
.no-break {
  page-break-inside: avoid;
}

/* Chapter start (new page) */
.chapter {
  page-break-before: always;
}
```

### Pagination

**Page Numbering**:
- Roman numerals for front matter (i, ii, iii...)
- Arabic numerals for main content (1, 2, 3...)
- Restart numbering per section (optional)

**Implementation**:
- Use CSS counters for automatic numbering
- Inject page numbers via header/footer templates
- Support different numbering styles per section

---

## Default Templates

### Default Template Set

The default template set provides a clean, professional design suitable for most use cases.

**Design Principles**:
- Clean and minimal
- Professional typography
- Consistent spacing
- Print-optimized colors
- Accessible contrast ratios

**Typography**:
- **Headings**: Serif font (e.g., Georgia, "Times New Roman")
- **Body**: Serif font for readability
- **Code**: Monospace font (e.g., "Courier New", Consolas)
- **Sizes**: Responsive to page size

**Color Scheme**:
- **Text**: Dark gray (#333333) or black
- **Headings**: Dark blue (#1a1a2e) or black
- **Links**: Blue (#0066cc)
- **Code background**: Light gray (#f5f5f5)
- **Borders**: Light gray (#e0e0e0)

**Layout**:
- **Margins**: 2cm top/bottom, 1.5cm left/right
- **Line height**: 1.6 for body text
- **Paragraph spacing**: 1em
- **Heading spacing**: 2em before, 1em after

### Template Customization

Users can:
1. Copy default template set
2. Modify HTML/CSS files
3. Use custom template via `--template` option
4. Override specific templates via configuration

---

## Configuration

### Configuration File Format

Configuration files use YAML or JSON format:

**Example (`pdf-factory.config.yaml`)**:
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

pdf:
  format: "A4"
  margin:
    top: "2cm"
    right: "1.5cm"
    bottom: "2cm"
    left: "1.5cm"
  printBackground: true
  displayHeaderFooter: true
  scale: 1.0

processing:
  markdown:
    gfm: true
    breaks: true
    math: true
    syntaxHighlighting: true
  frontMatter:
    required: false
    strict: false

output:
  directory: "./output"
  naming: "{{title}}.pdf"
```

### Configuration Precedence

1. Command-line options (highest priority)
2. Configuration file
3. Default values (lowest priority)

### Environment Variables

- `PDF_FACTORY_TEMPLATE_DIR`: Default template directory
- `PDF_FACTORY_OUTPUT_DIR`: Default output directory
- `PDF_FACTORY_CONFIG`: Path to default configuration file

---

## Error Handling

### Error Categories

1. **File Errors**:
   - File not found
   - Permission denied
   - Invalid file encoding
   - Corrupted file

2. **Processing Errors**:
   - Invalid Markdown syntax
   - Malformed YAML front matter
   - Template rendering errors
   - Missing template files

3. **Generation Errors**:
   - Browser launch failure
   - PDF generation timeout
   - Memory exhaustion
   - Invalid PDF options

4. **Configuration Errors**:
   - Invalid configuration file
   - Missing required fields
   - Type mismatches

### Error Handling Strategy

**Principles**:
- Fail fast with clear error messages
- Provide actionable error information
- Log errors for debugging
- Graceful degradation where possible

**Error Messages**:
```typescript
interface ErrorMessage {
  code: string;
  message: string;
  details?: string;
  suggestion?: string;
  file?: string;
  line?: number;
}
```

**Example Error Output**:
```
Error: Template not found
  Code: TEMPLATE_NOT_FOUND
  Template: cover.html
  Location: ./templates/default/cover.html
  Suggestion: Run 'pdf-factory init default' to create default templates
```

### Logging

**Log Levels**:
- `ERROR`: Critical errors that prevent execution
- `WARN`: Warnings that don't prevent execution
- `INFO`: Informational messages
- `DEBUG`: Detailed debugging information (verbose mode)

**Log Format**:
```
[LEVEL] [TIMESTAMP] [COMPONENT] Message
```

---

## Performance Considerations

### Optimization Strategies

1. **Template Caching**:
   - Compile templates once
   - Cache compiled templates in memory
   - Invalidate cache on template file changes

2. **Parallel Processing**:
   - Process multiple files in parallel (directory mode)
   - Use worker threads for CPU-intensive tasks
   - Batch PDF generation operations

3. **Resource Management**:
   - Reuse browser instances
   - Limit concurrent browser pages
   - Clean up resources promptly

4. **Memory Management**:
   - Stream large files instead of loading entirely
   - Clear intermediate data structures
   - Use buffers efficiently

### Performance Targets

- **Single File**: < 5 seconds for typical document (50 pages)
- **Directory (10 files)**: < 30 seconds
- **Memory Usage**: < 500MB for typical operation
- **CPU Usage**: Efficient utilization without blocking

### Scalability

**Large Documents**:
- Support documents with 1000+ pages
- Implement pagination strategies
- Optimize TOC generation for large documents

**Many Files**:
- Efficiently process directories with 100+ files
- Implement progress reporting
- Support resumable processing

---

## Security Considerations

### Input Validation

1. **File Path Validation**:
   - Prevent directory traversal attacks
   - Validate file extensions
   - Check file permissions

2. **Content Validation**:
   - Sanitize HTML output
   - Validate YAML front matter
   - Prevent code injection in templates

3. **Template Security**:
   - Restrict template file access
   - Validate template syntax
   - Prevent arbitrary code execution

### Sandboxing

- Run browser in sandboxed environment
- Limit file system access
- Restrict network access (if needed)
- Use process isolation for untrusted content

### Best Practices

- Never execute user-provided code
- Validate all inputs
- Use secure defaults
- Keep dependencies updated
- Follow principle of least privilege

---

## Testing Strategy

### Unit Tests

**Components to Test**:
- File processor (Markdown parsing, front matter extraction)
- Template engine (rendering, variable injection)
- Directory processor (file discovery, sorting)
- Configuration manager (loading, merging, validation)
- CLI parser (argument parsing, validation)

**Test Coverage Target**: 80%+

### Integration Tests

**Scenarios**:
- End-to-end PDF generation from Markdown
- Directory processing with various structures
- Template rendering with different data
- Error handling and recovery

### Test Data

- Sample Markdown files (various formats)
- Test template sets
- Mock file system structures
- Edge cases (empty files, malformed content)

### Continuous Integration

- Run tests on every commit
- Test on multiple Node.js versions
- Test on multiple operating systems
- Performance regression testing

---

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1-2)

**Tasks**:
1. Set up TypeScript project structure
2. Implement CLI interface with commander.js
3. Create configuration manager
4. Implement file processor (basic Markdown parsing)
5. Set up testing framework

**Deliverables**:
- Working CLI with basic commands
- File reading and Markdown parsing
- Configuration loading

### Phase 2: Template System (Week 3-4)

**Tasks**:
1. Implement template engine (Handlebars)
2. Create default template set
3. Implement template loading and caching
4. Add template inheritance support
5. Create template rendering logic

**Deliverables**:
- Functional template engine
- Complete default template set
- Template rendering working

### Phase 3: PDF Generation (Week 5-6)

**Tasks**:
1. Integrate Puppeteer/Playwright
2. Implement PDF generator
3. Add page break management
4. Implement header/footer support
5. Add pagination

**Deliverables**:
- PDF generation from HTML
- Page layout and pagination working
- Header/footer rendering

### Phase 4: Directory Processing (Week 7)

**Tasks**:
1. Implement directory scanner
2. Add file sorting logic
3. Create document structure builder
4. Implement TOC generation
5. Add recursive directory support

**Deliverables**:
- Directory processing functional
- TOC generation working
- File ordering and structure preservation

### Phase 5: Polish and Optimization (Week 8)

**Tasks**:
1. Error handling improvements
2. Performance optimization
3. Documentation completion
4. Additional template sets
5. CLI improvements (progress bars, better output)

**Deliverables**:
- Production-ready application
- Complete documentation
- Performance optimizations
- Multiple template sets

### Phase 6: Testing and Release (Week 9-10)

**Tasks**:
1. Comprehensive testing
2. Bug fixes
3. Performance testing
4. Documentation review
5. Release preparation

**Deliverables**:
- Tested and stable release
- Complete documentation
- Published package

---

## Future Enhancements

### Short-term (v1.1)

- **Watch Mode**: Auto-regenerate PDF on file changes
- **Multiple Output Formats**: EPUB, HTML export
- **Custom CSS Injection**: User-provided stylesheets
- **Image Optimization**: Automatic image compression
- **Table of Figures**: Generate TOC for images/tables

### Medium-term (v1.2)

- **Interactive PDFs**: Hyperlinks, bookmarks, annotations
- **Multi-column Layout**: Newspaper-style layouts
- **Custom Fonts**: Support for custom font files
- **Watermarks**: Add watermarks to PDFs
- **Batch Processing**: Process multiple directories

### Long-term (v2.0)

- **Web Interface**: Browser-based UI for non-CLI users
- **Cloud Processing**: Process documents in the cloud
- **Collaboration Features**: Multi-author support
- **Version Control Integration**: Git-based workflows
- **Plugin System**: Extensible architecture for custom processors

### Research Areas

- **AI-powered Layout**: Intelligent page break placement
- **Accessibility**: Enhanced screen reader support
- **Internationalization**: RTL language support, CJK typography
- **Print Optimization**: Advanced print-specific features

---

## Appendix

### A. Project Structure

```
pdf-factory/
├── src/
│   ├── cli/
│   │   ├── index.ts
│   │   ├── commands/
│   │   └── interactive/
│   │       ├── interactive-cli.ts
│   │       └── components/
│   │           ├── menu.ts
│   │           ├── prompt.ts
│   │           ├── file-browser.ts
│   │           ├── progress.ts
│   │           └── review.ts
│   ├── processors/
│   │   ├── file-processor.ts
│   │   └── directory-processor.ts
│   ├── templates/
│   │   ├── template-engine.ts
│   │   └── default/
│   ├── generators/
│   │   └── pdf-generator.ts
│   ├── config/
│   │   └── config-manager.ts
│   ├── utils/
│   └── types/
├── templates/
│   ├── default/
│   ├── academic/
│   └── book/
├── tests/
├── docs/
├── package.json
├── tsconfig.json
└── README.md
```

### B. Dependencies

**Core Dependencies**:
- `commander`: CLI framework
- `inquirer` or `prompts`: Interactive prompt library
- `inquirer-file-tree-selection-prompt`: File browser for interactive mode
- `chalk` or `colors`: Terminal colors and styling
- `ora`: Spinner and progress indicators
- `marked` or `markdown-it`: Markdown parser
- `puppeteer` or `playwright`: PDF generation
- `handlebars`: Template engine
- `js-yaml`: YAML parsing
- `glob`: File pattern matching

**Dev Dependencies**:
- `typescript`: TypeScript compiler
- `@types/node`: Node.js type definitions
- `jest`: Testing framework
- `eslint`: Linting
- `prettier`: Code formatting

### C. Glossary

- **Front Matter**: YAML metadata at the beginning of Markdown files
- **TOC**: Table of Contents
- **GFM**: GitHub Flavored Markdown
- **AST**: Abstract Syntax Tree
- **Headless Browser**: Browser without GUI, used for automation

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01-XX | System Design | Initial design document |

---

**End of Design Document**
