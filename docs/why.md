---
outline: false
---

# Why Pinion?

We have maintained CLI tooling for large internal projects and well-used open-source projects for many years. During that time, we tried all of the generators, looking for a flexible option to handle both internal projects and npm-published CLIs.

Since a tool that covered all our requirements did not exist, we built Pinion to be

- **Typesafe** - Generators and templates should be typesafe. Type safety helps avoid runtime errors.
- **Functional** - A generator should just be a function that performs its steps and returns with the information from those steps. This approach keeps everything robust yet flexible. It's React, but for generating code.
- **Scalable** - Generator logic and templates should be kept together but flexible enough to organize in a way that best suits your needs. Get started with a single file and scale as your project grows.
- **Flexible** - Start with Pinions [small API](./api.md) and go from there. By using just plain TypeScript you get full flexibility over what your generators can do.
- **Composable** - Calling another generator is just calling another function. This makes them testable, composable and reusable.
- **Fast** - Generators can be pre-compiled to ship e.g. as an npm package or your project's CLI tool. Pre-compiling templates means there's no interpreting templates at runtime or loading additional libraries. Only what you import into your generators will be loaded.

Below is a short and somewhat biased comparison between Pinion, [PlopJS](https://plopjs.com/), [Yeoman](https://yeoman.io/) and [Hygen](http://www.hygen.io/):

| Feature           | Pinion     | Plop       | Yeoman                | Hygen    |
| ----------------- | ---------- | ---------- | --------------------- | -------- |
| Template Language | TypeScript | Handlebars | Handlebars, EJS, Jade | EJS      |
| Pattern           | Functional | Imperative | Object Oriented       | Yaml/EJS |
| Typesafe          | ✅         | ❌         | ❌                    | ❌       |
| Local templates   | ✅         | ✅         | ❌                    | ✅       |
| Embeddable        | ✅         | ✅         | ✅                    | ❌       |
| Composable        | ✅         | ❌         | ✅                    | ❌       |
| Pre-compilation   | ✅         | ❌         | ❌                    | ❌       |
