---
outline: deep
---

# Generators

A Pinion generator is any file that has a `generate` export which takes a context and returns a Promise with that context. In its most basic form a Pinion generator looks like this:

```ts [generators/empty.tpl.ts]
import type { PinionContext } from '@featherscloud/pinion'

// A Context interface. (This one is empty)
interface Context extends PinionContext {}

// The `generate` export
export const generate = (init: Context) => Promise.resolve(init)
```

```sh
npx pinion generators/empty.tpl.ts
```

The steps in a generator will then be put together in a Promise chain (`Promise.resolve(init).then(step1).then(step2)`). Each step in the `.then` chain is called a Task.

## Context

The key component of a Pinion generator is the `context` object that gets passed to each task. The `Context` interface defines the types of the variables used in generator tasks and templates.

### Example

Let's look at the first quick start example and focus on the `Context`:

:embed-markdown{collection="pinionShared" path="pinion/shared/quick-start-1-basics"}

Even if your `Context` interface is empty, it still inherits the types from `PinionContext`. Let's see what's available in `PinionContext`.

### PinionContext

Let's focus only on types. The `Context` should always extend `PinionContext`, as shown here:

```ts
import type { PinionContext } from '@featherscloud/pinion'

interface Context extends PinionContext {
  // ...
}
```

By extending `PinionContext`, your `Context` interface now has the following properties:

```ts
export interface PinionContext {
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
```

<BlockQuote type="tip" label="Note">

For more information on the `pinion` configuration see the [Composability section](./composability.md).

</BlockQuote>

### Defining Context

You can add your own properties to `Context`. The process involves two steps:

- Define the attribute in the `Context` interface.
- Add the attribute to the `context` object somewhere in the `generate` function.

The first step is basically to define the type. The second one is to make the `context` match the type.

The next example is similar to the one at the top of the page but it moves the date string from the template into the context.

Let's review key lines to see how to further define `Context`:

- **Line 5:** a number property named `year` is added to the `Context` interface.
- **Line 22:** the object returned in the promise adds a `year` property to the context. This makes `year` available to subsequent functions and to the template. The `renderTemplate` utility then calls the template function with the updated `context`.
- **Line 9:** the `context` is received by the template function.
- **Line 14:** the `year` property is used in the template.

:embed-markdown{collection="pinionShared" path="pinion/shared/context-extending-1"}

The above example is a bit contrived because we can use TypeScript functions directly in templates. It's not necessary to define variables outside of templates like it is with other generator tools.

The concept to be learned is that you can add properties to `context` in the promise and they will be available in the template. This would be more useful if we extracted the function into its own module and reused it in multiple generators.

What's really cool is that there's no special magic to learn. To make a reusable function, just export it from a `.ts` file. Then you can import it and use it like any other TypeScript function.

## Tasks

A task is any step within the `generate` function. Pinion tasks rely on functional programming through `Promise.then` chains. You can follow each step in the generator and they are still bundled as a testable and embedable plain function.

```ts [generators/tasks.tpl.ts]
import { type PinionContext, prompt } from '@featherscloud/pinion'

interface Context extends PinionContext {
  message: string
  name: string
  description: string
}

export function generate(init: Context) {
  return Promise.resolve(init)
    .then((context) => {
      // Returning a new object instead of modifying the existing object avoids
      // unintended side effects
      return {
        ...context,
        message: 'Updated context from task 1'
      }
    })
    .then(async (context) => {
      context.pinion.logger.log(
        `This is task 2 and context.message is: "${context.message}"`
      )

      return context
    })
    .then(
      prompt({
        name: {
          type: 'input',
          message: 'What is the name of your app?'
        },
        description: {
          type: 'input',
          message: 'Write a short description'
        }
      })
    )
    .then(async (context) => {
      context.pinion.logger.log(
        `Got name "${context.name}" and description "${context.description}"`
      )
      return context
    })
}
```

```sh
npx pinion generators/tasks.tpl.ts
```

<BlockQuote type="tip" label="Note">

A custom `.then` handler must always return the `context`. If you modify the context, return a new object as shown above.

</BlockQuote>

Pinion has a few [built in tasks](./api.md#tasks) to [render templates](./templates.md), [handle user input](./user-input.md) and. A list of all available tasks can be found in the [API documentation](./api.md#tasks). You can write your own functionality in a custom `.then()` task as shown above and [write your own reusable tasks](./composability.md#reusable-tasks).

## What's next?

In the next section we will talk about [working with templates and files](./templates.md). The [API](./api.md) has an overview of all built-in tasks.
