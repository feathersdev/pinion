import { spawn, SpawnOptions } from 'child_process'
import inquirer from 'inquirer'
import chalk from 'chalk'

import { loadModule } from './utils.js'

const { prompt } = inquirer
const { yellow, red, blue } = chalk

export interface Logger {
  warn: (msg: string) => void
  error: (msg: string) => void
  log: (msg: string) => void
  notice: (msg: string) => void
}

export class BasicLogger implements Logger {
  logger: typeof console = console
  previousNotice: string = ''

  warn(msg: string) {
    this.logger.log(yellow(`    ${msg}`))
  }

  error(msg: string) {
    this.logger.log(red(msg))
  }

  log(msg: string) {
    this.logger.log(msg)
  }

  notice(msg: string) {
    if (this.previousNotice !== msg) {
      this.logger.log(blue(`    ${msg}`))
      this.previousNotice = msg
    }
  }
}

export type PinionTrace = {
  name: string
  timestamp: number
  info: unknown
}

export type Configuration = {
  /**
   * The current working directory
   */
  cwd: string
  /**
   * The logger instance, writing information to the console
   */
  logger: Logger
  /*
   * Whether to force overwriting existing files by default
   */
  force: boolean
  /**
   * The prompt instance, used to ask questions to the user
   */
  prompt: typeof prompt
  /**
   * Trace messages of all executed generators
   */
  trace: PinionTrace[]
  /**
   * A function to execute a command
   *
   * @param command The command to execute
   * @param args The command arguments
   * @param options The NodeJS spawn options
   * @returns The exit code of the command
   */
  exec: (command: string, args: string[], options?: SpawnOptions) => Promise<number>
}

export type PinionContext = {
  /**
   * The current working directory
   */
  cwd: string
  /**
   * The command line arguments
   */
  argv: string[]
  pinion: Configuration
}

export type ContextCallable<T, C extends PinionContext> = (ctx: C) => T | Promise<T>
export type Callable<T, C extends PinionContext> = T | ContextCallable<T, C>
export type Promisable<T> = T | Promise<T>

/**
 * Returns the value for a callable which can either be a plain value or a
 * callback function that takes the context and returns the value.
 *
 * @param callable A plain value or a callback function that returns the value
 * @param context The current context object
 * @returns The final value
 */
export const getCallable = async <T, C extends PinionContext>(callable: Callable<T, C>, context: C) =>
  typeof callable === 'function' ? (callable as ContextCallable<T, C>)(context) : callable

export const mapCallables = <X, C extends PinionContext>(callables: Callable<X, C>[], context: C) =>
  Promise.all(callables.map((callable) => getCallable(callable, context)))

/**
 * Returns a new Pinion configuration object.
 *
 * @param initialConfig Any customized Pinion configuration settings
 * @returns
 */
export const getConfig = (initialConfig?: Partial<Configuration>): Configuration => ({
  prompt,
  logger: new BasicLogger(),
  cwd: process.cwd(),
  force: false,
  trace: [],
  exec: (command: string, args: string[], options?: SpawnOptions) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    })

    return new Promise((resolve, reject) => {
      child.once('exit', (code) => (code === 0 ? resolve(code) : reject(code)))
    })
  },
  ...initialConfig
})

/**
 * Returns a new Pinion context that can be passed to a generator.
 *
 * @param initialCtx The initial context data
 * @param initialConfig The initial Pinion configuration
 * @returns The initialized Pinion context.
 */
export const getContext = <T extends PinionContext>(
  initialCtx: Partial<T>,
  initialConfig: Partial<Configuration> = {}
) => {
  const pinion = getConfig(initialConfig)

  return {
    cwd: pinion.cwd,
    argv: [] as string[],
    ...initialCtx,
    pinion
  } as T
}

/**
 * Returns a Promise of the initial context
 * @param initialContext
 * @returns
 * @deprecated Use `Promise.resolve(context)` instead
 */
export const generator = async <T extends PinionContext>(initialContext: T) => initialContext

export const runModule = async (file: string, ctx: PinionContext) => {
  const { generate } = await loadModule(file)

  return generate(ctx)
}
