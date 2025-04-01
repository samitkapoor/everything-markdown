import React from 'react';
import { CodeBlock } from 'react-code-block';
import './styles.css';

// Define types for markdown tokens
interface MarkdownToken {
  type:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'ul'
    | 'ol'
    | 'li'
    | 'hr'
    | 'codeblock'
    | 'p'
    | 'blockquote'
    | 'table'
    | 'img'
    | 'html';
  content?: string | React.ReactNode;
  language?: string;
  url?: string;
  alt?: string;
  tableData?: string[][];
  ordered?: boolean;
  checked?: boolean;
  level?: number;
  htmlContent?: string;
}

// Interface for nested image content
interface NestedImageContent {
  type: 'image';
  alt: string;
  url: string;
}

// Interface for inline text elements
interface InlineElement {
  type: 'text' | 'code' | 'link' | 'bold' | 'italic' | 'strikethrough' | 'image' | 'html';
  content: string | NestedImageContent;
  url?: string;
  alt?: string;
  htmlContent?: string;
}

// Pre-compile regex patterns
const IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/;
const HTML_REGEX = /<([a-zA-Z0-9]+)(?:\s+[^>]*)?\/?>/;
const HR_REGEX = /^(\*{3,}|-{3,}|_{3,})$/;
const ORDERED_LIST_REGEX = /^\d+\.\s/;
const UNORDERED_LIST_REGEX = /^[\*\-\+]\s/;

/**
 * Main Markdown Renderer component
 * Parses and renders markdown content
 */
const EverythingMarkdown: React.FC<{
  content: string;
  className?: string;
}> = ({ content, className }) => {
  const cleanContent = content.replace(/<!--[\s\S]*?-->/g, '');
  const tokens: MarkdownToken[] = [];
  let isInCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeLanguage = 'plaintext';
  let inTable = false;
  let tableData: string[][] = [];
  let tableHeaders: string[] = [];
  let isInMultilineComment = false;

  const handleComments = (
    line: string,
    language: string
  ): { shouldSkip: boolean; isCommentEnd: boolean } => {
    const trimmed = line.trim();
    const lang = language.toLowerCase();

    if (['javascript', 'typescript', 'js', 'ts', 'css', 'scss', 'sass'].includes(lang)) {
      if (trimmed.startsWith('//')) return { shouldSkip: true, isCommentEnd: true };
      if (trimmed.includes('/*') && !trimmed.includes('*/'))
        return { shouldSkip: true, isCommentEnd: false };
      if (trimmed.includes('*/')) return { shouldSkip: true, isCommentEnd: true };
    } else if (['html', 'xml'].includes(lang)) {
      if (trimmed.includes('<!--') && !trimmed.includes('-->'))
        return { shouldSkip: true, isCommentEnd: false };
      if (trimmed.includes('-->')) return { shouldSkip: true, isCommentEnd: true };
    } else if (['python', 'ruby', 'bash', 'sh', 'shell', 'zsh'].includes(lang)) {
      return { shouldSkip: trimmed.startsWith('#'), isCommentEnd: true };
    }

    return { shouldSkip: false, isCommentEnd: false };
  };

  const lines = cleanContent?.split('\n') ?? [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (line.startsWith('```')) {
      if (!isInCodeBlock) {
        isInCodeBlock = true;
        isInMultilineComment = false;
        const langMatch = line.match(/^```(\w+)/);
        codeLanguage = langMatch && langMatch[1] ? langMatch[1] : 'plaintext';
        if (codeLanguage === 'markdown') continue;
      } else {
        tokens.push({
          type: 'codeblock',
          content: (
            <CodeBlock code={codeBlockLines.join('\n')} language={codeLanguage}>
              <CodeBlock.Code
                style={{
                  backgroundColor: '#1e1e1f',
                  overflow: 'auto',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.1)',
                  maxWidth: '800px',
                  height: 'auto'
                }}
              >
                <div className="table-row">
                  <CodeBlock.LineContent className="table-cell text-sm">
                    <CodeBlock.Token />
                  </CodeBlock.LineContent>
                </div>
              </CodeBlock.Code>
            </CodeBlock>
          ),
          language: codeLanguage
        });
        codeBlockLines = [];
        isInCodeBlock = false;
        isInMultilineComment = false;
        codeLanguage = 'plaintext';
      }
      continue;
    }

    if (isInCodeBlock) {
      // Inside code blocks, preserve all content including comments
      if (['bash', 'sh', 'shell', 'zsh'].includes(codeLanguage.toLowerCase())) {
        codeBlockLines.push(rawLine.trim());
      } else {
        codeBlockLines.push(rawLine);
      }
      continue;
    }

    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableHeaders =
          line
            ?.split('|')
            ?.slice(1, -1)
            ?.map((header) => header.trim()) ?? [];

        if (
          i + 1 < lines.length &&
          lines[i + 1].trim().startsWith('|') &&
          lines[i + 1].trim().endsWith('|') &&
          lines[i + 1].includes('-')
        ) {
          i++;
          continue;
        }
      } else {
        const rowData =
          line
            ?.split('|')
            ?.slice(1, -1)
            ?.map((cell) => cell.trim()) ?? [];
        tableData.push(rowData);
      }

      if (i + 1 >= lines.length || !lines[i + 1].trim().startsWith('|')) {
        tokens.push({
          type: 'table',
          tableData: [tableHeaders, ...tableData]
        });
        inTable = false;
        tableData = [];
        tableHeaders = [];
      }
      continue;
    }

    if (inTable && !line.startsWith('|')) {
      tokens.push({
        type: 'table',
        tableData: [tableHeaders, ...tableData]
      });
      inTable = false;
      tableData = [];
      tableHeaders = [];
    }

    const markdownElement = getMarkdownElement(line);
    if (markdownElement) {
      tokens.push(markdownElement);
    }
  }

  if (inTable) {
    tokens.push({
      type: 'table',
      tableData: [tableHeaders, ...tableData]
    });
  }

  return (
    <div className={`markdown-container ${className || ''}`}>
      {tokens.map((token, index) => (
        <RenderToken key={index} token={token} />
      ))}
    </div>
  );
};

/**
 * Parse a line of markdown into a token
 */
const getMarkdownElement = (line: string): MarkdownToken | null => {
  if (line.length === 0) return null;

  const htmlMatch = line.match(HTML_REGEX);
  if (htmlMatch) return { type: 'html', htmlContent: line };

  if (line.startsWith('# ')) return { type: 'h1', content: line.slice(2) };
  if (line.startsWith('## ')) return { type: 'h2', content: line.slice(3) };
  if (line.startsWith('### ')) return { type: 'h3', content: line.slice(4) };
  if (line.startsWith('#### ')) return { type: 'h4', content: line.slice(5) };
  if (line.startsWith('##### ')) return { type: 'h5', content: line.slice(6) };
  if (line.startsWith('###### ')) return { type: 'h6', content: line.slice(7) };

  if (line.startsWith('> ')) return { type: 'blockquote', content: line.slice(2) };

  if (line.match(HR_REGEX)) return { type: 'hr' };

  if (line.match(ORDERED_LIST_REGEX)) {
    return { type: 'li', content: line.replace(ORDERED_LIST_REGEX, ''), ordered: true };
  }

  if (line.match(UNORDERED_LIST_REGEX)) {
    const content = line.replace(UNORDERED_LIST_REGEX, '');
    if (content.startsWith('[ ] ') || content.startsWith('[x] ') || content.startsWith('[X] ')) {
      const checked = content.startsWith('[x]') || content.startsWith('[X]');
      return { type: 'li', content: content.slice(4), ordered: false, checked };
    }
    return { type: 'li', content, ordered: false };
  }

  const imageMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
  if (imageMatch) {
    return { type: 'img', alt: imageMatch[1], url: imageMatch[2] };
  }

  return { type: 'p', content: line };
};

/**
 * Render a markdown token
 */
const RenderToken = ({ token }: { token: MarkdownToken }) => {
  switch (token.type) {
    case 'html':
      return <div dangerouslySetInnerHTML={{ __html: token.htmlContent || '' }} />;
    case 'h1':
      return (
        <h1 className="markdown-h1">
          <RenderLine line={token.content} />
        </h1>
      );
    case 'h2':
      return (
        <h2 className="markdown-h2">
          <RenderLine line={token.content} />
        </h2>
      );
    case 'h3':
      return (
        <h3 className="markdown-h3">
          <RenderLine line={token.content} />
        </h3>
      );
    case 'h4':
      return (
        <h4 className="markdown-h4">
          <RenderLine line={token.content} />
        </h4>
      );
    case 'h5':
      return (
        <h5 className="markdown-h5">
          <RenderLine line={token.content} />
        </h5>
      );
    case 'h6':
      return (
        <h6 className="markdown-h6">
          <RenderLine line={token.content} />
        </h6>
      );
    case 'li':
      return (
        <div className="markdown-list-item">
          {token.checked !== undefined ? (
            <input type="checkbox" checked={token.checked} readOnly className="markdown-checkbox" />
          ) : (
            <span className="markdown-bullet">•</span>
          )}
          <div>
            <RenderLine line={token.content} />
          </div>
        </div>
      );
    case 'hr':
      return <hr className="markdown-hr" />;
    case 'codeblock':
      return <div className="markdown-code-block hide-scrollbar">{token.content}</div>;
    case 'blockquote':
      return (
        <blockquote className="markdown-blockquote">
          <RenderLine line={token.content} />
        </blockquote>
      );
    case 'table':
      return (
        <div className="markdown-table-container">
          <table className="markdown-table">
            {token.tableData && (
              <>
                <thead>
                  <tr>
                    {token.tableData[0].map((header, i) => (
                      <th key={i}>
                        <RenderLine line={header} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {token.tableData.slice(1).map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j}>
                          <RenderLine line={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </table>
        </div>
      );
    case 'img':
      return (
        <div className="markdown-image-container">
          <img src={token.url} alt={token.alt || ''} className="markdown-image" />
        </div>
      );
    case 'p':
      return (
        <p>
          <RenderLine line={token.content} />
        </p>
      );
    default:
      return null;
  }
};

/**
 * Parse and render inline markdown elements within a line
 */
const RenderLine = ({ line }: { line?: string | React.ReactNode }) => {
  if (typeof line !== 'string') {
    return <>{line}</>;
  }

  const elements: InlineElement[] = parseInlineElements(line);

  return (
    <>
      {elements.map((el, index) => {
        switch (el.type) {
          case 'text':
            return <span key={index}>{el.content as string}</span>;
          case 'code':
            return (
              <span key={index} className="markdown-code">
                {el.content as string}
              </span>
            );
          case 'link':
            return (
              <a
                key={index}
                href={el.url}
                target="_blank"
                rel="noopener noreferrer"
                className="markdown-link"
              >
                {typeof el.content === 'object' &&
                'type' in el.content &&
                el.content.type === 'image' ? (
                  <img
                    src={(el.content as NestedImageContent).url}
                    alt={(el.content as NestedImageContent).alt || ''}
                    className="markdown-inline-image"
                  />
                ) : (
                  <RenderLine line={el.content as string} />
                )}
              </a>
            );
          case 'bold':
            return (
              <strong key={index}>
                <RenderLine line={el.content as string} />
              </strong>
            );
          case 'italic':
            return (
              <em key={index}>
                <RenderLine line={el.content as string} />
              </em>
            );
          case 'strikethrough':
            return (
              <del key={index}>
                <RenderLine line={el.content as string} />
              </del>
            );
          case 'image':
            return (
              <img key={index} src={el.url} alt={el.alt || ''} className="markdown-inline-image" />
            );
          case 'html':
            return (
              <span key={index} className="markdown-html">
                {el.htmlContent}
              </span>
            );
          default:
            return null;
        }
      })}
    </>
  );
};

/**
 * Parse inline markdown elements like bold, italic, code, links
 */
const parseInlineElements = (text: string): InlineElement[] => {
  const elements: InlineElement[] = [];
  let i = 0;
  let currentText = '';
  const textLength = text.length;

  while (i < textLength) {
    const char = text[i];

    if (char !== '[' && char !== '!' && char !== '`' && char !== '*' && char !== '<') {
      currentText += char;
      i++;
      continue;
    }

    if (currentText) {
      elements.push({ type: 'text', content: currentText });
      currentText = '';
    }

    if (char === '<') {
      const htmlMatch = text.substring(i).match(HTML_REGEX);
      if (htmlMatch) {
        elements.push({ type: 'html', content: '', htmlContent: htmlMatch[0] });
        i += htmlMatch[0].length;
        continue;
      }
    }

    if (char === '*' && i + 1 < textLength && text[i + 1] === '*') {
      let boldText = '';
      i += 2;

      while (i < textLength - 1 && !(text[i] === '*' && text[i + 1] === '*')) {
        boldText += text[i];
        i++;
      }

      if (i < textLength - 1 && text[i] === '*' && text[i + 1] === '*') {
        elements.push({ type: 'bold', content: boldText });
        i += 2;
      } else {
        currentText = '**' + boldText;
      }
      continue;
    }

    if (char === '`') {
      let codeText = '';
      i++;

      while (i < textLength && text[i] !== '`') {
        codeText += text[i];
        i++;
      }

      if (i < textLength) {
        elements.push({ type: 'code', content: codeText });
        i++;
      } else {
        currentText = '`' + codeText;
      }
      continue;
    }

    if (char === '!' && text[i + 1] === '[') {
      const imgMatch = text.substring(i).match(IMAGE_REGEX);
      if (imgMatch) {
        const fullMatch = imgMatch[0];
        const nextChar = text[i + fullMatch.length];

        if (nextChar === ']' && text[i + fullMatch.length + 1] === '(') {
          currentText += char;
          i++;
          continue;
        }

        elements.push({
          type: 'image',
          content: '',
          alt: imgMatch[1],
          url: imgMatch[2]
        });
        i += fullMatch.length;
        continue;
      }
    }

    if (char === '[') {
      let bracketCount = 1;
      let j = i + 1;
      let linkText = '';

      while (j < textLength && bracketCount > 0) {
        const currentChar = text[j];
        if (currentChar === '[') bracketCount++;
        if (currentChar === ']') bracketCount--;
        linkText += currentChar;
        j++;
      }

      linkText = linkText.slice(0, -1);

      if (j < textLength && text[j] === '(') {
        j++;
        const urlStart = j;
        while (j < textLength && text[j] !== ')') j++;

        if (j < textLength) {
          const linkUrl = text.substring(urlStart, j);

          if (linkText.startsWith('![')) {
            const imgMatch = linkText.match(IMAGE_REGEX);
            if (imgMatch) {
              elements.push({
                type: 'link',
                content: {
                  type: 'image',
                  alt: imgMatch[1],
                  url: imgMatch[2]
                },
                url: linkUrl
              });
            }
          } else {
            elements.push({ type: 'link', content: linkText, url: linkUrl });
          }

          i = j + 1;
          continue;
        }
      }
    }

    currentText += char;
    i++;
  }

  if (currentText) {
    elements.push({ type: 'text', content: currentText });
  }

  return elements;
};

export default EverythingMarkdown;
