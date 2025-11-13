import chalk from 'chalk';

import type { Logger } from '../types';

export class ConsoleLogger implements Logger {
  private readonly verbose: boolean;

  constructor(verbose = false) {
    this.verbose = verbose;
  }

  info(message: string): void {
    console.log(chalk.cyan('[INFO]'), message);
  }

  warn(message: string): void {
    console.warn(chalk.yellow('[WARN]'), message);
  }

  error(message: string): void {
    console.error(chalk.red('[ERROR]'), message);
  }

  debug(message: string): void {
    if (!this.verbose) {
      return;
    }

    console.debug(chalk.gray('[DEBUG]'), message);
  }
}

