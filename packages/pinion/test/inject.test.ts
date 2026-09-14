import { describe, it, beforeEach, afterEach } from 'vitest'
import assert from 'assert'
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import { tmpdir, EOL } from 'os'
import { join } from 'path'
import { getContext, inject, before, after, prepend, append } from '../src/index.js'

describe('@featherscloud/pinion/tasks/inject', () => {
  let cwd: string

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'pinion-inject-'))
  })

  afterEach(async () => {
    await rm(cwd, { recursive: true, force: true })
  })

  const write = async (content: string) => {
    const fileName = join(cwd, 'test.md')
    await writeFile(fileName, content)

    return fileName
  }

  it('injects before a pattern that spans multiple lines', async () => {
    const fileName = await write('Hello\nWorld\n')

    await inject('Injected', before(/Hello\r?\nWorld/), fileName)(getContext({}, { cwd }))

    assert.strictEqual(await readFile(fileName, 'utf8'), 'Injected\nHello\nWorld\n')
  })

  it('injects after a pattern that spans multiple lines', async () => {
    const fileName = await write('Hello\nWorld\n')

    await inject('Injected', after(/Hello\r?\nWorld/), fileName)(getContext({}, { cwd }))

    assert.strictEqual(await readFile(fileName, 'utf8'), 'Hello\nWorld\nInjected\n')
  })

  it('keeps the line endings of a file with CRLF endings', async () => {
    const fileName = await write('Hello\r\nWorld\r\n')

    await inject('Injected', after('World'), fileName)(getContext({}, { cwd }))

    assert.strictEqual(await readFile(fileName, 'utf8'), 'Hello\r\nWorld\r\nInjected\r\n')
  })

  it('uses the OS line ending for a file without line breaks', async () => {
    const fileName = await write('Just one line')

    // The template can also be a function that gets called with the context
    await inject(() => 'Injected', append(), fileName)(getContext({}, { cwd }))

    assert.strictEqual(await readFile(fileName, 'utf8'), `Just one line${EOL}Injected`)
  })

  it('errors when injecting to a file that does not exist', async () => {
    const fileName = join(cwd, 'missing.md')

    await assert.rejects(inject('Injected', prepend(), fileName)(getContext({}, { cwd })), {
      message: `Cannot inject to '${fileName}'. The file doesn't exist.`
    })
  })

  it('errors when the before pattern is not found', async () => {
    const fileName = await write('Hello\nWorld\n')

    await assert.rejects(inject('Injected', before('nope'), fileName)(getContext({}, { cwd })), {
      message: `Could not find line 'nope' in file test.md to inject content before`
    })
  })

  it('errors when the after pattern is not found', async () => {
    const fileName = await write('Hello\nWorld\n')

    await assert.rejects(inject('Injected', after('nope'), fileName)(getContext({}, { cwd })), {
      message: `Could not find line 'nope' in file test.md to inject content after`
    })
  })
})
