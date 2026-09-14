---
outline: deep
---

# Quick Start

Pinion is a flexible task runner and code generator for any language. Using TypeScript, it gives you full flexibility over what you can do with type-safe tasks and templates out of the box.

Let's see how you can get started with Pinion in 30 seconds.

## Install Pinion

Add Pinion as a development dependency in your project like this:

```bash
npm install @featherscloud/pinion --save-dev
```

<BlockQuote type="tip" label="Note">

While generators are written in TypeScript your project can use any programming language. For projects without a `package.json` run `npm init --yes` first.

</BlockQuote>

## Creating a generator

A Pinion generator has two ingredients:

- A TypeScript interface to define `Context`
- A `generate` export that wraps the context in a promise and runs through the generator steps

The following file generates a basic `readme.md` from a TypeScript template string:

:embed-markdown{collection="pinionShared" path="pinion/shared/quick-start-1-basics"}

Once you ran the command, you can find your `readme.md` file in the current directory.

## Asking questions

Pinion comes with a `prompt` utility that works with your typed context. Let's get some input from the user!

You can ask questions from the command line with the [prompt](./generators.md#prompt) task:

:embed-markdown{collection="pinionShared" path="pinion/shared/quick-start-2-user-input"}

Pinion uses [Inquirer](https://www.npmjs.com/package/inquirer) under the hood to ask questions. The `prompt` task takes an array or object of [Inquirer questions](https://www.npmjs.com/package/inquirer#question) and returns a function that takes a context and returns a promise with the updated context. We can then use this context in the next step to render our template with the answers.

<BlockQuote type="tip" label="Note">

If you already created the `readme.md` the generator will ask if you want to overwrite the existing file.

</BlockQuote>

## What's next?

This is everything needed to get started with writing a generator. Next you can learn more about [why we created Pinion](./why.md) and how it can be useful for you, go more [in-depth with generators](./generators.md) or look at the [complete API](./api.md).
