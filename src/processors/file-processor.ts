import path from 'node:path';

import fs from 'fs-extra';
import matter from 'gray-matter';
import hljs from 'highlight.js';
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import footnote from 'markdown-it-footnote';
import linkAttributes from 'markdown-it-link-attributes';
import taskLists from 'markdown-it-task-lists';

import type {
  FileMetadata,
  Heading,
  MarkdownOptions,
  ProcessedFile,
} from '../types';

interface RenderResult {
  html: string;
  headings: Heading[];
}

export class FileProcessor {
  private readonly md: MarkdownIt;
  private readonly options: MarkdownOptions;

  constructor(options: MarkdownOptions) {
    this.options = options;
    this.md = this.createRenderer();
  }

  async processFile(filePath: string): Promise<ProcessedFile> {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(fileContent);
    const metadata = this.toMetadata(data, filePath);
    const { html, headings } = this.renderMarkdown(content);

    return {
      path: filePath,
      frontMatter: data,
      content: html,
      metadata,
      headings,
    };
  }

  private renderMarkdown(markdown: string): RenderResult {
    const env: { headings: Heading[] } = { headings: [] };
    const html = this.md.render(markdown, env);
    return {
      html,
      headings: env.headings ?? [],
    };
  }

  private createRenderer(): MarkdownIt {
    const renderer = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: (str, lang) => this.highlight(str, lang),
      breaks: this.options.breaks,
    });

    renderer.use(anchor, {
      slugify: (value) => this.slugify(value),
      permalink: anchor.permalink.linkInsideHeader({
        symbol: '#',
        class: 'anchor-link',
      }),
    });

    renderer.use(linkAttributes, {
      matcher: (link: string) => /^https?:\/\//.test(link),
      attrs: {
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    });

    if (this.options.syntaxHighlighting) {
      renderer.renderer.rules.code_inline = (tokens, idx) => {
        const token = tokens[idx];
        return `<code class="inline-code">${renderer.utils.escapeHtml(token.content)}</code>`;
      };
    }

    if (this.options.gfm) {
      renderer.use(taskLists, { enabled: true });
    }

    if (this.options.gfm || this.options.breaks) {
      renderer.enable(['table', 'strikethrough']);
    }

    renderer.use(footnote);

    renderer.core.ruler.push('collect_headings', (state) => {
      const headings: Heading[] = [];

      state.tokens.forEach((token, idx) => {
        if (token.type !== 'heading_open') {
          return;
        }

        const level = Number.parseInt(token.tag.replace('h', ''), 10);
        const contentToken = state.tokens[idx + 1];
        const title = contentToken?.content ?? '';
        const anchorAttr = token.attrs?.find(([name]) => name === 'id');
        const anchorId = anchorAttr?.[1] ?? this.slugify(title);

        headings.push({
          title,
          level,
          anchor: anchorId,
        });
      });

      state.env.headings = headings;
    });

    return renderer;
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  private highlight(code: string, language?: string): string {
    if (!this.options.syntaxHighlighting) {
      return `<pre class="code-block"><code>${this.md.utils.escapeHtml(code)}</code></pre>`;
    }

    if (language && hljs.getLanguage(language)) {
      try {
        return `<pre class="code-block"><code class="language-${language}">${hljs.highlight(code, {
          language,
        }).value}</code></pre>`;
      } catch {
        // ignore and fallback
      }
    }

    return `<pre class="code-block"><code>${this.md.utils.escapeHtml(code)}</code></pre>`;
  }

  private toMetadata(data: Record<string, unknown>, filePath: string): FileMetadata {
    const metadata: FileMetadata = {};

    if (typeof data.title === 'string') {
      metadata.title = data.title;
    } else {
      metadata.title = this.inferTitleFromPath(filePath);
    }

    if (typeof data.author === 'string') {
      metadata.author = data.author;
    }

    if (typeof data.date === 'string') {
      metadata.date = data.date;
    }

    if (typeof data.order === 'number') {
      metadata.order = data.order;
    }

    if (typeof data.chapter === 'boolean') {
      metadata.chapter = data.chapter;
    }

    if (typeof data.toc === 'boolean') {
      metadata.toc = data.toc;
    }

    return metadata;
  }

  private inferTitleFromPath(filePath: string): string {
    return path.basename(filePath, path.extname(filePath)).replace(/[-_]/g, ' ');
  }
}

