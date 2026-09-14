import { describe, it } from 'vitest'
import assert from 'assert'
import { fileURLToPath } from 'url'
import { dirname, join, relative } from 'path'
import { readFileSync } from 'fs'
import { cli } from '../src/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const { version } = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'))

const captureLog = async (run: () => Promise<unknown>) => {
  const originalLog = console.log
  const output: string[] = []
  console.log = (...args: unknown[]) => output.push(args.join(' '))

  try {
    await run()
  } finally {
    console.log = originalLog
  }

  return output.join('\n')
}

describe('@featherscloud/pinion/cli', () => {
  it('runs the CLI with a generator and command line arguments', async () => {
    const ctx = await cli(['packages/pinion/test/templates/cli.ts', '--name', 'testing'])

    assert.ok(ctx.noop)
    assert.strictEqual(ctx.name, 'testing')
  })

  it('runs the CLI with an absolute generator path', async () => {
    const ctx = await cli([join(__dirname, 'templates', 'cli.ts'), '--name', 'testing'])

    assert.ok(ctx.noop)
    assert.strictEqual(ctx.name, 'testing')
  })

  it('runs the CLI with a generator path relative to the current working directory', async () => {
    const generatorFile = relative(process.cwd(), join(__dirname, 'templates', 'cli.ts'))
    const ctx = await cli([generatorFile, '--name', 'testing'])

    assert.ok(ctx.noop)
    assert.strictEqual(ctx.name, 'testing')
  })

  it('prints the version', async () => {
    const output = await captureLog(() => cli(['--version']))

    assert.strictEqual(output, version)
  })

  it('prints the help message', async () => {
    const output = await captureLog(() => cli(['help']))

    assert.match(output, new RegExp(`pinion v${version}`))
    assert.match(output, /Usage:/)
  })

  it('runs a generator with a default export', async () => {
    const ctx = await cli([join(__dirname, 'fixtures', 'default-generate.ts')])

    assert.ok(ctx.defaulted)
  })

  it('errors without generator file', async () => {
    await assert.rejects(cli([]), {
      message: 'Please specify a generator file name'
    })
  })

  it('errors when the generator file does not exist', async () => {
    const generatorFile = join(process.cwd(), 'does-not-exist.ts')

    await assert.rejects(cli([generatorFile]), {
      message: `The generator file ${generatorFile} does not exists`
    })
  })

  it('errors when the generator file does not export a generate function', async () => {
    await assert.rejects(cli([join(__dirname, 'fixtures', 'no-generate.ts')]), {
      message: 'The generator file must export a generate function'
    })
  })
})
