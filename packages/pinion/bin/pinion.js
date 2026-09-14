#!/usr/bin/env node

'use strict'
import { styleText } from 'node:util'

import('../lib/cli.js').then(async ({ cli }) => {
  try {
    await cli(process.argv.slice(2)).then(() => {
      process.exit(0)
    })
  } catch (error) {
    console.error(`${styleText('red', 'Oh no! Something went wrong')}: ${error.message}`)

    process.exit(1)
  }
})
