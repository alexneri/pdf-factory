#!/usr/bin/env node
import process from 'node:process';

import { Command } from 'commander';

import pkg from '../../package.json';
import { ConfigManager } from '../config/config-manager';
import { DocumentBuilder } from '../core/document-builder';
import { PdfFactory } from '../core/pdf-factory';
import { PdfGenerator } from '../generators/pdf-generator';
import { DirectoryProcessor } from '../processors/directory-processor';
import { FileProcessor } from '../processors/file-processor';
import { TemplateEngine } from '../templates/template-engine';
import { BuildOptions, BuildSettings, DirectoryOptions } from '../types';
import { ConsoleLogger } from '../utils/logger';

import { InteractiveCLI } from './interactive/interactive-cli';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const wantsInteractiveFlag = args.includes('-i') || args.includes('--interactive');
  const hasCommand = args.some((arg) => !arg.startsWith('-'));

  if (args.length === 0 || (wantsInteractiveFlag && !hasCommand)) {
    const { pdfFactory } = await createPdfFactory(undefined, false);
    try {
      const interactive = new InteractiveCLI(pdfFactory);
      await interactive.start();
    } finally {
      await pdfFactory.dispose();
    }
    return;
  }

  const program = new Command();
  program.name('pdf-factory').description(pkg.description ?? '').version(pkg.version ?? '0.0.0');

  program
    .command('build')
    .argument('<input>', 'Markdown file to process')
    .description('Build a PDF from a single Markdown file')
    .option('-o, --output <path>', 'Output PDF path')
    .option('-t, --template <name>', 'Template set name', 'default')
    .option('-c, --config <path>', 'Configuration file path')
    .option('--no-cover', 'Skip cover page')
    .option('--no-toc', 'Skip table of contents')
    .option('-v, --verbose', 'Enable verbose logging', false)
    .action(async (input: string, options) => {
      await runCommand(async () => {
        const { pdfFactory } = await createPdfFactory(options.config, options.verbose);
        try {
          const buildOptions: BuildOptions = {
            includeCover: options.cover !== false,
            includeTOC: options.toc !== false,
            verbose: Boolean(options.verbose),
          };

          const settings: BuildSettings = {
            input,
            output: options.output ?? '',
            template: options.template ?? 'default',
            options: buildOptions,
          };

          await pdfFactory.buildFromFile(settings);
        } finally {
          await pdfFactory.dispose();
        }
      });
    });

  program
    .command('build-dir')
    .argument('<directory>', 'Directory containing Markdown files')
    .description('Build a PDF by combining Markdown files in a directory')
    .option('-o, --output <path>', 'Output PDF path')
    .option('-t, --template <name>', 'Template set name', 'default')
    .option('-c, --config <path>', 'Configuration file path')
    .option('-r, --recursive', 'Process subdirectories recursively')
    .option('--pattern <glob>', 'Glob pattern for Markdown files', '**/*.md')
    .option('--order-by <method>', 'Sort files by name, date, or custom', 'name')
    .option('--ignore <patterns>', 'Comma-separated glob patterns to ignore', 'node_modules/**,.git/**')
    .option('--no-cover', 'Skip cover page')
    .option('--no-toc', 'Skip table of contents')
    .option('-v, --verbose', 'Enable verbose logging', false)
    .action(async (directory: string, options) => {
      await runCommand(async () => {
        const { pdfFactory } = await createPdfFactory(options.config, options.verbose);
        try {
          const buildOptions: BuildOptions = {
            includeCover: options.cover !== false,
            includeTOC: options.toc !== false,
            verbose: Boolean(options.verbose),
            recursive: Boolean(options.recursive),
            pattern: options.pattern,
            orderBy: normalizeOrderBy(options.orderBy),
            ignore: options.ignore
              ? options.ignore.split(',').map((entry: string) => entry.trim()).filter(Boolean)
              : undefined,
          };

          const settings: Omit<BuildSettings, 'input'> = {
            output: options.output ?? '',
            template: options.template ?? 'default',
            options: buildOptions,
          };

          const directoryOptions: DirectoryOptions = {
            recursive: Boolean(options.recursive),
            pattern: options.pattern,
            orderBy: normalizeOrderBy(options.orderBy),
            ignore: buildOptions.ignore,
          };

          await pdfFactory.buildFromDirectory(directory, settings, directoryOptions);
        } finally {
          await pdfFactory.dispose();
        }
      });
    });

  program
    .command('init')
    .argument('[name]', 'Template name', 'custom-template')
    .description('Initialize a new template set')
    .option('-d, --directory <path>', 'Target directory for template')
    .option('-c, --config <path>', 'Configuration file path')
    .action(async (name: string, options) => {
      await runCommand(async () => {
        const { pdfFactory } = await createPdfFactory(options.config, false);
        try {
          await pdfFactory.initTemplate(name, options.directory);
        } finally {
          await pdfFactory.dispose();
        }
      });
    });

  program
    .command('list-templates')
    .description('List available templates')
    .option('-c, --config <path>', 'Configuration file path')
    .action(async (options) => {
      await runCommand(async () => {
        const { pdfFactory } = await createPdfFactory(options.config, false);
        try {
          const templates = await pdfFactory.listTemplates();
          templates.forEach((template) => console.log(template));
        } finally {
          await pdfFactory.dispose();
        }
      });
    });

  await program.parseAsync(process.argv);
}

async function runCommand(handler: () => Promise<void>): Promise<void> {
  try {
    await handler();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\nError: ${message}\n`);
    process.exitCode = 1;
  }
}

async function createPdfFactory(configPath?: string, verbose?: boolean): Promise<{
  pdfFactory: PdfFactory;
}> {
  const configManager = new ConfigManager(process.cwd());
  await configManager.load(configPath);
  const config = configManager.get();
  const logger = new ConsoleLogger(Boolean(verbose));
  const fileProcessor = new FileProcessor(config.processing.markdown);
  const directoryProcessor = new DirectoryProcessor(fileProcessor);
  const templateEngine = new TemplateEngine(config.templates.directory);
  const pdfGenerator = new PdfGenerator();
  const documentBuilder = new DocumentBuilder();
  const pdfFactory = new PdfFactory(
    configManager,
    fileProcessor,
    directoryProcessor,
    templateEngine,
    pdfGenerator,
    documentBuilder,
    logger,
  );

  return { pdfFactory };
}

function normalizeOrderBy(value: unknown): 'name' | 'date' | 'custom' {
  if (value === 'date' || value === 'custom') {
    return value;
  }

  return 'name';
}

void main();

