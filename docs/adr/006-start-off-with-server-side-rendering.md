# 6. Front-end tech stack: Start off with server-side rendering

Date: 2021-07-14

## Status

Proposed

## Context

We discussed different options for our tech stack on GitHub as a team — see discussion in [#25](https://github.com/18F/OPRE-Unicorn/issues/25). 

### Explanation of the tech concept

See [Why simplicity? Choosing a web architecture](https://18f.gsa.gov/2021/04/05/why_simplicity_choosing_a_web_architecture/) on the 18F blog.

### Options Considered 

* Starting off with server-side rendering, and adding more front-end tooling incrementally
* Starting off with a single page application architecture, with front-end tooling like React handling all rendering client-side

### Tradeoffs 

* In the short term, starting off with server-rendered HTML will allow us to get started delivering features more quickly. We won't need to invest developer time and energy in setting up React, setting up associated front-end React tooling and testing, and re-implementing basic accessibility features in React such as page titles.
* In the long term, keeping most of the front-end code as semantic server-rendered HTML should make the product more accessible, simpler to maintain, and more cost-effective for OPRE, since the cost of developing and maintaining HTML is lower than the cost of developing and maintaining React code.
* In the medium term, we may want to add some interactivity to our application by using React or another front-end library to power specific interactive features, such as an interactive grid view with client side sorting, search, and/or column selection.

## Decision

We will start off with server-side HTML rendering, and add more front-end tooling incrementally. 

## Consequences / premortem

See tradeoffs above.
