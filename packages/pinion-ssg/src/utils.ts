import { resolve } from 'path'
import { readdir } from 'fs/promises'
import { parse } from 'yaml'
import { Frontmatter } from './core.js'

export const listAllFiles = async (folder: string): Promise<string[]> => {
  const list = await readdir(folder, { withFileTypes: true })
  const nameList = await Promise.all(
    list.map((file) => {
      const fullName = resolve(folder, file.name)

      return file.isDirectory() ? listAllFiles(fullName) : fullName
    })
  )

  return nameList.flat().sort()
}

const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/

export const parseFrontmatter = (content: string): { frontmatter: Frontmatter; content: string } => {
  const match = content.match(frontmatterRegex)

  if (!match) {
    return { frontmatter: {}, content }
  }

  const data = parse(match[1])

  return {
    frontmatter: data && typeof data === 'object' ? data : {},
    content: content.slice(match[0].length)
  }
}
