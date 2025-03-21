# everything-markdown

## Description

A Markdown renderer that renders everything (Codeblocks, Tables, Images, etc.) in React.

## Installation

```
npm install everything-markdown
```

## Usage

```javascript
import EverythingMarkdown from 'everything-markdown';

function MyComponent() {
  const markdownText = `
  # Hello World
  
  This is a paragraph with some **bold** and *italic* text.`;

  return <EverythingMarkdown content={markdownText} />;
}

export default MyComponent;
```

## Features

- **Comprehensive Markdown Rendering**: Supports a wide range of Markdown elements, including headers, paragraphs, lists, code blocks, tables, images, and more.

- **React-based**: Built specifically for React applications, ensuring seamless integration and optimal performance.

- **Lightweight**: Minimal dependencies and optimized bundle size for efficient performance without bloat.
