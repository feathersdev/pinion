import { dirname, resolve } from 'path'
import { mkdir } from 'fs/promises'
import { Callable, getCallable, PinionContext } from '@featherscloud/pinion'
import { PageData, PagesContext } from '../core.js'
import { addTrace, writeOutputFile } from './helpers.js'

export type SearchIndexEntry = {
  /**
   * The page title
   */
  title: string
  /**
   * The page path
   */
  path: string
  /**
   * The plain text content of the page
   */
  text: string
}

export type WriteSearchIndexOptions<C extends PinionContext = PinionContext> = {
  /**
   * A converter to modify each search index entry
   */
  converter?: (
    entry: SearchIndexEntry,
    page: PageData,
    ctx: C
  ) => SearchIndexEntry | Promise<SearchIndexEntry>
  /**
   * Overwrite an existing file (default: `true`)
   */
  force?: boolean
}

const entities: { [key: string]: string } = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'"
}

const blockRegex = /<(script|style)\b[\s\S]*?<\/\1>/gi
const tagRegex = /<[^>]*>/g
const entityRegex = /&(?:amp|lt|gt|quot|#39);/g
const whitespaceRegex = /\s+/g

/**
 * Strips HTML tags and entities and collapses whitespace.
 *
 * @param html The HTML to convert
 * @returns The plain text
 */
export const htmlToText = (html: string) =>
  html
    .replace(blockRegex, ' ')
    .replace(tagRegex, ' ')
    .replace(entityRegex, (entity) => entities[entity])
    .replace(whitespaceRegex, ' ')
    .trim()

export const searchIndexEntry = (page: PageData): SearchIndexEntry => ({
  title: page.title,
  path: page.route,
  text: htmlToText(page.html ?? page.content)
})

/**
 * Writes a search index for all pages as a JSON file. Each entry contains
 * the page `title`, `path` and plain text `content`. The format is library
 * agnostic and can be loaded by client-side search libraries.
 *
 * @param file The JSON file to write the search index to
 * @param options The write options
 * @returns The current context
 */
export const writeSearchIndex =
  <C extends PinionContext & PagesContext>(
    file: Callable<string, C>,
    options: WriteSearchIndexOptions<C> = {}
  ) =>
  async (ctx: C): Promise<C> => {
    const fileName = resolve(ctx.cwd, await getCallable(file, ctx))
    const entries: SearchIndexEntry[] = []

    for (const page of ctx.pages) {
      const entry = searchIndexEntry(page)

      entries.push(options.converter ? await options.converter(entry, page, ctx) : entry)
    }

    await mkdir(dirname(fileName), { recursive: true })
    await writeOutputFile(ctx, fileName, JSON.stringify(entries, null, '  '), options)

    return addTrace(ctx, 'writeSearchIndex', { fileName, entries })
  }
