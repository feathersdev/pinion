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
  toc: TocItem[]
}

export type TocItem = {
  /**
   * The title of the entry (the heading text for page tables of contents)
   */
  title: string
  /**
   * The path the entry links to (the anchor slug for page tables of contents)
   */
  path?: string
  /**
   * Nested entries
   */
  children?: TocItem[]
}

export type PagesContext = {
  pages: PageData[]
}

export type TocContext = {
  /**
   * The general table of contents, set by the `renderMarkdown` task
   * when the `toc` option is supplied
   */
  toc?: TocItem[]
}

export type Layout<C extends PinionContext = PinionContext> = (
  html: string,
  page: PageData,
  ctx: C
) => string | Promise<string>
