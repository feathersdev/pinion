import { PinionContext } from '../../src/index.js'

interface Context extends PinionContext {
  name: string
}

export const generate = (ctx: Context) =>
  Promise.resolve(ctx)
    .then((context) => {
      // Parse `--name <value>` from the command line arguments
      const nameFlagIndex = context.argv.indexOf('--name')
      const name = nameFlagIndex !== -1 ? context.argv[nameFlagIndex + 1] : context.name

      return { ...context, name }
    })
    .then((ctx) => ({ ...ctx, noop: true }))
