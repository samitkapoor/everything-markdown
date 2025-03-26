# everything-markdown

A easy to use, powerful and lightweight Markdown renderer for React that supports code blocks, tables, images, lists, headings, and more—ensuring full Markdown compatibility with ease. 🚀

### Installation

```
npm install everything-markdown
```

### Usage

````javascript
import { EverythingMarkdown } from 'everything-markdown';

function MyComponent() {
  const markdownText = `'# Markdown Syntax Guide\n\n## Headings\n\n# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6\n\n## Emphasis\n\n*Italic* or _Italic_\n\n**Bold** or __Bold__\n\n***Bold and Italic*** or ___Bold and Italic___\n\n~~Strikethrough~~\n\n## Lists\n\n### Unordered List\n\n- Item 1\n- Item 2\n  - Subitem 1\n  - Subitem 2\n- Item 3\n\n### Ordered List\n\n1. First item\n2. Second item\n   1. Subitem 1\n   2. Subitem 2\n3. Third item\n\n## Links\n\n[OpenAI](https://openai.com)\n\n## Images\n\n![Alt text](https://via.placeholder.com/150 "Image Title")\n\n## Code\n\n### Inline Code\n\nUse `code` inside a sentence.\n\n### Block Code\n\n```javascript\nfunction helloWorld() {\n    console.log("Hello, World!");\n}\n```\n\n## Blockquotes\n\n> This is a blockquote.\n> \n> It can span multiple lines.\n\n## Tables\n\n| Name  | Age | City    |\n|-------|-----|--------|\n| Alice | 25  | New York |\n| Bob   | 30  | London  |\n\n## Horizontal Rule\n\n---\n\n## Task List\n\n- [x] Task 1\n- [ ] Task 2\n- [ ] Task 3\n\n## Footnotes\n\nThis is a footnote reference[^1].\n\n[^1]: This is the footnote text.\n\n## HTML in Markdown\n\n<div style="color: red;">This text is red.</div>\n';`;

  return <EverythingMarkdown content={markdownText} />;
}

export default MyComponent;
````

### Features

- **Comprehensive Markdown Rendering**: Supports a wide range of Markdown elements, including headers, paragraphs, lists, code blocks, tables, images, and more.

- **React-based**: Built specifically for React applications, ensuring seamless integration and optimal performance.

- **Lightweight**: Minimal dependencies and optimized bundle size for efficient performance without bloat.
