import inquirer from 'inquirer';
import ora from 'ora';

import { PdfFactory } from '../../core/pdf-factory';
import type { BuildOptions, BuildSettings } from '../../types';

export class InteractiveCLI {
  private readonly pdfFactory: PdfFactory;

  constructor(pdfFactory: PdfFactory) {
    this.pdfFactory = pdfFactory;
  }

  async start(): Promise<void> {
    let exitRequested = false;

    while (!exitRequested) {
      const { action } = await inquirer.prompt<{ action: string }>([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'Build PDF from single file', value: 'build-file' },
            { name: 'Build PDF from directory', value: 'build-dir' },
            { name: 'List available templates', value: 'list-templates' },
            { name: 'Initialize new template', value: 'init-template' },
            { name: 'Exit', value: 'exit' },
          ],
        },
      ]);

      switch (action) {
        case 'build-file':
          await this.handleBuildFile();
          break;
        case 'build-dir':
          await this.handleBuildDirectory();
          break;
        case 'list-templates':
          await this.handleListTemplates();
          break;
        case 'init-template':
          await this.handleInitTemplate();
          break;
        default:
          exitRequested = true;
          break;
      }
    }
  }

  private async handleBuildFile(): Promise<void> {
    const answers = await inquirer.prompt<{
      inputPath: string;
      outputPath: string;
      template: string;
      includeCover: boolean;
      includeTOC: boolean;
    }>([
      {
        type: 'input',
        name: 'inputPath',
        message: 'Enter the Markdown file path:',
        validate: (value: string) => (value.trim().length > 0 ? true : 'Input path is required'),
      },
      {
        type: 'input',
        name: 'outputPath',
        message: 'Output PDF path (leave empty for default):',
      },
      {
        type: 'list',
        name: 'template',
        message: 'Select template:',
        choices: await this.getTemplateChoices(),
      },
      {
        type: 'confirm',
        name: 'includeCover',
        message: 'Include cover page?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'includeTOC',
        message: 'Include table of contents?',
        default: true,
      },
    ]);

    const options: BuildOptions = {
      includeCover: answers.includeCover,
      includeTOC: answers.includeTOC,
      verbose: false,
    };

    const settings: BuildSettings = {
      input: answers.inputPath,
      output: answers.outputPath,
      template: answers.template,
      options,
    };

    const spinner = ora('Generating PDF...').start();
    try {
      await this.pdfFactory.buildFromFile(settings);
      spinner.succeed('PDF generated successfully.');
    } catch (error) {
      spinner.fail('PDF generation failed.');
      throw error;
    }
  }

  private async handleBuildDirectory(): Promise<void> {
    const answers = await inquirer.prompt<{
      directory: string;
      outputPath: string;
      template: string;
      recursive: boolean;
      pattern: string;
      orderBy: 'name' | 'date' | 'custom';
      ignore: string;
      includeCover: boolean;
      includeTOC: boolean;
    }>([
      {
        type: 'input',
        name: 'directory',
        message: 'Enter directory path:',
        validate: (value: string) => (value.trim().length > 0 ? true : 'Directory path is required'),
      },
      {
        type: 'confirm',
        name: 'recursive',
        message: 'Process subdirectories recursively?',
        default: true,
      },
      {
        type: 'input',
        name: 'pattern',
        message: 'File pattern:',
        default: '**/*.md',
      },
      {
        type: 'list',
        name: 'orderBy',
        message: 'Sort files by:',
        choices: [
          { name: 'Name', value: 'name' },
          { name: 'Date', value: 'date' },
          { name: 'Custom (front matter order)', value: 'custom' },
        ],
        default: 'name',
      },
      {
        type: 'input',
        name: 'ignore',
        message: 'Ignore patterns (comma separated):',
        default: 'node_modules/**,.git/**',
      },
      {
        type: 'input',
        name: 'outputPath',
        message: 'Output PDF path (leave empty for default):',
      },
      {
        type: 'list',
        name: 'template',
        message: 'Select template:',
        choices: await this.getTemplateChoices(),
      },
      {
        type: 'confirm',
        name: 'includeCover',
        message: 'Include cover page?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'includeTOC',
        message: 'Include table of contents?',
        default: true,
      },
    ]);

    const options: BuildOptions = {
      includeCover: answers.includeCover,
      includeTOC: answers.includeTOC,
      verbose: false,
      recursive: answers.recursive,
      pattern: answers.pattern,
      orderBy: answers.orderBy,
      ignore: answers.ignore
        ? answers.ignore.split(',').map((item) => item.trim()).filter(Boolean)
        : undefined,
    };

    const settings: Omit<BuildSettings, 'input'> = {
      output: answers.outputPath,
      template: answers.template,
      options,
    };

    const spinner = ora('Generating PDF...').start();
    try {
      await this.pdfFactory.buildFromDirectory(answers.directory, settings, {
        recursive: answers.recursive,
        pattern: answers.pattern,
        orderBy: answers.orderBy,
        ignore: options.ignore,
      });
      spinner.succeed('PDF generated successfully.');
    } catch (error) {
      spinner.fail('PDF generation failed.');
      throw error;
    }
  }

  private async handleListTemplates(): Promise<void> {
    const templates = await this.pdfFactory.listTemplates();
    if (templates.length === 0) {
      console.log('No templates available.');
      return;
    }

    console.log('\nAvailable templates:');
    templates.forEach((template) => console.log(` • ${template}`));
    console.log('');
  }

  private async handleInitTemplate(): Promise<void> {
    const answers = await inquirer.prompt<{ name: string; directory: string }>([
      {
        type: 'input',
        name: 'name',
        message: 'Template name:',
        validate: (value: string) => (value.trim().length > 0 ? true : 'Template name is required'),
      },
      {
        type: 'input',
        name: 'directory',
        message: 'Target directory (leave empty for default templates directory):',
      },
    ]);

    const spinner = ora('Creating template...').start();
    try {
      await this.pdfFactory.initTemplate(answers.name, answers.directory || undefined);
      spinner.succeed('Template created.');
    } catch (error) {
      spinner.fail('Template creation failed.');
      throw error;
    }
  }

  private async getTemplateChoices(): Promise<{ name: string; value: string }[]> {
    const templates = await this.pdfFactory.listTemplates();

    if (templates.length === 0) {
      return [{ name: 'default', value: 'default' }];
    }

    return templates.map((template) => ({
      name: template,
      value: template,
    }));
  }
}

