# ADR 25: Replace webpack with Vite

Date: 12-1-2023

## Status

Accepted

## Context

We have been using webpack as a module bundler for our project. However, we have encountered a bug related to the "@babel/plugin-proposal-private-property-in-object" package. This package is not declared as a dependency in "babel-preset-react-app," which we rely on. While it currently works due to the package being present in our node_modules folder, there is a risk of it breaking in the future.

Moreover, "babel-preset-react-app" is no longer maintained as part of the create-react-app project. Therefore, it is unlikely that this bug will be fixed.

## Decision

We will replace webpack with Vite. These tools are actively maintained and provide similar functionality to webpack. The tasks involved in this decision include:

1. Research the benefits and features of Vite/Bun compared to webpack
2. Update project configuration to use Vite/Bun instead of webpack
3. Refactor build scripts and tooling to work with Vite/Bun
4. Test the project thoroughly to ensure compatibility and functionality
5. Remove webpack-related dependencies and configurations

## Consequences

We predict that using Vite/Bun will improve development performance and take advantage of its features. It will also eliminate the risk associated with the "@babel/plugin-proposal-private-property-in-object" package. However, this change will require significant effort to refactor our build scripts and tooling. We will also need to thoroughly test our project to ensure compatibility and functionality.

Additional strengths of Vite include:

- Fast development server with hot module replacement (HMR) for instant feedback during development.
- Out-of-the-box support for modern JavaScript features, such as ES modules, dynamic imports, and tree shaking.
- Efficient build process that leverages native ES module imports for faster bundling.
- Seamless integration with popular frameworks like React, Vue, and Angular.
- Automatic code splitting for optimized loading and performance.
- Built-in support for TypeScript, CSS preprocessors, and other modern web technologies.
- Highly customizable configuration options to tailor Vite to specific project needs.

By leveraging these strengths, Vite can significantly enhance the development experience and productivity of our project.

## Other

![Vite and Bun](https://github-production-user-asset-6210df.s3.amazonaws.com/4629398/282599507-100520bb-842b-473a-ad38-3a31359b718a.png)
