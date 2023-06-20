## Status

Tentative

## Context

There are variety of technologies available for managing state in a React application.  The most common are:
* [Redux](https://redux.js.org/)
* [Redux Toolkit RTK Query](https://redux-toolkit.js.org/rtk-query/overview)
* [React useState hook](https://react.dev/reference/react/useState)
* [React props](https://reactjs.org/docs/components-and-props.html)
* [React context](https://react.dev/learn/scaling-up-with-reducer-and-context)

Each has their tradeoffs and benefits.  Redux is the most common, but also the most complex.
RTK Query is a newer technology that is built on top of Redux and simplifies some of the more complex aspects of Redux.
The useState hook is a React native technology that is simple to use, but does not scale well.
React props are the simplest technology, but does not scale well.
React context is a way to pass data through the component tree without having to pass props down manually at every level.

There is a [Redux Style Guide](https://redux.js.org/style-guide/) that is a good starting point for
understanding how to use Redux and has some good guidelines for managing state in a React application.

## Decision

We will use the following guidelines for managing state in OPS:

* Use Redux for managing state that is shared across multiple components
* Use RTK Query for managing state that is shared across multiple components and is fetched from an API
* Use useState for managing state that is local to a component
* Use Redux for managing state that is local to a component and is passed from a parent component
* Use React context for managing state that is shared across multiple components and does not require complex global state management

Also, the [Redux Style Guide](https://redux.js.org/style-guide/) should be adhered to as much as possible.

In general, useState should be used for local state as a default since it promotes simplicity and component reuse.

For a "wizard like component", use React context to manage the state and pass it down to child components via context.
This allows the wizard to be reused while encapsulating its state.

When using React context, care should be taken to ensure that the context provider is not too high up in the component tree
to avoid unnecessary re-renders.

In "page level components" (components that are at the top of the component tree and are not reused),
Redux should be used for ease of testing and debugging.  This can be put into practice by for example if the
page is called `PortfolioDetails.jsx`, then the Redux slice should be called `portfolioDetailsSlice.js`
and the page state should be called `portfolioDetails`.

When using Redux, care should be taken to cleanup state when a component is unmounted.



## Consequences

The decision to use Redux, RTK Query, useState, React props, and React context for managing state in OPS has the following consequences:

* Using Redux for managing state that is shared across multiple components can lead to more complex code and increased development time, but it provides a centralized store for managing application state and can improve performance by reducing the number of re-renders.
* Using RTK Query for managing state that is shared across multiple components and is fetched from an API can simplify the process of making API requests and handling responses, but it requires additional setup and configuration compared to using plain Redux.
* Using useState for managing local state can simplify component logic and make it easier to reason about, but it can lead to prop drilling and may not scale well for larger applications.
* Using React props for passing data between components is a simple and straightforward approach, but it can become unwieldy for deeply nested component hierarchies and may require additional boilerplate code.
* Using React context for managing state that is shared across multiple components can simplify the process of passing data between components, but it can lead to performance issues if the context provider is too high up in the component tree and can make it harder to reason about component behavior.

Overall, the decision to use these technologies for managing state in OPS should lead to more maintainable and scalable code, but it may require additional setup and configuration compared to simpler approaches like using useState or React props.
