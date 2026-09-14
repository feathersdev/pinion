import { dirname, isAbsolute, join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { getContext } from './core.js'
import { loadModule } from './utils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const { version } = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'))
const HELP_ACTIONS = ['help', '--help', '-h']
const VERSION_ACTIONS = ['--version', '-V']

const printHelp = () => {
  console.log(`pinion v${version}

A fast and typesafe code generator

Usage:

  pinion <file> [args...]    Run a generator file with command line arguments
  pinion help                Show this help message
  pinion --version           Show the version`)
}

export const cli = async (cmd: string[]) => {
  const [generatorFile, ...argv] = cmd

  if (VERSION_ACTIONS.includes(generatorFile)) {
    console.log(version)
    return
  }

  if (HELP_ACTIONS.includes(generatorFile)) {
    printHelp()
    return
  }

  if (!generatorFile) {
    throw new Error('Please specify a generator file name')
  }

  const moduleName = isAbsolute(generatorFile) ? generatorFile : join(process.cwd(), generatorFile)

  if (!existsSync(moduleName)) {
    throw new Error(`The generator file ${moduleName} does not exists`)
  }

  const module = await loadModule(moduleName)
  const generate = module.default?.generate || module.generate
  const generatorContext = getContext({ argv }, {})

  if (typeof generate !== 'function') {
    throw new Error('The generator file must export a generate function')
  }

  return generate(generatorContext)
}
