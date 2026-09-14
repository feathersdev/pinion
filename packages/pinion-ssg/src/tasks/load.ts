import { relative, resolve } from 'path'
import { readFile } from 'fs/promises'
import { Callable, getCallable, PinionContext } from '@featherscloud/pinion'
import { PageData, PagesContext } from '../core.js'
import { listAllFiles, parseFrontmatter } from '../utils.js'
import { addTrace } from './helpers.js'

const markdownExtension = /\.(md|markdown)$/

/**
 * Reads all markdown files in a folder, parses frontmatter and content
 * and adds the resulting pages to the context.
 *
 * @param from The folder to read the markdown files from
 * @returns The context extended with the `pages` data
 */
export const loadMarkdown =
  <C extends PinionContext>(from: Callable<string, C>) =>
  async (ctx: C): Promise<C & PagesContext> => {
    const folder = resolve(ctx.cwd, await getCallable(from, ctx))
    const files = (await listAllFiles(folder)).filter((file) => markdownExtension.test(file))
    const pages: PageData[] = []

    for (const source of files) {
      const { frontmatter, content } = parseFrontmatter((await readFile(source)).toString())

      pages.push({
        source,
        route: relative(folder, source).replace(markdownExtension, '.html'),
        frontmatter,
        content
      })
    }

    return addTrace({ ...ctx, pages }, 'loadMarkdown', { folder, pages })
  }
