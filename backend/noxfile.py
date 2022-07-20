import nox

python_source = ["opre_ops", "noxfile.py"]


@nox.session
def lint(session):
    session.run("pipenv", "install", "--dev", external=True)

    args = session.posargs or python_source
    session.run("flake8", *args, external=True)


@nox.session
def black(session):
    session.run("pipenv", "install", "--dev", external=True)

    args = session.posargs or python_source
    session.run("black", *args, external=True)
