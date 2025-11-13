import os from 'node:os';
import path from 'node:path';

import fs from 'fs-extra';
import { describe, expect, it } from 'vitest';

import { DEFAULT_CONFIG } from '../src/config/config-manager';
import { FileProcessor } from '../src/processors/file-processor';

describe('FileProcessor', () => {
  it('processes markdown files with headings and metadata', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-factory-'));
    const filePath = path.join(tempDir, 'sample.md');
    const markdown = `---
title: Sample Document
author: Jane Doe
---
# Introduction

Hello world.
`;

    await fs.writeFile(filePath, markdown);

    const processor = new FileProcessor(DEFAULT_CONFIG.processing.markdown);
    const result = await processor.processFile(filePath);

    expect(result.metadata.title).toBe('Sample Document');
    expect(result.metadata.author).toBe('Jane Doe');
    expect(result.headings).toHaveLength(1);
    expect(result.headings[0]).toMatchObject({ title: 'Introduction', level: 1 });
    expect(result.content).toContain('<h1 id="introduction" tabindex="-1">Introduction');
  });
});

