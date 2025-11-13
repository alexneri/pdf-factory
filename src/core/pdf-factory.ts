import path from 'node:path';

import fs from 'fs-extra';

import { ConfigManager } from '../config/config-manager';
import { PdfGenerator } from '../generators/pdf-generator';
import { DirectoryProcessor } from '../processors/directory-processor';
import { FileProcessor } from '../processors/file-processor';
import { TemplateEngine } from '../templates/template-engine';
import type {
  BuildSettings,
  DirectoryOptions,
  Logger,
  ProcessedFile,
  TableOfContentsEntry,
} from '../types';

import { DocumentBuilder } from './document-builder';

export class PdfFactory {
  private readonly configManager: ConfigManager;
  private readonly fileProcessor: FileProcessor;
  private readonly directoryProcessor: DirectoryProcessor;
  private readonly templateEngine: TemplateEngine;
  private readonly pdfGenerator: PdfGenerator;
  private readonly documentBuilder: DocumentBuilder;
  private readonly logger: Logger;

  constructor(
    configManager: ConfigManager,
    fileProcessor: FileProcessor,
    directoryProcessor: DirectoryProcessor,
    templateEngine: TemplateEngine,
    pdfGenerator: PdfGenerator,
    documentBuilder: DocumentBuilder,
    logger: Logger,
  ) {
    this.configManager = configManager;
    this.fileProcessor = fileProcessor;
    this.directoryProcessor = directoryProcessor;
    this.templateEngine = templateEngine;
    this.pdfGenerator = pdfGenerator;
    this.documentBuilder = documentBuilder;
    this.logger = logger;
  }

  async buildFromFile(settings: BuildSettings): Promise<string> {
    const config = this.configManager.get();
    const absoluteInput = path.resolve(settings.input);

    this.logger.info(`Processing file ${absoluteInput}`);
    const processed = await this.fileProcessor.processFile(absoluteInput);
    const toc = this.buildTocFromFile(processed);
    const templateData = this.documentBuilder.build({
      files: [processed],
      toc: settings.options.includeTOC ? toc : [],
      options: settings.options,
      fallbackTitle: processed.metadata.title ?? path.basename(absoluteInput),
    });

    const html = await this.templateEngine.render(settings.template, templateData);
    const pdfBuffer = await this.pdfGenerator.generate(html, config.pdf);
    const outputPath = await this.resolveOutputPath(settings.output ?? '', processed.metadata.title);
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, pdfBuffer);

    this.logger.info(`PDF written to ${outputPath}`);

    return outputPath;
  }

  async buildFromDirectory(
    dirPath: string,
    settings: Omit<BuildSettings, 'input'>,
    directoryOptions: DirectoryOptions,
  ): Promise<string> {
    const config = this.configManager.get();
    const absoluteDir = path.resolve(dirPath);
    this.logger.info(`Scanning directory ${absoluteDir}`);

    const structure = await this.directoryProcessor.processDirectory(absoluteDir, directoryOptions);

    if (structure.files.length === 0) {
      throw new Error(`No Markdown files found in ${absoluteDir}`);
    }

    const title = path.basename(absoluteDir);
    const templateData = this.documentBuilder.build({
      files: structure.files,
      toc: settings.options.includeTOC ? structure.toc : [],
      options: settings.options,
      fallbackTitle: title,
    });

    const html = await this.templateEngine.render(settings.template, templateData);
    const pdfBuffer = await this.pdfGenerator.generate(html, config.pdf);
    const outputPath = await this.resolveOutputPath(settings.output ?? '', title);
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, pdfBuffer);

    this.logger.info(`PDF written to ${outputPath}`);

    return outputPath;
  }

  async listTemplates(): Promise<string[]> {
    const config = this.configManager.get();
    const templateDir = config.templates.directory;
    const entries = await fs.readdir(templateDir, { withFileTypes: true }).catch(() => []);

    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  }

  async initTemplate(name: string, directory?: string): Promise<string> {
    const config = this.configManager.get();
    const sourceDir = path.join(config.templates.directory, 'default');
    const targetDir = directory
      ? path.resolve(directory, name)
      : path.join(config.templates.directory, name);

    const exists = await fs.pathExists(targetDir);
    if (exists) {
      throw new Error(`Template directory already exists: ${targetDir}`);
    }

    await fs.copy(sourceDir, targetDir);
    this.logger.info(`Template "${name}" created at ${targetDir}`);
    return targetDir;
  }

  async dispose(): Promise<void> {
    await this.pdfGenerator.close();
  }

  private async resolveOutputPath(requestedOutput: string, title?: string): Promise<string> {
    const config = this.configManager.get();
    if (requestedOutput) {
      return path.isAbsolute(requestedOutput)
        ? requestedOutput
        : path.resolve(config.output.directory, requestedOutput);
    }

    const safeTitle = (title ?? 'document').replace(/[^\w\d-_]+/g, '-').toLowerCase();
    const fileName = config.output.naming.replace('{{title}}', safeTitle);
    return path.resolve(config.output.directory, fileName);
  }

  private buildTocFromFile(file: ProcessedFile): TableOfContentsEntry[] {
    return file.headings
      .filter((heading) => heading.level <= 3)
      .map((heading) => ({
        title: heading.title,
        level: heading.level,
        anchor: heading.anchor,
      }));
  }
}

