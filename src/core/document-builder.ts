import type {
  BuildOptions,
  DocumentData,
  DocumentMetadata,
  PageData,
  ProcessedFile,
  TableOfContentsEntry,
  TemplateData,
} from '../types';

interface BuildDocumentParams {
  files: ProcessedFile[];
  toc: TableOfContentsEntry[];
  options: BuildOptions;
  fallbackTitle: string;
}

export class DocumentBuilder {
  build(params: BuildDocumentParams): TemplateData {
    const { files, toc, options, fallbackTitle } = params;
    const primaryFile = files[0];
    const title = (primaryFile?.metadata.title as string | undefined) ?? fallbackTitle;
    const author = primaryFile?.metadata.author as string | undefined;
    const date = primaryFile?.metadata.date as string | undefined;

    const pages = this.toPages(files);
    const documentContent = pages
      .map(
        (page) =>
          `<section id="${page.anchor}" data-source="${page.filePath}">${page.content}</section>`,
      )
      .join('\n');

    const document: DocumentData = {
      title,
      author,
      date,
      content: documentContent,
      frontMatter: primaryFile?.frontMatter ?? {},
    };

    const metadata: DocumentMetadata = {
      generatedAt: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.0.0',
      source: primaryFile?.path ?? 'unknown',
    };

    return {
      document,
      metadata,
      toc,
      pages,
      options,
    };
  }

  private toPages(files: ProcessedFile[]): PageData[] {
    return files.map((file, index) => {
      const anchor =
        file.headings[0]?.anchor ?? `section-${index + 1}-${this.slugify(file.metadata.title ?? '')}`;
      return {
        title: file.metadata.title ?? `Section ${index + 1}`,
        anchor,
        content: file.content,
        order: index,
        filePath: file.path,
      };
    });
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }
}

