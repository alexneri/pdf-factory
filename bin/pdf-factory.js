#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const { publishFile } = require('../src/lib/publisher');
const { publishDirectory } = require('../src/lib/directoryPublisher');
const packageJson = require('../package.json');

program
  .name('pdf-factory')
  .description('A CLI utility to create publish-ready PDFs from Markdown content')
  .version(packageJson.version);

program
  .command('publish <input>')
  .description('Publish markdown file(s) to PDF')
  .option('-o, --output <path>', 'Output PDF file path')
  .option('-t, --title <title>', 'Document title')
  .option('-a, --author <author>', 'Document author')
  .option('--cover-template <path>', 'Custom cover template HTML file')
  .option('--title-template <path>', 'Custom title page template HTML file')
  .option('--toc', 'Generate table of contents', true)
  .option('--no-toc', 'Disable table of contents')
  .option('--header-template <path>', 'Custom header template HTML file')
  .option('--footer-template <path>', 'Custom footer template HTML file')
  .action(async (input, options) => {
    try {
      const stats = require('fs').statSync(input);
      
      if (stats.isDirectory()) {
        console.log(`Publishing directory: ${input}`);
        await publishDirectory(input, options);
      } else if (stats.isFile()) {
        console.log(`Publishing file: ${input}`);
        await publishFile(input, options);
      } else {
        console.error('Input must be a file or directory');
        process.exit(1);
      }
      
      console.log('✓ PDF generated successfully!');
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize a new project with default templates')
  .option('-d, --directory <path>', 'Target directory', '.')
  .action((options) => {
    const { initTemplates } = require('../src/lib/templateManager');
    try {
      initTemplates(options.directory);
      console.log('✓ Templates initialized successfully!');
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

program.parse();
