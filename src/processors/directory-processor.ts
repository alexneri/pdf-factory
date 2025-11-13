import path from 'node:path';

import fs from 'fs-extra';
import { glob } from 'glob';

import type {
  DirectoryOptions,
  DocumentStructure,
  ProcessedFile,
  Section,
  TableOfContentsEntry,
} from '../types';

import { FileProcessor } from './file-processor';

export class DirectoryProcessor {
  private readonly fileProcessor: FileProcessor;

  constructor(fileProcessor: FileProcessor) {
    this.fileProcessor = fileProcessor;
  }

  async processDirectory(
    dirPath: string,
    options: DirectoryOptions = {},
  ): Promise<DocumentStructure> {
    const pattern = options.pattern ?? (options.recursive ? '**/*.md' : '*.md');
    const files = await glob(pattern, {
      cwd: dirPath,
      absolute: true,
      nodir: true,
      dot: false,
      ignore: options.ignore ?? ['node_modules/**', '.git/**'],
    });

    if (files.length === 0) {
      return { files: [], sections: [], toc: [] };
    }

    const processedFiles = await Promise.all(files.map((file) => this.fileProcessor.processFile(file)));
    const sortedFiles = await this.sortFiles(processedFiles, options.orderBy ?? 'name');
    const sections = this.buildSections(sortedFiles);
    const toc = this.buildToc(sortedFiles);

    return {
      files: sortedFiles,
      sections,
      toc,
    };
  }

  private async sortFiles(
    files: ProcessedFile[],
    orderBy: NonNullable<DirectoryOptions['orderBy']>,
  ): Promise<ProcessedFile[]> {
    if (orderBy === 'custom') {
      return [...files].sort((a, b) => {
        const orderA = a.metadata.order ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.metadata.order ?? Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });
    }

    if (orderBy === 'date') {
      const statsEntries = await Promise.all(
        files.map(async (file) => ({ path: file.path, stat: await fs.stat(file.path) })),
      );
      const statsMap = new Map(statsEntries.map((entry) => [entry.path, entry.stat]));
      return [...files].sort((a, b) => {
        const statA = statsMap.get(a.path)?.mtimeMs ?? 0;
        const statB = statsMap.get(b.path)?.mtimeMs ?? 0;
        return statA - statB;
      });
    }

    return [...files].sort((a, b) => {
      const nameA = path.basename(a.path).toLowerCase();
      const nameB = path.basename(b.path).toLowerCase();
      return nameA.localeCompare(nameB, undefined, { numeric: true });
    });
  }

  private buildSections(files: ProcessedFile[]): Section[] {
    const sections: Section[] = [];

    for (const file of files) {
      const stack: Section[] = [];
      for (const heading of file.headings) {
        const section: Section = {
          title: heading.title,
          level: heading.level,
          anchor: heading.anchor,
          filePath: file.path,
          children: [],
        };

        while (stack.length > 0 && stack[stack.length - 1].level >= section.level) {
          stack.pop();
        }

        if (stack.length === 0) {
          sections.push(section);
        } else {
          stack[stack.length - 1].children.push(section);
        }

        stack.push(section);
      }
    }

    return sections;
  }

  private buildToc(files: ProcessedFile[]): TableOfContentsEntry[] {
    const entries: TableOfContentsEntry[] = [];

    for (const file of files) {
      const stack: TableOfContentsEntry[] = [];
      for (const heading of file.headings) {
        const entry: TableOfContentsEntry = {
          title: heading.title,
          level: heading.level,
          anchor: heading.anchor,
          children: [],
        };

        while (stack.length > 0 && (stack.at(-1)?.level ?? 0) >= entry.level) {
          stack.pop();
        }

        const parent = stack.at(-1);

        if (parent) {
          parent.children = parent.children ?? [];
          parent.children.push(entry);
        } else {
          entries.push(entry);
        }

        stack.push(entry);
      }
    }

    return entries;
  }
}

