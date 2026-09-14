import { relative } from 'path'
import { existsSync } from 'fs'
import { writeFile } from 'fs/promises'
import { PinionContext } from '@featherscloud/pinion'

export type WriteFileOptions = {
  force: boolean
}

export const addTrace = <C extends PinionContext>(ctx: C, name: string, info: unknown) => {
  ctx.pinion.trace = [...ctx.pinion.trace, { name, info, timestamp: Date.now() }]

  return ctx
}

export const writeOutputFile = async <C extends PinionContext>(
  ctx: C,
  fileName: string,
  content: string,
  options: Partial<WriteFileOptions> = {}
) => {
  const { logger } = ctx.pinion
  const force = options.force ?? true
  const relativeName = relative(ctx.cwd, fileName)

  if (existsSync(fileName) && !force) {
    logger.warn(`Skipped file ${relativeName}`)

    return false
  }

  await writeFile(fileName, content)
  logger.notice(`Wrote file ${relativeName}`)

  return true
}
