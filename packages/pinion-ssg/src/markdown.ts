import MarkdownIt from 'markdown-it'
import type { MarkdownIt as MarkdownItRenderer, MarkdownItOptions } from 'markdown-it'
import { bundledLanguages, createHighlighter, Highlighter } from 'shiki'

export type { MarkdownItOptions }
export type MarkdownItPlugin = (md: MarkdownItRenderer) => void

export type RendererOptions = {
  /**
   * The Shiki theme used for syntax highlighting
   */
  theme: string
  /**
   * Additional languages to load for syntax highlighting
   */
  langs: string[]
  /**
   * markdown-it constructor options
   */
  markdownIt?: MarkdownItOptions
  /**
   * markdown-it plugins to register
   */
  plugins?: MarkdownItPlugin[]
}

/**
 * Creates a markdown-it renderer with Shiki syntax highlighting for all
 * languages used in the code fences of the given contents.
 *
 * @param contents The markdown contents that will be rendered
 * @param options The renderer options
 * @returns The configured markdown-it renderer
 */
export const createMarkdownRenderer = async (
  contents: string[],
  options: Partial<RendererOptions> = {}
): Promise<MarkdownItRenderer> => {
  const { theme = 'github-dark', langs = [], markdownIt, plugins = [] } = options
  const fenceLangs = new Set<string>(langs)
  let highlighter: Highlighter | undefined
  const md = new MarkdownIt({
    html: true,
    // A first rendering pass collects the languages used in code fences
    highlight(code, lang) {
      if (lang) fenceLangs.add(lang)

      return ''
    },
    ...markdownIt
  })

  for (const content of contents) {
    md.render(content)
  }

  const loadableLangs = [...fenceLangs].filter((lang) => lang in bundledLanguages)

  if (loadableLangs.length) {
    highlighter = await createHighlighter({
      themes: [theme],
      langs: loadableLangs
    })
  }

  if (!markdownIt?.highlight) {
    md.set({
      highlight(code, lang) {
        if (!highlighter || !lang) {
          return ''
        }

        try {
          return highlighter.codeToHtml(code, { lang, theme })
        } catch {
          return ''
        }
      }
    })
  }

  for (const plugin of plugins) {
    plugin(md)
  }

  return md
}
