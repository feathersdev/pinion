import { basename, dirname, join, resolve } from 'path'
import { mkdir } from 'fs/promises'
import { Callable, getCallable, PinionContext } from '@featherscloud/pinion'
import { Layout, PageData, PagesContext, TocItem } from '../core.js'
import { MarkdownItOptions, MarkdownItPlugin, createMarkdownRenderer } from '../markdown.js'
import { extractHeadings, buildTocTree } from '../toc.js'
import { addTrace, writeOutputFile } from './helpers.js'

export type RenderMarkdownOptions<C extends PinionContext = PinionContext> = {
  /**
   * The default layout template
   */
  layout?: Layout<C>
  /**
   * Named layout templates, selectable per page via the `layout` frontmatter
   */
  layouts?: { [name: string]: Layout<C> }
  /**
   * The Shiki theme used for syntax highlighting (default: `github-dark`)
   */
  theme?: string
  /**
   * Additional languages to load for syntax highlighting
   */
  langs?: string[]
  /**
   * markdown-it constructor options
   */
  markdownIt?: MarkdownItOptions
  /**
   * markdown-it plugins to register
   */
  plugins?: MarkdownItPlugin[]
  /**
   * The general table of contents, made available to layout templates as
   * `ctx.toc`. Defaults to a flat list generated from the page titles
   * and routes
   */
  toc?: Callable<TocItem[], C>
  /**
   * Overwrite existing output files (default: `true`)
   */
  force?: boolean
}

const identity = (html: string) => html

const defaultToc = (pages: PageData[]): TocItem[] =>
  pages.map(({ title, route }) => ({ title, route }))

/**
 * Renders all pages in the context to HTML files and writes them to the
 * target folder, using the page `route` as the file name.
 *
 * @param to The folder to write the rendered HTML files to
 * @param options The render options
 * @returns The current context
 */
export const renderMarkdown =
  <C extends PinionContext & PagesContext>(
    to: Callable<string, C>,
    options: RenderMarkdownOptions<C> = {}
  ) =>
  async (ctx: C): Promise<C & { toc: TocItem[] }> => {
    const target = resolve(ctx.cwd, await getCallable(to, ctx))
    const md = await createMarkdownRenderer(
      ctx.pages.map((page) => page.content),
      options
    )
    const defaultLayout = options.layout ?? identity

    for (const page of ctx.pages) {
      const env = {}
      const tokens = md.parse(page.content, env)
      const toc = buildTocTree(extractHeadings(tokens))

      page.html = md.renderer.render(tokens, md.options, env)
      page.toc = toc
      page.title = page.frontmatter.title || toc[0]?.text || basename(page.route, '.html')
    }

    // The default table of contents is generated from the rendered page titles
    const toc = await getCallable(options.toc ?? defaultToc(ctx.pages), ctx)
    const siteCtx = { ...ctx, toc }

    for (const page of ctx.pages) {
      const name = page.frontmatter.layout
      let layout: Layout<C>

      if (typeof name === 'string') {
        const named = options.layouts?.[name]

        if (!named) {
          throw new Error(`Layout '${name}' set for page '${page.route}' does not exist`)
        }

        layout = named
      } else {
        layout = defaultLayout
      }

      await mkdir(dirname(join(target, page.route)), { recursive: true })
      await writeOutputFile(ctx, join(target, page.route), await layout(page.html!, page, siteCtx), options)
    }

    return addTrace({ ...ctx, toc }, 'renderMarkdown', { target, toc, pages: ctx.pages })
  }
