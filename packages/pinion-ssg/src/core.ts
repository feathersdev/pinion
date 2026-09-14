import { PinionContext } from '@featherscloud/pinion'

export type Frontmatter = { [key: string]: any }

export type PageData = {
  /**
   * The absolute path of the source markdown file
   */
  source: string
  /**
   * The output file name relative to the render target folder, mirroring
   * the source folder structure with the extension replaced by `.html`
   */
  route: string
  /**
   * The parsed YAML frontmatter data (empty object if none)
   */
  frontmatter: Frontmatter
  /**
   * The markdown content without frontmatter
   */
  content: string
  /**
   * The rendered HTML, set by the `renderMarkdown` task
   */
  html?: string
  /**
   * The page title: the `title` frontmatter, the first heading text or the
   * route base name, whatever is found first. Set by the `renderMarkdown` task
   */
  title: string
  /**
   * The nested table of contents, set by the `renderMarkdown` task
   */
  toc: TocEntry[]
}

export type TocEntry = {
  /**
   * The heading level (1-6)
   */
  level: number
  /**
   * The heading text
   */
  text: string
  /**
   * The anchor slug, also used as the heading `id`
   */
  slug: string
  /**
   * Headings at deeper levels
   */
  children: TocEntry[]
}

export type TocItem = {
  /**
   * The title of the table of contents entry
   */
  title: string
  /**
   * The route the entry links to
   */
  route?: string
  /**
   * Nested table of contents entries
   */
  children?: TocItem[]
}

export type PagesContext = {
  pages: PageData[]
}

export type Layout<C extends PinionContext = PinionContext> = (
  html: string,
  page: PageData,
  ctx: C
) => string | Promise<string>
