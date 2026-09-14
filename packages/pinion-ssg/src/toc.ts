import type { Token } from 'markdown-it'
import { TocItem } from './core.js'

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

/**
 * Returns a slug function that generates GitHub-style slugs and
 * de-duplicates them by appending `-1`, `-2` etc.
 */
export const createSlugger = () => {
  const counts = new Map<string, number>()

  return (text: string) => {
    const slug = slugify(text) || 'section'
    const count = counts.get(slug) ?? 0

    counts.set(slug, count + 1)

    return count ? `${slug}-${count}` : slug
  }
}

const headingText = (token: Token) =>
  (token.children ?? [])
    .filter((child) => child.type === 'text' || child.type === 'code_inline')
    .map((child) => child.content)
    .join('')
    .trim()

type Heading = TocItem & { level: number; path: string }

/**
 * Extracts a flat list of headings from markdown-it tokens and sets the
 * slug as the `id` attribute on the heading open tokens.
 *
 * @param tokens The markdown-it tokens of a page
 * @returns The flat list of headings
 */
export const extractHeadings = (tokens: Token[]): Heading[] => {
  const slug = createSlugger()
  const headings: Heading[] = []

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    if (token.type !== 'heading_open') {
      continue
    }

    const inline = tokens[i + 1]
    const title = inline?.type === 'inline' ? headingText(inline) : ''
    const path = slug(title)

    token.attrSet('id', path)
    headings.push({ level: Number(token.tag.slice(1)), title, path })
  }

  return headings
}

/**
 * Builds a nested table of contents from a flat list of headings.
 *
 * @param headings The flat list of headings
 * @returns The nested table of contents
 */
export const buildTocTree = (headings: Heading[]): TocItem[] => {
  type TocNode = Heading & { children: TocNode[] }
  const strip = ({ title, path, children }: TocNode): TocItem => ({ title, path, children: children.map(strip) })
  const nodes: TocNode[] = []
  const stack: TocNode[] = []

  for (const heading of headings) {
    const node: TocNode = { ...heading, children: [] }

    while (stack.length && stack[stack.length - 1].level >= heading.level) {
      stack.pop()
    }

    if (stack.length) {
      stack[stack.length - 1].children.push(node)
    } else {
      nodes.push(node)
    }

    stack.push(node)
  }

  return nodes.map(strip)
}
