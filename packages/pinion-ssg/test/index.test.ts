import { describe, it } from 'vitest'
import path from 'path'
import { fileURLToPath } from 'url'
import { mkdir, readFile, rm, writeFile } from 'fs/promises'
import assert from 'assert'
import { getContext } from '@featherscloud/pinion'
import { loadMarkdown, renderMarkdown } from '../src/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('@featherscloud/pinion-ssg', () => {
  it('loads and renders markdown pages', async () => {
    await rm(path.join(__dirname, 'tmp', 'public'), { recursive: true, force: true })
    const initialCtx = getContext({ cwd: __dirname })
    const ctx = await Promise.resolve(initialCtx)
      .then(loadMarkdown(path.join('fixtures', 'content')))
      .then(
        renderMarkdown(path.join('tmp', 'public'), {
          theme: 'github-light',
          layouts: {
            docs: (html) => `<div class="docs">${html}</div>`
          }
        })
      )

    assert.strictEqual(ctx.pages.length, 3)
    assert.deepStrictEqual(
      ctx.pages.map(({ route }) => route),
      ['guides/getting-started.html', 'index.html', 'plain.html']
    )

    const [docs, index, plain] = ctx.pages

    assert.deepStrictEqual(docs.frontmatter, {
      layout: 'docs',
      title: 'Getting started'
    })
    assert.ok(docs.html!.includes('<h1 id="getting-started">Getting started</h1>'))
    assert.ok(plain.frontmatter && Object.keys(plain.frontmatter).length === 0)
    assert.ok(index.frontmatter.title === 'Home page')

    assert.deepStrictEqual(index.toc, [
      {
        level: 1,
        text: 'Home',
        slug: 'home',
        children: [
          {
            level: 2,
            text: 'Features',
            slug: 'features',
            children: [{ level: 3, text: 'Highlighting', slug: 'highlighting', children: [] }]
          },
          { level: 2, text: 'More', slug: 'more', children: [] }
        ]
      }
    ])
    assert.deepStrictEqual(plain.toc, [
      { level: 2, text: 'Setup', slug: 'setup', children: [] },
      { level: 2, text: 'Setup', slug: 'setup-1', children: [] }
    ])
    assert.strictEqual(index.title, 'Home page')
    // Falls back to the first heading text
    assert.strictEqual(plain.title, 'Setup')
    // The default table of contents is generated from the page titles and routes
    assert.deepStrictEqual(ctx.toc, [
      { title: 'Getting started', route: 'guides/getting-started.html' },
      { title: 'Home page', route: 'index.html' },
      { title: 'Setup', route: 'plain.html' }
    ])

    const { trace } = ctx.pinion

    assert.strictEqual(trace[0].name, 'loadMarkdown')
    assert.strictEqual((trace[0].info as any).folder, path.join(__dirname, 'fixtures', 'content'))
    assert.strictEqual(trace[trace.length - 1].name, 'renderMarkdown')
    assert.strictEqual(
      (trace[trace.length - 1].info as any).target,
      path.join(__dirname, 'tmp', 'public')
    )

    const indexHtml = await readFile(path.join(__dirname, 'tmp', 'public', 'index.html'))

    assert.ok(indexHtml.toString().includes('<h1 id="home">Home</h1>'))
    assert.ok(indexHtml.toString().includes('<em>markdown</em>'))
    assert.ok(indexHtml.toString().includes('<a href="https://example.com">link</a>'))
    // Frontmatter is not rendered
    assert.ok(!indexHtml.toString().includes('Home page'))
    // Code fences are highlighted by Shiki
    assert.ok(indexHtml.toString().includes('<pre class="shiki'))
    assert.ok(indexHtml.toString().includes('<span class="line">'))
    assert.ok(indexHtml.toString().includes('hello'))

    const docsHtml = await readFile(
      path.join(__dirname, 'tmp', 'public', 'guides', 'getting-started.html')
    )

    assert.ok(docsHtml.toString().startsWith('<div class="docs">'))
    assert.ok(docsHtml.toString().includes('<h1 id="getting-started">Getting started</h1>'))

    const plainHtml = await readFile(path.join(__dirname, 'tmp', 'public', 'plain.html'))

    assert.ok(plainHtml.toString().includes('<strong>html</strong>'))
    // Headings get anchor ids, duplicates are suffixed
    assert.ok(indexHtml.toString().includes('<h1 id="home">'))
    assert.ok(indexHtml.toString().includes('<h2 id="features">'))
    assert.ok(plainHtml.toString().includes('<h2 id="setup-1">'))
  })

  it('skips existing files with force: false', async () => {
    await mkdir(path.join(__dirname, 'tmp', 'skip'), { recursive: true })
    await writeFile(path.join(__dirname, 'tmp', 'skip', 'plain.html'), 'existing')

    const initialCtx = getContext({ cwd: __dirname })
    await Promise.resolve(initialCtx)
      .then(loadMarkdown('fixtures/content'))
      .then(
        renderMarkdown('tmp/skip', {
          force: false,
          layouts: {
            docs: (html) => `<div class="docs">${html}</div>`
          }
        })
      )

    const existing = await readFile(path.join(__dirname, 'tmp', 'skip', 'plain.html'))

    assert.strictEqual(existing.toString(), 'existing')
  })

  it('makes a supplied table of contents available to layouts', async () => {
    const initialCtx = getContext({ cwd: __dirname })
    const toc = [
      {
        title: 'Guides',
        children: [{ title: 'Getting started', route: 'guides/getting-started.html' }]
      },
      { title: 'Home page', route: 'index.html' }
    ]
    const ctx = await Promise.resolve(initialCtx)
      .then(loadMarkdown('fixtures/content'))
      .then(
        renderMarkdown('tmp/toc', {
          layouts: {
            docs: (html, page, ctx) => `<nav>${ctx.toc.map(({ title }) => title).join(',')}</nav>${html}`
          },
          toc
        })
      )

    assert.deepStrictEqual(ctx.toc, toc)

    const docsHtml = await readFile(
      path.join(__dirname, 'tmp', 'toc', 'guides', 'getting-started.html')
    )

    assert.ok(docsHtml.toString().startsWith('<nav>Guides,Home page</nav>'))
  })

  it('throws an error for unknown layouts', async () => {
    const initialCtx = getContext({ cwd: __dirname })

    await assert.rejects(
      Promise.resolve(initialCtx)
        .then(loadMarkdown('fixtures/content'))
        .then(renderMarkdown('tmp/unknown')),
      /Layout 'docs' set for page 'guides\/getting-started.html' does not exist/
    )
  })
})
