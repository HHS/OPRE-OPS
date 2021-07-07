# 5. Back-end web framework

Date: 2021-07-02

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

### Options Considered 

* [Django](https://www.djangoproject.com/)
* [Flask](https://flask.palletsprojects.com/en/2.0.x/)

### Tradeoffs 

We felt that the features that Django offers out-of-the-box are ones the project is likely to use and benefit from. For example: 

* **Database abstraction layer**: This project will need a database. Using Django's built in database abstraction layer (ORM) will let us get started more quickly writing code that interacts with the database. 
* **Django Admin interface**: This built-in Django feature could allow an administrator to edit data easily.

We also considered using Flask. Flask is a more minimalist or "[micro](https://flask.palletsprojects.com/en/2.0.x/foreword/#what-does-micro-mean)" framework. It does not include a database abstraction layer out of the box, and requires extensive further configuration to make applications production-ready. The default server bundled with Flask is [not production-ready](https://stackoverflow.com/questions/12269537/is-the-server-bundled-with-flask-safe-to-use-in-production/12269934#12269934).

We decided that Flask would be better suited to a more experimental application, or a more microservices-based approach. Since we want a database-backed CRUD application serving users who may need to edit or input data, we decided Django would be a better fit.

## Decision

We will use Django as our Python web framework. 

## Consequences

We predict that choosing Django as our Python web framework for the back end will:

* give the project access to wide pools of technical talent
* allow the project to benefit from built-in Django features:
  * Django's database abstraction layer
  * (potentially) the Django Admin dashboard

Choosing Django won't limit our choices when we consider what front-end tech stack to use. We could: 

* use the Django template language to render server-side HTML
* use Django purely as an API, and create a separate front-end using React
* take a middle route -- for example, by rendering most pages server-side but using React to create specific interactive features
