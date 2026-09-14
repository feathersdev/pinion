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
}

export type PagesContext = {
  pages: PageData[]
}

export type Layout<C extends PinionContext = PinionContext> = (
  html: string,
  page: PageData,
  ctx: C
) => string | Promise<string>
