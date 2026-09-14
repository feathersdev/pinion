import type { Token } from 'markdown-it'
import { TocEntry } from './core.js'

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

/**
 * Extracts a flat list of headings from markdown-it tokens and sets the
 * slug as the `id` attribute on the heading open tokens.
 *
 * @param tokens The markdown-it tokens of a page
 * @returns The flat list of headings
 */
export const extractHeadings = (tokens: Token[]) => {
  const slug = createSlugger()
  const headings: { level: number; text: string; slug: string }[] = []

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    if (token.type !== 'heading_open') {
      continue
    }

    const inline = tokens[i + 1]
    const text = inline?.type === 'inline' ? headingText(inline) : ''
    const entry = {
      level: Number(token.tag.slice(1)),
      text,
      slug: slug(text)
    }

    token.attrSet('id', entry.slug)
    headings.push(entry)
  }

  return headings
}

/**
 * Builds a nested table of contents from a flat list of headings.
 *
 * @param headings The flat list of headings
 * @returns The nested table of contents
 */
export const buildTocTree = (headings: { level: number; text: string; slug: string }[]) => {
  const tree: TocEntry[] = []
  const stack: TocEntry[] = []

  for (const heading of headings) {
    const entry: TocEntry = { ...heading, children: [] }

    while (stack.length && stack[stack.length - 1].level >= heading.level) {
      stack.pop()
    }

    if (stack.length) {
      stack[stack.length - 1].children.push(entry)
    } else {
      tree.push(entry)
    }

    stack.push(entry)
  }

  return tree
}
