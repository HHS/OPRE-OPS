# 5. Back-end tech stack

Date: 2021-07-01

## Status

Proposed

## Context

We discussed different options for our tech stack on GitHub as a team — see discussion in [#25](https://github.com/18F/OPRE-Unicorn/issues/25). Afterwards, the engineering team met to discuss back-end tech stack options in particular. 

### Explanation of the tech concept

Django, Flask, Rails, Sinatra -- these are all examples of web frameworks. Web frameworks are pre-written code that give developers tools and features right away when they start new web application projects. 

Using a web framework, we won't be starting off writing code on a totally blank page. We'll start with some of the tools and features we need already in place, such as code to fetch and send data to and from a database. That will help us jump more quickly to writing project-specific code. 

### Resources for further reading

+ https://www.djangoproject.com/
+ https://docs.djangoproject.com/en/dev/faq/general/#faq-general 
+ Django Admin: https://developer.mozilla.org/en-US/docs/Learn/Server-side/Django/Admin_site

## Decision

We found concensus on using Django, although we considered Flask as well. We felt that the features Django offers out-of-the-box -- such as tools to interact with the database layer, and the Django Admin dashboard -- are ones the project is likely to use and benefit from. 

We will use Django as our Python Web Framework. 

## Consequences

We predict that choosing Django as our Python web framework for the back end will:

* give the project access to wide pools of technical talent
* allow the project to benefit from built-in Django features:
  * Django's ORM for interacting with a database
  * (potentially) the Django template language
  * (potentially) the Django Admin dashboard

Choosing Django won't limit our choices when we consider what front-end tech stack to use. We could: 

* use the Django template language to render server-side HTML
* use Django as an API, and create a separate front-end using React
* take a middle route: for example, by rendering most pages server-side but using React to create specific interactive features
