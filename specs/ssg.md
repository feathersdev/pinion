# @featherscloud/pinion-ssg

@featherscloud/pinion-ssg is a static site generator using @featherscloud/pinion.

It is a new package in packages/pinion-ssg with the same setup (folder structure, tests etc.) as packages/pinion:

- Pure ESM, Node >= 22.18, TypeScript strict mode
- Sources in `src/`, tests in `test/`, compiled output in `lib/`
- Tests via vitest, linting via oxlint (root workspace configuration)

It provides composable Pinion tasks (functions that take and return the generator context, support `Callable` arguments and add trace information) to:

- Read all markdown files in a folder
- Render them to HTML using Pinion templates
- Support syntax highlighting

## Dependencies

- `@featherscloud/pinion` — task and context types
- `markdown-it` — markdown rendering (with `@types/markdown-it`)
- `shiki` — syntax highlighting
- `yaml` — frontmatter parsing

## Data model

Markdown pages are represented as `PageData`:

```ts
type PageData = {
  // Absolute path of the source markdown file
  source: string
  // Output file name relative to the render target folder, mirroring
  // the source folder structure with the extension replaced by `.html`
  // (e.g. `guides/intro.md` -> `guides/intro.html`)
  route: string
  // Parsed YAML frontmatter data (empty object if none)
  frontmatter: { [key: string]: any }
  // The markdown content without frontmatter
  content: string
  // The rendered HTML (set by `renderMarkdown`)
  html?: string
}
```

Frontmatter is delimited by `---` fences at the beginning of a file and parsed with the `yaml` package. Invalid YAML throws an error.

## Tasks

### `loadMarkdown(from)`

- `from`: `Callable<string, C>` — the folder to read markdown files from, resolved against `ctx.cwd`
- Recursively lists all files ending in `.md` or `.markdown`, parses frontmatter and content
- Returns the context extended with `pages: PageData[]` (sorted by source file name)

### `renderMarkdown(to, options)`

- `to`: `Callable<string, C>` — the output folder, resolved against `ctx.cwd`
- Renders each page in `ctx.pages` to HTML with markdown-it, writes the result to `to` using the page `route`
- Requires `ctx.pages`, e.g. set by a preceding `loadMarkdown` task

Options:

- `layout`: `Layout<C>` — default layout template
- `layouts`: `{ [name: string]: Layout<C> }` — named layout templates
- `theme`: Shiki theme name, default `'github-dark'`
- `langs`: additional Shiki languages to load up-front
- `markdownIt`: markdown-it constructor options (default: `{ html: true }`)
- `plugins`: markdown-it plugins (`(md: MarkdownIt) => void`)
- `force`: overwrite existing output files, default `true` (site builds are non-interactive; when `false` existing files are skipped with a warning)

A layout template is a Pinion template in the form

```ts
type Layout<C> = (html: string, page: PageData, ctx: C) => string | Promise<string>
```

The layout is resolved per page:

1. If `page.frontmatter.layout` is a string, the layout with that name is looked up in `options.layouts` (an error is thrown if it does not exist)
2. Otherwise `options.layout` is used
3. If neither is set, the rendered HTML is written as-is

### Syntax highlighting

Code fences are highlighted with Shiki using the configured theme. Languages are collected from the pages code fences in a first pass and loaded automatically; fences with languages Shiki does not know (or that fail to load) fall back to escaped default rendering.

## Example

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

## Testing

Tests live in `test/` and use markdown fixtures in `test/fixtures`. They verify:

- Loading pages from a folder (routes, frontmatter, content)
- Rendering HTML to the target folder, mirroring the folder structure
- Layout selection via `options.layout`, `options.layouts` and frontmatter (including errors for unknown layouts)
- Syntax highlighting of code fences
- Trace entries for both tasks
