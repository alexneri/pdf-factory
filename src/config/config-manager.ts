import path from 'node:path';

import fs from 'fs-extra';
import yaml from 'js-yaml';
import { z } from 'zod';

import type { Config } from '../types';

const DEFAULT_CONFIG: Config = {
  templates: {
    directory: path.resolve(process.cwd(), 'templates'),
    defaults: {
      cover: 'cover.html',
      title: 'title.html',
      toc: 'toc.html',
      header: 'header.html',
      footer: 'footer.html',
      backCover: 'back-cover.html',
      frontMatter: 'front-matter.html',
      layout: 'layout.html',
      styles: 'styles.css',
    },
  },
  pdf: {
    format: 'A4',
    margin: {
      top: '2cm',
      right: '1.5cm',
      bottom: '2cm',
      left: '1.5cm',
    },
    printBackground: true,
    displayHeaderFooter: true,
    preferCSSPageSize: false,
    scale: 1.0,
  },
  processing: {
    markdown: {
      gfm: true,
      breaks: true,
      math: false,
      syntaxHighlighting: true,
    },
    frontMatter: {
      required: false,
      strict: false,
    },
  },
  output: {
    directory: path.resolve(process.cwd(), 'output'),
    naming: '{{title}}.pdf',
  },
};

const TemplateDefaultsSchema = z
  .object({
    cover: z.string(),
    title: z.string(),
    toc: z.string(),
    header: z.string(),
    footer: z.string(),
    backCover: z.string(),
    frontMatter: z.string(),
    layout: z.string(),
    styles: z.string(),
  })
  .partial();

const ConfigSchema = z.object({
  templates: z
    .object({
      directory: z.string().optional(),
      defaults: TemplateDefaultsSchema.optional(),
    })
    .optional(),
  pdf: z
    .object({
      format: z.string().optional(),
      margin: z
        .object({
          top: z.string().optional(),
          right: z.string().optional(),
          bottom: z.string().optional(),
          left: z.string().optional(),
        })
        .optional(),
      printBackground: z.boolean().optional(),
      displayHeaderFooter: z.boolean().optional(),
      preferCSSPageSize: z.boolean().optional(),
      scale: z.number().optional(),
      headerTemplate: z.string().optional(),
      footerTemplate: z.string().optional(),
    })
    .optional(),
  processing: z
    .object({
      markdown: z
        .object({
          gfm: z.boolean().optional(),
          breaks: z.boolean().optional(),
          math: z.boolean().optional(),
          syntaxHighlighting: z.boolean().optional(),
        })
        .optional(),
      frontMatter: z
        .object({
          required: z.boolean().optional(),
          strict: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  output: z
    .object({
      directory: z.string().optional(),
      naming: z.string().optional(),
    })
    .optional(),
});

export class ConfigManager {
  private config: Config = DEFAULT_CONFIG;
  private readonly cwd: string;

  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
  }

  async load(configPath?: string): Promise<Config> {
    const resolvedPath =
      configPath ??
      process.env.PDF_FACTORY_CONFIG ??
      path.resolve(this.cwd, 'pdf-factory.config.yaml');

    if (await fs.pathExists(resolvedPath)) {
      const loadedConfig = await this.readConfigFile(resolvedPath);
      this.config = deepMerge(DEFAULT_CONFIG, loadedConfig);
    } else {
      this.config = DEFAULT_CONFIG;
    }

    this.normalizePaths();

    return this.config;
  }

  get(): Config {
    return this.config;
  }

  merge(config: Partial<Config>): void {
    this.config = deepMerge(this.config, config);
  }

  private async readConfigFile(configPath: string): Promise<Partial<Config>> {
    const raw = await fs.readFile(configPath, 'utf-8');
    const parsed = configPath.endsWith('.json')
      ? JSON.parse(raw)
      : (yaml.load(raw) as Record<string, unknown>);
    const validated = ConfigSchema.parse(parsed);
    return validated as Partial<Config>;
  }

  private normalizePaths(): void {
    this.config.templates.directory = this.ensureAbsolute(this.config.templates.directory);
    this.config.output.directory = this.ensureAbsolute(this.config.output.directory);
  }

  private ensureAbsolute(targetPath: string): string {
    return path.isAbsolute(targetPath) ? targetPath : path.resolve(this.cwd, targetPath);
  }
}

function deepMerge<T>(target: T, source?: Partial<T>): T {
  if (typeof target !== 'object' || target === null) {
    return source as T;
  }

  const output = Array.isArray(target) ? [...target] : { ...target };

  for (const [key, value] of Object.entries(source ?? {})) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      (output as Record<string, unknown>)[key] = value.slice();
      continue;
    }

    if (typeof value === 'object' && value !== null) {
      (output as Record<string, unknown>)[key] = deepMerge(
        (output as Record<string, unknown>)[key],
        value,
      );
      continue;
    }

    (output as Record<string, unknown>)[key] = value;
  }

  return output as T;
}

export { DEFAULT_CONFIG };

