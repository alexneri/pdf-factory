import path from 'node:path';

import fs from 'fs-extra';
import { glob } from 'glob';
import Handlebars from 'handlebars';

import type { TemplateData } from '../types';

interface Template {
  name: string;
  content: string;
  compiled: Handlebars.TemplateDelegate<TemplateData>;
}

export class TemplateEngine {
  private cache = new Map<string, Template>();
  private readonly templatesDir: string;

  constructor(templatesDir: string) {
    this.templatesDir = templatesDir;
    this.registerHelpers();
  }

  async loadTemplate(name: string): Promise<Template> {
    if (this.cache.has(name)) {
      return this.cache.get(name)!;
    }

    const templateDir = path.join(this.templatesDir, name);
    const exists = await fs.pathExists(templateDir);

    if (!exists) {
      throw new Error(`Template "${name}" not found in ${this.templatesDir}`);
    }

    await this.registerPartials(templateDir);

    const layoutPath = path.join(templateDir, 'layout.html');
    const layoutContent = await fs.readFile(layoutPath, 'utf-8');
    const compiled = Handlebars.compile<TemplateData>(layoutContent);

    const template = {
      name,
      content: layoutContent,
      compiled,
    };

    this.cache.set(name, template);

    return template;
  }

  async render(name: string, data: TemplateData): Promise<string> {
    const template = await this.loadTemplate(name);
    const stylesPath = path.join(this.templatesDir, name, 'styles.css');
    const styles = (await fs.pathExists(stylesPath)) ? await fs.readFile(stylesPath, 'utf-8') : undefined;

    return template.compiled({
      ...data,
      styles,
    });
  }

  clearCache(): void {
    this.cache.clear();
  }

  private async registerPartials(templateDir: string): Promise<void> {
    const htmlFiles = await glob('**/*.html', {
      cwd: templateDir,
      absolute: true,
      nodir: true,
    });

    await Promise.all(
      htmlFiles.map(async (filePath) => {
        if (path.basename(filePath) === 'layout.html') {
          return;
        }

        const partialName = this.toPartialName(templateDir, filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        Handlebars.registerPartial(partialName, content);
      }),
    );
  }

  private toPartialName(baseDir: string, filePath: string): string {
    const relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/');
    return relativePath.replace(/\.html$/, '');
  }

  private registerHelpers(): void {
    Handlebars.registerHelper('eq', (a, b) => a === b);
    Handlebars.registerHelper('and', (a, b) => a && b);
    Handlebars.registerHelper('or', (a, b) => a || b);
    Handlebars.registerHelper('not', (value) => !value);
    Handlebars.registerHelper('formatDate', (value: string) => {
      if (!value) {
        return '';
      }

      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
    });
  }
}

