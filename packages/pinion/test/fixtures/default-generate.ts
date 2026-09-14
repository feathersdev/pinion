import type { PinionContext } from '../../src/index.js'

// A generator that uses a default export
export default {
  generate: async (ctx: PinionContext) => ({ ...ctx, defaulted: true })
}
