# 18. Use Open Policy Agent (OPA) for Authorization rules

## Status

Tentative

## Context

We considered a few options for how to handle policy/authorization decisions within OPS:

* [Open Policy Agent (OPA)](https://www.openpolicyagent.org/)
* [OSO](https://docs.osohq.com/index.html)
* [Flask-Authorize](https://flask-authorize.readthedocs.io/en/latest/)

There are many options to consider when it comes to handling authorization/permissions/policies within an application, and those decisions are heavily weighted on how complex those permissions need to be, how many different systems need to consider the permissions, the ability to customize the permissions, and whether changes can be done on the fly or not.

### External Service vs. Framework Specific

One of the core decisions to make up front is whether to build the permissions system into the core framework (Flask), either with custom code, or through many available extensions; or to use a 3rd party service-based system which would handle decisions agnostically, regardless the system making the request for a decision. In this, both OSA and OSO are external, agnostic systems, where Flask-Authorize, or any other extension system would be specific to our Flask API.

Using a framework specific option is usually easier to implement in the beginning, as it's native to the framework, heavily documented, and fairly lightweight; but comes at the cost of updates/changes. Without a very strong understanding of every role or permission based decision that might be needed, this could require significant code changes and updates in order to implement future changes. Depending on the specific needs, this could take longer to implement as well if the complexity of the permissions is large. In our case, we believe the permissions to be fairly simple, but there are use cases we're still investigating.

Using an external service-based system allows for a much easier to configure and change permission system, each using their own language for interpreting the policies (Rego / Polar). The services run independently of the application but can use the same data-source as the application (Database) or their own data-source in cases where the information is isolated from the application. Because they offer an API to interface with, they're agnostic to what service is requesting the decision (Frontend, Backend, Reporting Service, etc.). With this flexibility though comes the cost of maintenance and management of the system, learning a new policy language, and additional surface area from a risk perspective.

## Decision

We've created an experiment to test out OPA in a dedicated branch [opa-experiment](https://github.com/HHS/OPRE-OPS/tree/opa-experiment), where we tested out a small use-case for using OPA. It works well, but does take quite a bit to get it up and running securely, and additional considerations would need to be made before it could be used in a production environment. But it represents the minimum needed in order to utilize OPA. This is a similar representation of what OSO would take, as they're similar competing services.

After this experiment, we've decided to hold off on a final decision until we have a better understanding of the specific permission needs. Until then, we'll implement the minimum AuthN needs, since everything that's available in the application so far is read-only, and generally available to all authenticated users. Authentication has already been mapped out in the [Login.gov (AuthN)](./016-use-login.gov-for-authentication.md) ADR.

## Consequences

TBD
