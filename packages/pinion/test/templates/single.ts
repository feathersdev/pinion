import { PinionContext, renderTemplate, toFile } from '../../src/index.js'

// A generator that can be run as a single file with `runGenerator`
export const generate = (ctx: PinionContext) =>
  Promise.resolve(ctx).then(renderTemplate('This is a single generator', toFile('tmp', 'single.md')))
