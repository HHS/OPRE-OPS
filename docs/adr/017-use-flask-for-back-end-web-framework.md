# 5. Back-end web framework

Date: 2022-11-07

## Status

Accepted

## Context

We re-evaluated the previous decision as a team to use django for the framework after noticing that we were progressively building work-arounds to avoid almost all of Django's built-in functionality, and reconsidered the previous decision about Django and determined that Flask would better suit our needs.

### Explanation of the tech concept

Django, Flask, Rails, Sinatra -- these are all examples of web frameworks. Web frameworks are pre-written code that give developers tools and features right away when they start new web application projects.

Using a web framework, we won't be starting off writing code on a totally blank page. We'll start with some of the tools and features we need already in place, such as code to fetch and send data to and from a database. That will help us jump more quickly to writing project-specific code.

### Options Considered

* [Django](https://www.djangoproject.com/)
* [Flask](https://flask.palletsprojects.com/en/2.0.x/)

### Tradeoffs

After looking at the out-of-the-box features of Django more thoroughly and realizing that we would have to build work-arounds for almost all of them to make the OPS system work as desired (like, for instance, the user management system). Key points were:

* **Multiple work-arounds**: The extra pieces of Django would essentially be "dead weight" to the system, not to mention extra complicated by having to build such work-arounds rather than just writing what we need the first time. The Django Admin interface was completely to be bypassed, as an example.
* **Lightweight Framework**: Flask, beuing much more lightweight, allows us to pick and choose from the best libraries in the Python stack, while removing the bulk of the Django "dead weight" away, rather than having unused code sitting around in the application.
* **Security**: The unused Django code would essentially open an avenue for possible security problems in the future with the application. By not having the unused code in our application, it ensures that unused code cannot be used to compromose the system.

With Flask, we also are using the SQLAlchemy database abstraction layer, which is a popular framework used by multiple large Python projects. The default server for both Django and Flask are not production-ready, and both would need to have another web server to run, like Gunicorn.

Flask + SQLAlchemy gives more option-enabling flexibility with the application, where Django would require too many work-arounds to be beneficial. As such, we have decided to convert the existing codebase to Flask. We decided it would be best to do it before there is very much code, so the transition would be more painless and smoother.

## Decision

We will use Flask (with SQLAlchemy) as our Python web framework.

## Consequences

We predict that choosing Flask as our Python web framework for the back end will:

* Better align with the current composition of the engineering team.
* Allow for the application to be more flexible and not need as much work-arounds to make it fit in a more "batteries-included" framework.
* Also allow for the team to be able to select the best tools for the job, rather than just end up with everything handed to us:
  * SQLAlchemy for database abstraction

Choosing Flask won't limit our choices when we consider what front-end tech stack to use. We could:

* pick new technologies from the best available in the Python library.
* Build a simple REST based framework for CRUD operations, which Flask excels at.
* Be able to use standard templating tools, like Jinja2 to render server-side HTML
* take a middle route -- for example, by rendering most pages server-side but using React to create specific interactive features

## Further reading

+ https://flask.palletsprojects.com/en/2.2.x/
+ https://www.sqlalchemy.org/
