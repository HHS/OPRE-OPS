# 19. Style Guide for Frontend State

## Status

Tentative

## Context

There are variety of technologies available for managing state in a React application.  The most common are:
* [Redux](https://redux.js.org/)
* [Redux Toolkit RTK Query](https://redux-toolkit.js.org/rtk-query/overview)
* [React useState hook](https://react.dev/reference/react/useState)
* [React props](https://reactjs.org/docs/components-and-props.html)

Each has their tradeoffs and benefits.  Redux is the most common, but also the most complex.
RTK Query is a newer technology that is built on top of Redux and simplifies some of the more complex aspects of Redux.
The useState hook is a React native technology that is simple to use, but does not scale well.
React props are the simplest technology, but do not scale well.

There is a [Redux Style Guide](https://redux.js.org/style-guide/) that is a good starting point for
understanding how to use Redux and has some good guidelines for managing state in a React application.

## Decision

We will use the following guidelines for managing state in OPS:

* Use Redux for managing state that is shared across multiple components
* Use RTK Query for managing state that is shared across multiple components and is fetched from an API
* Use useState for managing state that is local to a component
* Use Redux for managing state that is local to a component and is passed from a parent component

Also, the [Redux Style Guide](https://redux.js.org/style-guide/) should be adhered to as much as possible.

In general, useState should be used for local state as a default since it promotes simplicity and component reuse.
For a "wizard like component", useState should be used for local state and pass it's state via props to child components
so that the wizard can be reused thus encapsulating the state.
Otherwise, when sharing state across components, Redux should be used for ease of testing and debugging.

In "page level components" (components that are at the top of the component tree and are not reused),
Redux should be used for ease of testing and debugging.  This can be put into practice by for example if the
page is called `PortfolioDetails.jsx`, then the Redux slice should be called `portfolioDetailsSlice.js`
and the page state should be called `portfolioDetails`.

When using Redux, care should be taken to cleanup state when a component is unmounted.

## Consequences

TBD
