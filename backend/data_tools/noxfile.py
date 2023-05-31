import nox

nox.options.sessions = ["lint"]
python_source = ["src", "tests", "./noxfile.py"]


@nox.session
def lint(session):
    session.run("pipenv", "install", "--dev", external=True)

    args = session.posargs or python_source
    session.run("flake8", "--config", "../.flake8", *args, external=True)


@nox.session
def black(session):
    session.run("pipenv", "install", "--dev", external=True)

    args = session.posargs or python_source
    session.run("black", *args, external=True)
