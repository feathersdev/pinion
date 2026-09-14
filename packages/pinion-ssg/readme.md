# @featherscloud/pinion-ssg

> A static site generator built with [Pinion](https://github.com/feathersdev/pinion)

@featherscloud/pinion-ssg provides [Pinion](https://github.com/feathersdev/pinion) tasks to read markdown files, render them to HTML and write a static website. It uses [markdown-it](https://github.com/markdown-it/markdown-it) for markdown rendering, [Shiki](https://shiki.style) for syntax highlighting and supports YAML frontmatter and layout templates.

## Quick start

```
npm install @featherscloud/pinion-ssg
```

Given a website in a `site` folder with markdown pages like

```md
---
title: My first page
---

# Hello world

This is *my* page.

\`\`\`js
console.log('Hello world')
\`\`\`
```

a generator that renders it to a `public` folder looks like this:

```ts
import { getContext } from '@featherscloud/pinion'
import { loadMarkdown, renderMarkdown } from '@featherscloud/pinion-ssg'

export const generate = (ctx) =>
  Promise.resolve(ctx)
    .then(loadMarkdown('site'))
    .then(
      renderMarkdown('public', {
        theme: 'github-light',
        layout: (html, page) => `
          <!DOCTYPE html>
          <html>
            <head><title>${page.frontmatter.title}</title></head>
            <body>${html}</body>
          </html>`
      })
    )

await generate(getContext({}))
```

## Tasks

### loadMarkdown(from)

Reads all markdown files (`.md` and `.markdown`) in a folder recursively, parses YAML frontmatter and adds them to the context as `pages`:

```ts
type PageData = {
  // Absolute path of the source markdown file
  source: string
  // Output file name relative to the render target folder, mirroring
  // the source folder structure with the extension replaced by `.html`
  route: string
  // Parsed YAML frontmatter data (empty object if none)
  frontmatter: { [key: string]: any }
  // The markdown content without frontmatter
  content: string
  // The rendered HTML, set by `renderMarkdown`
  html?: string
}
```

### renderMarkdown(to, options)

Renders all pages to HTML and writes them to the target folder. Options are:

- `layout`: The default layout template
- `layouts`: Named layout templates, selectable per page via the `layout` frontmatter
- `theme`: The Shiki theme used for syntax highlighting (default: `github-dark`)
- `langs`: Additional languages to load for syntax highlighting
- `markdownIt`: markdown-it constructor options
- `plugins`: markdown-it plugins to register
- `toc`: The general table of contents, available to layouts as `ctx.toc`
- `force`: Overwrite existing files (default: `true`, if `false` existing files are skipped)

A layout template receives the rendered HTML, the page data and the context:

```ts
type Layout = (html: string, page: PageData, ctx: PinionContext) => string | Promise<string>
```

## Tables of contents

Headings in the rendered HTML get anchor `id` attributes automatically (GitHub-style slugs, duplicates suffixed with `-1`, `-2` etc.). Each page gets a nested table of contents and a title, so layouts can render navigation:

```ts
type TocEntry = {
  // The heading level (1-6)
  level: number
  // The heading text
  text: string
  // The anchor slug, also used as the heading `id`
  slug: string
  // Headings at deeper levels
  children: TocEntry[]
}
```

The general table of contents can be supplied to `renderMarkdown` as a plain object. It is made available to layout templates as `ctx.toc` and supports nesting:

```ts
type TocItem = {
  // The title of the entry
  title: string
  // The route the entry links to
  route?: string
  // Nested entries
  children?: TocItem[]
}

renderMarkdown('public', {
  toc: [
    {
      title: 'Guides',
      children: [{ title: 'Getting started', route: 'guides/getting-started.html' }]
    },
    { title: 'Home', route: 'index.html' }
  ],
  layout: (html, page, ctx) => `
    <nav>
      ${ctx.toc
        .map((item) => `<a href="${item.route}">${item.title}</a>`)
        .join('')}
    </nav>
    <main>${html}</main>`
})
```

If no table of contents is supplied, a flat list is generated from the page titles and routes.