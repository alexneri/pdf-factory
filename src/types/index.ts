import type { PDFOptions as PuppeteerPdfOptions } from 'puppeteer';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface BuildOptions {
  includeCover: boolean;
  includeTOC: boolean;
  verbose: boolean;
  customConfig?: string;
  recursive?: boolean;
  pattern?: string;
  orderBy?: 'name' | 'date' | 'custom';
  ignore?: string[];
}

export interface BuildSettings {
  input: string;
  output: string;
  template: string;
  options: BuildOptions;
}

export interface FileMetadata {
  title?: string;
  author?: string;
  date?: string;
  order?: number;
  chapter?: boolean;
  toc?: boolean;
  [key: string]: unknown;
}

export interface Heading {
  title: string;
  level: number;
  anchor: string;
}

export interface ProcessedFile {
  path: string;
  frontMatter: Record<string, unknown>;
  content: string;
  metadata: FileMetadata;
  headings: Heading[];
}

export interface DirectoryOptions {
  recursive?: boolean;
  pattern?: string;
  orderBy?: 'name' | 'date' | 'custom';
  ignore?: string[];
}

export interface Section {
  title: string;
  level: number;
  filePath: string;
  anchor: string;
  children: Section[];
}

export interface TableOfContentsEntry {
  title: string;
  level: number;
  page?: number;
  anchor: string;
  children?: TableOfContentsEntry[];
}

export interface DocumentStructure {
  files: ProcessedFile[];
  sections: Section[];
  toc: TableOfContentsEntry[];
}

export interface DocumentData {
  title: string;
  author?: string;
  date?: string;
  content: string;
  frontMatter: Record<string, unknown>;
}

export interface PageData {
  title: string;
  anchor: string;
  content: string;
  order: number;
  filePath: string;
}

export interface TemplateData {
  document: DocumentData;
  metadata: DocumentMetadata;
  toc: TableOfContentsEntry[];
  pages: PageData[];
  options: BuildOptions;
  styles?: string;
}

export interface DocumentMetadata {
  generatedAt: string;
  version: string;
  source: string;
}

export interface TemplateConfig {
  directory: string;
  defaults: {
    cover: string;
    title: string;
    toc: string;
    header: string;
    footer: string;
    backCover: string;
    frontMatter: string;
    layout: string;
    styles: string;
  };
}

export interface OutputConfig {
  directory: string;
  naming: string;
}

export interface Config {
  templates: TemplateConfig;
  pdf: PdfGenerationOptions;
  processing: ProcessingConfig;
  output: OutputConfig;
}

export interface ProcessingConfig {
  markdown: MarkdownOptions;
  frontMatter: FrontMatterOptions;
}

export interface MarkdownOptions {
  gfm: boolean;
  breaks: boolean;
  math: boolean;
  syntaxHighlighting: boolean;
}

export interface FrontMatterOptions {
  required: boolean;
  strict: boolean;
}

export type PdfGenerationOptions = PuppeteerPdfOptions & {
  preferCSSPageSize?: boolean;
};

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug?(message: string): void;
}

