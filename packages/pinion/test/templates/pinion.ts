import { fileURLToPath } from 'url'
import { dirname } from 'path'
import {
  PinionContext,
  runGenerator,
  runGenerators,
  renderTemplate,
  when,
  inject,
  toFile,
  fromFile,
  after,
  prepend,
  append,
  before,
  exec,
  copyFiles
} from '../../src/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export interface GeneratorContext extends PinionContext {
  name: string
  age: number
  order: string[]
  a: boolean
  b: boolean
  finalized: boolean
}

export type GeneratorArguments = PinionContext & Partial<Pick<GeneratorContext, 'name' | 'age'>>

export const generate = (ctx: GeneratorArguments) =>
  Promise.resolve(ctx)
    .then(renderTemplate('# Hello (world)', toFile('tmp', 'hello.md')))
    .then(inject('\nThis is injected after', after('Hello (world)'), toFile('tmp', 'hello.md')))
    .then(inject('This is injected before\n', before(/Hello\s/), toFile('tmp', 'hello.md')))
    .then(inject('<!-- Prepended -->', prepend(), toFile('tmp', 'hello.md')))
    .then(inject('<!-- Appended -->', append(), toFile('tmp', 'hello.md')))
    // A custom task can expand the context with new values, e.g. from a prompt
    .then((ctx) => ({
      ...ctx,
      age: ctx.age || 0
    }))
    .then(
      when(
        (ctx) => !!ctx.name && !ctx.age,
        exec('echo', () => ['"This is a test"'])
      )
    )
    .then(copyFiles(fromFile(__dirname), toFile('tmp', 'copy')))
    .then(runGenerators(__dirname))
    // `single.ts` has no `.tpl` suffix so it is only run explicitly
    .then(runGenerator(__dirname, 'single.ts'))
    .then((ctx) => ({
      ...ctx,
      finalized: true
    }))
