import { relative } from 'path'
import { existsSync } from 'fs'
import { writeFile } from 'fs/promises'
import { createInterface } from 'readline/promises'
import { PinionContext } from '../core.js'

/**
 * Add tracing information on what happened to the Pinion context
 *
 * @param ctx The current context
 * @param name The name of the operation
 * @param data The data to log
 * @returns The current context
 */
export const addTrace = <C extends PinionContext>(ctx: C, name: string, info: unknown) => {
  ctx.pinion.trace = [...ctx.pinion.trace, { name, info, timestamp: Date.now() }]

  return ctx
}

export type WriteFileOptions = {
  force: boolean
}

export const overwrite = async <C extends PinionContext>(
  ctx: C,
  fileName: string,
  options: Partial<WriteFileOptions> = {}
) => {
  const { logger } = ctx.pinion
  const force = options.force !== undefined ? options.force : ctx.pinion.force
  const relativeName = relative(ctx.cwd, fileName)

  if (existsSync(fileName) && !force) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const answer = await rl.question(`File ${relativeName} already exists. Overwrite? (y/N) `)
    rl.close()

    if (!['y', 'yes'].includes(answer.trim().toLowerCase())) {
      logger.warn(`Skipped file ${relativeName}`)
      return false
    }
  }

  return true
}

export const promptWriteFile = async <C extends PinionContext>(
  fileName: string,
  content: string | Buffer,
  ctx: C,
  options: Partial<WriteFileOptions> = {}
) => {
  const { logger } = ctx.pinion
  const relativeName = relative(ctx.cwd, fileName)

  if (await overwrite(ctx, fileName, options)) {
    await writeFile(fileName, content)
    logger.notice(`Wrote file ${relativeName}`)
  }

  return ctx
}
