import { existsSync } from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import { readdir } from 'fs/promises'

const extensionCheck = /(\.ts|\.js)$/
const getFileUrl = (file: string) => {
  let url = file

  if (!extensionCheck.test(file)) {
    if (existsSync(`${file}.js`)) {
      url = `${file}.js`
    } else if (existsSync(`${file}.ts`)) {
      url = `${file}.ts`
    }
  }

  if (!url.startsWith('file://')) {
    url = pathToFileURL(url).href
  }

  return url
}

export const loadModule = async (file: string) => {
  const fileName = getFileUrl(file)
  const { typescript } = process.features

  if (fileName.endsWith('.ts') && !typescript) {
    throw new Error(
      `Loading TypeScript generators requires native TypeScript support (Node.js >= 22.18, current version: ${process.version})`
    )
  }

  return import(fileName)
}

export const listFiles = async (folder: string, extension?: string): Promise<string[]> => {
  const list = await readdir(folder, { withFileTypes: true })
  const fileNames = list.filter((file) => file.isFile()).map(({ name }) => path.resolve(folder, name))

  return extension ? fileNames.filter((name) => name.endsWith(extension)) : fileNames
}

export const listAllFiles = async (folder: string): Promise<string[]> => {
  const list = await readdir(folder, { withFileTypes: true })
  const nameList = await Promise.all(
    list.map((file) => {
      const fullName = path.resolve(folder, file.name)

      return file.isDirectory() ? listAllFiles(fullName) : fullName
    })
  )

  return nameList.flat().sort()
}

export const merge = (target: { [key: string]: any }, source: { [key: string]: any }) => {
  for (const key of Object.keys(source)) {
    const value = source[key]

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      target[key] = merge(target[key] || {}, value)
    } else {
      target[key] = value
    }
  }

  return target
}

export const formatString = (template: string, ...args: any[]) => template.replace(/%s/g, () => args.shift())
